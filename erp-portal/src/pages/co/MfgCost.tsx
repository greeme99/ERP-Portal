// CO-001 제조원가 — 재료비/노무비/간접비 구성, 표준 vs 실제(수율), 차이분석
import { materialStore, bomStore } from "../../data/mock/master";
import { woStore } from "../../data/mock/production";
import { stdCost, costBreakdown, OVERHEAD_RATE } from "../../data/mock/finance";
import { useStore } from "../../services/store";

export default function MfgCost() {
  const mats = useStore(materialStore);
  const boms = useStore(bomStore);
  const wos = useStore(woStore);

  const products = mats.filter((m) => m.type === "완제품" || m.type === "반제품");

  const rows = products.map((p) => {
    const bd = costBreakdown(p.code, mats, boms);
    const std = stdCost(p.code, mats, boms);
    const done = wos.filter((w) => w.material === p.code && w.status === "완료");
    const totalIn = done.reduce((s, w) => s + w.good + w.defect, 0);
    const totalGood = done.reduce((s, w) => s + w.good, 0);
    const actual = totalGood > 0 ? (std * totalIn) / totalGood : null;
    const variance = actual !== null ? actual - std : null;
    const sell = p.type === "완제품" ? p.price : null;
    return { code: p.code, name: p.name, type: p.type, bd, std, actual, variance, sell };
  });

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. 관리회계 (Controlling)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">제조원가 (CO-001)</h1>
          <span className="text-[11px] text-sub">재료비+노무비+간접비({OVERHEAD_RATE * 100}%) 구성 · 수율 반영 실제원가</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 text-[11px] text-sub">
        표준원가 = (재료비[하위 BOM 롤업] + 노무비[가공·조립]) × (1 + 간접비 {OVERHEAD_RATE * 100}%) |
        실제원가 = 표준 × (투입 ÷ 양품) — 완료 WO 수율 기준
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">재료비</th>
              <th className="px-3 py-2 text-right">노무비</th>
              <th className="px-3 py-2 text-right">간접비</th>
              <th className="px-3 py-2 text-right">표준원가</th>
              <th className="px-3 py-2 text-right">실제원가</th>
              <th className="px-3 py-2 text-right">차이</th>
              <th className="px-3 py-2 text-right">판매가</th>
              <th className="px-3 py-2 text-right">마진율</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const marginPct = r.sell ? ((r.sell - r.std) / r.sell) * 100 : null;
              return (
                <tr key={r.code} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2">{r.code} — {r.name}<span className="text-sub text-[10px] ml-1">{r.type}</span></td>
                  <td className="px-3 py-2 text-right">{Math.round(r.bd.matCost).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{Math.round(r.bd.labor).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-sub">{Math.round(r.bd.overhead).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-bold">{Math.round(r.std).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    {r.actual !== null ? Math.round(r.actual).toLocaleString() : <span className="text-sub">-</span>}
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold ${r.variance === null ? "text-sub" : r.variance > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {r.variance !== null ? `${r.variance > 0 ? "+" : ""}${Math.round(r.variance).toLocaleString()}` : "-"}
                  </td>
                  <td className="px-3 py-2 text-right text-sub">{r.sell ? r.sell.toLocaleString() : "-"}</td>
                  <td className={`px-3 py-2 text-right font-bold ${marginPct === null ? "text-sub" : marginPct < 20 ? "text-red-500" : marginPct > 50 ? "text-amber-500" : "text-emerald-500"}`}>
                    {marginPct !== null ? `${marginPct.toFixed(1)}%` : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line">
          마진율 정상범위 20~50% (미만 적색, 초과 황색 — 원가 검증 필요) | 차이(+) = 수율 손실
        </div>
      </div>
    </div>
  );
}
