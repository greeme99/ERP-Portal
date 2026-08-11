// MK-007 마켓인텔리전스 (Market Intelligence & VOC Sync) — 시장 트렌드 키워드·점유율(MS%)·고객 니즈 인텔리전스 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface MarketIntelligenceItem {
  id: string;
  trendKeyword: string;
  categoryName: string; // 제품 카테고리 (예: 프리미엄 무선청소기, 자율주행 로봇청소기)
  marketSharePct: number; // 당사 시장 점유율 MS (%)
  growthRatePct: number; // 카테고리 연평균 성장률 CAGR (%)
  customerBuyingIntentScore: number; // 고객 구매 의향 지수 (100점 만점)
  keyCompetitorName: string; // 경쟁사명
  intelligenceSummary: string;
}

export const marketIntelStore = createStore("mk.market_intel", [
  { id: "INT-01", trendKeyword: "초경량 BLDC 모터 무선 청소기", categoryName: "소형가전 무선청소기", marketSharePct: 28.5, growthRatePct: 12.5, customerBuyingIntentScore: 88, keyCompetitorName: "D사, L사", intelligenceSummary: "흡입력 200W 이상 및 1.5kg 이하 초경량화 제품 선호도 급증", status: "우수" },
  { id: "INT-02", trendKeyword: "AI 라이다 자율주행 및 먼지비움 스테이션", categoryName: "스마트 로봇청소기", marketSharePct: 18.0, growthRatePct: 24.0, customerBuyingIntentScore: 92, keyCompetitorName: "R사, E사", intelligenceSummary: "자동 물걸레 세척 및 올인원 먼지비움 스테이션 일체형 기기 수요 확대", status: "확장 필요" },
]);

export default function MarketIntelligence() {
  const items = useStore(marketIntelStore) as MarketIntelligenceItem[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = items.filter((i) => catFilter === "전체" || i.categoryName.includes(catFilter));

  const avgShare = filtered.reduce((acc, i) => acc + i.marketSharePct, 0) / (filtered.length || 1);

  const excel = () =>
    downloadCsv(
      "마케팅_마켓인텔리전스_분석_대장.csv",
      ["트렌드키워드", "제품카테고리", "시장점유율(%)", "시장성장률(%)", "구매의향지수(점)", "주요경쟁사", "인텔리전스요약"],
      filtered.map((i) => [
        i.trendKeyword,
        i.categoryName,
        `${i.marketSharePct}%`,
        `${i.growthRatePct}%`,
        i.customerBuyingIntentScore,
        i.keyCompetitorName,
        i.intelligenceSummary,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">12. Marketing (마케팅)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">마켓인텔리전스 (MK-007)</h1>
          <span className="text-[11px] text-sub">소형가전 시장 트렌드 키워드 분석 · 시장 점유율(MS) · 고객 구매 의향 지수 인텔리전스</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">당사 평균 시장 점유율 (MS)</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{avgShare.toFixed(1)}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">시장 평균 성장률 (CAGR)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.growthRatePct, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">고객 구매 의향 지수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.customerBuyingIntentScore, 0) / (filtered.length || 1)).toFixed(0)} <span className="text-xs font-normal text-ink">점</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">카테고리:</span>
          {["전체", "무선청소기", "로봇청소기"].map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                catFilter === c
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 마켓인텔리전스 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">트렌드 키워드</th>
              <th className="px-3 py-2">제품 카테고리</th>
              <th className="px-3 py-2 text-right">시장 점유율 (MS)</th>
              <th className="px-3 py-2 text-right">카테고리 성장률</th>
              <th className="px-3 py-2 text-right">구매 의향 지수</th>
              <th className="px-3 py-2">주요 경쟁사</th>
              <th className="px-3 py-2">인텔리전스 핵심 요약</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-bold text-blue-600">{i.trendKeyword}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.categoryName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.marketSharePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.growthRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.customerBuyingIntentScore}점</td>
                <td className="px-3 py-2 text-sub font-medium">{i.keyCompetitorName}</td>
                <td className="px-3 py-2 text-sub text-[11px]">{i.intelligenceSummary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
