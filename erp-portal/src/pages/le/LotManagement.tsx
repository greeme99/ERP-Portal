// LE-005 LOT 관리 — LOT 현황 + 이력 추적 (Traceability)
import { useState } from "react";
import { materialStore } from "../../data/mock/master";
import { lotStore, txStore, TX_STYLE } from "../../data/mock/logistics";
import { useStore, downloadCsv } from "../../services/store";

export default function LotManagement() {
  const lots = useStore(lotStore);
  const txs = useStore(txStore);
  const mats = useStore(materialStore);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  const filtered = lots.filter(
    (l) => q.trim() === "" || l.code.toLowerCase().includes(q.toLowerCase()) || l.material.toLowerCase().includes(q.toLowerCase())
  );
  const selLot = lots.find((l) => l.id === sel);
  const history = txs.filter((t) => t.lot === selLot?.code);

  const excel = () =>
    downloadCsv("LOT현황.csv", ["LOT", "품목", "잔량", "창고", "공급사", "입고일", "상태"],
      filtered.map((l) => [l.code, l.material, l.qty, l.wh, l.vendor, l.date, l.status]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">04. 물류관리 (Logistics)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">LOT 관리 (LE-005)</h1>
          <span className="text-[11px] text-sub">LOT 현황 · 이동 이력 추적</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 LOT/품목 검색"
          className="px-3 py-1.5 rounded border border-line bg-surface text-[12px] w-56 outline-none focus:border-accent" />
        <span className="text-[11px] text-sub">{filtered.length}건</span>
        <button onClick={excel} className="ml-auto px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* LOT 목록 */}
        <div className="bg-panel border border-line rounded-lg overflow-x-auto">
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
              {filtered.map((l) => (
                <tr key={l.id} onClick={() => setSel(l.id)}
                  className={`border-b border-line last:border-0 cursor-pointer hover:bg-accent-soft ${sel === l.id ? "bg-accent-soft" : ""}`}>
                  <td className="px-3 py-2 font-mono">{l.code}</td>
                  <td className="px-3 py-2">{l.material}</td>
                  <td className="px-3 py-2 text-right">{l.qty.toLocaleString()}</td>
                  <td className="px-3 py-2 text-sub">{l.wh}</td>
                  <td className="px-3 py-2 text-sub">{l.date}</td>
                  <td className={`px-3 py-2 font-semibold ${l.status === "가용" ? "text-emerald-500" : "text-red-500"}`}>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Traceability */}
        <div className="bg-panel border border-line rounded-lg">
          {selLot ? (
            <>
              <div className="px-4 py-2.5 border-b border-line">
                <span className="font-semibold">🔎 {selLot.code} 추적</span>
                <div className="text-[11px] text-sub mt-1">
                  {selLot.material} — {mats.find((m) => m.code === selLot.material)?.name ?? ""} | 공급사 {selLot.vendor} | 현재 {selLot.wh}
                </div>
              </div>
              {history.length > 0 ? (
                <ul className="p-4 space-y-2">
                  {history.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-[12px]">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TX_STYLE[t.type] ?? ""}`}>{t.type}</span>
                      <span className="text-sub">{t.date}</span>
                      <span>{t.qty.toLocaleString()}개</span>
                      <span className="text-sub">{t.from} → {t.to}</span>
                      <span className="font-mono text-sub ml-auto">{t.ref}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-sub text-[12px]">이 LOT의 트랜잭션 이력이 없습니다.</div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-sub text-[12px]">LOT을 선택하면 이력을 추적합니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
