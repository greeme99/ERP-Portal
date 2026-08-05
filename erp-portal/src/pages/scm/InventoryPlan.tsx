// SCM-005 재고계획 — 목표재고·재주문점·커버리지, 안전재고 조정
import { materialStore, bomStore } from "../../data/mock/master";
import { mpsStore, explodeBom } from "../../data/mock/production";
import { forecastStore, CURRENT_MONTH } from "../../data/mock/scm";
import { useStore, downloadCsv } from "../../services/store";

export default function InventoryPlan() {
  const mats = useStore(materialStore);
  const boms = useStore(bomStore);
  const mps = useStore(mpsStore);
  const forecasts = useStore(forecastStore);

  // 월 수요: FG=당월예측, 원자재/반제품=MPS 전개 소요량
  const req: Record<string, number> = {};
  mps.forEach((p) => explodeBom(p.material, p.plan, boms, req));

  const monthlyDemand = (code: string, type: string) => {
    if (type === "완제품") return forecasts.find((f) => f.material === code && f.month === CURRENT_MONTH)?.forecast ?? 0;
    return Math.ceil(req[code] ?? 0);
  };

  const rows = mats
    .filter((m) => m.status === "사용")
    .map((m) => {
      const demand = monthlyDemand(m.code, m.type);
      const target = Math.round(m.safety * 1.5); // 목표재고 = 안전재고 x1.5
      const reorder = m.safety; // 재주문점 = 안전재고
      const daily = demand / 30;
      const coverage = daily > 0 ? m.stock / daily : Infinity;
      const needOrder = m.stock <= reorder;
      return { id: m.id, code: m.code, name: m.name, type: m.type, stock: m.stock, safety: m.safety, demand, target, reorder, coverage, needOrder };
    })
    .sort((a, b) => a.coverage - b.coverage);

  const setSafety = (id: string, v: number) => materialStore.update(id, { safety: v });

  const excel = () =>
    downloadCsv("재고계획.csv", ["품목", "유형", "현재고", "월수요", "안전재고", "재주문점", "목표재고", "커버리지(일)", "재주문"],
      rows.map((r) => [r.code, r.type, r.stock, r.demand, r.safety, r.reorder, r.target,
        r.coverage === Infinity ? "∞" : r.coverage.toFixed(0), r.needOrder ? "필요" : "-"]));

  const orderCount = rows.filter((r) => r.needOrder).length;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">02. SCM (Supply Chain)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">재고계획 (SCM-005)</h1>
          <span className="text-[11px] text-sub">목표재고·재주문점·커버리지 · 안전재고 조정</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3 text-[12px]">
        <span>대상 <b>{rows.length}</b>종</span>
        <span className={orderCount > 0 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>재주문 필요 {orderCount}종</span>
        <span className="text-[11px] text-sub ml-auto">목표재고=안전×1.5 · 재주문점=안전재고 · 커버리지=현재고÷(월수요÷30) · 재주문점 이하 적색</span>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2 text-right">현재고</th>
              <th className="px-3 py-2 text-right">월수요</th>
              <th className="px-3 py-2 text-right">안전재고</th>
              <th className="px-3 py-2 text-right">재주문점</th>
              <th className="px-3 py-2 text-right">목표재고</th>
              <th className="px-3 py-2 text-right">커버리지</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2">{r.code} — {r.name}</td>
                <td className="px-3 py-2 text-sub">{r.type}</td>
                <td className={`px-3 py-2 text-right ${r.needOrder ? "text-red-500 font-semibold" : ""}`}>{r.stock.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.demand.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <input type="number" value={r.safety} onChange={(e) => setSafety(r.id, Number(e.target.value))}
                    className="w-20 px-1 py-0.5 rounded border border-line bg-surface text-[11px] text-right text-ink" />
                </td>
                <td className="px-3 py-2 text-right text-sub">{r.reorder.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.target.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right font-semibold ${r.coverage === Infinity ? "text-sub" : r.coverage < 15 ? "text-red-500" : r.coverage < 30 ? "text-amber-500" : "text-emerald-500"}`}>
                  {r.coverage === Infinity ? "∞" : `${r.coverage.toFixed(0)}일`}
                </td>
                <td className="px-3 py-2">
                  {r.needOrder
                    ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">재주문</span>
                    : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">정상</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line">
          안전재고 수정 시 즉시 반영(재주문점·MRP 부족량에 영향) · 커버리지 15일 미만 적색
        </div>
      </div>
    </div>
  );
}
