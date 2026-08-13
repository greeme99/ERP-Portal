// Entity Store — 저장 위치는 세 가지다.
//   1) REST 백엔드 (VITE_API_URL 설정 + 서버 연결 성공): 서버가 진실, 낙관적 쓰기
//   2) localStorage (브라우저, 서버 없음): 기존 프로토타입 동작
//   3) 인메모리 (Node/E2E)
// 어느 모드든 아래 EntityStore 계약은 동일하므로 화면 코드는 수정하지 않는다.
import { useSyncExternalStore } from "react";
import { getBackendStatus, remote, reserveIdBlock, takeSnapshot } from "./restBackend";

export interface Entity {
  id: string;
  [key: string]: any;
}

export interface EntityStore {
  subscribe: (listener: () => void) => () => void;
  getAll: () => Entity[];
  create: (row: Omit<Entity, "id"> & { id?: string }) => Entity;
  update: (id: string, patch: Partial<Entity>) => void;
  remove: (ids: string[]) => void;
  /**
   * 전체 행을 한 번에 교체한다. 일괄 업로드처럼 N건을 원자적으로 반영해야 하는
   * 경로에서 쓴다. REST 모드에서는 단건 요청 N개가 아니라 PUT 한 번으로 나간다.
   */
  replaceAll: (rows: Entity[]) => void;
}

// 쓰기 실패를 화면에 알리는 훅. 기본은 콘솔 경고이며 앱에서 교체한다.
let writeFailureHandler: (message: string) => void = (message) => console.error(`[ERP store] ${message}`);
export function setWriteFailureHandler(handler: (message: string) => void) {
  writeFailureHandler = handler;
}

// 부트스트랩이 끝난 뒤 서버 스냅샷을 주입할 수 있도록 키 있는 store 를 등록해 둔다.
const keyedStores = new Map<string, (rows: Entity[]) => void>();

/**
 * bootstrapBackend() 직후 1회 호출한다. 서버 스냅샷이 있는 키만 캐시를 교체한다.
 * 서버에 없는 키는 seed 상태로 남고 첫 쓰기 때 서버에 생성된다.
 */
export function hydrateFromBackend(): number {
  if (getBackendStatus() !== "rest") return 0;
  let adopted = 0;
  keyedStores.forEach((adopt, key) => {
    const rows = takeSnapshot(key);
    if (rows) {
      adopt(rows);
      adopted++;
    }
  });
  return adopted;
}

interface PersistedEntities {
  version: 1;
  savedAt: string;
  data: Entity[];
}

const STORAGE_PREFIX = "erp-portal:prototype:v1";
const SEQUENCE_KEY = `${STORAGE_PREFIX}:sequence`;
const MAX_PERSISTED_ROWS = 10_000;
const MAX_NUMERIC_SEQUENCE = 999_999_999;
let seq = 1000;
let seqHydrated = false;

function observeEntitySequences(entities: Entity[]) {
  for (const entity of entities) {
    const match = /-(\d+)$/.exec(entity.id);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isSafeInteger(value) && value <= MAX_NUMERIC_SEQUENCE) seq = Math.max(seq, value);
  }
}

function getStorage(): Storage | undefined {
  try {
    return typeof globalThis.localStorage === "undefined" ? undefined : globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function warnStorage(message: string, error?: unknown) {
  console.warn(`[ERP persistence] ${message}`, error ?? "");
}

function isEntityArray(value: unknown): value is Entity[] {
  if (!Array.isArray(value) || value.length > MAX_PERSISTED_ROWS) return false;
  const ids = new Set<string>();
  return value.every((row) => {
    if (row === null || typeof row !== "object" || Array.isArray(row)) return false;
    const id = (row as Record<string, unknown>).id;
    if (typeof id !== "string" || id.length === 0 || ids.has(id)) return false;
    ids.add(id);
    return true;
  });
}

function readPersisted(storage: Storage, key: string): { data?: Entity[]; writable: boolean } {
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    warnStorage(`${key} 읽기에 실패해 메모리 모드로 전환합니다.`, error);
    return { writable: false };
  }
  if (raw === null) return { writable: true };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isEntityArray(parsed)) return { data: parsed, writable: true };
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      (parsed as Partial<PersistedEntities>).version === 1 &&
      isEntityArray((parsed as Partial<PersistedEntities>).data)
    ) {
      return { data: (parsed as PersistedEntities).data, writable: true };
    }
  } catch (error) {
    warnStorage(`${key} 데이터가 손상되어 초기 데이터로 복구합니다.`, error);
    return { writable: false };
  }

  warnStorage(`${key} 형식 또는 버전을 인식할 수 없어 초기 데이터로 복구합니다.`);
  return { writable: false };
}

