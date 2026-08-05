// 인사이트 계산 계층 — KPI, 예외탐지, AI Agent 분석 (전 store 집계)
// 컴포넌트에서 useStore()로 구독한 뒤 이 함수들을 호출하면 데이터 변경 시 자동 재계산됨
import { materialStore, bomStore, customerStore } from "../data/mock/master";
import { salesOrderStore, docTotal, atpQty, DocLine } from "../data/mock/sales";
import { prStore, poStore, budgetStore, vendorEvalStore, evalTotal, evalGrade } from "../data/mock/procurement";
import { lotStore } from "../data/mock/logistics";
import { mpsStore, woStore, CAPACITY } from "../data/mock/production";
import { inspStore, SPC_SERIES, spcStats } from "../data/mock/quality";
import { ncStore, capaStore } from "../data/mock/quality2";
import { ecoStore } from "../data/mock/pdm";
import { arStore, apStore, stdCost } from "../data/mock/finance";

export const TODAY = "2026-07-03";
export const fmtEok = (v: number) => `${(v / 100000000).toFixed(2)}억`;

// ── KPI 집계 ─────────────────────────────────────
export function computeKpis() {
  const mats = materialStore.getAll();
  const boms = bomStore.getAll();
  const orders = salesOrderStore.getAll();
  const wos = woStore.getAll();
  const insps = inspStore.getAll();

  const delivered = orders.filter((o) => o.status === "출하완료");
  const revenue = delivered.reduce((s, o) => s + docTotal(o.lines as DocLine[]), 0);
  const cogs = delivered.reduce(
    (s, o) => s + (o.lines as DocLine[]).reduce((t, l) => t + stdCost(l.material, mats, boms) * l.qty, 0), 0);
  const profit = revenue - cogs;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : null;

  const invValue = mats.reduce((s, m) => s + m.stock * m.price, 0);
  const turnover = invValue > 0 && cogs > 0 ? (cogs * 12) / invValue : null; // 월 원가 연간화 proxy

  const onTime = delivered.filter((o) => o.dueDate >= TODAY).length;
  const otd = delivered.length > 0 ? (onTime / delivered.length) * 100 : null;

  const doneWos = wos.filter((w) => w.status === "완료");
  const totGood = doneWos.reduce((s, w) => s + w.good, 0);
  const totAll = doneWos.reduce((s, w) => s + w.good + w.defect, 0);
  const yieldPct = totAll > 0 ? (totGood / totAll) * 100 : null;
  const oee = yieldPct !== null ? yieldPct * 0.92 : null; // 가동률 92% 가정 proxy

  const inspDefects = insps.reduce((s, i) => s + (i.result !== "대기" ? i.defects : 0), 0);
  const inspSamples = insps.reduce((s, i) => s + (i.result !== "대기" ? i.sample : 0), 0);
  const woDefects = totAll - totGood;
  const ppm = inspSamples + totAll > 0 ? ((inspDefects + woDefects) / (inspSamples + totAll)) * 1e6 : null;

  return { revenue, cogs, profit, marginPct, invValue, turnover, otd, oee, yieldPct, ppm, deliveredCount: delivered.length };
}

// ── 예외 탐지 ────────────────────────────────────
export interface Exception {
  tag: string;
  text: string;
  link: string;
  severity: "high" | "mid";
}

