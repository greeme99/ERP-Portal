// 엔티티 SQLite (WAL 모드) 저장소 어댑터 — dao.mjs(Repository 패턴)를 통해 SQLite DB에 영속화한다.
// 기존 storage.mjs 의 비동기 인터페이스 계약을 100% 유지하여 상위 라우터 및 E2E 테스트와 완벽히 호환된다.
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createSqliteDao } from "./dao.mjs";

const KEY_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,63}$/;
const MAX_ROWS = 10_000;

export function isValidKey(key) {
  return typeof key === "string" && KEY_PATTERN.test(key) && !key.includes("..");
}

export function validateEntities(value) {
  if (!Array.isArray(value)) return "데이터가 배열이 아닙니다.";
  if (value.length > MAX_ROWS) return `행 수가 상한 ${MAX_ROWS}을 초과합니다.`;
  const ids = new Set();
  for (const row of value) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) return "행이 객체가 아닙니다.";
    const { id } = row;
    if (typeof id !== "string" || id.length === 0) return "행에 문자열 id 가 없습니다.";
    if (ids.has(id)) return `중복된 id 입니다: ${id}`;
    ids.add(id);
  }
  return null;
}

export function createStorage(dataDir) {
  const root = resolve(dataDir);
  const dbPath = join(root, "erp.db");
  const dao = createSqliteDao(dbPath);
  const chains = new Map();

  const serialize = (key, task) => {
    const prev = chains.get(key) ?? Promise.resolve();
    const next = prev.then(task, task);
    chains.set(key, next.catch(() => {}));
    return next;
  };

  return {
    async init() {
      await mkdir(root, { recursive: true });
      await dao.init(root, isValidKey);
    },

    async read(key) {
      if (!isValidKey(key)) throw new Error(`허용되지 않은 저장 경로: ${key}`);
      try {
        const parsed = dao.readStoreSync(key);
        if (parsed === null) return null;
        return validateEntities(parsed) === null ? parsed : null;
      } catch (error) {
        console.warn(`[storage-sqlite] ${key} 읽기 실패:`, error.message);
        return null;
      }
    },

    async readAll() {
      try {
        return dao.readAllStoresSync();
      } catch (error) {
        console.warn("[storage-sqlite] 전체 스냅샷 조회 실패:", error.message);
        return {};
      }
    },

    write(key, data, identity = {}, action = "PUT") {
      if (!isValidKey(key)) return Promise.reject(new Error(`허용되지 않은 저장 경로: ${key}`));
      return serialize(key, async () => {
        return dao.writeStoreSync(key, data, identity, action);
      });
    },

    reserveSequence(count) {
      return serialize("_sequence", async () => {
        return dao.reserveSequenceSync(count);
      });
    },

    async readSequence() {
      return dao.readSequenceSync();
    },

    observeIds(rows) {
      return serialize("_sequence", async () => {
        dao.observeIdsSync(rows);
      });
    },

    nextDocNumber(docType, period) {
      return serialize("_docnumber", async () => {
        return dao.nextDocNumberSync(docType, period);
      });
    },

    observeDocNumbers(rows) {
      return serialize("_docnumber", async () => {
        dao.observeDocNumbersSync(rows);
      });
    },

    mutate(key, mutator, identity = {}, action = "MUTATE", entityId = "*") {
      if (!isValidKey(key)) return Promise.reject(new Error(`허용되지 않은 저장 경로: ${key}`));
      return serialize(key, async () => {
        const current = dao.readStoreSync(key) ?? [];
        const next = mutator(current);
        const invalid = validateEntities(next);
        if (invalid) throw Object.assign(new Error(invalid), { status: 400 });
        dao.writeStoreSync(key, next, identity, action, entityId);
        return next;
      });
    },

    commitSimulation(payload, identity = {}) {
      return serialize("_simulation_commit", async () => {
        const stores = payload?.stores ?? {};
        for (const [key, rows] of Object.entries(stores)) {
          if (!isValidKey(key)) {
            throw Object.assign(new Error(`허용되지 않은 저장 키입니다: ${key}`), { status: 400 });
          }
          const invalid = validateEntities(rows);
          if (invalid) {
            throw Object.assign(new Error(`[${key}] ${invalid}`), { status: 400 });
          }
        }
        return dao.commitSimulationSync(payload, identity);
      });
    },

    async listConfirmedTransactions(module, limit = 50) {
      return dao.listConfirmedTransactionsSync(module, limit);
    },

    async listAuditLogs(storeKey, limit = 100) {
      return dao.listAuditLogsSync(storeKey, limit);
    },

    async getMdmStatus() {
      return dao.getMdmStatusSync();
    },

    async getStats() {
      return dao.getStatsSync();
    },

    close() {
      dao.close();
    },
  };
}