function writePersisted(storage: Storage, key: string, data: Entity[]): boolean {
  try {
    const payload: PersistedEntities = { version: 1, savedAt: new Date().toISOString(), data };
    storage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (error) {
    warnStorage(`${key} 저장에 실패했습니다. 현재 세션의 변경은 유지되지만 새로고침 후 사라질 수 있습니다.`, error);
    return false;
  }
}

function hydrateSequence() {
  if (seqHydrated) return;
  seqHydrated = true;
  const storage = getStorage();
  if (!storage) return;
  try {
    const saved = Number(storage.getItem(SEQUENCE_KEY));
    if (Number.isSafeInteger(saved) && saved >= seq && saved <= MAX_NUMERIC_SEQUENCE) seq = saved;
  } catch (error) {
    warnStorage("ID 순번을 읽지 못해 세션 순번을 사용합니다.", error);
  }
}

// ── 서버 발급 ID 구간 ──────────────────────────────────────────────
// 여러 클라이언트가 같은 서버를 쓰면 브라우저별 카운터로는 id 가 충돌한다.
// 서버에서 겹치지 않는 구간을 받아 그 안에서 동기로 발급한다.
const ID_BLOCK_SIZE = 200;
const ID_BLOCK_REFILL_AT = 40; // 남은 개수가 이보다 적으면 미리 다음 구간을 받는다
let blockNext = 0;
let blockEnd = 0;
let refilling: Promise<void> | null = null;

const requestBlock = async () => {
  const block = await reserveIdBlock(ID_BLOCK_SIZE);
  if (!block) return;
  // 이미 쓰던 구간이 남아 있으면 버리고 새 구간으로 갈아탄다(겹치지 않으므로 안전).
  blockNext = block.start;
  blockEnd = block.end;
};

/** 부트스트랩에서 호출한다. 첫 구간을 확보해 렌더 시점부터 서버 순번을 쓰게 한다. */
export async function primeIdBlock(): Promise<boolean> {
  if (getBackendStatus() !== "rest") return false;
  await requestBlock();
  return blockEnd >= blockNext && blockEnd > 0;
}

const refillSoon = () => {
  if (refilling) return;
  refilling = requestBlock().finally(() => {
    refilling = null;
  });
};

/** REST 모드에서 서버 구간이 남아 있으면 그 번호를, 없으면 null 을 준다. */
function takeServerSequence(): number | null {
  if (getBackendStatus() !== "rest") return null;
  if (blockNext > blockEnd) {
    refillSoon();
    return null;
  }
  const value = blockNext++;
  if (blockEnd - blockNext < ID_BLOCK_REFILL_AT) refillSoon();
  return value;
}

const randomSuffix = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const nextId = (prefix: string) => {
  // REST 모드에서는 서버가 발급한 구간만 쓴다. 구간이 일시적으로 비었으면
  // 로컬 카운터로 떨어지지 않고 충돌 없는 임의 값을 쓴다(다른 클라이언트와 겹치지 않게).
  if (getBackendStatus() === "rest") {
    const fromServer = takeServerSequence();
    return `${prefix}-${fromServer ?? randomSuffix()}`;
  }

  hydrateSequence();
  if (seq >= MAX_NUMERIC_SEQUENCE) {
    return `${prefix}-${randomSuffix()}`;
  }
  const id = `${prefix}-${++seq}`;
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(SEQUENCE_KEY, String(seq));
    } catch (error) {
      warnStorage("ID 순번을 저장하지 못했습니다.", error);
    }
  }
  return id;
};

