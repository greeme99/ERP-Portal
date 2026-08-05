// LE-002 출고관리 — 출하예약 SO 연계 출고, LOT FIFO 차감, 재고 반영
import { materialStore, customerStore } from "../../data/mock/master";
import { salesOrderStore, DocLine } from "../../data/mock/sales";
import { lotStore, txStore } from "../../data/mock/logistics";
import { useStore, nextId } from "../../services/store";

const TODAY = "2026-07-03";

export default function GoodsIssue() {
  const orders = useStore(salesOrderStore);
  const lots = useStore(lotStore);
  const mats = useStore(materialStore);
  const customers = useStore(customerStore);

  const ready = orders.filter((o) => o.status === "출하예약");
  const custName = (c: string) => customers.find((x) => x.code === c)?.name ?? c;

  // LOT FIFO 차감
  const consumeLots = (material: string, qty: number, ref: string) => {
    let remain = qty;
    const fifo = lots
      .filter((l) => l.material === material && l.status === "가용" && l.qty > 0)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const lot of fifo) {
      if (remain <= 0) break;
      const take = Math.min(lot.qty, remain);
      lotStore.update(lot.id, { qty: lot.qty - take, status: lot.qty - take === 0 ? "소진" : "가용" });
      txStore.create({ id: nextId("TX"), type: "출고", material, qty: take, from: lot.wh, to: ref.split("/")[1] ?? "-", lot: lot.code, date: TODAY, ref: ref.split("/")[0] });
      remain -= take;
    }
    return remain; // 0이면 완전 차감
  };

  const issue = (o: any) => {
    const lines = o.lines as DocLine[];
    // 재고 확인
    for (const l of lines) {
      const m = mats.find((x) => x.code === l.material);
      if (!m || m.stock < l.qty) return alert(`재고 부족: ${l.material} (현재고 ${m?.stock ?? 0}, 필요 ${l.qty})`);
    }
    if (!confirm(`${o.code} — ${custName(o.customer)}로 출고 처리할까요?`)) return;
    for (const l of lines) {
      const m = mats.find((x) => x.code === l.material)!;
      materialStore.update(m.id, { stock: m.stock - l.qty });
      consumeLots(l.material, l.qty, `${o.code}/${o.customer}`);
    }
    salesOrderStore.update(o.id, { status: "출하완료" });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">04. 물류관리 (Logistics)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">출고관리 (LE-002)</h1>
          <span className="text-[11px] text-sub">출하예약 SO 연계 · LOT FIFO 차감</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg">
        <div className="px-4 py-2.5 border-b border-line font-semibold">🚚 출고 대기 (출하예약 {ready.length}건)</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">SO번호</th>
              <th className="px-3 py-2">고객</th>
              <th className="px-3 py-2">품목/수량</th>
              <th className="px-3 py-2">납기일</th>
              <th className="px-3 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {ready.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{o.code}</td>
                <td className="px-3 py-2">{custName(o.customer)}</td>
                <td className="px-3 py-2">
                  {(o.lines as DocLine[]).map((l, i) => (
                    <div key={i}>{l.material} × {l.qty.toLocaleString()}</div>
                  ))}
                </td>
                <td className={`px-3 py-2 ${o.dueDate < TODAY ? "text-red-500 font-bold" : "text-sub"}`}>{o.dueDate}</td>
                <td className="px-3 py-2">
                  <button onClick={() => issue(o)} className="px-3 py-1 rounded bg-blue-600 text-white text-[11px] font-semibold">🚚 출고</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ready.length === 0 && (
          <div className="px-4 py-5 text-center text-sub text-[12px]">
            출고 대기 건이 없습니다. 수주관리(SD-003)에서 출하예약을 먼저 처리하세요.
          </div>
        )}
      </div>

      {/* 완제품 LOT 현황 */}
      <div className="bg-panel border border-line rounded-lg">
        <div className="px-4 py-2.5 border-b border-line font-semibold">📦 완제품 LOT 현황 (FIFO 순)</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">LOT</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">잔량</th>
              <th className="px-3 py-2">창고</th>
              <th className="px-3 py-2">입고일</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {lots
              .filter((l) => l.material.startsWith("FG-"))
              .sort((a, b) => (a.date < b.date ? -1 : 1))
              .map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-mono">{l.code}</td>
                  <td className="px-3 py-2">{l.material} — {mats.find((m) => m.code === l.material)?.name ?? ""}</td>
                  <td className="px-3 py-2 text-right">{l.qty.toLocaleString()}</td>
                  <td className="px-3 py-2 text-sub">{l.wh}</td>
                  <td className="px-3 py-2 text-sub">{l.date}</td>
                  <td className={`px-3 py-2 font-semibold ${l.status === "가용" ? "text-emerald-500" : "text-red-500"}`}>{l.status}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
