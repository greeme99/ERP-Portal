// ExecutiveKpiAnalytics.tsx (C-Level Executive KPI & AI Financial Forecasting) — 경영진 전용 AI 경영실적 및 예측 종합 모니터링
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ExecutiveKpiItem {
  id: string;
  kpiName: string; // KPI 항목명 (예: 전사 매출액, 영업이익률 OPM, 재고자산 회전율, OTD 적기 배송률)
  targetValue: string; // 목표치
  currentValue: string; // 현재 달성치
  achievementRatePct: number; // 목표 달성률 (%)
  aiForecastNextQuarter: string; // AI 예측 차기 분기 예상치
  statusRiskLevel: "목표 달성 (Low Risk)" | "주의 (Warning)" | "경고 (High Risk)";
}

export const execKpiStore = createStore("dashboard.exec_kpi", [
  { id: "KPI-01", kpiName: "전사 연간 누적 매출액 (Revenue)", targetValue: "500.0 억원", currentValue: "524.8 억원", achievementRatePct: 104.96, aiForecastNextQuarter: "138.5 억원 (+5.2% 성장)", statusRiskLevel: "목표 달성 (Low Risk)" },
  { id: "KPI-02", kpiName: "영업 이익률 (Operating Profit Margin)", targetValue: "12.0%", currentValue: "14.2%", achievementRatePct: 118.33, aiForecastNextQuarter: "14.5% (안정 유지)", statusRiskLevel: "목표 달성 (Low Risk)" },
  { id: "KPI-03", kpiName: "수주-출하 적기 이행률 (OTD Rate)", targetValue: "98.0%", currentValue: "100.0%", achievementRatePct: 102.04, aiForecastNextQuarter: "99.5%", statusRiskLevel: "목표 달성 (Low Risk)" },
  { id: "KPI-04", kpiName: "품질 공정 불량률 (Process PPM)", targetValue: "10,000 PPM", currentValue: "14,900 PPM", achievementRatePct: 67.11, aiForecastNextQuarter: "8,500 PPM (개선 조치중)", statusRiskLevel: "주의 (Warning)" },
]);

export default function ExecutiveKpiAnalytics() {
  const items = useStore(execKpiStore) as ExecutiveKpiItem[];
  const [riskFilter, setRiskFilter] = useState("전체");

  const filtered = items.filter((i) => riskFilter === "전체" || i.statusRiskLevel.includes(riskFilter));

  const excel = () =>
    downloadCsv(
      "경영진_C-Level_KPI_AI예측_종합대장.csv",
      ["KPI항목명", "목표치", "현재달성치", "달성률(%)", "AI차기분기예측", "리스크상태"],
      filtered.map((i) => [
        i.kpiName,
        i.targetValue,
        i.currentValue,
        `${i.achievementRatePct.toFixed(1)}%`,
        i.aiForecastNextQuarter,
        i.statusRiskLevel,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">00. Executive & AI Command (경영진 관제)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">C-Level 경영진 KPI & AI 예측 분석</h1>
          <span className="text-[11px] text-sub">전사 재무 · 생산 · 품질 핵심 지표 시뮬레이션 및 30일 경영실적 AI Forecast 모니터링</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 평균 KPI 목표 달성률</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">
            {(filtered.reduce((acc, i) => acc + i.achievementRatePct, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">AI 몬테카를로 재무 건전성 점수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">96.5 <span className="text-xs font-normal text-ink">/ 100점</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">Hermes AI 추천 경고 탐지</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">1 <span className="text-xs font-normal text-ink">건 (품질 PPM 주의)</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "목표 달성", "주의"].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                riskFilter === r
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 경영진KPI Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">KPI 핵심 항목명</th>
              <th className="px-3 py-2 text-right">경영 목표치</th>
              <th className="px-3 py-2 text-right">현재 달성치</th>
              <th className="px-3 py-2 text-right">목표 달성률</th>
              <th className="px-3 py-2">Hermes AI 차기 분기 예측</th>
              <th className="px-3 py-2">리스크 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-bold text-blue-600 text-[11px]">{i.kpiName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.targetValue}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.currentValue}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.achievementRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 font-medium text-ink text-[11px]">{i.aiForecastNextQuarter}</td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      i.statusRiskLevel.includes("Low Risk")
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {i.statusRiskLevel}
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
