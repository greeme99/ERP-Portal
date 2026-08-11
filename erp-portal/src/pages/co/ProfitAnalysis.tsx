// CO-012 손익분석 — 손익센터별/제품군별 매출·매출원가·판관비·영업이익 및 이익률 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ProfitCenterRecord {
  id: string;
  profitCenterCode: string;
  profitCenterName: string;
  productLine: "소형가전" | "전자부품" | "스마트가전";
  revenue: number; // 매출액 (KRW)
  cogs: number; // 매출원가 (KRW)
  sgna: number; // 판관비 (KRW)
  operatingProfit: number; // 영업이익 (KRW)
  opMargin: number; // 영업이익률 (%)
  yearMonth: string;
}

export const profitAnalysisStore = createStore("co.profit_analysis", [
  { id: "PC-01", profitCenterCode: "PC-100", profitCenterName: "소형가전 사업부", productLine: "소형가전", revenue: 450000000, cogs: 275000000, sgna: 68000000, operatingProfit: 107000000, opMargin: 23.8, yearMonth: "2026-07" },
  { id: "PC-02", profitCenterCode: "PC-200", profitCenterName: "전자부품 사업부", productLine: "전자부품", revenue: 320000000, cogs: 195000000, sgna: 45000000, operatingProfit: 80000000, opMargin: 25.0, yearMonth: "2026-07" },
  { id: "PC-03", profitCenterCode: "PC-300", profitCenterName: "스마트가전 신사업부", productLine: "스마트가전", revenue: 210000000, cogs: 140000000, sgna: 42000000, operatingProfit: 28000000, opMargin: 13.3, yearMonth: "2026-07" },
]);

export default function ProfitAnalysis() {
  const records = useStore(profitAnalysisStore) as ProfitCenterRecord[];
  const [lineFilter, setLineFilter] = useState("전체");

  const filtered = records.filter((r) => lineFilter === "전체" || r.productLine === lineFilter);

  const totalRevenue = filtered.reduce((acc, r) => acc + r.revenue, 0);
  const totalCogs = filtered.reduce((acc, r) => acc + r.cogs, 0);
  const totalSgna = filtered.reduce((acc, r) => acc + r.sgna, 0);
  const totalOp = filtered.reduce((acc, r) => acc + r.operatingProfit, 0);
  const avgMargin = totalRevenue > 0 ? ((totalOp / totalRevenue) * 100).toFixed(1) : "0.0";

  const excel = () =>
    downloadCsv(
      "관리회계_손익센터별_손익분석.csv",
      ["손익센터코드", "손익센터명", "제품군", "매출액(원)", "매출원가(원)", "판관비(원)", "영업이익(원)", "영업이익률(%)", "기준년월"],
      filtered.map((r) => [
        r.profitCenterCode,
        r.profitCenterName,
        r.productLine,
        r.revenue,
        r.cogs,
        r.sgna,
        r.operatingProfit,
        `${r.opMargin}%`,
        r.yearMonth,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. Controlling (관리회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">손익분석 (CO-012)</h1>
          <span className="text-[11px] text-sub">손익센터별 매출 · 매출원가 · 판관비 및 영업이익률(%) 분석</span>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 매출액</div>
          <div className="text-xl font-bold mt-1 font-mono">{(totalRevenue / 100000000).toFixed(2)} <span className="text-xs font-normal">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">총 매출원가 (COGS)</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{(totalCogs / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">총 영업이익</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{(totalOp / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">전사 평균 영업이익률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgMargin}%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">제품군 필터:</span>
          {["전체", "소형가전", "전자부품", "스마트가전"].map((pl) => (
            <button
              key={pl}
              onClick={() => setLineFilter(pl)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                lineFilter === pl
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {pl}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 손익분석 Excel 다운로드
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">손익센터 코드 / 명</th>
              <th className="px-3 py-2">제품군</th>
              <th className="px-3 py-2 text-right">매출액</th>
              <th className="px-3 py-2 text-right">매출원가</th>
              <th className="px-3 py-2 text-right">판관비</th>
              <th className="px-3 py-2 text-right">영업이익</th>
              <th className="px-3 py-2 text-right">영업이익률</th>
              <th className="px-3 py-2">기준년월</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{r.profitCenterCode} — {r.profitCenterName}</td>
                <td className="px-3 py-2 text-sub">{r.productLine}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{r.revenue.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{r.cogs.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{r.sgna.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{r.operatingProfit.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{r.opMargin}%</td>
                <td className="px-3 py-2 font-mono text-sub">{r.yearMonth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