export function computeExceptions(): Exception[] {
  const mats = materialStore.getAll();
  const boms = bomStore.getAll();
  const orders = salesOrderStore.getAll();
  const ars = arStore.getAll();
  const pos = poStore.getAll();
  const budgets = budgetStore.getAll();
  const lots = lotStore.getAll();
  const ex: Exception[] = [];

  // AR 연체
  const overdue = ars.filter((a) => a.status === "미수" && a.dueDate < TODAY);
  if (overdue.length > 0)
    ex.push({ tag: "채권", severity: "high", link: "/m/fi/fi-03",
      text: `연체 채권 ${overdue.length}건 ${fmtEok(overdue.reduce((s, a) => s + a.amount, 0))} — 수금 독촉 필요` });

  // ATP 부족 (미출하 수주)
  const atpShort = orders
    .filter((o) => o.status === "등록" || o.status === "출하예약")
    .flatMap((o) => (o.lines as DocLine[]).map((l) => ({ o, l })))
    .filter(({ o, l }) => {
      const m = mats.find((x) => x.code === l.material);
      return m ? atpQty(l.material, m.stock, orders, o.id) < l.qty : false;
    });
  if (atpShort.length > 0)
    ex.push({ tag: "수주", severity: "high", link: "/m/sd/sd-04",
      text: `ATP 부족 수주라인 ${atpShort.length}건 — 생산계획(MPS) 반영 필요` });

  // 안전재고 미달
  const belowSafety = mats.filter((m) => m.stock < m.safety);
  if (belowSafety.length > 0)
    ex.push({ tag: "재고", severity: "mid", link: "/m/pp/pp-03",
      text: `안전재고 미달 ${belowSafety.length}종 (${belowSafety.slice(0, 3).map((m) => m.code).join(", ")}${belowSafety.length > 3 ? " 외" : ""}) — MRP 실행 권장` });

  // PO 납기 지연
  const latePo = pos.filter((o) => o.status === "발주" && o.dueDate < TODAY);
  if (latePo.length > 0)
    ex.push({ tag: "구매", severity: "high", link: "/m/mm/mm-05",
      text: `납기 지연 PO ${latePo.length}건 (${latePo.map((o) => o.code).join(", ")}) — 공급사 독촉` });

  // 예산 소진
  const hotBudgets = budgets.filter((b) => b.used / b.budget >= 0.9);
  if (hotBudgets.length > 0)
    ex.push({ tag: "예산", severity: "mid", link: "/m/mm/mm-04",
      text: `예산 90% 이상 소진 부서: ${hotBudgets.map((b) => b.dept).join(", ")}` });

  // SPC 공정능력
  const badSpc = SPC_SERIES.filter((s) => spcStats(s).cpk < 1.33);
  if (badSpc.length > 0)
    ex.push({ tag: "품질", severity: "high", link: "/m/qm/qm-06",
      text: `Cpk < 1.33 특성 ${badSpc.length}건 (${badSpc.map((s) => s.name).join(", ")}) — 공정개선 필요` });

  // 보류 LOT
  const heldLots = lots.filter((l) => l.status === "보류");
  if (heldLots.length > 0)
    ex.push({ tag: "품질", severity: "mid", link: "/m/le/le-05",
      text: `검사 불합격 보류 LOT ${heldLots.length}건 — 부적합관리 처리 필요` });

  // 미종결 부적합(NC)
  const openNc = ncStore.getAll().filter((n) => n.status === "진행");
  if (openNc.length > 0)
    ex.push({ tag: "부적합", severity: "mid", link: "/m/qm/qm-08",
      text: `미종결 부적합(8D) ${openNc.length}건 (${openNc.map((n) => n.code).join(", ")}) — 근본원인/시정조치 진행 필요` });

  // CAPA 기한 초과
  const lateCapa = capaStore.getAll().filter((c) => c.status === "진행" && c.dueDate < TODAY);
  if (lateCapa.length > 0)
    ex.push({ tag: "CAPA", severity: "high", link: "/m/qm/qm-11",
      text: `기한 초과 CAPA ${lateCapa.length}건 — 시정조치 지연` });

  // 승인 후 미적용 ECO
  const openEco = ecoStore.getAll().filter((e) => e.status === "승인");
  if (openEco.length > 0)
    ex.push({ tag: "설계변경", severity: "mid", link: "/m/plm/plm-03",
      text: `적용 대기 ECO ${openEco.length}건 (${openEco.map((e) => e.code).join(", ")}) — BOM 반영 필요` });

  return ex.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));
}

