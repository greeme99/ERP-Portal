// SD-012 고객별 손익분석 — 주요 고객사별 매출·원가·이익액 및 고객 기여 마진율(%) 실시간 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CustomerProfitItem {
  id: string;
  customerCode: string;
  customerName: string;
  channelCategory: "대기업 OEM" | "중견 가전사" | "해외 수출처";
  salesRevenue: number; // 매출액 (KRW)
  cogsAmount: number; // 매출원가 (KRW)
  grossProfit: number; // 매출총이익 (KRW)
  marginRate: number; // 마진율 (%)
  creditLimit: number; // 여신한도 (KRW)
  status: "우수고객" | "일반고객" | "여신주의";
}

export const customerProfitStore = createStore("sd.customer_profit", [
  { id: "CPRF-01", customerCode: "CUS-1001", customerName: "삼성전자 글로벌", channelCategory: "대기업 OEM", salesRevenue: 1250000000, cogsAmount: 780000000, grossProfit: 470000000, marginRate: 37.6, creditLimit: 2000000000, status: "우수고객" },
  { id: "CPRF-02", customerCode: "CUS-1002", customerName: "LG전자", channelCategory: "대기업 OEM", salesRevenue: 850000000, cogsAmount: 530000000, grossProfit: 320000000, marginRate: 37.6, creditLimit: 1500000000, status: "우수고객" },
  { id: "CPRF-03", customerCode: "CUS-1003", customerName: "쿠쿠전자", channelCategory: "중견 가전사", salesRevenue: 420000000, cogsAmount: 265000000, grossProfit: 155000000, marginRate: 36.9, creditLimit: 500000000, status: "일반고객" },
  { id: "CPRF-04", customerCode: "CUS-1004", customerName: "한일전기", channelCategory: "중견 가전사", salesRevenue: 280000000, cogsAmount: 180000000, grossProfit: 100000000, marginRate: 35.7, creditLimit: 300000000, status: "여신주의" },
]);

export default function CustomerProfitability() {
  const items = useStore(customerProfitStore) as CustomerProfitItem[];
  const [channelFilter, setChannelFilter] = useState("전체");

  const filtered = items.filter((i) => channelFilter === "전체" || i.channelCategory === channelFilter);

  const totalRev = filtered.reduce((acc, i) => acc + i.salesRevenue, 0);
  const totalProfit = filtered.reduce((acc, i) => acc + i.grossProfit, 0);
  const avgMargin = totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : "0.0";

  const excel = () =>
    downloadCsv(
      "영업_고객별_손익분석_대장.csv",
      ["고객코드", "고객사명", "채널구분", "매출액(원)", "매출원가(원)", "매출총이익(원)", "마진율(%)", "여신한도(원)", "상태"],
      filtered.map((i) => [
        i.customerCode,
        i.customerName,
        i.channelCategory,
        i.salesRevenue,
        i.cogsAmount,
        i.grossProfit,
        `${i.marginRate}%`,
        i.creditLimit,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">고객별 손익분석 (SD-012)</h1>
          <span className="text-[11px] text-sub">주요 고객사별 매출 · 매출원가 · 이익 기여액 및 마진율(%) 실시간 분석</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 영업 매출액</div>
          <div className="text-xl font-bold mt-1 font-mono">{(totalRev / 100000000).toFixed(2)} <span className="text-xs font-normal">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">총 매출 총이익</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{(totalProfit / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 고객 마진율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgMargin}%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">채널:</span>
          {["전체", "대기업 OEM", "중견 가전사"].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                channelFilter === ch
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 고객별 손익 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">고객코드 / 명</th>
              <th className="px-3 py-2">채널 구분</th>
              <th className="px-3 py-2 text-right">매출액</th>
              <th className="px-3 py-2 text-right">매출원가</th>
              <th className="px-3 py-2 text-right">매출 총이익</th>
              <th className="px-3 py-2 text-right">마진율</th>
              <th className="px-3 py-2 text-right">여신 한도</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.customerCode} — {i.customerName}</td>
                <td className="px-3 py-2 text-sub">{i.channelCategory}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{(i.salesRevenue / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{(i.cogsAmount / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.grossProfit / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.marginRate.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{(i.creditLimit / 100000000).toFixed(1)}억원</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.status === "우수고객" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    i.status === "일반고객" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
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
