// PP-001 생산계획(MPS) — 수요(수주+예측) 대비 계획, 생산능력 검토
import { Link } from "react-router-dom";
import { materialStore } from "../../data/mock/master";
import { salesOrderStore, DocLine } from "../../data/mock/sales";
import { mpsStore, CAPACITY } from "../../data/mock/production";
import { useStore } from "../../services/store";

export default function MpsPage() {
  const plans = useStore(mpsStore);
  const orders = useStore(salesOrderStore);
  const mats = useStore(materialStore);

  // 미출하 수주량 (FG별)
  const orderQty = (material: string) =>
    orders
      .filter((o) => o.status === "등록" || o.status === "출하예약")
      .flatMap((o) => o.lines as DocLine[])
      .filter((l) => l.material === material)
      .reduce((s, l) => s + l.qty, 0);

  const totalPlan = plans.reduce((s, p) => s + p.plan, 0);
  const loadPct = Math.round((totalPlan / CAPACITY) * 100);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. 생산관리 (Production)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">생산계획 MPS (PP-001)</h1>
          <span className="text-[11px] text-sub">2026-07 | 수요 대비 계획 · 생산능력 검토</span>
        </div>
      </div>

      {/* 능력 검토 */}
      <div className="bg-panel border border-line rounded-lg p-4">
        <div className="flex justify-between text-[12px] mb-2">
          <span className="font-semibold">라인 부하율 (월 능력 {CAPACITY.toLocaleString()} EA)</span>
          <span className={`font-bold ${loadPct > 100 ? "text-red-500" : loadPct > 85 ? "text-amber-500" : "text-emerald-500"}`}>
            {totalPlan.toLocaleString()} EA — {loadPct}%
          </span>
        </div>
        <div className="h-2.5 bg-surface rounded">
          <div
            className={`h-2.5 rounded ${loadPct > 100 ? "bg-red-500" : loadPct > 85 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(loadPct, 100)}%` }}
          />
        </div>
        {loadPct > 100 && <div className="text-[11px] text-red-500 mt-1">⚠️ 능력 초과 — 외주생산 또는 계획 조정 필요</div>}
      </div>

      {/* MPS 그리드 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">완제품</th>
              <th className="px-3 py-2 text-right">수주잔량</th>
              <th className="px-3 py-2 text-right">수요예측</th>
              <th className="px-3 py-2 text-right">총수요</th>
              <th className="px-3 py-2 text-right">현재고</th>
              <th className="px-3 py-2 text-right">계획수량</th>
              <th className="px-3 py-2 text-right">계획-수요 GAP</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => {
              const so = orderQty(p.material);
              const demand = so + p.forecast;
              const mat = mats.find((m) => m.code === p.material);
              const gap = p.plan + (mat?.stock ?? 0) - demand;
              return (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2">{p.material} — {mat?.name ?? ""}</td>
                  <td className="px-3 py-2 text-right">{so.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{p.forecast.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-semibold">{demand.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-sub">{(mat?.stock ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={p.plan}
                      onChange={(e) => mpsStore.update(p.id, { plan: Number(e.target.value) })}
                      className="w-24 px-2 py-1 rounded border border-line bg-surface text-[12px] text-right text-ink"
                    />
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold ${gap < 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {gap >= 0 ? "+" : ""}{gap.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 py-2 border-t border-line flex items-center">
          <span className="text-[11px] text-sub">계획수량 수정 시 즉시 반영 · GAP = 계획+현재고−총수요</span>
          <Link to="/m/pp/pp-03" className="ml-auto px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">
            ▶ MRP 실행 (자재소요 계산)
          </Link>
        </div>
      </div>
    </div>
  );
}
