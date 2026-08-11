// FI-002 예산관리 (Financial Budgeting) — 부서별/계정과목별 연간/월별 수입·지출 예산 편성 및 실시간 집행율 통제
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface FiBudgetItem {
  id: string;
  deptName: string; // 부서명 (예: 구매팀, 영업팀, 품질보증팀, R&D연구소)
  accountCode: string;
  accountName: string; // 계정과목 (예: 원자재 매입비, 판매촉진비, 연구개발비)
  allocatedBudget: number; // 편성 예산 (KRW)
  executedAmount: number; // 집행 실적 (KRW)
  remainingBudget: number; // 예산 잔액 = Allocated - Executed (KRW)
  executionRatePct: number; // 집행율 (%)
  status: "정상" | "경고 (80% 초과)" | "초과 (100% 달성)";
  period: string;
}

export const fiBudgetStore = createStore("fi.budget_mgmt", [
  { id: "FIB-01", deptName: "구매자재팀", accountCode: "ACC-5001", accountName: "원자재 및 부품 매입비", allocatedBudget: 658350000, executedAmount: 658350000, remainingBudget: 0, executionRatePct: 100.0, status: "정상", period: "2026-07" },
  { id: "FIB-02", deptName: "R&D 연구소", accountCode: "ACC-5002", accountName: "신제품 연구개발비", allocatedBudget: 450000000, executedAmount: 320000000, remainingBudget: 130000000, executionRatePct: 71.1, status: "정상", period: "2026-07" },
  { id: "FIB-03", deptName: "영업마케팅팀", accountCode: "ACC-5003", accountName: "판매촉진 및 광고선전비", allocatedBudget: 150000000, executedAmount: 135000000, remainingBudget: 15000000, executionRatePct: 90.0, status: "경고 (80% 초과)", period: "2026-07" },
  { id: "FIB-04", deptName: "품질보증팀", accountCode: "ACC-5004", accountName: "정밀 계측기 검교정비", allocatedBudget: 35000000, executedAmount: 18000000, remainingBudget: 17000000, executionRatePct: 51.4, status: "정상", period: "2026-07" },
]);

export default function FiBudgetManagement() {
  const items = useStore(fiBudgetStore) as FiBudgetItem[];
  const [deptFilter, setDeptFilter] = useState("전체");

  const filtered = items.filter((i) => deptFilter === "전체" || i.deptName === deptFilter);

  const totalAllocated = filtered.reduce((acc, i) => acc + i.allocatedBudget, 0);
  const totalExecuted = filtered.reduce((acc, i) => acc + i.executedAmount, 0);
  const avgExecRate = totalAllocated > 0 ? ((totalExecuted / totalAllocated) * 100).toFixed(1) : "0.0";

  const excel = () =>
    downloadCsv(
      "재무_부서별_예산집행_대장.csv",
      ["부서명", "계정코드", "계정과목", "편성예산(원)", "집행실적(원)", "예산잔액(원)", "집행율(%)", "상태", "기준월"],
      filtered.map((i) => [
        i.deptName,
        i.accountCode,
        i.accountName,
        i.allocatedBudget,
        i.executedAmount,
        i.remainingBudget,
        `${i.executionRatePct}%`,
        i.status,
        i.period,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. Financial Accounting (재무회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">예산관리 (FI-002)</h1>
          <span className="text-[11px] text-sub">부서/계정과목별 편성 예산 대비 실시간 집행 실적 통제 및 예외 통지</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 편성 예산</div>
          <div className="text-xl font-bold mt-1 font-mono">{(totalAllocated / 100000000).toFixed(2)} <span className="text-xs font-normal">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">총 집행 실적 금액</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{(totalExecuted / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 예산 집행율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgExecRate}%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">부서:</span>
          {["전체", "구매자재팀", "R&D 연구소", "영업마케팅팀"].map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                deptFilter === d
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 예산집행 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">부서명</th>
              <th className="px-3 py-2">계정 코드 / 과목</th>
              <th className="px-3 py-2 text-right">편성 예산</th>
              <th className="px-3 py-2 text-right">집행 실적</th>
              <th className="px-3 py-2 text-right">예산 잔액</th>
              <th className="px-3 py-2 text-right">집행율</th>
              <th className="px-3 py-2">통제 상태</th>
              <th className="px-3 py-2">기준월</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.deptName}</td>
                <td className="px-3 py-2 text-sub">{i.accountCode} ({i.accountName})</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{(i.allocatedBudget / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.executedAmount / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{(i.remainingBudget / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.executionRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.status.includes("경고") ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {i.status}
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
