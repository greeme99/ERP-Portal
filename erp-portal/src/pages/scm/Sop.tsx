// SCM-002 S&OP — 판매(수요)·공급·생산계획 정합성 검토 및 합의
import { materialStore } from "../../data/mock/master";
import { salesOrderStore, DocLine } from "../../data/mock/sales";
import { mpsStore, CAPACITY } from "../../data/mock/production";
import { forecastStore, sopStore, CURRENT_MONTH } from "../../data/mock/scm";
import { useStore, downloadCsv } from "../../services/store";

const SOP_STATUS_STYLE: Record<string, string> = {
  검토중: "bg-amber-100 text-amber-700",
  합의완료: "bg-emerald-100 text-emerald-700",
};

export default function Sop() {
  const mats = useStore(materialStore);
  const orders = useStore(salesOrderStore);
  const mps = useStore(mpsStore);
  const forecasts = useStore(forecastStore);
  const sops = useStore(sopStore);

  const sop = sops.find((s) => s.month === CURRENT_MONTH);
  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;

  const rows = mps.map((p) => {
    // 판매계획(수요) = 당월 예측 + 미출하 수주잔
    const fc = forecasts.find((f) => f.material === p.material && f.month === CURRENT_MONTH)?.forecast ?? p.forecast;
    const so = orders
      .filter((o) => o.status === "등록" || o.status === "출하예약")
      .flatMap((o) => o.lines as DocLine[])
      .filter((l) => l.material === p.material)
      .reduce((s, l) => s + l.qty, 0);
    const demand = fc + so;
    const stock = mats.find((m) => m.code === p.material)?.stock ?? 0;
    // 공급계획 = 현재고 + 생산계획
    const supply = stock + p.plan;
    const gap = supply - demand;
    return { code: p.material, name: matName(p.material), fc, so, demand, stock, plan: p.plan, supply, gap };
  });

  const totalPlan = mps.reduce((s, p) => s + p.plan, 0);
  const load = Math.round((totalPlan / CAPACITY) * 100);
  const shortItems = rows.filter((r) => r.gap < 0).length;

  const signOff = () => {
    if (!sop) return;
    if (sop.status === "합의완료") return alert("이미 합의 완료되었습니다.");
    if (shortItems > 0 && !confirm(`공급부족 ${shortItems}건이 있습니다. 그래도 합의 완료할까요?`)) return;
    sopStore.update(sop.id, { status: "합의완료", note: `부하율 ${load}%, 공급부족 ${shortItems}건` });
    alert("S&OP 합의 완료 — 확정 계획으로 전환");
  };

  const excel = () =>
    downloadCsv("SOP.csv", ["품목", "예측", "수주잔", "총수요", "재고", "생산계획", "공급", "GAP"],
      rows.map((r) => [r.code, r.fc, r.so, r.demand, r.stock, r.plan, r.supply, r.gap]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">02. SCM (Supply Chain)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">S&OP 판매·운영 계획 (SCM-002)</h1>
          <span className="text-[11px] text-sub">{CURRENT_MONTH} · 수요·공급·생산 정합성 검토</span>
        </div>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">라인 부하율</div>
          <div className={`text-xl font-bold mt-1 ${load > 100 ? "text-red-500" : load > 85 ? "text-amber-500" : "text-emerald-500"}`}>{load}%</div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">공급부족 품목</div>
          <div className={`text-xl font-bold mt-1 ${shortItems > 0 ? "text-red-500" : "text-emerald-500"}`}>{shortItems}건</div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">총 생산계획</div>
          <div className="text-xl font-bold mt-1">{totalPlan.toLocaleString()}</div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">합의 상태</div>
          <div className="mt-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${SOP_STATUS_STYLE[sop?.status ?? "검토중"]}`}>{sop?.status ?? "검토중"}</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line flex items-center">
          <span className="font-semibold">수요-공급-생산 정합</span>
          <div className="ml-auto flex gap-1">
            <button onClick={excel} className="px-3 py-1 rounded border border-line text-[11px] hover:bg-accent-soft">📥 Excel</button>
            <button onClick={signOff} className="px-3 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold">✓ 합의 완료</button>
          </div>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">예측</th>
              <th className="px-3 py-2 text-right">수주잔</th>
              <th className="px-3 py-2 text-right">총수요</th>
              <th className="px-3 py-2 text-right">재고</th>
              <th className="px-3 py-2 text-right">생산계획</th>
              <th className="px-3 py-2 text-right">공급</th>
              <th className="px-3 py-2 text-right">GAP</th>
              <th className="px-3 py-2">판정</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2">{r.code} — {r.name}</td>
                <td className="px-3 py-2 text-right">{r.fc.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.so.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.demand.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-sub">{r.stock.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.plan.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.supply.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right font-bold ${r.gap < 0 ? "text-red-500" : "text-emerald-500"}`}>
                  {r.gap >= 0 ? "+" : ""}{r.gap.toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  {r.gap < 0
                    ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">공급부족</span>
                    : r.gap < r.demand * 0.1
                      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">타이트</span>
                      : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">안정</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line">
          예측은 수요예측(SCM-001), 생산계획은 MPS(PP-001)에서 연동 · 공급부족은 생산계획 증량 또는 외주 검토
        </div>
      </div>
    </div>
  );
}
