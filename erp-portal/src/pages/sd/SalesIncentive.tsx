// SD-015 영업인센티브 (Sales Incentive & Rep Performance) — 영업 담당자별 매출 목표 대비 달성률·수금실적 연동 인센티브 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SalesIncentiveItem {
  id: string;
  repCode: string;
  repName: string;
  deptName: string;
  targetSalesAmount: number; // 매출 목표 금액 (KRW)
  actualSalesAmount: number; // 매출 실적 금액 (KRW)
  achievementRatePct: number; // 목표 달성률 (%)
  collectedAmount: number; // 수금 완결 금액 (KRW)
  calculatedIncentive: number; // 계산 인센티브 금액 (KRW)
  performanceGrade: "S등급 (120% 초과)" | "A등급 (100% 달성)" | "B등급 (80% 이상)";
  period: string;
}

export const salesIncentiveStore = createStore("sd.sales_incentive", [
  { id: "INC-01", repCode: "REP-101", repName: "이영업 팀장", deptName: "국내영업 1팀", targetSalesAmount: 1000000000, actualSalesAmount: 1250000000, achievementRatePct: 125.0, collectedAmount: 1200000000, calculatedIncentive: 12500000, performanceGrade: "S등급 (120% 초과)", period: "2026-07" },
  { id: "INC-02", repCode: "REP-102", repName: "박영업 과장", deptName: "국내영업 2팀", targetSalesAmount: 500000000, actualSalesAmount: 510000000, achievementRatePct: 102.0, collectedAmount: 480000000, calculatedIncentive: 4500000, performanceGrade: "A등급 (100% 달성)", period: "2026-07" },
  { id: "INC-03", repCode: "REP-103", repName: "김수주 대리", deptName: "해외영업팀", targetSalesAmount: 600000000, actualSalesAmount: 540000000, achievementRatePct: 90.0, collectedAmount: 500000000, calculatedIncentive: 2700000, performanceGrade: "B등급 (80% 이상)", period: "2026-07" },
]);

export default function SalesIncentive() {
  const items = useStore(salesIncentiveStore) as SalesIncentiveItem[];
  const [gradeFilter, setGradeFilter] = useState("전체");

  const filtered = items.filter((i) => gradeFilter === "전체" || i.performanceGrade.includes(gradeFilter));

  const totalIncentive = filtered.reduce((acc, i) => acc + i.calculatedIncentive, 0);

  const excel = () =>
    downloadCsv(
      "영업_담당자별_인센티브_실적대장.csv",
      ["담당자코드", "성명", "부서명", "목표금액(원)", "매출실적(원)", "달성률(%)", "수금실적(원)", "인센티브(원)", "평가등급", "기준월"],
      filtered.map((i) => [
        i.repCode,
        i.repName,
        i.deptName,
        i.targetSalesAmount,
        i.actualSalesAmount,
        `${i.achievementRatePct}%`,
        i.collectedAmount,
        i.calculatedIncentive,
        i.performanceGrade,
        i.period,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">영업인센티브 (SD-015)</h1>
          <span className="text-[11px] text-sub">영업 담당자별 매출 목표 대비 달성률 · 수금 완결 실적 연동 인센티브 수당 산정</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 인센티브 지급 산정액</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalIncentive / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">S등급 (120% 초과) 우수 영업자</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{items.filter((i) => i.performanceGrade.includes("S등급")).length} <span className="text-xs font-normal text-ink">명</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">전사 영업 목표 평균 달성률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(items.reduce((acc, i) => acc + i.achievementRatePct, 0) / (items.length || 1)).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">등급:</span>
          {["전체", "S등급", "A등급", "B등급"].map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                gradeFilter === g
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 인센티브 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">담당자 코드 / 성명</th>
              <th className="px-3 py-2">소속 부서</th>
              <th className="px-3 py-2 text-right">매출 목표 금액</th>
              <th className="px-3 py-2 text-right">매출 실적 금액</th>
              <th className="px-3 py-2 text-right">목표 달성률</th>
              <th className="px-3 py-2 text-right">수금 실적 금액</th>
              <th className="px-3 py-2 text-right">산정 인센티브</th>
              <th className="px-3 py-2">평가 등급</th>
              <th className="px-3 py-2">기준월</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.repCode} — {i.repName}</td>
                <td className="px-3 py-2 text-sub">{i.deptName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{(i.targetSalesAmount / 100000000).toFixed(1)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.actualSalesAmount / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.achievementRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-medium text-sub">{(i.collectedAmount / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.calculatedIncentive / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.performanceGrade.includes("S등급") ? "bg-purple-100 text-purple-700 border border-purple-200" :
                    i.performanceGrade.includes("A등급") ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}>
                    {i.performanceGrade}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