export function createStore(initial: Entity[]): EntityStore;
export function createStore(storageKey: string, initial: Entity[]): EntityStore;
export function createStore(initialOrKey: Entity[] | string, keyedInitial?: Entity[]): EntityStore {
  const storageKey = typeof initialOrKey === "string" ? initialOrKey : undefined;
  const initial = typeof initialOrKey === "string" ? keyedInitial ?? [] : initialOrKey;
  const storage = storageKey ? getStorage() : undefined;
  const fullKey = storageKey ? `${STORAGE_PREFIX}:entity:${storageKey}` : undefined;
  const restored = storage && fullKey ? readPersisted(storage, fullKey) : undefined;
  let data: Entity[] = [...(restored?.data ?? initial)];
  let persistenceEnabled = (restored?.writable ?? Boolean(storage && fullKey)) && data.length <= MAX_PERSISTED_ROWS;
  if (storage && fullKey && data.length > MAX_PERSISTED_ROWS) {
    warnStorage(`${fullKey} 초기 데이터가 ${MAX_PERSISTED_ROWS}행을 초과해 메모리 모드로 전환합니다.`);
  }
  observeEntitySequences(data);
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  // REST 모드에서는 서버가 진실이므로 localStorage 에 쓰지 않는다.
  // (두 저장소가 서로 다른 상태를 갖는 것을 막는다)
  const isRest = () => Boolean(storageKey) && getBackendStatus() === "rest";

  // 서버가 이 키를 이미 알고 있는가.
  // seed 는 클라이언트에만 있으므로, 서버에 키가 없는 상태에서 단건 PATCH/DELETE 를
  // 보내면 서버가 대상을 못 찾아 404 를 내고 롤백이 빈 배열을 가져와 데이터가 사라진다.
  // 첫 쓰기는 전체 배열을 PUT 해 키를 생성하고, 이후에는 단건으로 보낸다.
  let serverKnowsKey = false;
  const persist = () => {
    if (!isRest() && persistenceEnabled && storage && fullKey) {
      writePersisted(storage, fullKey, data);
    }
  };

  // 낙관적 쓰기가 실패하면 서버를 다시 읽어 진실로 되돌리고 사용자에게 알린다.
  const rollback = (action: string) => async (error: Error) => {
    const server = storageKey ? await remote.refetch(storageKey) : null;
    if (server) {
      data = server;
      observeEntitySequences(data);
      emit();
    }
    writeFailureHandler(`${action} 저장에 실패해 서버 상태로 되돌렸습니다: ${error.message}`);
  };

  // 서버가 키를 모르면 전체를 PUT 해 만들고, 알고 있으면 단건 요청을 보낸다.
  const sendWrite = (action: string, granular: () => void) => {
    if (!isRest() || !storageKey) return;
    if (!serverKnowsKey) {
      serverKnowsKey = true;
      remote.replaceAll(storageKey, data, (error) => {
        serverKnowsKey = false;
        rollback(action)(error);
      });
      return;
    }
    granular();
  };

  const store: EntityStore = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getAll: () => data,
    create(row) {
      if (!isRest() && persistenceEnabled && data.length >= MAX_PERSISTED_ROWS) {
        throw new Error(`Entity store row limit exceeded: ${MAX_PERSISTED_ROWS}`);
      }
      const created: Entity = { ...row, id: row.id ?? nextId("row") };
      if (data.some((existing) => existing.id === created.id)) {
        throw new Error(`Duplicate entity id: ${created.id}`);
      }
      data = [created, ...data];
      persist();
      emit();
      sendWrite("신규 등록", () => remote.createRow(storageKey!, created, rollback("신규 등록")));
      return created;
    },
    update(id, patch) {
      const { id: _ignoredId, ...safePatch } = patch;
      data = data.map((r) => (r.id === id ? { ...r, ...safePatch, id } : r));
      persist();
      emit();
      sendWrite("수정", () => remote.updateRow(storageKey!, id, safePatch, rollback("수정")));
    },
    remove(ids) {
      data = data.filter((r) => !ids.includes(r.id));
      persist();
      emit();
      sendWrite("삭제", () => remote.removeRows(storageKey!, ids, rollback("삭제")));
    },
    replaceAll(rows) {
      data = [...rows];
      observeEntitySequences(data);
      persist();
      emit();
      if (isRest() && storageKey) {
        serverKnowsKey = true;
        remote.replaceAll(storageKey, data, rollback("일괄 반영"));
      }
    },
  };

  // 서버 스냅샷 주입 경로 — 부트스트랩 시 hydrateFromBackend() 가 호출한다.
  if (storageKey) {
    keyedStores.set(storageKey, (rows) => {
      serverKnowsKey = true; // 스냅샷에 있었다 = 서버가 이 키를 알고 있다
      data = [...rows];
      observeEntitySequences(data);
      emit();
    });
  }

  return store;
}

