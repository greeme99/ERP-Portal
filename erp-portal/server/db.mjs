// SQLite (WAL 모드) 데이터베이스 엔진 — Desktop PC 로컬/사내 서버용.
// Node.js 표준 내장 모듈(node:sqlite DatabaseSync)을 사용하여 C++ 컴파일 의존성 없이 동작한다.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const SCHEMA_DDL = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;

-- 0. 스토어 키 레지스트리 (키 생성 여부, 버전, 행 수 메타데이터)
CREATE TABLE IF NOT EXISTS erp_store_registry (
  store_key TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  row_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT 'system'
);

-- 1. 155개 ERP 엔티티 공통 하이브리드 테이블 (JSON1 호환 + 행 순서/버전 관리)
CREATE TABLE IF NOT EXISTS erp_entities (
  store_key TEXT NOT NULL,
  id TEXT NOT NULL,
  row_order INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT 'system',
  PRIMARY KEY (store_key, id)
);

CREATE INDEX IF NOT EXISTS idx_erp_entities_store_order
  ON erp_entities(store_key, row_order ASC);

-- 2. 문서번호 무결성 채번 테이블 (문서유형·기간별 1씩 증가)
CREATE TABLE IF NOT EXISTS doc_numbers (
  doc_type TEXT NOT NULL,
  period TEXT NOT NULL,
  current_seq INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (doc_type, period)
);

-- 3. 글로벌 ID 시퀀스 구간 예약 테이블
CREATE TABLE IF NOT EXISTS sequences (
  seq_key TEXT PRIMARY KEY,
  current_val INTEGER NOT NULL DEFAULT 1000,
  updated_at TEXT NOT NULL
);

-- 4. 감사 추적 로그 (Audit Trail) 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  user_role TEXT NOT NULL DEFAULT '',
  store_key TEXT NOT NULL,
  entity_id TEXT NOT NULL DEFAULT '*',
  action TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  payload_snapshot TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_store
  ON audit_logs(store_key, created_at DESC);

-- 5. 프론트엔드 시뮬레이션 확정 이력 (Confirmed Transactions) 테이블
CREATE TABLE IF NOT EXISTS confirmed_transactions (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  plan_period TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  version INTEGER NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  comment TEXT NOT NULL DEFAULT '',
  snapshot_json TEXT NOT NULL,
  committed_by TEXT NOT NULL DEFAULT 'system',
  committed_role TEXT NOT NULL DEFAULT '관리자',
  committed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_confirmed_tx_module
  ON confirmed_transactions(module, plan_type, version DESC);
`;

/**
 * SQLite 데이터베이스 인스턴스를 생성하고 WAL 모드 및 하이브리드 스키마를 초기화한다.
 * @param {string} dbFilePath SQLite DB 파일 경로 (또는 ':memory:')
 */
export function openSqliteDatabase(dbFilePath) {
  if (dbFilePath !== ":memory:") {
    const absPath = resolve(dbFilePath);
    mkdirSync(dirname(absPath), { recursive: true });
  }
  const db = new DatabaseSync(dbFilePath);
  db.exec(SCHEMA_DDL);
  return db;
}

const txDepthMap = new WeakMap();

/**
 * 원자적 트랜잭션(ACID) 실행 래퍼 (중첩 호출 시 SAVEPOINT 자동 지원).
 * SQLite WAL 모드에서 최외곽 트랜잭션은 BEGIN IMMEDIATE 로 쓰기 잠금을 획득하고,
 * 내부 중첩 트랜잭션은 SAVEPOINT 로 안전하게 처리한다.
 * @template T
 * @param {DatabaseSync} db
 * @param {() => T} work
 * @returns {T}
 */
export function runInTransaction(db, work) {
  const depth = txDepthMap.get(db) ?? 0;
  txDepthMap.set(db, depth + 1);
  const spName = `sp_${depth}`;

  if (depth === 0) {
    db.exec("BEGIN IMMEDIATE");
  } else {
    db.exec(`SAVEPOINT ${spName}`);
  }

  try {
    const result = work();
    if (depth === 0) {
      db.exec("COMMIT");
    } else {
      db.exec(`RELEASE SAVEPOINT ${spName}`);
    }
    return result;
  } catch (err) {
    try {
      if (depth === 0) {
        db.exec("ROLLBACK");
      } else {
        db.exec(`ROLLBACK TO SAVEPOINT ${spName}`);
        db.exec(`RELEASE SAVEPOINT ${spName}`);
      }
    } catch {
      // 이미 롤백된 경우 무시
    }
    throw err;
  } finally {
    txDepthMap.set(db, depth);
  }
}
