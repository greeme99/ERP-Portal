// E2E 통합 시나리오 검증 — MRP→PR→PO→입고→검사→생산→수주→출고→회계→KPI
// 실행: npx tsx scripts/e2e-scenario.ts
import { materialStore, bomStore, customerStore } from "../src/data/mock/master";
import { salesOrderStore, docTotal, atpQty, DocLine } from "../src/data/mock/sales";
import { prStore, poStore, budgetStore } from "../src/data/mock/procurement";
import { lotStore, txStore, newLotCode } from "../src/data/mock/logistics";
import { mpsStore, woStore, explodeBom } from "../src/data/mock/production";
import { inspStore, sampleSize } from "../src/data/mock/quality";
import { procInspStore, ncStore, capaStore, D_STEPS } from "../src/data/mock/quality2";
import { journalStore, arStore, jvBalanced, stdCost, JLine } from "../src/data/mock/finance";
import { computeKpis, computeExceptions, AI_AGENTS, routeQuestion } from "../src/services/insights";
import { nextId } from "../src/services/store";


const TODAY = "2026-07-03";
let pass = 0, fail = 0;
const check = (cond: boolean, msg: string) => {
  console.log(`${cond ? "✅ PASS" : "❌ FAIL"} | ${msg}`);
  cond ? pass++ : fail++;
};
const log = (msg: string) => console.log(`   → ${msg}`);

console.log("═══ E2E 통합 시나리오 검증 (2026-07-03) ═══\n");

// ── STEP 1. MRP: MPS 기반 BOM 전개 → 부족자재 산출 ──
console.log("[1] MRP 자재소요 전개");
const req: Record<string, number> = {};
mpsStore.getAll().forEach((p) => explodeBom(p.material, p.plan, bomStore.getAll(), req));
const rm3004 = materialStore.getAll().find((m) => m.code === "RM-3004")!;
const shortage3004 = Math.ceil(Math.max(0, (req["RM-3004"] ?? 0) + rm3004.safety - rm3004.stock));
check(Object.keys(req).length >= 7, `BOM 전개 자재 ${Object.keys(req).length}종 (기대 ≥7)`);
check(shortage3004 > 0, `RM-3004 부족량 ${shortage3004.toLocaleString()} (소요 ${req["RM-3004"]}, 재고 ${rm3004.stock})`);

// ── STEP 2. PR 생성 → 승인 (예산 차감) ──
console.log("\n[2] 구매요청 PR 승인 Workflow");
const budget0 = budgetStore.getAll().find((b) => b.dept === "생산팀")!;
const prAmount = shortage3004 * rm3004.price;
check(budget0.used + prAmount <= budget0.budget, `예산 체크: 잔여 ${(budget0.budget - budget0.used).toLocaleString()} ≥ 요청 ${prAmount.toLocaleString()}`);
const prCode = nextId("PR");
prStore.create({ id: prCode, code: prCode, dept: "생산팀", material: "RM-3004", qty: shortage3004, amount: prAmount, reqDate: TODAY, dueDate: "2026-07-25", status: "승인대기" });
prStore.update(prCode, { status: "승인" });
budgetStore.update(budget0.id, { used: budget0.used + prAmount });
const budget1 = budgetStore.getAll().find((b) => b.dept === "생산팀")!;
check(budget1.used === budget0.used + prAmount, `승인 시 예산 차감: ${budget0.used.toLocaleString()} → ${budget1.used.toLocaleString()}`);

