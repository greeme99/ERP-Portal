// SD-011 영업실적관리 — 영업 담당자/고객사별 매출 목표(Target) vs 달성 실적(Actual) 및 달성률(%) 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SalesRepPerformance {
  id: string;
  repCode: string;
  repName: string;
  department: "국내영업1팀" | "국내영업2팀" | "해외영업팀";
  targetRevenue: number; // 영업 목표 (KRW)
  actualRevenue: number; // 달성 실적 (KRW)
  achievementRate: number; // 달성률 (%)
  dealCount: number; // 체결 수주 건수
  backlogAmount: number; // 수주 잔고 (KRW)
  month: string;
}

export const salesRepStore = createStore("sd.rep_performance", [
  { id: "REP-01", repCode: "SLS-101", repName: "홍영업 팀장", department: "국내영업1팀", targetRevenue: 500000000, actualRevenue: 580000000, achievementRate: 116.0, dealCount: 12, backlogAmount: 120000000, month: "2026-07" },
  { id: "REP-02", repCode: "SLS-102", repName: "김세일 과장", department: "국내영업2팀", targetRevenue: 400000000, actualRevenue: 370000000, achievementRate: 92.5, dealCount: 8, backlogAmount: 95000000, month: "2026-07" },
  { id: "REP-03", repCode: "SLS-201", repName: "최글로벌 차장", department: "해외영업팀", targetRevenue: 650000000, actualRevenue: 720000000, achievementRate: 110.8, dealCount: 5, backlogAmount: 250000000, month: "2026-07" },
]);

export default function SalesPerformance() {
  const reps = useStore(salesRepStore) as SalesRepPerformance[];
  const [deptFilter, setDeptFilter] = useState("전체");

  const filtered = reps.filter((r) => deptFilter === "전체" || r.department === deptFilter);

  const totalTarget = filtered.reduce((acc, r) => acc + r.targetRevenue, 0);
  const totalActual = filtered.reduce((acc, r) => acc + r.actualRevenue, 0);
  const avgRate = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : "0.0";

  const excel = () =>
    downloadCsv(
      "영업_담당자별_실적대장.csv",
      ["사번", "담당자명", "부서", "목표매출(원)", "달성실적(원)", "달성률(%)", "체결건수", "수주잔고(원)", "기준월"],
      filtered.map((r) => [
        r.repCode,
        r.repName,
        r.department,
        r.targetRevenue,
        r.actualRevenue,
        `${r.achievementRate}%`,
        r.dealCount,
        r.backlogAmount,
        r.month,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">영업실적관리 (SD-011)</h1>
          <span className="text-[11px] text-sub">영업 담당자/부서별 매출 목표(Target) vs 달성(Actual) 실시간 추적</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 영업 목표 금액</div>
          <div className="text-xl font-bold mt-1 font-mono">{(totalTarget / 100000000).toFixed(2)} <span className="text-xs font-normal">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">전사 달성 매출 실적</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{(totalActual / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">전사 영업 목표 달성률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgRate}%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">부서:</span>
          {["전체", "국내영업1팀", "국내영업2팀", "해외영업팀"].map((dp) => (
            <button
              key={dp}
              onClick={() => setDeptFilter(dp)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                deptFilter === dp
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {dp}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 영업실적 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">사번 / 담당자명</th>
              <th className="px-3 py-2">부서</th>
              <th className="px-3 py-2 text-right">목표 매출 (Target)</th>
              <th className="px-3 py-2 text-right">달성 실적 (Actual)</th>
              <th className="px-3 py-2 text-right">목표 달성률</th>
              <th className="px-3 py-2 text-right">체결 수주 건수</th>
              <th className="px-3 py-2 text-right">미출하 수주잔고</th>
              <th className="px-3 py-2">기준월</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{r.repCode} — {r.repName}</td>
                <td className="px-3 py-2 text-sub">{r.department}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{(r.targetRevenue / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 text-right font-mono font-bold font-semibold text-emerald-600">{(r.actualRevenue / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{r.achievementRate.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-medium">{r.dealCount}건</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{(r.backlogAmount / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 font-mono text-sub">{r.month}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
