// LE-001 입고관리 — PO 연계 입고 → LOT 생성 + 재고 증가
import { materialStore } from "../../data/mock/master";
import { poStore } from "../../data/mock/procurement";
import { lotStore, txStore, newLotCode, TX_STYLE } from "../../data/mock/logistics";
import { useStore, nextId } from "../../services/store";

const TODAY = "2026-07-03";

export default function GoodsReceipt() {
  const pos = useStore(poStore);
  const txs = useStore(txStore);
  const mats = useStore(materialStore);

  const openPos = pos.filter((o) => o.status === "발주");

  const receive = (po: any) => {
    if (!confirm(`${po.code} — ${po.material} ${po.qty.toLocaleString()}개를 입고 처리할까요?\n(수입검사 합격 가정, WH-102 원자재창고)`)) return;
    const lot = newLotCode();
    // 1) LOT 생성
    lotStore.create({ id: lot, code: lot, material: po.material, qty: po.qty, wh: "WH-102", vendor: po.vendor, date: TODAY, status: "가용" });
    // 2) 재고 증가
    const mat = mats.find((m) => m.code === po.material);
    if (mat) materialStore.update(mat.id, { stock: mat.stock + po.qty });
    // 3) 트랜잭션 기록 + PO 마감
    txStore.create({ id: nextId("TX"), type: "입고", material: po.material, qty: po.qty, from: po.vendor, to: "WH-102", lot, date: TODAY, ref: po.code });
    poStore.update(po.id, { status: "입고완료" });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">04. 물류관리 (Logistics)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">입고관리 (LE-001)</h1>
          <span className="text-[11px] text-sub">PO 연계 · LOT 자동 생성 · 재고 반영</span>
        </div>
      </div>

      {/* 입고 대기 PO */}
      <div className="bg-panel border border-line rounded-lg">
        <div className="px-4 py-2.5 border-b border-line font-semibold">📦 입고 대기 PO ({openPos.length}건)</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">PO번호</th>
              <th className="px-3 py-2">공급사</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2">납기일</th>
              <th className="px-3 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {openPos.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{o.code}</td>
                <td className="px-3 py-2">{o.vendor}</td>
                <td className="px-3 py-2">{o.material} — {mats.find((m) => m.code === o.material)?.name ?? ""}</td>
                <td className="px-3 py-2 text-right">{o.qty.toLocaleString()}</td>
                <td className={`px-3 py-2 ${o.dueDate < TODAY ? "text-red-500 font-bold" : "text-sub"}`}>{o.dueDate}</td>
                <td className="px-3 py-2">
                  <button onClick={() => receive(o)} className="px-3 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold">✓ 입고</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {openPos.length === 0 && <div className="px-4 py-5 text-center text-sub text-[12px]">입고 대기 PO가 없습니다.</div>}
      </div>

      {/* 입고 이력 */}
      <div className="bg-panel border border-line rounded-lg">
        <div className="px-4 py-2.5 border-b border-line font-semibold">🧾 재고 트랜잭션 이력</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">일자</th>
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2">From → To</th>
              <th className="px-3 py-2">LOT</th>
              <th className="px-3 py-2">참조</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 text-sub">{t.date}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TX_STYLE[t.type] ?? ""}`}>{t.type}</span>
                </td>
                <td className="px-3 py-2">{t.material}</td>
                <td className="px-3 py-2 text-right">{t.qty.toLocaleString()}</td>
                <td className="px-3 py-2 text-sub">{t.from} → {t.to}</td>
                <td className="px-3 py-2 font-mono text-sub">{t.lot}</td>
                <td className="px-3 py-2 font-mono text-sub">{t.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
