// QM-007 공정능력분석 (Cpk) — 중요 공정 치수·스펙 상/하한(USL/LSL)·Cp 및 Cpk 공정능력지수 산출
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ProcessCapabilityItem {
  id: string;
  processCode: string;
  processName: string;
  parameterName: string; // 측정 인자 (예: 샤프트 외경, 모터 저항)
  lsl: number; // 스펙 하한
  usl: number; // 스펙 상한
  mean: number; // 측정 평균치
  sigma: number; // 표준편차 (σ)
  cp: number; // 공정능력지수 Cp
  cpk: number; // 공정능력지수 Cpk
  judgment: "우수 (Cpk≥1.67)" | "양호 (1.33≤Cpk<1.67)" | "부족 (Cpk<1.33)";
  sampleSize: number;
  measuredAt: string;
}

export const processCapabilityStore = createStore("qm.process_capability", [
  { id: "CPK-01", processCode: "PRC-A01", processName: "사출 성형 공정 A라인", parameterName: "청소기 상부 케이스 두께 (mm)", lsl: 2.30, usl: 2.70, mean: 2.51, sigma: 0.038, cp: 1.75, cpk: 1.67, judgment: "우수 (Cpk≥1.67)", sampleSize: 100, measuredAt: "2026-07-25" },
  { id: "CPK-02", processCode: "PRC-B02", processName: "SMT 칩마운팅 B라인", parameterName: "저항 칩 탑재 위치 오차 (μm)", lsl: -15.0, usl: 15.0, mean: 1.20, sigma: 2.85, cp: 1.75, cpk: 1.61, judgment: "양호 (1.33≤Cpk<1.67)", sampleSize: 150, measuredAt: "2026-07-29" },
  { id: "CPK-03", processCode: "PRC-C01", processName: "BLDC 모터 조립 C라인", parameterName: "샤프트 조립 동축도 (mm)", lsl: 0.00, usl: 0.05, mean: 0.032, sigma: 0.008, cp: 1.04, cpk: 0.75, judgment: "부족 (Cpk<1.33)", sampleSize: 80, measuredAt: "2026-08-03" },
]);

export default function ProcessCapability() {
  const list = useStore(processCapabilityStore) as ProcessCapabilityItem[];
  const [judgFilter, setJudgFilter] = useState("전체");

  const filtered = list.filter((i) => judgFilter === "전체" || i.judgment.includes(judgFilter));

  const avgCpk = (list.reduce((acc, i) => acc + i.cpk, 0) / list.length).toFixed(2);
  const excellentCount = list.filter((i) => i.cpk >= 1.67).length;
  const deficientCount = list.filter((i) => i.cpk < 1.33).length;

  const excel = () =>
    downloadCsv(
      "품질_공정능력지수_Cpk_대장.csv",
      ["공정코드", "공정명", "측정인자", "하한(LSL)", "상한(USL)", "평균(Mean)", "표준편차(σ)", "Cp", "Cpk", "판정", "샘플수", "측정일자"],
      filtered.map((i) => [
        i.processCode,
        i.processName,
        i.parameterName,
        i.lsl,
        i.usl,
        i.mean,
        i.sigma,
        i.cp,
        i.cpk,
        i.judgment,
        i.sampleSize,
        i.measuredAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. Quality Management (품질관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공정능력분석 Cpk (QM-007)</h1>
          <span className="text-[11px] text-sub">핵심 치수/스펙 규격(LSL/USL) · Cp & Cpk 공정능력지수 실시간 산출</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 평균 Cpk 지수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{avgCpk}</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">우수 공정 (Cpk ≥ 1.67)</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{excellentCount} <span className="text-xs font-normal text-ink">공정</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">개선 필요 공정 (Cpk &lt; 1.33)</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{deficientCount} <span className="text-xs font-normal text-ink">공정</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">판정:</span>
          {["전체", "우수", "양호", "부족"].map((jd) => (
            <button
              key={jd}
              onClick={() => setJudgFilter(jd)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                judgFilter === jd
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {jd}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 Cpk 공정능력대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">공정코드 / 명</th>
              <th className="px-3 py-2">측정 인자</th>
              <th className="px-3 py-2 text-right">LSL ~ USL (규격)</th>
              <th className="px-3 py-2 text-right">평균 (Mean)</th>
              <th className="px-3 py-2 text-right">표준편차 (σ)</th>
              <th className="px-3 py-2 text-right">Cp</th>
              <th className="px-3 py-2 text-right">Cpk</th>
              <th className="px-3 py-2">판정</th>
              <th className="px-3 py-2">측정일자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{i.processCode} — {i.processName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.parameterName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.lsl} ~ {i.usl}</td>
                <td className="px-3 py-2 text-right font-mono">{i.mean}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.sigma}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.cp.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.cpk.toFixed(2)}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.cpk >= 1.67 ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    i.cpk >= 1.33 ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {i.judgment}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.measuredAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
