// CO-008 예산관리(편성) — 부서별 편성·집행·잔액, PR 예산체크와 연동
import { budgetStore } from "../../data/mock/procurement";
import { useStore, downloadCsv } from "../../services/store";

const eok = (v: number) => `${(v / 100000000).toFixed(1)}억`;

export default function BudgetPlan() {
  const budgets = useStore(budgetStore);

  const setBudget = (id: string, v: number) => budgetStore.update(id, { budget: v });

  const totBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totUsed = budgets.reduce((s, b) => s + b.used, 0);
  const totPct = totBudget > 0 ? Math.round((totUsed / totBudget) * 100) : 0;

  const excel = () =>
    downloadCsv("예산편성.csv", ["부서", "편성액", "집행액", "잔액", "집행률%"],
      budgets.map((b) => [b.dept, b.budget, b.used, b.budget - b.used, ((b.used / b.budget) * 100).toFixed(1)]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. 관리회계 (Controlling)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">예산관리 · 편성 (CO-008)</h1>
          <span className="text-[11px] text-sub">부서별 연간 예산 편성·집행 · 구매요청(PR) 예산체크 연동</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">총 편성액</div><div className="text-xl font-bold mt-1">{eok(totBudget)}</div></div>
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">총 집행액</div><div className="text-xl font-bold mt-1">{eok(totUsed)}</div></div>
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">잔여</div><div className="text-xl font-bold mt-1">{eok(totBudget - totUsed)}</div></div>
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">전사 집행률</div><div className={`text-xl font-bold mt-1 ${totPct >= 90 ? "text-red-500" : totPct >= 70 ? "text-amber-500" : "text-emerald-500"}`}>{totPct}%</div></div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line flex items-center">
          <span className="font-semibold">부서별 예산 편성</span>
          <button onClick={excel} className="ml-auto px-3 py-1 rounded border border-line text-[11px] hover:bg-accent-soft">📥 Excel</button>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">부서</th>
              <th className="px-3 py-2 text-right">편성액(원)</th>
              <th className="px-3 py-2 text-right">집행액</th>
              <th className="px-3 py-2 text-right">잔액</th>
              <th className="px-3 py-2 w-40">집행률</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => {
              const pct = b.budget > 0 ? Math.round((b.used / b.budget) * 100) : 0;
              const over = b.used > b.budget;
              return (
                <tr key={b.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-semibold">{b.dept}</td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" value={b.budget} onChange={(e) => setBudget(b.id, Number(e.target.value))}
                      className="w-32 px-2 py-1 rounded border border-line bg-surface text-[12px] text-right text-ink" />
                  </td>
                  <td className="px-3 py-2 text-right">{b.used.toLocaleString()}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${over ? "text-red-500" : ""}`}>{(b.budget - b.used).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface rounded">
                        <div className={`h-1.5 rounded ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-[11px] w-8 text-right">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {over
                      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">초과</span>
                      : pct >= 90
                        ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">소진임박</span>
                        : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">여유</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line">
          편성액 수정 시 즉시 반영 — 구매요청(PR) 화면의 예산 잔여·초과 경고에 연동
        </div>
      </div>
    </div>
  );
}
