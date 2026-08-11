// SD-013 영업분석 (Sales Analytics) — 월별/지역별/제품군별 수주 및 매출 동향 트렌드 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SalesAnalyticItem {
  id: string;
  period: string; // 분석월 (예: 2026-07)
  region: "수도권" | "영남권" | "충청/호남" | "해외수출";
  productGroup: string;
  orderAmount: number; // 수주 금액 (KRW)
  shippedAmount: number; // 출하/매출 금액 (KRW)
  avgMarginRate: number; // 평균 마진율 (%)
  status: "호조" | "보통" | "부진";
}

export const salesAnalyticsStore = createStore("sd.sales_analytics", [
  { id: "SDA-01", period: "2026-07", region: "수도권", productGroup: "소형가전 무선청소기", orderAmount: 1450000000, shippedAmount: 1250000000, avgMarginRate: 38.5, status: "호조" },
  { id: "SDA-02", period: "2026-07", region: "영남권", productGroup: "스마트 로봇청소기", orderAmount: 920000000, shippedAmount: 850000000, avgMarginRate: 37.0, status: "호조" },
  { id: "SDA-03", period: "2026-07", region: "해외수출", productGroup: "전자기판 모듈 SF-2001", orderAmount: 680000000, shippedAmount: 510000000, avgMarginRate: 39.2, status: "보통" },
]);

export default function SalesAnalytics() {
  const items = useStore(salesAnalyticsStore) as SalesAnalyticItem[];
  const [regionFilter, setRegionFilter] = useState("전체");

  const filtered = items.filter((i) => regionFilter === "전체" || i.region === regionFilter);

  const totalOrder = filtered.reduce((acc, i) => acc + i.orderAmount, 0);
  const totalShipped = filtered.reduce((acc, i) => acc + i.shippedAmount, 0);

  const excel = () =>
    downloadCsv(
      "영업_수주_매출_트렌드분석.csv",
      ["분석월", "지역", "제품군", "수주금액(원)", "매출금액(원)", "평균마진율(%)", "상태"],
      filtered.map((i) => [
        i.period,
        i.region,
        i.productGroup,
        i.orderAmount,
        i.shippedAmount,
        `${i.avgMarginRate}%`,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">영업분석 (SD-013)</h1>
          <span className="text-[11px] text-sub">월별 · 권역별 · 제품군별 수주 및 매출 동향 트렌드 다차원 분석</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 영업 수주 금액</div>
          <div className="text-xl font-bold mt-1 font-mono">{(totalOrder / 100000000).toFixed(2)} <span className="text-xs font-normal">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">총 출하 매출 실적</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{(totalShipped / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 수주 마진율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.avgMarginRate, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">권역:</span>
          {["전체", "수도권", "영남권", "해외수출"].map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                regionFilter === r
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 영업분석 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">분석월</th>
              <th className="px-3 py-2">권역</th>
              <th className="px-3 py-2">제품군</th>
              <th className="px-3 py-2 text-right">수주 금액</th>
              <th className="px-3 py-2 text-right">출하/매출 금액</th>
              <th className="px-3 py-2 text-right">평균 마진율</th>
              <th className="px-3 py-2">실적 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono text-sub">{i.period}</td>
                <td className="px-3 py-2 font-medium">{i.region}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.productGroup}</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{(i.orderAmount / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.shippedAmount / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.avgMarginRate.toFixed(1)}%</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
