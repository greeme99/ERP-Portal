// REST 백엔드 커넥터 — store.ts 가 쓰는 전송 계층 + 시뮬레이션 확정(Commit) 트랜잭션 API.
//
// 설계 제약: EntityStore.getAll() 은 동기이고 create() 는 Entity 를 동기 반환한다.
// 따라서 캐시를 즉시 갱신하고 서버 전송은 백그라운드로 보낸다(낙관적 쓰기).
// 시뮬레이션 업무(수요예측, MPS, MRP 등)는 프론트엔드 인메모리에서 시뮬레이션한 뒤
// commitSimulationPlan() 호출 시 SQLite DB에 원자적(ACID) 트랜잭션으로 확정 저장한다.
import type { Entity } from "./store";

export type BackendStatus = "localStorage" | "rest" | "connecting";

interface SnapshotResponse {
  ok?: boolean;
  data?: Record<string, Entity[]>;
  error?: string;
}

export interface SimulationCommitPayload {
  module: string;
  planPeriod: string;
  planType: string;
  comment?: string;
  stores: Record<string, Entity[]>;
}

export interface ConfirmedTransactionRecord {
  id: string;
  module: string;
  planPeriod: string;
  planType: string;
  version: number;
  rowCount: number;
  comment: string;
  committedBy: string;
  committedRole: string;
  committedAt: string;
}

// 브라우저는 Vite 의 VITE_API_URL 또는 단일 포트 Same-Origin, Node(E2E·CI)는 ERP_API_URL 을 쓴다.
function resolveBaseUrl(): string {
  const fromVite = import.meta.env?.VITE_API_URL;
  const fromNode = typeof process !== "undefined" ? process.env?.ERP_API_URL : undefined;
  const explicit = String(fromVite ?? fromNode ?? "").replace(/\/+$/, "");
  if (explicit) return explicit;
  // 브라우저에서 단일 포트(8080/5177) 통합 서빙으로 열렸을 때는 현재 오리진을 기본값으로 사용한다.
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
}

const BASE_URL = resolveBaseUrl();
const BOOTSTRAP_TIMEOUT_MS = 4000;
const LOCAL_COMMIT_HISTORY_KEY = "erp-portal:prototype:v1:confirmed_transactions";

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

let identityProvider: (() => Entity | undefined) | null = null;

export function setIdentityProvider(provider: () => Entity | undefined) {
  identityProvider = provider;
}

function identityHeaders(): Record<string, string> {
  const user = identityProvider?.();
  if (!user) return {};
  return {
    "X-ERP-User-Id": encodeURIComponent(String(user.id ?? "")),
    "X-ERP-User-Role": encodeURIComponent(String(user.role ?? "")),
    "X-ERP-User-Status": encodeURIComponent(String(user.status ?? "")),
  };
}

const jsonInit = (method: string, payload?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json", ...identityHeaders() },
  ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
});

/**
 * 프론트엔드 인메모리(EntityStore)에서 시뮬레이션한 결과를 SQLite DB에 확정(Commit) 저장한다.
 * 서버 미연결(로컬 프로토타입) 상태일 때도 로컬 확정 이력을 남겨 일관된 UX를 제공한다.
 */
export async function commitSimulationPlan(
  payload: SimulationCommitPayload
): Promise<ConfirmedTransactionRecord> {
  if (BASE_URL && status === "rest") {
    const res = await fetch(`${BASE_URL}/api/simulation/commit`, jsonInit("POST", payload));
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) {
      throw new Error(body?.error ?? `시뮬레이션 확정 저장 실패 (${res.status})`);
    }
    return body.data as ConfirmedTransactionRecord;
  }

  // 로컬 폴백 (브라우저 localStorage 확정 이력 기록)
  const user = identityProvider?.();
  const history = readLocalCommitHistory();
  const prevMax = history
    .filter((h) => h.module === payload.module.toUpperCase() && h.planType === payload.planType)
    .reduce((m, h) => Math.max(m, h.version), 0);
  const nextVer = prevMax + 1;
  const ts = new Date().toISOString();
  const dateCode = ts.slice(0, 10).replace(/-/g, "");
  const totalRows = Object.values(payload.stores).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);

  const record: ConfirmedTransactionRecord = {
    id: `CMT-${payload.module.toUpperCase()}-${dateCode}-V${nextVer}`,
    module: payload.module.toUpperCase(),
    planPeriod: payload.planPeriod,
    planType: payload.planType,
    version: nextVer,
    rowCount: totalRows,
    comment: payload.comment || "프론트엔드 시뮬레이션 확정 저장 (로컬)",
    committedBy: String(user?.name ?? user?.id ?? "김문규"),
    committedRole: String(user?.role ?? "관리자"),
    committedAt: ts,
  };

  writeLocalCommitHistory([record, ...history].slice(0, 100));
  return record;
}

/**
 * 확정된 시뮬레이션 이력(Confirmed Transactions)을 조회한다.
 */
export async function fetchSimulationHistory(
  module?: string,
  limit = 20
): Promise<ConfirmedTransactionRecord[]> {
  if (BASE_URL && status === "rest") {
    try {
      const qs = new URLSearchParams();
      if (module) qs.set("module", module);
      qs.set("limit", String(limit));
      const res = await fetch(`${BASE_URL}/api/simulation/history?${qs.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const body = await res.json();
        if (Array.isArray(body?.data)) return body.data;
      }
    } catch {
      /* 폴백 */
    }
  }
  const local = readLocalCommitHistory();
  return module ? local.filter((h) => h.module === module.toUpperCase()).slice(0, limit) : local.slice(0, limit);
}

function readLocalCommitHistory(): ConfirmedTransactionRecord[] {
  try {
    if (typeof globalThis.localStorage === "undefined") return [];
    const raw = globalThis.localStorage.getItem(LOCAL_COMMIT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCommitHistory(records: ConfirmedTransactionRecord[]) {
  try {
    if (typeof globalThis.localStorage === "undefined") return;
    globalThis.localStorage.setItem(LOCAL_COMMIT_HISTORY_KEY, JSON.stringify(records));
  } catch {
    /* 무시 */
  }
}

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
