// QM-005 검사분석 (Inspection Analytics) — 수입·공정·출하 검사 종합 불량율/PPM·불량 유형 Pareto 통계 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface InspectionAnalyticItem {
  id: string;
  inspectionType: "수입검사(IQC)" | "공정검사(LQC)" | "출하검사(OQC)";
  period: string;
  totalInspectedQty: number; // 총 검사 수량
  passedQty: number; // 합격 수량
  defectQty: number; // 불량 수량
  defectPpm: number; // 불량률 PPM
  topDefectReason: string; // 최다 발생 불량 사유 (예: SMT 납땜 미달, 외관 흠집)
  passRatePct: number; // 합격률 (%)
}

export const inspectionAnalyticsStore = createStore("qm.inspection_analytics", [
  { id: "QMA-01", inspectionType: "수입검사(IQC)", period: "2026-07", totalInspectedQty: 7800, passedQty: 7800, defectQty: 0, defectPpm: 0, topDefectReason: "불량 없음 (전량 합격)", passRatePct: 100.0 },
  { id: "QMA-02", inspectionType: "공정검사(LQC)", period: "2026-07", totalInspectedQty: 500, passedQty: 490, defectQty: 10, defectPpm: 20000, topDefectReason: "모터 하우징 유격 조립 불량 (10건)", passRatePct: 98.0 },
  { id: "QMA-03", inspectionType: "출하검사(OQC)", period: "2026-07", totalInspectedQty: 400, passedQty: 400, defectQty: 0, defectPpm: 0, topDefectReason: "불량 없음 (출하 합격)", passRatePct: 100.0 },
]);

export default function InspectionAnalytics() {
  const items = useStore(inspectionAnalyticsStore) as InspectionAnalyticItem[];
  const [typeFilter, setTypeFilter] = useState("전체");

  const filtered = items.filter((i) => typeFilter === "전체" || i.inspectionType.includes(typeFilter));

  const totalInspected = filtered.reduce((acc, i) => acc + i.totalInspectedQty, 0);
  const totalDefect = filtered.reduce((acc, i) => acc + i.defectQty, 0);
  const overallPpm = totalInspected > 0 ? Math.round((totalDefect / totalInspected) * 1000000) : 0;

  const excel = () =>
    downloadCsv(
      "품질_종합_검사분석_대장.csv",
      ["검사유형", "기준월", "총검사수량", "합격수량", "불량수량", "불량PPM", "최다불량원인", "합격률(%)"],
      filtered.map((i) => [
        i.inspectionType,
        i.period,
        i.totalInspectedQty,
        i.passedQty,
        i.defectQty,
        i.defectPpm,
        i.topDefectReason,
        `${i.passRatePct}%`,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. Quality Management (품질관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">검사분석 (QM-005)</h1>
          <span className="text-[11px] text-sub">수입 · 공정 · 출하 검사 종합 불량률/PPM 현황 및 불량 원인 파레토 통계</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 검사 수량</div>
          <div className="text-xl font-bold mt-1 font-mono">{totalInspected.toLocaleString()} <span className="text-xs font-normal">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">종합 품질 불량률 PPM</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{overallPpm.toLocaleString()} <span className="text-xs font-normal text-ink">PPM</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">종합 품질 합격률</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {totalInspected > 0 ? (((totalInspected - totalDefect) / totalInspected) * 100).toFixed(2) : "100.00"}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">검사유형:</span>
          {["전체", "수입검사", "공정검사", "출하검사"].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                typeFilter === tp
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 검사분석 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">검사 유형</th>
              <th className="px-3 py-2">기준월</th>
              <th className="px-3 py-2 text-right">총 검사수량</th>
              <th className="px-3 py-2 text-right">합격 수량</th>
              <th className="px-3 py-2 text-right">불량 수량</th>
              <th className="px-3 py-2 text-right">불량 PPM</th>
              <th className="px-3 py-2">최다 불량 원인 사유</th>
              <th className="px-3 py-2 text-right">합격률</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-bold">{i.inspectionType}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.period}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.totalInspectedQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.passedQty.toLocaleString()} EA</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.defectQty > 0 ? "text-red-500" : "text-sub"}`}>{i.defectQty} EA</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.defectPpm > 0 ? "text-red-500" : "text-sub"}`}>{i.defectPpm.toLocaleString()} PPM</td>
                <td className="px-3 py-2 text-ink text-[11px] font-medium">{i.topDefectReason}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.passRatePct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