// ── AI Agent 분석 (rule-based 시나리오) ──────────
export function aiDemandPlanner(): string {
  const plans = mpsStore.getAll();
  const orders = salesOrderStore.getAll();
  const mats = materialStore.getAll();
  const lines = plans.map((p) => {
    const so = orders
      .filter((o) => o.status === "등록" || o.status === "출하예약")
      .flatMap((o) => o.lines as DocLine[])
      .filter((l) => l.material === p.material)
      .reduce((s, l) => s + l.qty, 0);
    const stock = mats.find((m) => m.code === p.material)?.stock ?? 0;
    const gap = p.plan + stock - (so + p.forecast);
    return `· ${p.material}: 수요 ${(so + p.forecast).toLocaleString()} vs 계획+재고 ${(p.plan + stock).toLocaleString()} → ${gap >= 0 ? `여유 +${gap.toLocaleString()}` : `⚠️ 부족 ${gap.toLocaleString()} — 계획 ${Math.abs(gap).toLocaleString()} 증량 권고`}`;
  });
  const load = Math.round((plans.reduce((s, p) => s + p.plan, 0) / CAPACITY) * 100);
  return `📈 AI Demand Planner 분석 (2026-07)\n${lines.join("\n")}\n라인 부하율 ${load}%${load > 100 ? " — ⚠️ 능력 초과, 외주 검토" : ""}`;
}

export function aiBuyer(): string {
  const mats = materialStore.getAll();
  const boms = bomStore.getAll();
  const evals = vendorEvalStore.getAll();
  const req: Record<string, number> = {};
  mpsStore.getAll().forEach((p) => {
    const walk = (mat: string, qty: number) => {
      boms.filter((b) => b.parent === mat).forEach((b) => {
        req[b.child] = (req[b.child] ?? 0) + b.qty * qty;
        walk(b.child, b.qty * qty);
      });
    };
    walk(p.material, p.plan);
  });
  const shortages = Object.entries(req)
    .map(([code, qty]) => {
      const m = mats.find((x) => x.code === code);
      return { code, shortage: Math.max(0, qty + (m?.safety ?? 0) - (m?.stock ?? 0)), type: m?.type ?? "" };
    })
    .filter((r) => r.shortage > 0 && (r.type === "원자재" || r.type === "부자재"));
  const best = [...evals].sort((a, b) => evalTotal(b as any) - evalTotal(a as any))[0];
  if (shortages.length === 0) return "🛒 AI Buyer: 현재 MPS 기준 구매 부족 자재가 없습니다.";
  return `🛒 AI Buyer 구매 추천\n${shortages.map((s) => `· ${s.code}: ${Math.ceil(s.shortage).toLocaleString()} 발주 필요`).join("\n")}\n추천 공급사: ${best?.name} (종합 ${evalTotal(best as any)}점, ${evalGrade(evalTotal(best as any))}등급)\n→ MRP 화면에서 PR 원클릭 생성 가능`;
}

export function aiScheduler(): string {
  const wos = woStore.getAll();
  const risky = wos.filter((w) => w.status !== "완료" && w.dueDate <= "2026-07-10");
  const open = wos.filter((w) => w.status !== "완료");
  if (open.length === 0) return "🏭 AI Scheduler: 진행 중인 작업지시가 없습니다.";
  return `🏭 AI Scheduler 일정 분석\n미완료 WO ${open.length}건${risky.length > 0 ? `, 납기 임박(7/10 이내) ${risky.length}건:\n${risky.map((w) => `· ${w.code} ${w.material} ${w.qty.toLocaleString()}개 — 납기 ${w.dueDate} [${w.status}]`).join("\n")}\n→ ${risky[0]?.code} 우선 착수 권고` : " — 납기 리스크 없음"}`;
}

