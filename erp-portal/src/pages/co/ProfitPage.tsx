// CO-002 손익분석 — 고객별/제품별 매출·원가·마진 (출하완료 기준)
import { useState } from "react";
import { materialStore, bomStore, customerStore } from "../../data/mock/master";
import { salesOrderStore, DocLine } from "../../data/mock/sales";
import { stdCost } from "../../data/mock/finance";
import { useStore, downloadCsv } from "../../services/store";

export default function ProfitPage() {
  const mats = useStore(materialStore);
  const boms = useStore(bomStore);
  const customers = useStore(customerStore);
  const orders = useStore(salesOrderStore);
  const [mode, setMode] = useState<"customer" | "product">("customer");

  const custName = (c: string) => customers.find((x) => x.code === c)?.name ?? c;
  const delivered = orders.filter((o) => o.status === "출하완료");

  // 라인 단위 손익 집계
  const agg: Record<string, { revenue: number; cost: number; qty: number }> = {};
  delivered.forEach((o) => {
    (o.lines as DocLine[]).forEach((l) => {
      const key = mode === "customer" ? o.customer : l.material;
      const cost = stdCost(l.material, mats, boms) * l.qty;
      if (!agg[key]) agg[key] = { revenue: 0, cost: 0, qty: 0 };
      agg[key].revenue += l.qty * l.price;
      agg[key].cost += cost;
      agg[key].qty += l.qty;
    });
  });

  const rows = Object.entries(agg)
    .map(([key, v]) => ({
      key,
      label: mode === "customer" ? custName(key) : `${key} — ${mats.find((m) => m.code === key)?.name ?? ""}`,
      ...v,
      profit: v.revenue - v.cost,
      margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.profit - a.profit);

  const total = rows.reduce((s, r) => ({ revenue: s.revenue + r.revenue, cost: s.cost + r.cost, profit: s.profit + r.profit }), { revenue: 0, cost: 0, profit: 0 });
  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 1);

  const excel = () =>
    downloadCsv(`손익분석_${mode === "customer" ? "고객별" : "제품별"}.csv`,
      ["구분", "수량", "매출", "원가", "매출총이익", "마진율%"],
      rows.map((r) => [r.label, r.qty, r.revenue, Math.round(r.cost), Math.round(r.profit), r.margin.toFixed(1)]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. 관리회계 (Controlling)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">손익분석 (CO-002)</h1>
          <span className="text-[11px] text-sub">출하완료 기준 · 표준원가 차감 매출총이익</span>
        </div>
      </div>

      {/* 합계 KPI */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">매출</div>
          <div className="text-xl font-bold mt-1">{(total.revenue / 100000000).toFixed(2)}억</div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">매출원가</div>
          <div className="text-xl font-bold mt-1">{(total.cost / 100000000).toFixed(2)}억</div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">매출총이익 (마진율)</div>
          <div className="text-xl font-bold mt-1 text-emerald-500">
            {(total.profit / 100000000).toFixed(2)}억
            <span className="text-[12px] ml-1">({total.revenue > 0 ? ((total.profit / total.revenue) * 100).toFixed(1) : 0}%)</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line flex items-center gap-2">
          <button onClick={() => setMode("customer")}
            className={`px-3 py-1 rounded text-[12px] font-semibold ${mode === "customer" ? "bg-accent text-white" : "border border-line hover:bg-accent-soft"}`}>
            고객별
          </button>
          <button onClick={() => setMode("product")}
            className={`px-3 py-1 rounded text-[12px] font-semibold ${mode === "product" ? "bg-accent text-white" : "border border-line hover:bg-accent-soft"}`}>
            제품별
          </button>
          <button onClick={excel} className="ml-auto px-3 py-1 rounded border border-line text-[11px] hover:bg-accent-soft">📥 Excel</button>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">{mode === "customer" ? "고객" : "제품"}</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2 text-right">매출(원)</th>
              <th className="px-3 py-2 w-40">매출 비중</th>
              <th className="px-3 py-2 text-right">원가(원)</th>
              <th className="px-3 py-2 text-right">총이익(원)</th>
              <th className="px-3 py-2 text-right">마진율</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right">{r.qty.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.revenue.toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="h-2 bg-surface rounded">
                    <div className="h-2 rounded bg-accent" style={{ width: `${(r.revenue / maxRevenue) * 100}%` }} />
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-sub">{Math.round(r.cost).toLocaleString()}</td>
                <td className={`px-3 py-2 text-right font-semibold ${r.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {Math.round(r.profit).toLocaleString()}
                </td>
                <td className={`px-3 py-2 text-right font-bold ${r.margin < 20 ? "text-red-500" : "text-emerald-500"}`}>
                  {r.margin.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-4 py-6 text-center text-sub text-[12px]">
            출하완료된 수주가 없습니다. 수주관리 → 출하예약 → 출고관리에서 출고를 처리하면 손익이 집계됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