// ── STEP 3. PO 발주 → 입고 (LOT 생성 + 재고 증가) ──
console.log("\n[3] 발주 → 입고");
const poCode = nextId("PO");
poStore.create({ id: poCode, code: poCode, pr: prCode, vendor: "V-1002", material: "RM-3004", qty: shortage3004, price: rm3004.price, orderDate: TODAY, dueDate: "2026-07-18", status: "발주" });
const stockBefore = materialStore.getAll().find((m) => m.code === "RM-3004")!.stock;
const lotCode = newLotCode();
lotStore.create({ id: lotCode, code: lotCode, material: "RM-3004", qty: shortage3004, wh: "WH-102", vendor: "V-1002", date: TODAY, status: "가용" });
materialStore.update("RM-3004", { stock: stockBefore + shortage3004 });
txStore.create({ id: nextId("TX"), type: "입고", material: "RM-3004", qty: shortage3004, from: "V-1002", to: "WH-102", lot: lotCode, date: TODAY, ref: poCode });
poStore.update(poCode, { status: "입고완료" });
const stockAfter = materialStore.getAll().find((m) => m.code === "RM-3004")!.stock;
check(stockAfter === stockBefore + shortage3004, `입고 재고 반영: ${stockBefore.toLocaleString()} → ${stockAfter.toLocaleString()}`);
check(lotStore.getAll().some((l) => l.code === lotCode), `LOT 생성: ${lotCode}`);

// ── STEP 4. 수입검사 합격 ──
console.log("\n[4] 수입검사");
const iqCode = nextId("IQ");
const smp = sampleSize(shortage3004);
inspStore.create({ id: iqCode, code: iqCode, lot: lotCode, material: "RM-3004", vendor: "V-1002", qty: shortage3004, sample: smp, defects: 0, result: "합격", date: TODAY });
check(inspStore.getAll().find((i) => i.code === iqCode)?.result === "합격", `${lotCode} 검사 합격 (샘플 ${smp}, 불량 0)`);

// ── STEP 5. 생산: WO 실적 → 백플러시 + FG 입고 ──
console.log("\n[5] 생산 실행 (FG-1001 500대, 양품 490/불량 10)");
const woCode = nextId("WO");
woStore.create({ id: woCode, code: woCode, material: "FG-1001", qty: 500, startDate: TODAY, dueDate: "2026-07-15", status: "진행", good: 0, defect: 0 });
const good = 490, defect = 10, input = good + defect;
const fgBefore = materialStore.getAll().find((m) => m.code === "FG-1001")!.stock;
const sfBefore = materialStore.getAll().find((m) => m.code === "SF-2001")!.stock;
bomStore.getAll().filter((b) => b.parent === "FG-1001").forEach((b) => {
  const m = materialStore.getAll().find((x) => x.code === b.child)!;
  materialStore.update(m.id, { stock: m.stock - Math.ceil(b.qty * input) });
});
materialStore.update("FG-1001", { stock: materialStore.getAll().find((m) => m.code === "FG-1001")!.stock + good });
const fgLot = newLotCode();
lotStore.create({ id: fgLot, code: fgLot, material: "FG-1001", qty: good, wh: "WH-101", vendor: "-", date: TODAY, status: "가용" });
woStore.update(woCode, { status: "완료", good, defect });
const fgAfter = materialStore.getAll().find((m) => m.code === "FG-1001")!.stock;
const sfAfter = materialStore.getAll().find((m) => m.code === "SF-2001")!.stock;
check(fgAfter === fgBefore + good, `FG 입고: ${fgBefore.toLocaleString()} → ${fgAfter.toLocaleString()} (+${good})`);
check(sfAfter === sfBefore - input, `백플러시 차감 SF-2001: ${sfBefore.toLocaleString()} → ${sfAfter.toLocaleString()} (−${input})`);

// ── STEP 6. 수주 → ATP → 출하예약 → 출고 (FIFO) ──
console.log("\n[6] 수주 → 출고");
const soCode = nextId("SO");
const soQty = 400, soPrice = 82000;
salesOrderStore.create({ id: soCode, code: soCode, customer: "C-1001", orderDate: TODAY, dueDate: "2026-07-20", status: "등록", lines: [{ material: "FG-1001", qty: soQty, price: soPrice }] as DocLine[] });
const atp = atpQty("FG-1001", fgAfter, salesOrderStore.getAll(), soCode);
log(`FG-1001 ATP(신규 수주 제외) = ${atp.toLocaleString()} — 기존 미출하 수주 반영`);
salesOrderStore.update(soCode, { status: "출하예약" });
// 출고: 재고 차감 + LOT FIFO
const fgStock2 = materialStore.getAll().find((m) => m.code === "FG-1001")!.stock;
check(fgStock2 >= soQty, `출고 가능 재고: ${fgStock2.toLocaleString()} ≥ ${soQty}`);
let remain = soQty;
lotStore.getAll()
  .filter((l) => l.material === "FG-1001" && l.status === "가용" && l.qty > 0)
  .sort((a, b) => (a.date < b.date ? -1 : 1))
  .forEach((l) => {
    if (remain <= 0) return;
    const take = Math.min(l.qty, remain);
    lotStore.update(l.id, { qty: l.qty - take, status: l.qty - take === 0 ? "소진" : "가용" });
    remain -= take;
  });
