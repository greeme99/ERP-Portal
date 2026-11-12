// Repository / DAO 계층 — SQLite 하이브리드 스키마를 캡슐화한다.
// 향후 PostgreSQL 등 엔터프라이즈 RDBMS 로 전환 시 본 모듈의 메서드 시그니처만 유지하여 드라이버를 교체한다.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { openSqliteDatabase, runInTransaction } from "./db.mjs";

const SEQUENCE_KEY = "global_entity_seq";
const SEQUENCE_START = 1000;
const MAX_SEQUENCE = 999_999_999;
const MAX_RESERVE = 10_000;

const DOCTYPE_PATTERN = /^[A-Z][A-Z0-9]{0,7}$/;
const PERIOD_PATTERN = /^[0-9]{2,6}$/;
const MAX_DOC_SEQ = 999_999;

export function createSqliteDao(dbFilePath) {
  /** @type {import("node:sqlite").DatabaseSync | null} */
  let db = null;

  const ensureDb = () => {
    if (!db) {
      db = openSqliteDatabase(dbFilePath);
    }
    return db;
  };

  const nowIso = () => new Date().toISOString();

  return {
    /**
     * DB 를 초기화하고, 기존 JSON 파일 저장소에 데이터가 남아 있으면서 DB 가 비어 있을 경우
     * 자동으로 SQLite 테이블로 1회 마이그레이션한다.
     * @param {string} [legacyDataDir]
     * @param {(key: string) => boolean} [isValidKeyFn]
     */
    async init(legacyDataDir, isValidKeyFn) {
      const conn = ensureDb();
      const countRow = conn.prepare("SELECT COUNT(*) AS cnt FROM erp_store_registry").get();
      const existingCount = Number(countRow?.cnt ?? 0);

      // 시퀀스 기본값 보장
      conn
        .prepare(
          "INSERT OR IGNORE INTO sequences (seq_key, current_val, updated_at) VALUES (?, ?, ?)"
        )
        .run(SEQUENCE_KEY, SEQUENCE_START, nowIso());

      if (existingCount > 0 || !legacyDataDir) return;

      // 레거시 JSON 파일 자동 이관
      let files = [];
      try {
        files = await readdir(legacyDataDir);
      } catch {
        return;
      }

      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        if (file === "_sequence.json") {
          try {
            const raw = JSON.parse(await readFile(join(legacyDataDir, file), "utf8"));
            const val = Number(raw?.value);
            if (Number.isSafeInteger(val) && val > SEQUENCE_START) {
              conn
                .prepare("UPDATE sequences SET current_val = MAX(current_val, ?), updated_at = ? WHERE seq_key = ?")
                .run(val, nowIso(), SEQUENCE_KEY);
            }
          } catch {
            /* 무시 */
          }
          continue;
        }
        if (file === "_docnumber.json") {
          try {
            const map = JSON.parse(await readFile(join(legacyDataDir, file), "utf8"));
            if (map && typeof map === "object") {
              const upsertDoc = conn.prepare(`
                INSERT INTO doc_numbers (doc_type, period, current_seq, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(doc_type, period) DO UPDATE SET
                  current_seq = MAX(doc_numbers.current_seq, excluded.current_seq),
                  updated_at = excluded.updated_at
              `);
              for (const [k, v] of Object.entries(map)) {
                const [dt, pr] = k.split(":");
                const seq = Number(v);
                if (dt && pr && Number.isSafeInteger(seq)) {
                  upsertDoc.run(dt, pr, seq, nowIso());
                }
              }
            }
          } catch {
            /* 무시 */
          }
          continue;
        }

        const key = file.slice(0, -5);
        if (isValidKeyFn && !isValidKeyFn(key)) continue;
        try {
          const rows = JSON.parse(await readFile(join(legacyDataDir, file), "utf8"));
          if (Array.isArray(rows)) {
            this.writeStoreSync(key, rows, { id: "migration", role: "system" }, "MIGRATE_JSON");
          }
        } catch {
          /* 무시 */
        }
      }
    },

    /**
     * 특정 store_key 의 엔티티 배열을 조회한다. 한 번도 생성되지 않은 키면 null 반환.
     * @param {string} key
     * @returns {any[] | null}
     */
    readStoreSync(key) {
      const conn = ensureDb();
      const reg = conn
        .prepare("SELECT store_key FROM erp_store_registry WHERE store_key = ?")
        .get(key);
      if (!reg) return null;

      const rows = conn
        .prepare("SELECT payload FROM erp_entities WHERE store_key = ? ORDER BY row_order ASC")
        .all(key);

      const result = [];
      for (const r of rows) {
        try {
          result.push(JSON.parse(String(r.payload)));
        } catch {
          return null;
        }
      }
      return result;
    },

    /**
     * 등록된 모든 store_key 의 전체 스냅샷을 단일 패스로 고속 조회한다.
     * @returns {Record<string, any[]>}
     */
    readAllStoresSync() {
      const conn = ensureDb();
      const out = {};
      const regs = conn.prepare("SELECT store_key FROM erp_store_registry").all();
      for (const r of regs) {
        out[String(r.store_key)] = [];
      }

      const rows = conn
        .prepare("SELECT store_key, payload FROM erp_entities ORDER BY store_key ASC, row_order ASC")
        .all();

      for (const r of rows) {
        const k = String(r.store_key);
        if (!out[k]) out[k] = [];
        try {
          out[k].push(JSON.parse(String(r.payload)));
        } catch {
          /* 손상된 행 무시 */
        }
      }
      return out;
    },

    /**
     * 특정 store_key 의 전체 엔티티를 원자적 트랜잭션으로 저장하고 버전과 감사로그를 갱신한다.
     * @param {string} key
     * @param {any[]} rows
     * @param {{ id?: string; role?: string }} [identity]
     * @param {string} [action]
     * @param {string} [entityId]
     */
    writeStoreSync(key, rows, identity = {}, action = "PUT", entityId = "*") {
      const conn = ensureDb();
      const ts = nowIso();
      const userId = identity?.id || "anonymous";
      const userRole = identity?.role || "";

      return runInTransaction(conn, () => {
        const curReg = conn
          .prepare("SELECT version FROM erp_store_registry WHERE store_key = ?")
          .get(key);
        const nextVer = curReg ? Number(curReg.version) + 1 : 1;

        conn
          .prepare(`
            INSERT INTO erp_store_registry (store_key, version, row_count, updated_at, updated_by)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(store_key) DO UPDATE SET
              version = excluded.version,
              row_count = excluded.row_count,
              updated_at = excluded.updated_at,
              updated_by = excluded.updated_by
          `)
          .run(key, nextVer, rows.length, ts, userId);

        conn.prepare("DELETE FROM erp_entities WHERE store_key = ?").run(key);

        const insertStmt = conn.prepare(`
          INSERT INTO erp_entities (store_key, id, row_order, payload, version, updated_at, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (let i = 0; i < rows.length; i++) {
          const item = rows[i];
          insertStmt.run(key, String(item.id), i, JSON.stringify(item), nextVer, ts, userId);
        }

        conn
          .prepare(`
            INSERT INTO audit_logs (user_id, user_role, store_key, entity_id, action, summary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .run(
            userId,
            userRole,
            key,
            entityId,
            action,
            `${key} [v${nextVer}] ${action} (${rows.length}건)`,
            ts
          );

        return rows;
      });
    },

    /**
     * 현재 시퀀스 값을 읽는다.
     */
    readSequenceSync() {
      const conn = ensureDb();
      const row = conn
        .prepare("SELECT current_val FROM sequences WHERE seq_key = ?")
        .get(SEQUENCE_KEY);
      const val = Number(row?.current_val);
      return Number.isSafeInteger(val) && val >= SEQUENCE_START && val <= MAX_SEQUENCE
        ? val
        : SEQUENCE_START;
    },

    /**
     * 겹치지 않는 ID 구간을 원자적으로 예약한다.
     * @param {number} count
     */
    reserveSequenceSync(count) {
      const conn = ensureDb();
      const size = Math.min(Math.max(Math.trunc(count) || 1, 1), MAX_RESERVE);
      return runInTransaction(conn, () => {
        const current = this.readSequenceSync();
        if (current >= MAX_SEQUENCE) {
          throw Object.assign(new Error("ID 순번이 상한에 도달했습니다."), { status: 507 });
        }
        const start = current + 1;
        const end = Math.min(current + size, MAX_SEQUENCE);
        conn
          .prepare("UPDATE sequences SET current_val = ?, updated_at = ? WHERE seq_key = ?")
          .run(end, nowIso(), SEQUENCE_KEY);
        return { start, end };
      });
    },

    /**
     * 엔티티 id 에서 숫자를 관찰해 최고 수위를 갱신한다.
     * @param {any[]} rows
     */
    observeIdsSync(rows) {
      let max = 0;
      for (const row of rows) {
        const match = /-(\d+)$/.exec(String(row?.id ?? ""));
        if (!match) continue;
        const value = Number(match[1]);
        if (Number.isSafeInteger(value) && value <= MAX_SEQUENCE) {
          max = Math.max(max, value);
        }
      }
      if (max <= SEQUENCE_START) return;
      const conn = ensureDb();
      conn
        .prepare("UPDATE sequences SET current_val = MAX(current_val, ?), updated_at = ? WHERE seq_key = ?")
        .run(max, nowIso(), SEQUENCE_KEY);
    },

    /**
     * 문서번호를 문서유형·기간별로 무결번 발급한다.
     * @param {string} docType
     * @param {string} period
     */
    nextDocNumberSync(docType, period) {
      if (!DOCTYPE_PATTERN.test(String(docType))) {
        throw Object.assign(new Error("허용되지 않은 문서유형입니다."), { status: 400 });
      }
      if (!PERIOD_PATTERN.test(String(period))) {
        throw Object.assign(new Error("허용되지 않은 기간입니다."), { status: 400 });
      }
      const conn = ensureDb();
      return runInTransaction(conn, () => {
        const row = conn
          .prepare("SELECT current_seq FROM doc_numbers WHERE doc_type = ? AND period = ?")
          .get(docType, period);
        const current = Number(row?.current_seq);
        const base = Number.isSafeInteger(current) && current >= 0 ? current : 0;
        if (base >= MAX_DOC_SEQ) {
          throw Object.assign(new Error("문서번호가 상한에 도달했습니다."), { status: 507 });
        }
        const seq = base + 1;
        conn
          .prepare(`
            INSERT INTO doc_numbers (doc_type, period, current_seq, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(doc_type, period) DO UPDATE SET
              current_seq = excluded.current_seq,
              updated_at = excluded.updated_at
          `)
          .run(docType, period, seq, nowIso());

        return {
          docType,
          period,
          seq,
          number: `${docType}-${period}${String(seq).padStart(3, "0")}`,
        };
      });
    },

    /**
     * 저장되는 행의 code 에서 문서번호를 관찰해 수위를 올린다.
     * @param {any[]} rows
     */
    observeDocNumbersSync(rows) {
      const highest = new Map();
      for (const row of rows) {
        const m = /^([A-Z][A-Z0-9]{0,7})-([0-9]{2})([0-9]{3,6})$/.exec(String(row?.code ?? ""));
        if (!m) continue;
        const mapKey = `${m[1]}:${m[2]}`;
        const seq = Number(m[3]);
        if (!Number.isSafeInteger(seq) || seq > MAX_DOC_SEQ) continue;
        highest.set(mapKey, Math.max(highest.get(mapKey) ?? 0, seq));
      }
      if (highest.size === 0) return;
      const conn = ensureDb();
      runInTransaction(conn, () => {
        const stmt = conn.prepare(`
          INSERT INTO doc_numbers (doc_type, period, current_seq, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(doc_type, period) DO UPDATE SET
            current_seq = MAX(doc_numbers.current_seq, excluded.current_seq),
            updated_at = excluded.updated_at
        `);
        const ts = nowIso();
        for (const [mapKey, seq] of highest) {
          const [dt, pr] = mapKey.split(":");
          stmt.run(dt, pr, seq, ts);
        }
      });
    },

    /**
     * 프론트엔드 인메모리(EntityStore)에서 시뮬레이션한 결과를 백엔드 SQLite DB에
     * 단일 원자적 트랜잭션(ACID)으로 확정(Commit) 저장하고 확정 버전을 발급한다.
     * @param {{
     *   module: string;
     *   planPeriod: string;
     *   planType: string;
     *   comment?: string;
     *   stores: Record<string, any[]>;
     * }} payload
     * @param {{ id?: string; role?: string }} [identity]
     */
    commitSimulationSync(payload, identity = {}) {
      const conn = ensureDb();
      const moduleName = String(payload?.module || "SCM").toUpperCase();
      const planPeriod = String(payload?.planPeriod || "2026-W27~W50");
      const planType = String(payload?.planType || "DEMAND_FORECAST");
      const comment = String(payload?.comment || "프론트엔드 시뮬레이션 확정 저장");
      const stores = payload?.stores && typeof payload.stores === "object" ? payload.stores : {};

      const userId = identity?.id || "admin";
      const userRole = identity?.role || "관리자";
      const ts = nowIso();

      return runInTransaction(conn, () => {
        let totalRows = 0;
        const storeEntries = Object.entries(stores);

        for (const [storeKey, rows] of storeEntries) {
          if (!Array.isArray(rows)) continue;
          this.writeStoreSync(storeKey, rows, identity, "SIMULATION_COMMIT", planType);
          this.observeIdsSync(rows);
          this.observeDocNumbersSync(rows);
          totalRows += rows.length;
        }

        const maxVerRow = conn
          .prepare(
            "SELECT MAX(version) AS maxVer FROM confirmed_transactions WHERE module = ? AND plan_type = ?"
          )
          .get(moduleName, planType);
        const nextVer = Number(maxVerRow?.maxVer ?? 0) + 1;
        const dateCode = ts.slice(0, 10).replace(/-/g, "");
        const txId = `CMT-${moduleName}-${dateCode}-V${nextVer}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

        conn
          .prepare(`
            INSERT INTO confirmed_transactions (
              id, module, plan_period, plan_type, version, row_count,
              comment, snapshot_json, committed_by, committed_role, committed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .run(
            txId,
            moduleName,
            planPeriod,
            planType,
            nextVer,
            totalRows,
            comment,
            JSON.stringify(stores),
            userId,
            userRole,
            ts
          );

        return {
          id: txId,
          module: moduleName,
          planPeriod,
          planType,
          version: nextVer,
          rowCount: totalRows,
          comment,
          committedBy: userId,
          committedRole: userRole,
          committedAt: ts,
        };
      });
    },

    /**
     * 확정된 시뮬레이션 트랜잭션 이력 목록을 조회한다 (스냅샷 본문 제외, 메타데이터만 반환).
     * @param {string} [module]
     * @param {number} [limit]
     */
    listConfirmedTransactionsSync(module, limit = 50) {
      const conn = ensureDb();
      const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      if (module) {
        return conn
          .prepare(`
            SELECT id, module, plan_period AS planPeriod, plan_type AS planType,
                   version, row_count AS rowCount, comment,
                   committed_by AS committedBy, committed_role AS committedRole, committed_at AS committedAt
            FROM confirmed_transactions
            WHERE module = ?
            ORDER BY committed_at DESC, version DESC
            LIMIT ?
          `)
          .all(String(module).toUpperCase(), safeLimit);
      }
      return conn
        .prepare(`
          SELECT id, module, plan_period AS planPeriod, plan_type AS planType,
                 version, row_count AS rowCount, comment,
                 committed_by AS committedBy, committed_role AS committedRole, committed_at AS committedAt
          FROM confirmed_transactions
          ORDER BY committed_at DESC, version DESC
          LIMIT ?
        `)
        .all(safeLimit);
    },

    /**
     * 감사 로그(Audit Trail) 목록을 조회한다.
     * @param {string} [storeKey]
     * @param {number} [limit]
     */
    listAuditLogsSync(storeKey, limit = 100) {
      const conn = ensureDb();
      const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
      if (storeKey) {
        return conn
          .prepare(`
            SELECT id, user_id AS userId, user_role AS userRole, store_key AS storeKey,
                   entity_id AS entityId, action, summary, created_at AS createdAt
            FROM audit_logs
            WHERE store_key = ?
            ORDER BY id DESC
            LIMIT ?
          `)
          .all(storeKey, safeLimit);
      }
      return conn
        .prepare(`
          SELECT id, user_id AS userId, user_role AS userRole, store_key AS storeKey,
                 entity_id AS entityId, action, summary, created_at AS createdAt
          FROM audit_logs
          ORDER BY id DESC
          LIMIT ?
        `)
        .all(safeLimit);
    },

    /**
     * DB 통계 요약 정보를 반환한다 (/api/health 용).
     */
    getStatsSync() {
      const conn = ensureDb();
      const storeCount = Number(
        conn.prepare("SELECT COUNT(*) AS cnt FROM erp_store_registry").get()?.cnt ?? 0
      );
      const entityCount = Number(
        conn.prepare("SELECT COUNT(*) AS cnt FROM erp_entities").get()?.cnt ?? 0
      );
      const commitCount = Number(
        conn.prepare("SELECT COUNT(*) AS cnt FROM confirmed_transactions").get()?.cnt ?? 0
      );
      const auditCount = Number(
        conn.prepare("SELECT COUNT(*) AS cnt FROM audit_logs").get()?.cnt ?? 0
      );
      return {
        engine: "SQLite (WAL Mode)",
        dbPath: dbFilePath,
        storeCount,
        entityCount,
        commitCount,
        auditCount,
      };
    },

    close() {
      if (db) {
        try {
          db.close();
        } catch {
          /* 이미 닫힘 */
        }
        db = null;
      }
    },
  };
}

