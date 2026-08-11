// MK-001 마케팅 전략 (Marketing Strategy & Planning) — 연간/분기별 마케팅 목표·타겟 세그먼트·프로모션 예산 수립
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface MarketingStrategyItem {
  id: string;
  strategyCode: string;
  strategyName: string;
  targetSegment: string; // 타겟 고객군 (예: 2030 1인 가구, B2B 가전 OEM)
  targetProductGroup: string;
  allocatedBudget: number; // 할당 예산 (KRW)
  kpiGoal: string; // 마진율 상승, 브랜드 인지도 등
  period: string; // 추진 기간
  status: "승인완료" | "수립중" | "검토중";
}

export const marketingStrategyStore = createStore("mk.strategy", [
  { id: "MKS-01", strategyCode: "STG-2026-01", strategyName: "2030 1인 가구 타겟 무선청소기 런칭 프로모션", targetSegment: "2030 싱글 가구", targetProductGroup: "소형 무선청소기 FG-1001", allocatedBudget: 150000000, kpiGoal: "신규 수주 3,000대 체결", period: "2026-Q3", status: "승인완료" },
  { id: "MKS-02", strategyCode: "STG-2026-02", strategyName: "글로벌 B2B 가전 OEM 파트너십 확장 전략", targetSegment: "국내외 가전 OEM 제조사", targetProductGroup: "전자기판 모듈 SF-2001", allocatedBudget: 80000000, kpiGoal: "신규 OEM 공급계약 2건 체결", period: "2026-Q3~Q4", status: "승인완료" },
  { id: "MKS-03", strategyCode: "STG-2026-03", strategyName: "스마트 로봇청소기 AI 기능 강조 디지털 마케팅", targetSegment: "3040 프리미엄 가전 구매층", targetProductGroup: "로봇청소기 FG-1002", allocatedBudget: 220000000, kpiGoal: "매출 성장률 +25% 달성", period: "2026-Q4", status: "수립중" },
]);

export default function MarketingStrategy() {
  const strategies = useStore(marketingStrategyStore) as MarketingStrategyItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = strategies.filter((s) => statusFilter === "전체" || s.status === statusFilter);

  const totalBudget = filtered.reduce((acc, s) => acc + s.allocatedBudget, 0);

  const excel = () =>
    downloadCsv(
      "마케팅_전략수립_대장.csv",
      ["전략코드", "전략명", "타겟세그먼트", "대상제품군", "할당예산(원)", "KPI목표", "추진기간", "상태"],
      filtered.map((s) => [
        s.strategyCode,
        s.strategyName,
        s.targetSegment,
        s.targetProductGroup,
        s.allocatedBudget,
        s.kpiGoal,
        s.period,
        s.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">12. Marketing Management (마케팅)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">마케팅 전략 (MK-001)</h1>
          <span className="text-[11px] text-sub">연간/분기별 타겟 세그먼트 수립 · 마케팅 예산 할당 · KPI 목표 추적</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 마케팅 전략 예산</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalBudget / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">승인 완료 전략 건수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{strategies.filter((s) => s.status === "승인완료").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">수립/검토 중 전략 건수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{strategies.filter((s) => s.status !== "승인완료").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "승인완료", "수립중"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === st
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 마케팅 전략 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">전략 코드 / 명</th>
              <th className="px-3 py-2">타겟 세그먼트</th>
              <th className="px-3 py-2">대상 제품군</th>
              <th className="px-3 py-2 text-right">할당 예산</th>
              <th className="px-3 py-2">KPI 목표</th>
              <th className="px-3 py-2">추진 기간</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{s.strategyCode} — {s.strategyName}</td>
                <td className="px-3 py-2 text-sub font-medium">{s.targetSegment}</td>
                <td className="px-3 py-2 text-sub">{s.targetProductGroup}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(s.allocatedBudget / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-ink font-medium">{s.kpiGoal}</td>
                <td className="px-3 py-2 font-mono text-sub">{s.period}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.status === "승인완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {s.status}
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
