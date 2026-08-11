// 브라우저에서는 localStorage에 지속하고, Node/E2E에서는 인메모리로 동작하는 Entity Store.
// 추후 REST API로 교체할 때도 화면 코드는 변경하지 않는 것이 원칙이다.
import { useSyncExternalStore } from "react";

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

export const nextId = (prefix: string) => {
  hydrateSequence();
  if (seq >= MAX_NUMERIC_SEQUENCE) {
    const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${random}`;
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
  const persist = () => {
    if (persistenceEnabled && storage && fullKey) {
      writePersisted(storage, fullKey, data);
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getAll: () => data,
    create(row) {
      if (persistenceEnabled && data.length >= MAX_PERSISTED_ROWS) {
        throw new Error(`Entity store row limit exceeded: ${MAX_PERSISTED_ROWS}`);
      }
      const created: Entity = { ...row, id: row.id ?? nextId("row") };
      if (data.some((existing) => existing.id === created.id)) {
        throw new Error(`Duplicate entity id: ${created.id}`);
      }
      data = [created, ...data];
      persist();
      emit();
      return created;
    },
    update(id, patch) {
      const { id: _ignoredId, ...safePatch } = patch;
      data = data.map((r) => (r.id === id ? { ...r, ...safePatch, id } : r));
      persist();
      emit();
    },
    remove(ids) {
      data = data.filter((r) => !ids.includes(r.id));
      persist();
      emit();
    },
  };
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

