// 기준정보(MDM 12종) 및 핵심 운영 스토어 SQLite DB 일괄 시딩(Seeding) 및 정합성 검증 스크립트
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createStorage } from "../server/storage.mjs";
import {
  materialStore,
  bomStore,
  partnerStore,
  customerStore,
  supplierStore,
  workCenterMasterStore,
  warehouseStore,
  plantStore,
  equipmentStore,
  glAccountStore,
  fxRateStore,
  orgStore,
} from "../src/data/mock/master";
import { userStore, permStore } from "../src/data/mock/platform";
import { forecastStore, contingencyStore, sopStore, forecastParamStore } from "../src/data/mock/scm";
import { mpsStore, mpsWeeklyStore, woStore } from "../src/data/mock/production";
import { quotationStore, salesOrderStore } from "../src/data/mock/sales";
import { budgetStore, prStore, poStore, vendorEvalStore } from "../src/data/mock/procurement";
import { lotStore, txStore } from "../src/data/mock/logistics";
import { inspStore } from "../src/data/mock/quality";
import { journalStore, arStore, apStore } from "../src/data/mock/finance";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(process.env.DATA_DIR ?? join(HERE, "..", "data"));

const storage = createStorage(DATA_DIR);
await storage.init();

const identity = { id: "U-1001", role: "관리자" };

// 1. 기준정보(MDM) 12종 정의
const mdmSeeds: Array<{ key: string; label: string; rows: any[] }> = [
  { key: "master.material", label: "[MDM-01] 품목 마스터", rows: materialStore.getAll() },
  { key: "master.bom", label: "[MDM-02] BOM 마스터", rows: bomStore.getAll() },
  { key: "master.partner", label: "[MDM-03] 거래처 통합 마스터", rows: partnerStore.getAll() },
  { key: "master.customer", label: "[SD-01] 고객 여신 마스터", rows: customerStore.getAll() },
  { key: "master.supplier", label: "[MDM-04] 공급사 마스터", rows: supplierStore.getAll() },
  { key: "mdm.work_center", label: "[MDM-05] 작업장 마스터", rows: workCenterMasterStore.getAll() },
  { key: "master.warehouse", label: "[MDM-06] 창고 마스터", rows: warehouseStore.getAll() },
  { key: "master.plant", label: "[MDM-07] 공장 마스터", rows: plantStore.getAll() },
  { key: "master.equipment", label: "[MDM-08] 설비 마스터", rows: equipmentStore.getAll() },
  { key: "master.gl_account", label: "[MDM-09] 계정과목 마스터", rows: glAccountStore.getAll() },
  { key: "master.fx_rate", label: "[MDM-10] 환율 마스터", rows: fxRateStore.getAll() },
  { key: "master.org", label: "[MDM-11] 조직 마스터", rows: orgStore.getAll() },
];

