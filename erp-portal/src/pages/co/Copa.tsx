// CO-010 수익성분석 COPA — 세그먼트별 공헌이익·고정비 배부·영업이익
import { useState } from "react";
import { materialStore, bomStore, customerStore } from "../../data/mock/master";
import { salesOrderStore, DocLine } from "../../data/mock/sales";
import { stdCost, journalStore, OPEX_ACCOUNTS, JLine } from "../../data/mock/finance";
import { useStore, downloadCsv } from "../../services/store";

type Dim = "customer" | "product" | "country";
const DIM_LABEL: Record<Dim, string> = { customer: "고객", product: "제품", country: "국가" };

export default function Copa() {
  const mats = useStore(materialStore);
  const boms = useStore(bomStore);
  const customers = useStore(customerStore);
  const orders = useStore(salesOrderStore);
  const journals = useStore(journalStore);
  const [dim, setDim] = useState<Dim>("customer");

  const custName = (c: string) => customers.find((x) => x.code === c)?.name ?? c;
  const custCountry = (c: string) => customers.find((x) => x.code === c)?.country ?? "-";
  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;

  const delivered = orders.filter((o) => o.status === "출하완료");

  // 고정비(판관비) 총액 — 매출 비례 배부
  const fixedCost = journals
    .filter((j) => j.status === "전기")
    .flatMap((j) => j.lines as JLine[])
    .filter((l) => OPEX_ACCOUNTS.includes(l.account))
    .reduce((s, l) => s + l.dr, 0);

  // 세그먼트 집계 (매출·변동원가[표준원가])
  const agg: Record<string, { revenue: number; varCost: number }> = {};
  delivered.forEach((o) => {
    (o.lines as DocLine[]).forEach((l) => {
      const key =
        dim === "customer" ? o.customer : dim === "country" ? custCountry(o.customer) : l.material;
      if (!agg[key]) agg[key] = { revenue: 0, varCost: 0 };
      agg[key].revenue += l.qty * l.price;
      agg[key].varCost += stdCost(l.material, mats, boms) * l.qty;
    });
  });

  const totalRev = Object.values(agg).reduce((s, v) => s + v.revenue, 0);

  const rows = Object.entries(agg)
    .map(([key, v]) => {
      const cm = v.revenue - v.varCost; // 공헌이익
      const cmPct = v.revenue > 0 ? (cm / v.revenue) * 100 : 0;
      const alloc = totalRev > 0 ? fixedCost * (v.revenue / totalRev) : 0; // 고정비 배부
      const op = cm - alloc; // 영업이익
      const opPct = v.revenue > 0 ? (op / v.revenue) * 100 : 0;
      const label =
        dim === "customer" ? custName(key) : dim === "product" ? `${key} ${matName(key)}` : key;
      return { key, label, ...v, cm, cmPct, alloc, op, opPct };
    })
    .sort((a, b) => b.op - a.op);

  const excel = () =>
    downloadCsv(`COPA_${DIM_LABEL[dim]}.csv`, ["세그먼트", "매출", "변동원가", "공헌이익", "공헌이익률%", "배부고정비", "영업이익", "영업이익률%"],
      rows.map((r) => [r.label, r.revenue, Math.round(r.varCost), Math.round(r.cm), r.cmPct.toFixed(1), Math.round(r.alloc), Math.round(r.op), r.opPct.toFixed(1)]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. 관리회계 (Controlling)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">수익성분석 COPA (CO-010)</h1>
          <span className="text-[11px] text-sub">세그먼트별 공헌이익 · 고정비 매출비례 배부 · 영업이익</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-2">
        {(["customer", "product", "country"] as Dim[]).map((d) => (
          <button key={d} onClick={() => setDim(d)}
            className={`px-3 py-1 rounded text-[12px] font-semibold ${dim === d ? "bg-accent text-white" : "border border-line hover:bg-accent-soft"}`}>
            {DIM_LABEL[d]}별
          </button>
        ))}
        <span className="text-[11px] text-sub ml-2">고정비(판관비) {(fixedCost / 1e8).toFixed(2)}억 매출비례 배부</span>
        <button onClick={excel} className="ml-auto px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">{DIM_LABEL[dim]}</th>
              <th className="px-3 py-2 text-right">매출(원)</th>
              <th className="px-3 py-2 text-right">변동원가</th>
              <th className="px-3 py-2 text-right">공헌이익</th>
              <th className="px-3 py-2 text-right">공헌이익률</th>
              <th className="px-3 py-2 text-right">배부고정비</th>
              <th className="px-3 py-2 text-right">영업이익</th>
              <th className="px-3 py-2 text-right">영업이익률</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right">{r.revenue.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-sub">{Math.round(r.varCost).toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-semibold">{Math.round(r.cm).toLocaleString()}</td>
                <td className={`px-3 py-2 text-right ${r.cmPct < 30 ? "text-amber-500" : "text-emerald-500"}`}>{r.cmPct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right text-sub">{Math.round(r.alloc).toLocaleString()}</td>
                <td className={`px-3 py-2 text-right font-bold ${r.op < 0 ? "text-red-500" : "text-emerald-600"}`}>{Math.round(r.op).toLocaleString()}</td>
                <td className={`px-3 py-2 text-right font-bold ${r.opPct < 0 ? "text-red-500" : r.opPct < 10 ? "text-amber-500" : "text-emerald-600"}`}>{r.opPct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-4 py-6 text-center text-sub text-[12px]">출하완료 실적이 없습니다. 수주→출고 처리 후 집계됩니다.</div>
        )}
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line">
          공헌이익 = 매출 − 변동원가(표준원가) · 영업이익 = 공헌이익 − 배부고정비(매출비례) · 영업이익 음수는 적자 세그먼트
        </div>
      </div>
    </div>
  );
}
