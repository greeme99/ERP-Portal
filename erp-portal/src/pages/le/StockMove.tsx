// LE-004 재고이동 — 창고 간 이동 + 트랜잭션 이력
import { useState } from "react";
import { materialStore, warehouseStore } from "../../data/mock/master";
import { lotStore, txStore, TX_STYLE } from "../../data/mock/logistics";
import { useStore, nextId } from "../../services/store";

const TODAY = "2026-07-03";

export default function StockMove() {
  const mats = useStore(materialStore);
  const whs = useStore(warehouseStore).filter((w) => w.status === "사용");
  const lots = useStore(lotStore);
  const txs = useStore(txStore);
  const [form, setForm] = useState({ lot: "", qty: 0, to: "" });

  const availLots = lots.filter((l) => l.status === "가용" && l.qty > 0);
  const lot = availLots.find((l) => l.id === form.lot);

  const move = () => {
    if (!lot) return alert("이동할 LOT을 선택하세요.");
    if (!form.to) return alert("도착 창고를 선택하세요.");
    if (form.to === lot.wh) return alert("출발/도착 창고가 동일합니다.");
    if (form.qty <= 0 || form.qty > lot.qty) return alert(`이동수량은 1~${lot.qty.toLocaleString()} 범위여야 합니다.`);
    if (form.qty === lot.qty) {
      lotStore.update(lot.id, { wh: form.to });
    } else {
      // 부분 이동: 원 LOT 차감 + 신규 LOT 분할
      lotStore.update(lot.id, { qty: lot.qty - form.qty });
      const split = `${lot.code}-S`;
      lotStore.create({ id: nextId("LOT"), code: split, material: lot.material, qty: form.qty, wh: form.to, vendor: lot.vendor, date: TODAY, status: "가용" });
    }
    txStore.create({ id: nextId("TX"), type: "이동", material: lot.material, qty: form.qty, from: lot.wh, to: form.to, lot: lot.code, date: TODAY, ref: "-" });
    setForm({ lot: "", qty: 0, to: "" });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">04. 물류관리 (Logistics)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">재고이동 (LE-004)</h1>
          <span className="text-[11px] text-sub">창고 간 이동 · LOT 분할 지원</span>
        </div>
      </div>

      {/* 이동 지시 */}
      <div className="bg-panel border border-line rounded-lg p-3 flex flex-wrap items-end gap-3">
        <label className="text-[11px] text-sub">
          LOT 선택
          <select value={form.lot}
            onChange={(e) => {
              const l = availLots.find((x) => x.id === e.target.value);
              setForm({ lot: e.target.value, qty: l?.qty ?? 0, to: "" });
            }}
            className="block w-80 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
            <option value="">선택</option>
            {availLots.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} | {l.material} | {l.qty.toLocaleString()}개 @ {l.wh}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-sub">
          이동수량
          <input type="number" value={form.qty} max={lot?.qty ?? 0}
            onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
            className="block w-28 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
        </label>
        <label className="text-[11px] text-sub">
          도착 창고
          <select value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}
            className="block w-52 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
            <option value="">선택</option>
            {whs.filter((w) => w.code !== lot?.wh).map((w) => (
              <option key={w.code} value={w.code}>{w.code} — {w.name}</option>
            ))}
          </select>
        </label>
        <button onClick={move} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">↔ 이동 실행</button>
        {lot && (
          <span className="text-[11px] text-sub pb-2">
            {lot.material} — {mats.find((m) => m.code === lot.material)?.name ?? ""} | 출발: {lot.wh}
          </span>
        )}
      </div>

      {/* 이동 이력 */}
      <div className="bg-panel border border-line rounded-lg">
        <div className="px-4 py-2.5 border-b border-line font-semibold">🧾 이동 이력</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">일자</th>
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2">From → To</th>
              <th className="px-3 py-2">LOT</th>
            </tr>
          </thead>
          <tbody>
            {txs.filter((t) => t.type === "이동").map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 text-sub">{t.date}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TX_STYLE[t.type]}`}>{t.type}</span>
                </td>
                <td className="px-3 py-2">{t.material}</td>
                <td className="px-3 py-2 text-right">{t.qty.toLocaleString()}</td>
                <td className="px-3 py-2 text-sub">{t.from} → {t.to}</td>
                <td className="px-3 py-2 font-mono text-sub">{t.lot}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {txs.filter((t) => t.type === "이동").length === 0 && (
          <div className="px-4 py-5 text-center text-sub text-[12px]">이동 이력이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