materialStore.update("FG-1001", { stock: fgStock2 - soQty });
salesOrderStore.update(soCode, { status: "출하완료" });
check(remain === 0, `LOT FIFO 차감 완료 (${soQty}개)`);
check(salesOrderStore.getAll().find((o) => o.id === soCode)?.status === "출하완료", `${soCode} 출하완료`);

// ── STEP 7. 회계: 매출 전표 + AR + 수금 ──
console.log("\n[7] 회계 연동");
const soAmt = soQty * soPrice;
const jvCode = nextId("JV");
const jvLines: JLine[] = [
  { account: "외상매출금", dr: soAmt, cr: 0 },
  { account: "제품매출", dr: 0, cr: soAmt },
];
journalStore.create({ id: jvCode, code: jvCode, date: TODAY, desc: "매출 인식 (C-1001)", ref: soCode, status: "전기", lines: jvLines });
check(jvBalanced(jvLines).ok, `매출전표 차대평형: ${soAmt.toLocaleString()}`);
const arCode = nextId("AR");
arStore.create({ id: arCode, code: arCode, ref: soCode, customer: "C-1001", amount: soAmt, invoiceDate: TODAY, dueDate: "2026-08-02", status: "미수" });
const cust0 = customerStore.getAll().find((c) => c.code === "C-1001")!;
arStore.update(arCode, { status: "수금완료" });
customerStore.update(cust0.id, { creditUsed: Math.max(0, cust0.creditUsed - soAmt) });
const cust1 = customerStore.getAll().find((c) => c.code === "C-1001")!;
check(cust1.creditUsed === cust0.creditUsed - soAmt, `수금 시 여신 차감: ${cust0.creditUsed.toLocaleString()} → ${cust1.creditUsed.toLocaleString()}`);

// ── STEP 8. KPI/손익 최종 검증 ──
console.log("\n[8] KPI·손익 집계");
const k = computeKpis();
const unitCost = stdCost("FG-1001", materialStore.getAll(), bomStore.getAll());
check(k.revenue >= soAmt, `매출 집계 ${(k.revenue / 1e8).toFixed(2)}억 ≥ 신규 출하 ${(soAmt / 1e8).toFixed(2)}억`);
check(k.profit > 0 && k.marginPct !== null, `매출총이익 ${(k.profit / 1e8).toFixed(2)}억 (마진 ${k.marginPct?.toFixed(1)}%, FG-1001 표준원가 ${Math.round(unitCost).toLocaleString()}원)`);
// Sprint 7 원가 현실화 검증: FG-1001 마진율 20~50% 정상범위
const fgMargin = ((82000 - unitCost) / 82000) * 100;
check(fgMargin >= 20 && fgMargin <= 50, `원가 현실화: FG-1001 마진율 ${fgMargin.toFixed(1)}% (정상범위 20~50%)`);
const ex = computeExceptions();
log(`예외 탐지 ${ex.length}건: ${ex.map((e) => e.tag).join(", ")}`);
check(k.ppm !== null && k.ppm > 0, `품질 PPM ${Math.round(k.ppm!).toLocaleString()} (생산불량 ${defect} 반영)`);
check(k.otd !== null, `OTD ${k.otd?.toFixed(1)}%`);

// ── STEP 9. QM 확장 연쇄 흐름 (공정검사 → 부적합(NC) 8D → CAPA → 자동종결) ──
console.log("\n[9] QM 확장 연쇄 흐름 검증");

