// REST 백엔드 커넥터 — store.ts 가 쓰는 전송 계층.
//
// 설계 제약: EntityStore.getAll() 은 동기이고 create() 는 Entity 를 동기 반환한다.
// 따라서 캐시를 즉시 갱신하고 서버 전송은 백그라운드로 보낸다(낙관적 쓰기).
// 전송이 실패하면 호출자가 롤백할 수 있게 onError 로 알린다.
// 타입만 가져온다. 값을 import 하면 store.ts 와 순환 참조가 된다.
import type { Entity } from "./store";

export type BackendStatus = "localStorage" | "rest" | "connecting";

interface SnapshotResponse {
  ok?: boolean;
  data?: Record<string, Entity[]>;
  error?: string;
}

// 브라우저는 Vite 의 VITE_API_URL, Node(E2E·CI)는 ERP_API_URL 을 쓴다.
// 둘 다 없으면 localStorage 프로토타입 모드다.
function resolveBaseUrl(): string {
  const fromVite = import.meta.env?.VITE_API_URL;
  const fromNode = typeof process !== "undefined" ? process.env?.ERP_API_URL : undefined;
  return String(fromVite ?? fromNode ?? "").replace(/\/+$/, "");
}

const BASE_URL = resolveBaseUrl();
const BOOTSTRAP_TIMEOUT_MS = 4000;

let status: BackendStatus = BASE_URL ? "connecting" : "localStorage";
let snapshot: Record<string, Entity[]> | null = null;
const statusListeners = new Set<(s: BackendStatus) => void>();

export const isRestConfigured = () => BASE_URL !== "";
export const getBackendStatus = () => status;

/**
 * 서버에서 겹치지 않는 ID 순번 구간을 받아온다.
 * nextId() 는 동기여야 하므로 구간을 미리 확보해 두고 그 안에서 발급한다.
 */
export async function reserveIdBlock(count: number): Promise<{ start: number; end: number } | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/sequence/reserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return Number.isSafeInteger(body?.start) && Number.isSafeInteger(body?.end) ? { start: body.start, end: body.end } : null;
  } catch {
    return null;
  }
}

export function subscribeBackendStatus(listener: (s: BackendStatus) => void) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function setStatus(next: BackendStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((l) => l(next));
}

/**
 * 문서번호를 서버에서 채번한다. 문서유형·기간별로 구멍 없이 증가한다.
 * 서버에 닿지 못하면 null 을 주고 호출자가 로컬 계산으로 폴백한다.
 */
export async function requestDocNumber(
  docType: string,
  period: string
): Promise<{ number: string; seq: number } | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/docnumber/next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docType, period }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return typeof body?.number === "string" && Number.isSafeInteger(body?.seq)
      ? { number: body.number, seq: body.seq }
      : null;
  } catch {
    return null;
  }
}

/**
 * 앱 시작 시 1회 호출한다. store 가 155개라 키별 GET 대신 스냅샷 하나로 받는다.
 * 서버에 닿지 못하면 localStorage 모드로 남고 화면은 그대로 동작한다.
 */
export async function bootstrapBackend(): Promise<BackendStatus> {
  if (!BASE_URL) return status;
  try {
    const res = await fetch(`${BASE_URL}/api/snapshot`, {
      signal: AbortSignal.timeout(BOOTSTRAP_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`snapshot ${res.status}`);
    const body: SnapshotResponse = await res.json();
    if (!body?.data || typeof body.data !== "object") throw new Error("snapshot 형식 오류");
    snapshot = body.data;
    setStatus("rest");
  } catch (error) {
    console.warn("[ERP backend] 서버에 연결하지 못해 localStorage 모드로 동작합니다.", error);
    snapshot = null;
    setStatus("localStorage");
  }
  return status;
}

/** 부트스트랩으로 받아둔 해당 키의 서버 데이터. 없으면 undefined. */
export function takeSnapshot(key: string): Entity[] | undefined {
  return snapshot?.[key];
}

const jsonInit = (method: string, payload?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
});

async function request(path: string, init: RequestInit): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/entities/${path}`, init);
  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* 본문 없음 */
    }
    throw new Error(message);
  }
}

// 키별 전송을 직렬화해 서버 도착 순서가 뒤바뀌지 않게 한다.
const queues = new Map<string, Promise<unknown>>();

function enqueue(key: string, task: () => Promise<void>, onError: (e: Error) => void) {
  const prev = queues.get(key) ?? Promise.resolve();
  const next = prev.then(task, task).catch((error: unknown) => {
    onError(error instanceof Error ? error : new Error(String(error)));
  });
  queues.set(key, next);
  return next;
}

export const remote = {
  createRow(key: string, row: Entity, onError: (e: Error) => void) {
    enqueue(key, () => request(key, jsonInit("POST", { row })), onError);
  },
  updateRow(key: string, id: string, patch: Partial<Entity>, onError: (e: Error) => void) {
    enqueue(key, () => request(`${key}/${encodeURIComponent(id)}`, jsonInit("PATCH", { patch })), onError);
  },
  removeRows(key: string, ids: string[], onError: (e: Error) => void) {
    enqueue(key, () => request(key, jsonInit("DELETE", { ids })), onError);
  },
  /** 일괄 업로드처럼 N건을 한 번에 반영해야 하는 경로 — 서버에서 원자적으로 교체된다. */
  replaceAll(key: string, data: Entity[], onError: (e: Error) => void) {
    return enqueue(key, () => request(key, jsonInit("PUT", { data })), onError);
  },
  /** 전송 실패 시 서버를 진실로 삼아 다시 읽는다. 낙관적 쓰기의 롤백 경로. */
  async refetch(key: string): Promise<Entity[] | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/entities/${key}`, { headers: { Accept: "application/json" } });
      if (!res.ok) return null;
      const body = await res.json();
      return Array.isArray(body?.data) ? body.data : null;
    } catch {
      return null;
    }
  },
  /** 테스트용 — 대기 중인 전송이 끝날 때까지 기다린다. */
  drain() {
    return Promise.all([...queues.values()]);
  },
};