export function aiQualityEngineer(): string {
  const bad = SPC_SERIES.map((s) => ({ s, st: spcStats(s) })).filter((x) => x.st.cpk < 1.33);
  const held = lotStore.getAll().filter((l) => l.status === "보류");
  const waiting = inspStore.getAll().filter((i) => i.result === "대기");
  const parts: string[] = ["🔬 AI Quality Engineer 진단"];
  if (bad.length > 0) parts.push(...bad.map((x) => `· ⚠️ ${x.s.name} Cpk ${x.st.cpk.toFixed(2)} < 1.33 — ${x.s.process} 공정개선 필요`));
  if (held.length > 0) parts.push(`· 보류 LOT ${held.length}건 (${held.map((l) => l.code).join(", ")}) — 부적합 처리 대기`);
  if (waiting.length > 0) parts.push(`· 수입검사 대기 ${waiting.length}건 — 검사 지연 시 생산 차질 위험`);
  const openNc = ncStore.getAll().filter((n) => n.status === "진행");
  if (openNc.length > 0) parts.push(`· 미종결 부적합(8D) ${openNc.length}건: ${openNc.map((n) => `${n.code}[D${n.dStep}]`).join(", ")}`);
  const lateCapa = capaStore.getAll().filter((c) => c.status === "진행" && c.dueDate < TODAY);
  if (lateCapa.length > 0) parts.push(`· ⚠️ 기한 초과 CAPA ${lateCapa.length}건 — 시정조치 독촉 필요`);
  if (parts.length === 1) parts.push("현재 품질 이상 징후 없음 — Cpk ≥ 1.33, 미종결 부적합 없음");
  return parts.join("\n");
}

export function aiCfo(): string {
  const k = computeKpis();
  const overdue = arStore.getAll().filter((a) => a.status === "미수" && a.dueDate < TODAY);
  const apOpen = apStore.getAll().filter((a) => a.status === "미지급");
  const hotBudgets = budgetStore.getAll().filter((b) => b.used / b.budget >= 0.9);
  return `💰 AI CFO Copilot 요약\n· 매출(출하 기준) ${fmtEok(k.revenue)} | 매출총이익 ${fmtEok(k.profit)}${k.marginPct !== null ? ` (마진 ${k.marginPct.toFixed(1)}%)` : ""}\n· 재고자산 ${fmtEok(k.invValue)}${k.turnover !== null ? ` | 회전율(연환산) ${k.turnover.toFixed(1)}회` : ""}\n· 연체채권 ${overdue.length}건 ${fmtEok(overdue.reduce((s, a) => s + a.amount, 0))} / 미지급채무 ${apOpen.length}건 ${fmtEok(apOpen.reduce((s, a) => s + a.amount, 0))}\n${hotBudgets.length > 0 ? `· ⚠️ 예산 90%+ 부서: ${hotBudgets.map((b) => b.dept).join(", ")}` : "· 예산 집행 정상 범위"}`;
}

export const AI_AGENTS = [
  { name: "AI Demand Planner", desc: "수요예측·공급계획", run: aiDemandPlanner, keywords: ["수요", "예측", "계획", "mps", "s&op"] },
  { name: "AI Buyer", desc: "구매추천·공급사 평가", run: aiBuyer, keywords: ["구매", "발주", "자재", "공급사", "pr", "po"] },
  { name: "AI Scheduler", desc: "생산스케줄 최적화", run: aiScheduler, keywords: ["생산", "작업", "일정", "스케줄", "납기"] },
  { name: "AI Quality Engineer", desc: "품질이상 탐지", run: aiQualityEngineer, keywords: ["품질", "불량", "검사", "spc", "cpk"] },
  { name: "AI CFO Copilot", desc: "경영지표·의사결정", run: aiCfo, keywords: ["매출", "이익", "손익", "원가", "재무", "채권", "kpi", "경영"] },
];

export function routeQuestion(q: string): string {
  const lower = q.toLowerCase();
  const agent = AI_AGENTS.find((a) => a.keywords.some((k) => lower.includes(k)));
  if (agent) return agent.run();
  return `요청을 분석할 Agent를 찾지 못했습니다. 키워드(수요/구매/생산/품질/손익 등)를 포함하거나 위 Agent 버튼을 사용해 주세요.\n예: "이번 달 손익 요약해줘", "부족 자재 알려줘"`;
}