// 2. 공통 권한 및 핵심 운영 트랜잭션 스토어 정의
const operationalSeeds: Array<{ key: string; label: string; rows: any[] }> = [
  { key: "platform.user", label: "[COM] 사용자 마스터", rows: userStore.getAll() },
  { key: "platform.permission", label: "[COM] 역할별 권한 매트릭스", rows: permStore.getAll() },
  { key: "scm.forecast", label: "[SCM-01] 24주 수요예측", rows: forecastStore.getAll() },
  { key: "scm.contingency", label: "[SCM-02] 3~24주 S&OP Contingency", rows: contingencyStore.getAll() },
  { key: "scm.sop", label: "[SCM-02] S&OP 합의 상태", rows: sopStore.getAll() },
  { key: "scm.forecast_params", label: "[SCM-01] AI 예측 튜닝 파라미터", rows: forecastParamStore.getAll() },
  { key: "production.mps", label: "[PP-01] 14일 일별 MPS", rows: mpsStore.getAll() },
  { key: "production.mps-weekly", label: "[PP-01] 3~20주 주간 MPS", rows: mpsWeeklyStore.getAll() },
  { key: "production.work-order", label: "[PP-03] 작업지시(WO)", rows: woStore.getAll() },
  { key: "sales.quotation", label: "[SD-02] 견적서(QT)", rows: quotationStore.getAll() },
  { key: "sales.order", label: "[SD-04] 수주서(SO)", rows: salesOrderStore.getAll() },
  { key: "procurement.budget", label: "[MM-00] 부서 예산", rows: budgetStore.getAll() },
  { key: "procurement.request", label: "[MM-01] 구매요청(PR)", rows: prStore.getAll() },
  { key: "procurement.order", label: "[MM-02] 구매발주(PO)", rows: poStore.getAll() },
  { key: "procurement.vendor-evaluation", label: "[MM-03] 공급사 평가", rows: vendorEvalStore.getAll() },
  { key: "logistics.lot", label: "[LE-03] LOT 재고", rows: lotStore.getAll() },
  { key: "logistics.transaction", label: "[LE-01] 수불 트랜잭션", rows: txStore.getAll() },
  { key: "quality.incoming-inspection", label: "[QM-01] 수입검사", rows: inspStore.getAll() },
  { key: "finance.journal", label: "[FI-01] 분개전표(JV)", rows: journalStore.getAll() },
  { key: "finance.ar", label: "[FI-02] 매출채권(AR)", rows: arStore.getAll() },
  { key: "finance.ap", label: "[FI-03] 매입채무(AP)", rows: apStore.getAll() },
];

console.log("═══ [1/3] 기준정보(MDM) 12종 SQLite DB(erp_entities + mdm_* 정규화 테이블) 일괄 등록 ═══");
for (const item of mdmSeeds) {
  await storage.write(item.key, item.rows, identity, "SEED_MDM");
  await storage.observeIds(item.rows);
  await storage.observeDocNumbers(item.rows);
  console.log(` ✅ ${item.label.padEnd(26)} (${item.key.padEnd(18)}) ➔ ${item.rows.length}건 적재 및 정규화 테이블 동기화 완료`);
}

console.log("\n═══ [2/3] 공통 권한 및 핵심 운영 트랜잭션 19종 초기 데이터 적재 ═══");
for (const item of operationalSeeds) {
  const existing = await storage.read(item.key);
  if (!existing || existing.length <= 1) {
    await storage.write(item.key, item.rows, identity, "SEED_INIT");
    await storage.observeIds(item.rows);
    await storage.observeDocNumbers(item.rows);
    console.log(` ✅ ${item.label.padEnd(26)} (${item.key.padEnd(30)}) ➔ ${item.rows.length}건 초기 적재 완료`);
  } else {
    console.log(` ⏭️ ${item.label.padEnd(26)} (${item.key.padEnd(30)}) ➔ 기존 ${existing.length}건 유지`);
  }
}

console.log("\n═══ [3/3] SQLite 정규화 기준정보(MDM) 물리 테이블 12종 정합성 검증 ═══");
const mdmStatus = await storage.getMdmStatus();
let allValid = true;
for (const st of mdmStatus) {
  const expected = mdmSeeds.find((m) => m.key === st.storeKey)?.rows.length ?? 0;
  const ok = st.rowCount === expected && st.rowCount > 0;
  if (!ok) allValid = false;
  console.log(
    ` ${ok ? "PASS" : "FAIL"} | ${st.menuCode.padEnd(6)} | 물리테이블: ${st.table.padEnd(18)} | 스토어: ${st.storeKey.padEnd(18)} | 등록건수: ${st.rowCount}건 (v${st.version})`
  );
}

const stats = await storage.getStats();
console.log(
  `\n📊 최종 DB 요약: 스토어 ${stats.storeCount}개 · 총 엔티티 ${stats.entityCount}건 · MDM 정규화 테이블 ${stats.mdmTableCount}개(${stats.mdmTotalRows}건) · 감사로그 ${stats.auditCount}건`
);

storage.close();
if (!allValid) process.exitCode = 1;