export function useStore(store: EntityStore): Entity[] {
  return useSyncExternalStore(store.subscribe, store.getAll);
}

// CSV(Excel) 다운로드 유틸 (UTF-8 BOM \uFEFF 명확히 추가)
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const text = String(v);
    const safe = /^[=+@\t\r]|^-(?!\d+(?:\.\d+)?$)/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// CSV \uD55C \uC904\uC744 \uCEEC\uB7FC\uC73C\uB85C \uBD84\uD560 (\uAD6C\uBD84\uC790 \uC790\uB3D9 \uAC10\uC9C0, \uB530\uC634\uD45C \uC548 \uCF64\uB9C8 \uBCF4\uC874 \u2014 \uC608: "1,228")
function parseCsvLine(line: string): string[] {
  const delimiter = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // "" \uB294 \uB530\uC634\uD45C \uB9AC\uD130\uB7F4 (downloadCsv \uC758 \uC774\uC2A4\uCF00\uC774\uD504\uC640 \uB300\uCE6D)
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  // downloadCsv \uAC00 CSV \uC778\uC81D\uC158 \uBC29\uC9C0\uB85C \uBD99\uC778 \uC120\uD589 \uC791\uC740\uB530\uC634\uD45C\uB97C \uB418\uB3CC\uB9B0\uB2E4
  return result.map((c) => c.replace(/^'(?=[=+@\t\r-])/, ""));
}

// \uC5C5\uB85C\uB4DC\uB41C CSV/TSV \uB97C 2\uCC28\uC6D0 \uBC30\uC5F4\uB85C \uD30C\uC2F1 (UTF-8 BOM \uC81C\uAC70, \uD55C\uAE00 \uAE68\uC9D0 \uC2DC EUC-KR/CP949 \uC7AC\uC2DC\uB3C4)
export function readCsvFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("\uD30C\uC77C\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."));
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (!buffer) return reject(new Error("\uD30C\uC77C\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4."));
      let text = new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "");
      if (text.includes("\uFFFD")) {
        try {
          text = new TextDecoder("euc-kr").decode(buffer).replace(/^\uFEFF/, "");
        } catch {
          // \uBE0C\uB77C\uC6B0\uC800\uAC00 euc-kr \uC744 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC73C\uBA74 UTF-8 \uACB0\uACFC\uB97C \uADF8\uB300\uB85C \uC0AC\uC6A9\uD55C\uB2E4
        }
      }
      resolve(text.split(/\r?\n/).filter((l) => l.trim() !== "").map(parseCsvLine));
    };
    reader.readAsArrayBuffer(file);
  });
}

