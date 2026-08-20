// CO-012 경영 Dashboard — 전사 수익성·자산·품질 KPI 와 통합 예외
//
// 새 계산을 만들지 않는다. insights.computeKpis/computeExceptions 가 이미
// 전사 KPI 를 계산하므로 그대로 쓰고, 채권·채무만 재무 store 에서 더한다.
import { Link } from "react-router-dom";
import { useStore } from "../../services/store";
import { apStore, arStore } from "../../data/mock/finance";
import { budgetStore } from "../../data/mock/procurement";
import { TODAY, computeExceptions, computeKpis, fmtEok } from "../../services/insights";

const pct1 = (v: number | null) => (v === null ? "—" : `${v.toFixed(1)}%`);

/** KPI 카드. good 이 null 이면 색을 입히지 않는다(판정 기준이 없는 값). */
function Kpi({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean | null }) {
  const tone = good === null || good === undefined ? "" : good ? "text-emerald-500" : "text-red-500";
  return (
    <div className="bg-panel border border-line rounded-lg p-3">
      <div className="text-[11px] text-sub">{label}</div>
      <div className={`text-xl font-bold mt-1 ${tone}`}>{value}</div>
      {sub && <div className="text-[10px] text-sub mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ManagementDashboard() {
  const ars = useStore(arStore);
  const aps = useStore(apStore);
  const budgets = useStore(budgetStore);

  const k = computeKpis();
  const exceptions = computeExceptions();

  const arOpen = ars.filter((r) => r.status !== "회수");
  const apOpen = aps.filter((r) => r.status !== "지급완료");
  const arAmount = arOpen.reduce((s, r) => s + r.amount, 0);
  const apAmount = apOpen.reduce((s, r) => s + r.amount, 0);
  const arOverdue = arOpen.filter((r) => r.dueDate < TODAY);

  const budgetTotal = budgets.reduce((s, b) => s + b.budget, 0);
  const usedTotal = budgets.reduce((s, b) => s + b.used, 0);
  const usedPct = budgetTotal > 0 ? (usedTotal / budgetTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] text-sub">09. 관리회계 (Controlling)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">경영 Dashboard</h1>
          <span className="text-[11px] text-sub">전사 수익성·자산·품질 KPI — 실시간 집계</span>
        </div>
      </div>

      {/* 수익성 */}
      <div>
        <div className="text-[11px] text-sub mb-1.5 font-semibold">💵 수익성</div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <Kpi label="매출" value={fmtEok(k.revenue)} sub={`출하완료 ${k.deliveredCount}건`} />
          <Kpi label="매출원가" value={fmtEok(k.cogs)} />
          <Kpi label="매출총이익" value={fmtEok(k.profit)} good={k.profit > 0} />
          <Kpi label="매출총이익률" value={pct1(k.marginPct)} good={k.marginPct === null ? null : k.marginPct >= 20} />
        </div>
      </div>

      {/* 자산·자금 */}
      <div>
        <div className="text-[11px] text-sub mb-1.5 font-semibold">🏦 자산 · 자금</div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <Kpi label="재고자산" value={fmtEok(k.invValue)} />
          <Kpi
            label="재고회전율"
            value={k.turnover === null ? "—" : `${k.turnover.toFixed(1)}회`}
            sub="연환산"
            good={k.turnover === null ? null : k.turnover >= 6}
          />
          <Kpi
            label="미수채권"
            value={fmtEok(arAmount)}
            sub={arOverdue.length > 0 ? `연체 ${arOverdue.length}건` : `${arOpen.length}건`}
            good={arOverdue.length === 0}
          />
          <Kpi label="미지급채무" value={fmtEok(apAmount)} sub={`${apOpen.length}건`} />
        </div>
      </div>

      {/* 운영 품질 */}
      <div>
        <div className="text-[11px] text-sub mb-1.5 font-semibold">⚙️ 운영 · 품질</div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <Kpi label="납기준수율 (OTD)" value={pct1(k.otd)} good={k.otd === null ? null : k.otd >= 95} />
          <Kpi label="설비종합효율 (OEE)" value={pct1(k.oee)} good={k.oee === null ? null : k.oee >= 85} />
          <Kpi label="생산 수율" value={pct1(k.yieldPct)} good={k.yieldPct === null ? null : k.yieldPct >= 98} />
          <Kpi
            label="불량률 (PPM)"
            value={k.ppm === null ? "—" : Math.round(k.ppm).toLocaleString()}
            good={k.ppm === null ? null : k.ppm <= 5000}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* 예산 집행 */}
        <div className="bg-panel border border-line rounded-lg overflow-x-auto">
          <div className="px-4 py-2.5 border-b border-line font-semibold flex justify-between items-baseline">
            <span>📊 부서별 예산 집행</span>
            <span className={`text-[11px] font-bold ${usedPct > 90 ? "text-red-500" : "text-sub"}`}>
              전사 {Math.round(usedPct)}%
            </span>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-sub text-left">
                <th className="px-3 py-2">부서</th>
                <th className="px-3 py-2 text-right">예산</th>
                <th className="px-3 py-2 text-right">집행</th>
                <th className="px-3 py-2 text-right">소진율</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => {
                const rate = b.budget > 0 ? (b.used / b.budget) * 100 : 0;
                return (
                  <tr key={b.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                    <td className="px-3 py-2">{b.dept}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtEok(b.budget)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtEok(b.used)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${rate > 90 ? "text-red-500" : rate > 75 ? "text-amber-500" : "text-emerald-500"}`}>
                      {Math.round(rate)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 통합 예외 */}
        <div className="bg-panel border border-line rounded-lg">
          <div className="px-4 py-2.5 border-b border-line font-semibold">🚨 전사 예외 ({exceptions.length}건)</div>
          {exceptions.length > 0 ? (
            <ul>
              {exceptions.map((a, i) => (
                <li key={i} className="px-4 py-2.5 border-b border-line last:border-0 flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${a.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {a.tag}
                  </span>
                  <Link to={a.link} className="text-[12px] hover:text-accent">{a.text}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-emerald-500 text-[12px]">✓ 탐지된 예외 없음</div>
          )}
        </div>
      </div>
    </div>
  );
}
