// MK-003 채널분석 (Marketing Channel Analytics) — 자사몰·오픈마켓·오프라인 매장 채널별 매출·전환율·ROAS 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ChannelItem {
  id: string;
  channelName: string; // 판매 채널명 (예: 자사 공식몰, 쿠팡 로켓배송, 11번가, 하이마트 오프라인)
  channelType: "자사몰" | "온라인 오픈마켓" | "오프라인 유통";
  salesAmount: number; // 채널별 매출액 (KRW)
  visitorCount: number; // 유입 방문자 수
  conversionRatePct: number; // 구매 전환율 (%)
  adSpendAmount: number; // 광고 투입 비용 (KRW)
  roasPct: number; // ROAS (광고수익률 %) = (Sales / AdSpend) * 100
  period: string;
}

export const channelStore = createStore("mk.channel_analytics", [
  { id: "CHN-01", channelName: "쿠팡 로켓배송", channelType: "온라인 오픈마켓", salesAmount: 1450000000, visitorCount: 850000, conversionRatePct: 4.2, adSpendAmount: 120000000, roasPct: 1208.3, period: "2026-07" },
  { id: "CHN-02", channelName: "자사 공식몰 (SmartMall)", channelType: "자사몰", salesAmount: 850000000, visitorCount: 320000, conversionRatePct: 5.8, adSpendAmount: 80000000, roasPct: 1062.5, period: "2026-07" },
  { id: "CHN-03", channelName: "롯데하이마트 오프라인", channelType: "오프라인 유통", salesAmount: 620000000, visitorCount: 150000, conversionRatePct: 8.5, adSpendAmount: 45000000, roasPct: 1377.8, period: "2026-07" },
]);

export default function ChannelAnalytics() {
  const items = useStore(channelStore) as ChannelItem[];
  const [typeFilter, setTypeFilter] = useState("전체");

  const filtered = items.filter((i) => typeFilter === "전체" || i.channelType === typeFilter);

  const totalSales = filtered.reduce((acc, i) => acc + i.salesAmount, 0);

  const excel = () =>
    downloadCsv(
      "마케팅_채널별_매출분석_대장.csv",
      ["채널명", "채널구분", "매출액(원)", "방문자수", "전환율(%)", "광고비(원)", "ROAS(%)", "기준월"],
      filtered.map((i) => [
        i.channelName,
        i.channelType,
        i.salesAmount,
        i.visitorCount,
        `${i.conversionRatePct}%`,
        i.adSpendAmount,
        `${i.roasPct}%`,
        i.period,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">12. Marketing Management (마케팅)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">채널분석 (MK-003)</h1>
          <span className="text-[11px] text-sub">자사몰 · 쿠팡 오픈마켓 · 오프라인 유통 채널별 매출 · 구매 전환율 및 ROAS 수익률</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 유통 채널 매출 합계</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalSales / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">최고 ROAS 광고 효율 채널</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">하이마트 <span className="text-xs font-normal text-ink">(1,377.8%)</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">자사몰 구매 전환율 (CR)</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">5.8% <span className="text-xs font-normal text-ink">(업계 최고)</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">구분:</span>
          {["전체", "자사몰", "온라인 오픈마켓", "오프라인 유통"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                typeFilter === t
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 채널분석 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">판매 채널명</th>
              <th className="px-3 py-2">채널 구분</th>
              <th className="px-3 py-2 text-right">채널 매출액</th>
              <th className="px-3 py-2 text-right">유입 방문자 수</th>
              <th className="px-3 py-2 text-right">구매 전환율 (CR)</th>
              <th className="px-3 py-2 text-right">광고 투입비</th>
              <th className="px-3 py-2 text-right">광고 ROAS</th>
              <th className="px-3 py-2">기준월</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-bold text-ink">{i.channelName}</td>
                <td className="px-3 py-2 text-sub">{i.channelType}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.salesAmount / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.visitorCount.toLocaleString()}명</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.conversionRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{(i.adSpendAmount / 10000000).toFixed(1)}천만원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.roasPct.toFixed(1)}%</td>
                <td className="px-3 py-2 font-mono text-sub">{i.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
