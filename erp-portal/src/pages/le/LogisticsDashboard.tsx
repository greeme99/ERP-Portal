// LE-014 물류 Dashboard — 입출고·재고·LOT·창고 통합 현황
//
// 새 store 를 만들지 않는다. 물류 화면들이 이미 쓰는 store 를 그대로 집계한다.
import { Link } from "react-router-dom";
import { useStore } from "../../services/store";
import { lotStore, txStore } from "../../data/mock/logistics";
import { materialStore, warehouseStore } from "../../data/mock/master";
import { fmtEok } from "../../services/insights";

const card = "bg-panel border rounded-lg p-3 hover:border-accent";

export default function LogisticsDashboard() {
  const lots = useStore(lotStore);
  const txs = useStore(txStore);
  const mats = useStore(materialStore);
  const whs = useStore(warehouseStore);

  const inbound = txs.filter((t) => t.type === "입고");
  const outbound = txs.filter((t) => t.type === "출고");
  const moves = txs.filter((t) => t.type === "이동");
  const held = lots.filter((l) => l.status !== "가용");
  const belowSafety = mats.filter((m) => m.stock < m.safety);
  const invValue = mats.reduce((s, m) => s + m.stock * m.price, 0);

  // 창고별 LOT 수량 — 로케이션 단위 재고는 별도 화면(LE-009)에 있다.
  const byWh = whs.map((w) => {
    const rows = lots.filter((l) => l.wh === w.code);
    return {
      code: String(w.code),
      name: String(w.name ?? ""),
      lots: rows.length,
      qty: rows.reduce((s, l) => s + l.qty, 0),
      held: rows.filter((l) => l.status !== "가용").length,
    };
  });

  const CARDS = [
    { label: "입고 건", value: inbound.length, link: "/m/le/le-01", bad: false },
    { label: "출고 건", value: outbound.length, link: "/m/le/le-02", bad: false },
    { label: "재고이동", value: moves.length, link: "/m/le/le-04", bad: false },
    { label: "보류 LOT", value: held.length, link: "/m/le/le-05", bad: held.length > 0 },
    { label: "안전재고 미달", value: belowSafety.length, link: "/m/mdm/mdm-01", bad: belowSafety.length > 0 },
    { label: "재고자산", value: fmtEok(invValue), link: "/m/le/le-03", bad: false },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] text-sub">04. 물류관리 (Logistics Execution)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">물류 Dashboard</h1>
          <span className="text-[11px] text-sub">입출고·재고·LOT·창고 통합 현황</span>
        </div>
      </div>

      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
        {CARDS.map((c) => (
          <Link key={c.label} to={c.link} className={`${card} ${c.bad ? "border-red-300" : "border-line"}`}>
            <div className="text-[11px] text-sub">{c.label}</div>
            <div className={`text-xl font-bold mt-1 ${c.bad ? "text-red-500" : "text-emerald-500"}`}>{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* 창고별 재고 */}
        <div className="bg-panel border border-line rounded-lg overflow-x-auto">
          <div className="px-4 py-2.5 border-b border-line font-semibold">🏭 창고별 LOT 재고</div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-sub text-left">
                <th className="px-3 py-2">창고</th>
                <th className="px-3 py-2 text-right">LOT 수</th>
                <th className="px-3 py-2 text-right">수량</th>
                <th className="px-3 py-2 text-right">보류</th>
              </tr>
            </thead>
            <tbody>
              {byWh.map((w) => (
                <tr key={w.code} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2">{w.code} — {w.name}</td>
                  <td className="px-3 py-2 text-right font-mono">{w.lots}</td>
                  <td className="px-3 py-2 text-right font-mono">{w.qty.toLocaleString()}</td>
                  <td className={`px-3 py-2 text-right font-mono ${w.held > 0 ? "text-red-500 font-bold" : ""}`}>{w.held}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 안전재고 미달 */}
        <div className="bg-panel border border-line rounded-lg overflow-x-auto">
          <div className="px-4 py-2.5 border-b border-line font-semibold">⚠️ 안전재고 미달 ({belowSafety.length}건)</div>
          {belowSafety.length > 0 ? (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line text-sub text-left">
                  <th className="px-3 py-2">품목</th>
                  <th className="px-3 py-2 text-right">현재고</th>
                  <th className="px-3 py-2 text-right">안전재고</th>
                  <th className="px-3 py-2 text-right">부족</th>
                </tr>
              </thead>
              <tbody>
                {belowSafety.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                    <td className="px-3 py-2">{m.code} — {m.name}</td>
                    <td className="px-3 py-2 text-right font-mono">{m.stock.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono text-sub">{m.safety.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-red-500">
                      {(m.safety - m.stock).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-6 text-center text-emerald-500 text-[12px]">✓ 안전재고 미달 품목 없음</div>
          )}
        </div>
      </div>

      {/* 최근 수불 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line font-semibold">📦 최근 수불 내역</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">일자</th>
              <th className="px-3 py-2">구분</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2">From → To</th>
              <th className="px-3 py-2">LOT</th>
              <th className="px-3 py-2">참조</th>
            </tr>
          </thead>
          <tbody>
            {[...txs].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono text-[11px]">{t.date}</td>
                <td className="px-3 py-2">{t.type}</td>
                <td className="px-3 py-2">{t.material}</td>
                <td className="px-3 py-2 text-right font-mono">{t.qty.toLocaleString()}</td>
                <td className="px-3 py-2 text-sub">{t.from} → {t.to}</td>
                <td className="px-3 py-2 font-mono text-[11px]">{t.lot}</td>
                <td className="px-3 py-2 text-sub">{t.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
