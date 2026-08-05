// SCM Control Tower — 수요-공급 밸런스, 재고/공급 리스크 통합 관제
import { Link } from "react-router-dom";
import { useStore } from "../../services/store";
import { materialStore } from "../../data/mock/master";
import { salesOrderStore, atpQty, DocLine } from "../../data/mock/sales";
import { prStore, poStore } from "../../data/mock/procurement";
import { lotStore } from "../../data/mock/logistics";
import { mpsStore, woStore, CAPACITY } from "../../data/mock/production";
import { computeExceptions, TODAY } from "../../services/insights";

export default function ControlTower() {
  const mats = useStore(materialStore);
  const orders = useStore(salesOrderStore);
  const prs = useStore(prStore);
  const pos = useStore(poStore);
  const lots = useStore(lotStore);
  const plans = useStore(mpsStore);
  const wos = useStore(woStore);

  const exceptions = computeExceptions();

  // 수요-공급 밸런스 (FG)
  const balance = plans.map((p) => {
    const mat = mats.find((m) => m.code === p.material);
    const so = orders
      .filter((o) => o.status === "등록" || o.status === "출하예약")
      .flatMap((o) => o.lines as DocLine[])
      .filter((l) => l.material === p.material)
      .reduce((s, l) => s + l.qty, 0);
    const demand = so + p.forecast;
    const supply = p.plan + (mat?.stock ?? 0);
    const atp = mat ? atpQty(p.material, mat.stock, orders) : 0;
    return { code: p.material, name: mat?.name ?? "", so, forecast: p.forecast, demand, stock: mat?.stock ?? 0, plan: p.plan, supply, gap: supply - demand, atp };
  });

  // 리스크 집계
  const latePo = pos.filter((o) => o.status === "발주" && o.dueDate < TODAY);
  const waitingPr = prs.filter((p) => p.status === "승인대기");
  const heldLots = lots.filter((l) => l.status === "보류");
  const belowSafety = mats.filter((m) => m.stock < m.safety);
  const openWos = wos.filter((w) => w.status !== "완료");
  const load = Math.round((plans.reduce((s, p) => s + p.plan, 0) / CAPACITY) * 100);

  const RISK_CARDS = [
    { label: "납기지연 PO", value: latePo.length, link: "/m/mm/mm-05", bad: latePo.length > 0 },
    { label: "승인대기 PR", value: waitingPr.length, link: "/m/mm/mm-04", bad: waitingPr.length > 2 },
    { label: "안전재고 미달", value: belowSafety.length, link: "/m/pp/pp-03", bad: belowSafety.length > 0 },
    { label: "보류 LOT", value: heldLots.length, link: "/m/le/le-05", bad: heldLots.length > 0 },
    { label: "진행 WO", value: openWos.length, link: "/m/pp/pp-06", bad: false },
    { label: "라인 부하율", value: `${load}%`, link: "/m/pp/pp-02", bad: load > 100 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] text-sub">02. SCM (Supply Chain)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">🗼 SCM Control Tower</h1>
          <span className="text-[11px] text-sub">수요·공급·재고·리스크 통합 관제 — 실시간</span>
        </div>
      </div>

      {/* 리스크 카드 */}
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
        {RISK_CARDS.map((c) => (
          <Link key={c.label} to={c.link}
            className={`bg-panel border rounded-lg p-3 hover:border-accent ${c.bad ? "border-red-300" : "border-line"}`}>
            <div className="text-[11px] text-sub">{c.label}</div>
            <div className={`text-xl font-bold mt-1 ${c.bad ? "text-red-500" : "text-emerald-500"}`}>{c.value}</div>
          </Link>
        ))}
      </div>

      {/* 수요-공급 밸런스 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line font-semibold">⚖️ 수요-공급 밸런스 (2026-07)</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">완제품</th>
              <th className="px-3 py-2 text-right">수주잔</th>
              <th className="px-3 py-2 text-right">예측</th>
              <th className="px-3 py-2 text-right">총수요</th>
              <th className="px-3 py-2 text-right">재고</th>
              <th className="px-3 py-2 text-right">생산계획</th>
              <th className="px-3 py-2 text-right">ATP</th>
              <th className="px-3 py-2 text-right">GAP</th>
              <th className="px-3 py-2">판정</th>
            </tr>
          </thead>
          <tbody>
            {balance.map((b) => (
              <tr key={b.code} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2">{b.code} — {b.name}</td>
                <td className="px-3 py-2 text-right">{b.so.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-sub">{b.forecast.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-semibold">{b.demand.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{b.stock.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{b.plan.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right ${b.atp < 0 ? "text-red-500 font-semibold" : ""}`}>{b.atp.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right font-bold ${b.gap < 0 ? "text-red-500" : "text-emerald-500"}`}>
                  {b.gap >= 0 ? "+" : ""}{b.gap.toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  {b.gap < 0
                    ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">공급부족</span>
                    : b.gap < b.demand * 0.1
                      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">타이트</span>
                      : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">안정</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 통합 예외 */}
      <div className="bg-panel border border-line rounded-lg">
        <div className="px-4 py-2.5 border-b border-line font-semibold">🚨 통합 예외 ({exceptions.length}건)</div>
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
      </div>
    </div>
  );
}