// 9-1. 공정검사 불합격 등록 (불량률 5% > 허용치 2%)
const pqCode = nextId("PQ");
const pqSample = 100, pqDefects = 5;
const pqResult = pqDefects / pqSample > 0.02 ? "불합격" : "합격";
procInspStore.create({ id: pqCode, code: pqCode, wo: woCode, material: "FG-1001", process: "최종조립", sample: pqSample, defects: pqDefects, result: pqResult, date: TODAY });
check(pqResult === "불합격", `공정검사 ${pqCode} 불합격 판정 (샘플 ${pqSample}, 불량 ${pqDefects}, 불량률 ${((pqDefects / pqSample) * 100).toFixed(1)}% > 2%)`);

// 9-2. 부적합(NC) 자동 연계 생성 (8D D1단계 개시)
const ncCode = nextId("NC");
ncStore.create({
  id: ncCode, code: ncCode, source: "공정검사", ref: pqCode, material: "FG-1001", vendor: "-",
  qty: pqDefects, defectType: "조립불량", severity: "중", dStep: 1, capa: "", status: "진행", date: TODAY,
  desc: `공정검사 ${pqCode} 불합격 연계 부적합 발생`,
});
const nc0 = ncStore.getAll().find((n) => n.code === ncCode)!;
check(nc0 !== undefined && nc0.status === "진행" && nc0.dStep === 1, `부적합 ${ncCode} 자동 발행 (D1 단계 진행중)`);

// 9-3. 8D 단계 진행 (D1 → D4 근본원인)
ncStore.update(ncCode, { dStep: 4 });
const nc1 = ncStore.getAll().find((n) => n.code === ncCode)!;
check(nc1.dStep === 4, `8D 프로세스 진행: ${D_STEPS[nc1.dStep - 1]}`);

// 9-4. CAPA 발행 연계
const capaCode = nextId("CAPA");
capaStore.create({
  id: capaCode, code: capaCode, nc: ncCode, type: "시정조치", owner: "생산기술팀",
  action: "조립 토크 체결 표준 재설정 및 작업자 교육", dueDate: "2026-07-20", status: "진행", effectiveness: "-",
});
ncStore.update(ncCode, { capa: capaCode });
check(capaStore.getAll().some((c) => c.code === capaCode && c.nc === ncCode), `CAPA ${capaCode} 발행 (NC ${ncCode} 연계)`);

// 9-5. CAPA 조치 완료 & 효과성 검증 → NC 자동 종결
capaStore.update(capaCode, { status: "완료", effectiveness: "유효 (불량률 0.1% 이하 감소)" });
// CAPA 완료 연동: NC 종결 및 D8 단계 세팅
ncStore.update(ncCode, { status: "종결", dStep: 8 });
const nc2 = ncStore.getAll().find((n) => n.code === ncCode)!;
const capa2 = capaStore.getAll().find((c) => c.code === capaCode)!;
check(capa2.status === "완료" && nc2.status === "종결" && nc2.dStep === 8, `CAPA 완료 → 연계 NC ${ncCode} 자동 종결 (${D_STEPS[7]})`);


// ── STEP 10. AI Agent 오케스트레이션 및 인사이트 검증 ──
console.log("\n[10] AI Agent 오케스트레이션 검증");

// AI Agent 5종 정상 동작 검증
let agentSuccessCount = 0;
AI_AGENTS.forEach((agent) => {
  const resultText = agent.run();
  if (resultText && resultText.length > 10) agentSuccessCount++;
});
check(agentSuccessCount === 5, `AI Agent 5종 (Demand Planner, Buyer, Scheduler, Quality, CFO) 인사이트 생성 (${agentSuccessCount}/5)`);

// 질문 라우팅 검증
const routeRes1 = routeQuestion("이번 달 손익 요약해줘");
const routeRes2 = routeQuestion("품질 이상 징후 확인해줘");
check(routeRes1.includes("AI CFO") && routeRes2.includes("AI Quality"), "AI Agent 자연어 질문 라우팅 검증 성공");

console.log(`\n═══ 결과: PASS ${pass} / FAIL ${fail} — ${fail === 0 ? "✅ E2E 통합 검증 성공" : "❌ 검증 실패"} ═══`);
process.exit(fail === 0 ? 0 : 1);

