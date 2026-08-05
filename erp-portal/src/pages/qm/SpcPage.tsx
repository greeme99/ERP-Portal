// QM-002 SPC — X 관리도 + Cp/Cpk 공정능력분석
import { useState } from "react";
import { SPC_SERIES, spcStats } from "../../data/mock/quality";

const W = 720, H = 240, PAD = 40;

export default function SpcPage() {
  const [selId, setSelId] = useState(SPC_SERIES[0].id);
  const series = SPC_SERIES.find((s) => s.id === selId)!;
  const { mean, std, ucl, lcl, cp, cpk } = spcStats(series);

  const all = [...series.data, ucl, lcl, series.usl, series.lsl];
  const yMin = Math.min(...all) - std;
  const yMax = Math.max(...all) + std;
  const x = (i: number) => PAD + (i / (series.data.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - PAD * 2);

  const line = series.data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const violations = series.data.map((v, i) => ({ v, i })).filter((p) => p.v > ucl || p.v < lcl);
  const cpkOk = cpk >= 1.33;

  const refLine = (v: number, color: string, label: string, dash?: string) => (
    <g>
      <line x1={PAD} y1={y(v)} x2={W - PAD} y2={y(v)} stroke={color} strokeWidth="1" strokeDasharray={dash ?? "0"} />
      <text x={W - PAD + 4} y={y(v) + 3} fontSize="9" fill={color}>{label} {v.toFixed(2)}</text>
    </g>
  );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. 품질관리 (Quality)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">SPC 관리도 (QM-002)</h1>
          <span className="text-[11px] text-sub">X 관리도 · Cp/Cpk 공정능력분석</span>
        </div>
      </div>

      {/* 특성 선택 + KPI */}
      <div className="bg-panel border border-line rounded-lg p-3 flex flex-wrap items-center gap-3">
        <select value={selId} onChange={(e) => setSelId(e.target.value)}
          className="px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink w-72">
          {SPC_SERIES.map((s) => (
            <option key={s.id} value={s.id}>{s.process} — {s.name} ({s.unit})</option>
          ))}
        </select>
        <span className="text-[11px] text-sub">규격 {series.lsl} ~ {series.usl} {series.unit} | n={series.data.length}</span>
        {violations.length > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold">관리이탈 {violations.length}점</span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "평균 (X̄)", value: mean.toFixed(3), ok: true },
          { label: "표준편차 (σ)", value: std.toFixed(3), ok: true },
          { label: "Cp", value: cp.toFixed(2), ok: cp >= 1.33 },
          { label: "Cpk", value: cpk.toFixed(2), ok: cpkOk },
          { label: "판정", value: cpkOk ? "능력 충분" : cpk >= 1.0 ? "개선 필요" : "능력 부족", ok: cpkOk },
        ].map((k) => (
          <div key={k.label} className="bg-panel border border-line rounded-lg p-3">
            <div className="text-[11px] text-sub">{k.label}</div>
            <div className={`text-lg font-bold mt-1 ${k.ok ? "text-emerald-500" : "text-red-500"}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* 관리도 */}
      <div className="bg-panel border border-line rounded-lg p-4 overflow-x-auto">
        <div className="font-semibold text-[12px] mb-2">X 관리도 — {series.name} ({series.unit})</div>
        <svg viewBox={`0 0 ${W + 60} ${H}`} className="w-full min-w-[640px]">
          {/* 규격선 / 관리한계선 / 중심선 */}
          {refLine(series.usl, "#ef4444", "USL")}
          {refLine(series.lsl, "#ef4444", "LSL")}
          {refLine(ucl, "#f59e0b", "UCL", "4 3")}
          {refLine(lcl, "#f59e0b", "LCL", "4 3")}
          {refLine(mean, "#10b981", "CL", "2 2")}
          {/* 데이터 라인 */}
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
          {series.data.map((v, i) => {
            const out = v > ucl || v < lcl;
            return (
              <circle key={i} cx={x(i)} cy={y(v)} r={out ? 4 : 2.5}
                fill={out ? "#ef4444" : "var(--accent)"} stroke={out ? "#fff" : "none"} strokeWidth="1" />
            );
          })}
          {/* X축 라벨 */}
          {series.data.map((_, i) =>
            i % 4 === 0 ? (
              <text key={i} x={x(i)} y={H - PAD + 14} fontSize="8" fill="var(--sub)" textAnchor="middle">#{i + 1}</text>
            ) : null
          )}
        </svg>
        {violations.length > 0 ? (
          <div className="text-[11px] text-red-500 mt-1">
            ⚠️ 관리한계 이탈: {violations.map((p) => `#${p.i + 1} (${p.v})`).join(", ")} — 부적합관리(CAPA) 검토 필요
          </div>
        ) : (
          <div className="text-[11px] text-emerald-500 mt-1">✓ 전 측정점 관리한계 내 — 공정 안정</div>
        )}
      </div>
    </div>
  );
}
