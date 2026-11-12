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

-- =========================================================================
-- 6. 기준정보관리 (MDM: Master Data Management) 12종 정규화 물리 테이블
-- erp_entities 와 실시간 양방향/자동 동기화되어 RDBMS 컬럼 쿼리 및 인덱싱을 보장한다.
-- =========================================================================

-- [MDM-01] 품목 마스터 (master.material)
CREATE TABLE IF NOT EXISTS mdm_material (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '원자재',
  uom TEXT NOT NULL DEFAULT 'EA',
  price REAL NOT NULL DEFAULT 0,
  labor REAL NOT NULL DEFAULT 0,
  stock REAL NOT NULL DEFAULT 0,
  safety REAL NOT NULL DEFAULT 0,
  lead_time_weeks INTEGER NOT NULL DEFAULT 1,
  lead_time_category TEXT NOT NULL DEFAULT '단납기',
  status TEXT NOT NULL DEFAULT '사용',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mdm_material_code ON mdm_material(code);

-- [MDM-02] BOM 마스터 (master.bom)
CREATE TABLE IF NOT EXISTS mdm_bom (
  id TEXT PRIMARY KEY,
  parent TEXT NOT NULL,
  child TEXT NOT NULL,
  qty REAL NOT NULL DEFAULT 1,
  uom TEXT NOT NULL DEFAULT 'EA',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mdm_bom_parent ON mdm_bom(parent);

-- [MDM-03] 거래처 통합 마스터 (master.partner)
CREATE TABLE IF NOT EXISTS mdm_partner (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '고객',
  country TEXT NOT NULL DEFAULT 'KR',
  currency TEXT NOT NULL DEFAULT 'KRW',
  pay_term TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '거래중',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mdm_partner_code ON mdm_partner(code);

-- [SD-01 / MDM] 고객 여신 마스터 (master.customer)
CREATE TABLE IF NOT EXISTS mdm_customer (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'KR',
  currency TEXT NOT NULL DEFAULT 'KRW',
  pay_term TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT 'B',
  credit_limit REAL NOT NULL DEFAULT 0,
  credit_used REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '거래중',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mdm_customer_code ON mdm_customer(code);

-- [MDM-04] 공급사 조달조건 마스터 (master.supplier)
CREATE TABLE IF NOT EXISTS mdm_supplier (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  item_group TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'KR',
  currency TEXT NOT NULL DEFAULT 'KRW',
  pay_term TEXT NOT NULL DEFAULT '',
  lead_time_weeks INTEGER NOT NULL DEFAULT 1,
  moq REAL NOT NULL DEFAULT 0,
  quality_grade TEXT NOT NULL DEFAULT 'B',
  status TEXT NOT NULL DEFAULT '거래중',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mdm_supplier_code ON mdm_supplier(code);

-- [MDM-05] 작업장 마스터 (mdm.work_center / master.work_center)
CREATE TABLE IF NOT EXISTS mdm_work_center (
  id TEXT PRIMARY KEY,
  work_center_code TEXT NOT NULL,
  work_center_name TEXT NOT NULL,
  process_category TEXT NOT NULL DEFAULT '메인 조립',
  hourly_labor_rate REAL NOT NULL DEFAULT 0,
  hourly_overhead_rate REAL NOT NULL DEFAULT 0,
  daily_capacity_hours REAL NOT NULL DEFAULT 8,
  status TEXT NOT NULL DEFAULT '사용중',
  plant_name TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

-- [MDM-06] 창고 마스터 (master.warehouse)
CREATE TABLE IF NOT EXISTS mdm_warehouse (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  plant TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '완제품',
  status TEXT NOT NULL DEFAULT '사용',
  updated_at TEXT NOT NULL
);

-- [MDM-07] 공장 마스터 (master.plant)
CREATE TABLE IF NOT EXISTS mdm_plant (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  manager TEXT NOT NULL DEFAULT '',
  line_count INTEGER NOT NULL DEFAULT 0,
  daily_capacity REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '가동중',
  updated_at TEXT NOT NULL
);

-- [MDM-08] 설비 마스터 (master.equipment)
CREATE TABLE IF NOT EXISTS mdm_equipment (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  plant TEXT NOT NULL DEFAULT '',
  work_center TEXT NOT NULL DEFAULT '',
  acquired_at TEXT NOT NULL DEFAULT '',
  rated_capacity REAL NOT NULL DEFAULT 0,
  pm_cycle_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT '정상',
  updated_at TEXT NOT NULL
);

-- [MDM-09] 계정과목 마스터 (master.gl_account)
CREATE TABLE IF NOT EXISTS mdm_gl_account (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '자산',
  drcr TEXT NOT NULL DEFAULT '차변',
  parent_code TEXT NOT NULL DEFAULT '',
  use_yn TEXT NOT NULL DEFAULT 'Y',
  updated_at TEXT NOT NULL
);

-- [MDM-10] 환율 마스터 (master.fx_rate)
CREATE TABLE IF NOT EXISTS mdm_fx_rate (
  id TEXT PRIMARY KEY,
  currency TEXT NOT NULL,
  rate_date TEXT NOT NULL,
  base_rate REAL NOT NULL DEFAULT 0,
  buy_rate REAL NOT NULL DEFAULT 0,
  sell_rate REAL NOT NULL DEFAULT 0,
  quote_seq INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

-- [MDM-11] 조직 마스터 (master.org)
CREATE TABLE IF NOT EXISTS mdm_org (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  org_type TEXT NOT NULL DEFAULT '팀',
  parent_code TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '(주)그린전자',
  head TEXT NOT NULL DEFAULT '',
  headcount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '운영중',
  updated_at TEXT NOT NULL
);

-- [AI-RAG] 비정형 매뉴얼·업무규정 벡터 스토어 (rag_vector_docs — RBAC Metadata Filtering 지원)
CREATE TABLE IF NOT EXISTS rag_vector_docs (
  doc_id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  min_perm_level TEXT NOT NULL DEFAULT '조회',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tcode TEXT NOT NULL DEFAULT '',
  route_path TEXT NOT NULL DEFAULT '',
  embedding_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

/**
 * SQLite 데이터베이스 인스턴스를 생성하고 WAL 모드 및 하이브리드/MDM 스키마를 초기화한다.
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
