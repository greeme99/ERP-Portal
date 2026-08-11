// MK-002 경쟁사분석 (Market Trend & Competitor Benchmarking) — 소형가전 시장 경쟁사 모델별 가격·시장 점유율(%)·기술 벤치마킹 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CompetitorItem {
  id: string;
  competitorName: string; // 경쟁사명 (예: 다이슨, 로보락, 삼성전자)
  productCategory: string; // 타겟 제품군 (예: 프리미엄 무선청소기, 로봇청소기)
  modelName: string;
  retailPrice: number; // 소비자 판매가 (KRW)
  marketSharePct: number; // 시장 점유율 (%)
  strengths: string; // 핵심 강점 (USP)
  weaknesses: string; // 약점 및 당사 차별화 포인트
  updatedAt: string;
}

export const competitorStore = createStore("mk.competitor_analysis", [
  { id: "CMP-01", competitorName: "다이슨 (Dyson)", productCategory: "프리미엄 무선청소기", modelName: "V15 Detect", retailPrice: 1290000, marketSharePct: 35.0, strengths: "강력한 흡입력 및 인지도", weaknesses: "고가격대, 소음 82dB로 상대적 고소음", updatedAt: "2026-07-20" },
  { id: "CMP-02", competitorName: "로보락 (Roborock)", productCategory: "스마트 로봇청소기", modelName: "S8 MaxV Ultra", retailPrice: 1690000, marketSharePct: 42.0, strengths: "자동 직배수 도킹 스테이션", weaknesses: "국내 AS 센터 부족 및 부품 수급 지연", updatedAt: "2026-07-25" },
  { id: "CMP-03", competitorName: "당사 (Smart ERP)", productCategory: "소형가전 무선청소기", modelName: "Smart Swing FG-1001", retailPrice: 850000, marketSharePct: 18.5, strengths: "저소음 BLDC 모터, 빠른 전국 AS", weaknesses: "브랜드 마케팅 인지도 확장 필요", updatedAt: "2026-08-01" },
]);

export default function CompetitorAnalysis() {
  const items = useStore(competitorStore) as CompetitorItem[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = items.filter((i) => catFilter === "전체" || i.productCategory.includes(catFilter));

  const excel = () =>
    downloadCsv(
      "마케팅_경쟁사_시장점유율_벤치마킹.csv",
      ["경쟁사명", "제품군", "대표모델명", "판매가(원)", "시장점유율(%)", "강점(USP)", "약점/차별화", "업데이트일시"],
      filtered.map((i) => [
        i.competitorName,
        i.productCategory,
        i.modelName,
        i.retailPrice,
        `${i.marketSharePct}%`,
        i.strengths,
        i.weaknesses,
        i.updatedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">12. Marketing Management (마케팅)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">경쟁사분석 (MK-002)</h1>
          <span className="text-[11px] text-sub">소형 가전 업계 경쟁사 대표 모델 출하 가격 · 시장 점유율(%) · 기술 USP 벤치마킹</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">당사 소형가전 시장 점유율</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">18.5% <span className="text-xs font-normal text-ink">(3위)</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">가격 경쟁력 우위 (대비)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">-34.1% <span className="text-xs font-normal text-ink">저렴</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">분석 대상 주요 경쟁사</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개사</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">제품군:</span>
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
          📥 경쟁사분석 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">경쟁사명</th>
              <th className="px-3 py-2">제품군 / 모델명</th>
              <th className="px-3 py-2 text-right">소비자 판매가</th>
              <th className="px-3 py-2 text-right">시장 점유율</th>
              <th className="px-3 py-2">핵심 강점 (USP)</th>
              <th className="px-3 py-2">약점 및 당사 차별화 포인트</th>
              <th className="px-3 py-2">업데이트</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-bold text-ink">{i.competitorName}</td>
                <td className="px-3 py-2 font-medium">
                  <div>{i.modelName}</div>
                  <div className="text-[11px] text-sub">{i.productCategory}</div>
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.retailPrice / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.marketSharePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-emerald-700 text-[11px] font-medium">{i.strengths}</td>
                <td className="px-3 py-2 text-sub text-[11px] font-medium">{i.weaknesses}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
