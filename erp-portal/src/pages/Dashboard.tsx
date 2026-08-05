// CEO Dashboard — 전 모듈 store 실시간 집계 (Sprint 5 실데이터화)
import { Link } from "react-router-dom";
import { useStore } from "../services/store";
import { materialStore, customerStore } from "../data/mock/master";
import { salesOrderStore } from "../data/mock/sales";
import { poStore, budgetStore } from "../data/mock/procurement";
import { lotStore } from "../data/mock/logistics";
import { woStore } from "../data/mock/production";
import { inspStore } from "../data/mock/quality";
import { arStore, apStore } from "../data/mock/finance";
import { computeKpis, computeExceptions, fmtEok } from "../services/insights";

const PORTALS = [
  { name: "SCM Control Tower", desc: "수요·공급·재고·예외 통합 관제", link: "/m/scm/scm-07", icon: "🗼" },
  { name: "손익분석", desc: "고객·제품별 매출총이익", link: "/m/co/co-11", icon: "📊" },
  { name: "작업지시·실적", desc: "생산 진행·수율", link: "/m/pp/pp-06", icon: "🏭" },
  { name: "매출채권", desc: "AR Aging·수금", link: "/m/fi/fi-03", icon: "💰" },
];

export default function Dashboard() {
  // store 구독 → 데이터 변경 시 KPI 자동 재계산
  useStore(materialStore); useStore(customerStore); useStore(salesOrderStore);
  useStore(poStore); useStore(budgetStore); useStore(lotStore);
  useStore(woStore); useStore(inspStore); useStore(arStore); useStore(apStore);

  const k = computeKpis();
  const exceptions = computeExceptions();

  const KPIS = [
    { label: "매출 (출하기준)", value: k.revenue > 0 ? fmtEok(k.revenue) : "-", sub: `출하완료 ${k.deliveredCount}건`, ok: true },
    { label: "매출총이익", value: k.profit !== 0 ? fmtEok(k.profit) : "-", sub: k.marginPct !== null ? `마진율 ${k.marginPct.toFixed(1)}%` : "출하 실적 없음", ok: (k.marginPct ?? 100) >= 20 },
    { label: "재고자산", value: fmtEok(k.invValue), sub: k.turnover !== null ? `회전율(연환산) ${k.turnover.toFixed(1)}회` : "회전율 산출 대기", ok: (k.turnover ?? 99) >= 6 },
    { label: "OTD 납기준수", value: k.otd !== null ? `${k.otd.toFixed(1)}%` : "-", sub: "출하완료 기준", ok: (k.otd ?? 100) >= 95 },
    { label: "OEE (proxy)", value: k.oee !== null ? `${k.oee.toFixed(1)}%` : "-", sub: k.yieldPct !== null ? `수율 ${k.yieldPct.toFixed(1)}% × 가동 92%` : "완료 실적 없음", ok: (k.oee ?? 100) >= 85 },
    { label: "품질 PPM", value: k.ppm !== null ? Math.round(k.ppm).toLocaleString() : "-", sub: "검사+생산 불량 합산", ok: (k.ppm ?? 0) < 20000 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-bold">CEO Dashboard</h1>
        <span className="text-[11px] text-sub">기준 2026-07-03 | 전 모듈 실시간 집계 — 거래 처리 시 즉시 반영</span>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="bg-panel border border-line rounded-lg p-3">
            <div className="text-[11px] text-sub">{kpi.label}</div>
            <div className={`text-xl font-bold mt-1 ${kpi.ok ? "" : "text-red-500"}`}>{kpi.value}</div>
            <div className="text-[10px] text-sub mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 예외 관리 (실시간 탐지) */}
        <section className="bg-panel border border-line rounded-lg">
          <div className="px-4 py-2.5 border-b border-line font-semibold">
            ⚠️ 예외 관리 <span className="text-[11px] text-sub font-normal">— 실시간 탐지 {exceptions.length}건</span>
          </div>
          {exceptions.length > 0 ? (
            <ul>
              {exceptions.map((a, i) => (
                <li key={i} className="px-4 py-2.5 border-b border-line last:border-0 flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${a.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {a.tag}
                  </span>
                  <Link to={a.link} className="text-[12px] hover:text-accent">{a.text}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-emerald-500 text-[12px]">✓ 탐지된 예외 없음</div>
          )}
        </section>

        {/* 포탈 바로가기 */}
        <section className="bg-panel border border-line rounded-lg">
          <div className="px-4 py-2.5 border-b border-line font-semibold">🚀 주요 포탈</div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {PORTALS.map((p) => (
              <Link key={p.name} to={p.link}
                className="border border-line rounded-lg p-3 hover:border-accent hover:bg-accent-soft">
                <div className="text-lg">{p.icon}</div>
                <div className="font-semibold text-[12px] mt-1">{p.name}</div>
                <div className="text-[11px] text-sub mt-0.5">{p.desc}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* E2E 프로세스 */}
      <section className="bg-panel border border-line rounded-lg p-4">
        <div className="font-semibold mb-2">🔄 제조 End-to-End 프로세스 (구현 화면 링크)</div>
        <div className="flex flex-wrap gap-1 text-[11px]">
          {[
            { s: "MPS", l: "/m/pp/pp-02" }, { s: "MRP", l: "/m/pp/pp-03" }, { s: "구매요청", l: "/m/mm/mm-04" },
            { s: "발주", l: "/m/mm/mm-05" }, { s: "입고", l: "/m/le/le-01" }, { s: "수입검사", l: "/m/qm/qm-02" },
            { s: "생산실행", l: "/m/pp/pp-06" }, { s: "SPC", l: "/m/qm/qm-06" }, { s: "수주(ATP)", l: "/m/sd/sd-04" },
            { s: "출고", l: "/m/le/le-02" }, { s: "전표", l: "/m/fi/fi-01" }, { s: "채권/채무", l: "/m/fi/fi-03" },
            { s: "제조원가", l: "/m/co/co-04" }, { s: "손익분석", l: "/m/co/co-11" },
          ].map((step, i, arr) => (
            <span key={step.s} className="flex items-center gap-1">
              <Link to={step.l} className="px-2 py-1 rounded bg-accent-soft text-ink hover:bg-accent hover:text-white">{step.s}</Link>
              {i < arr.length - 1 && <span className="text-sub">→</span>}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
