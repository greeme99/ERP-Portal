// SCM-001 수요예측 — FG별 월별 예측vs실적, MAPE·정확도, MPS 반영
import { materialStore } from "../../data/mock/master";
import { mpsStore } from "../../data/mock/production";
import { forecastStore, mape, accuracy, CURRENT_MONTH } from "../../data/mock/scm";
import { useStore, downloadCsv } from "../../services/store";

const MONTHS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];

export default function DemandForecast() {
  const rows = useStore(forecastStore);
  const mats = useStore(materialStore);
  const mps = useStore(mpsStore);

  const fgs = [...new Set(rows.map((r) => r.material))];
  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;

  const editForecast = (id: string, v: number) => forecastStore.update(id, { forecast: v });

  // 당월(07) 예측을 MPS 예측 필드에 반영
  const pushToMps = (material: string) => {
    const f = rows.find((r) => r.material === material && r.month === CURRENT_MONTH);
    const plan = mps.find((p) => p.material === material);
    if (f && plan) {
      mpsStore.update(plan.id, { forecast: f.forecast });
      alert(`${material} 2026-07 예측 ${f.forecast.toLocaleString()} → MPS 반영 완료`);
    }
  };

  const excel = () =>
    downloadCsv("수요예측.csv", ["품목", ...MONTHS, "MAPE%", "정확도%"],
      fgs.map((fg) => {
        const fr = rows.filter((r) => r.material === fg);
        const m = mape(fr as any);
        return [fg, ...MONTHS.map((mo) => {
          const r = fr.find((x) => x.month === mo);
          return r ? `${r.forecast}/${r.actual || "-"}` : "-";
        }), m?.toFixed(1) ?? "-", accuracy(m)?.toFixed(1) ?? "-"];
      }));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">02. SCM (Supply Chain)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">수요예측 (SCM-001)</h1>
          <span className="text-[11px] text-sub">월별 예측 vs 실적 · MAPE 정확도 · MPS 반영</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-2 text-[11px] text-sub">
        <span>각 셀: <b>예측 / 실적</b> (실적 0=미확정) · MAPE = 평균 절대 오차율(실적월만) · 정확도 = 100−MAPE</span>
        <button onClick={excel} className="ml-auto px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">품목</th>
              {MONTHS.map((m) => (
                <th key={m} className={`px-3 py-2 text-right ${m === CURRENT_MONTH ? "text-accent" : ""}`}>{m.slice(5)}{m === CURRENT_MONTH && " ▸"}</th>
              ))}
              <th className="px-3 py-2 text-right">MAPE</th>
              <th className="px-3 py-2 text-right">정확도</th>
              <th className="px-3 py-2">MPS</th>
            </tr>
          </thead>
          <tbody>
            {fgs.map((fg) => {
              const fr = rows.filter((r) => r.material === fg);
              const m = mape(fr as any);
              const acc = accuracy(m);
              return (
                <tr key={fg} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2">{fg} — {matName(fg)}</td>
                  {MONTHS.map((mo) => {
                    const r = fr.find((x) => x.month === mo);
                    const future = r && r.actual === 0;
                    return (
                      <td key={mo} className="px-3 py-2 text-right">
                        {r ? (
                          <div>
                            {future ? (
                              <input type="number" value={r.forecast} onChange={(e) => editForecast(r.id, Number(e.target.value))}
                                className="w-16 px-1 py-0.5 rounded border border-line bg-surface text-[11px] text-right text-ink" />
                            ) : (
                              <span>{r.forecast.toLocaleString()}</span>
                            )}
                            <div className="text-[10px] text-sub">{r.actual > 0 ? r.actual.toLocaleString() : "—"}</div>
                          </div>
                        ) : "-"}
                      </td>
                    );
                  })}
                  <td className={`px-3 py-2 text-right font-semibold ${m === null ? "text-sub" : m > 10 ? "text-red-500" : m > 5 ? "text-amber-500" : "text-emerald-500"}`}>
                    {m !== null ? `${m.toFixed(1)}%` : "-"}
                  </td>
                  <td className={`px-3 py-2 text-right font-bold ${acc === null ? "text-sub" : acc < 90 ? "text-amber-500" : "text-emerald-500"}`}>
                    {acc !== null ? `${acc.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => pushToMps(fg)} className="px-2 py-0.5 rounded bg-accent text-white text-[10px] font-semibold">↑ MPS 반영</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line">
          미래월(실적 —) 예측은 직접 수정 가능 · "MPS 반영"으로 당월 예측을 생산계획에 전달
        </div>
      </div>
    </div>
  );
}
