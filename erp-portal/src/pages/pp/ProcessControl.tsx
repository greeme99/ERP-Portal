// PP-004 공정관리 (Process Control & Quality Monitoring) — 실시간 라인 공정별 투입량·양품량·공정 불량률 모니터링
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ProcessControlItem {
  id: string;
  lineCode: string;
  lineName: string;
  opSeqName: string; // 공정 단계명 (예: Op 10 사출, Op 20 SMT, Op 30 조립)
  inputQty: number; // 투입 수량
  goodQty: number; // 양품 수량
  defectQty: number; // 공정 불량 수량
  defectRatePct: number; // 공정 불량률 (%)
  lineStatus: "정상가동" | "불량발생" | "라인점검";
  updatedAt: string;
}

export const processControlStore = createStore("pp.process_control", [
  { id: "PC-01", lineCode: "LINE-PRESS-A", lineName: "A라인 프레스 공정", opSeqName: "Op 10 ABS 외관 프레스 사출", inputQty: 1200, goodQty: 1194, defectQty: 6, defectRatePct: 0.5, lineStatus: "정상가동", updatedAt: "2026-08-06 11:30" },
  { id: "PC-02", lineCode: "LINE-SMT-B", lineName: "B라인 자동 SMT 공정", opSeqName: "Op 20 PCB 부품 자매 실장", inputQty: 500, goodQty: 499, defectQty: 1, defectRatePct: 0.2, lineStatus: "정상가동", updatedAt: "2026-08-06 11:45" },
  { id: "PC-03", lineCode: "LINE-ASSY-A", lineName: "A라인 메인 조립 공정", opSeqName: "Op 30 모터/하우징 최종 수조립", inputQty: 500, goodQty: 490, defectQty: 10, defectRatePct: 2.0, lineStatus: "불량발생", updatedAt: "2026-08-06 12:00" },
]);

export default function ProcessControl() {
  const items = useStore(processControlStore) as ProcessControlItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.lineStatus === statusFilter);

  const totalInput = filtered.reduce((acc, i) => acc + i.inputQty, 0);
  const totalGood = filtered.reduce((acc, i) => acc + i.goodQty, 0);
  const totalDefect = filtered.reduce((acc, i) => acc + i.defectQty, 0);

  const excel = () =>
    downloadCsv(
      "생산_실시간_공정관리_대장.csv",
      ["라인코드", "라인명", "공정단계명", "투입수량", "양품수량", "불량수량", "불량률(%)", "가동상태", "수신일시"],
      filtered.map((i) => [
        i.lineCode,
        i.lineName,
        i.opSeqName,
        i.inputQty,
        i.goodQty,
        i.defectQty,
        `${i.defectRatePct}%`,
        i.lineStatus,
        i.updatedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. Production Planning (생산관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공정관리 (PP-004)</h1>
          <span className="text-[11px] text-sub">실시간 공정별 투입 · 양품 · 공정 불량률 모니터링 및 수율 추적</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 공정 투입 수량</div>
          <div className="text-xl font-bold mt-1 font-mono">{totalInput.toLocaleString()} <span className="text-xs font-normal">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">총 공정 양품 수량</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{totalGood.toLocaleString()} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">총 공정 불량 수량</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{totalDefect} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "정상가동", "불량발생"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === st
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 공정관리 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">라인 코드 / 명</th>
              <th className="px-3 py-2">공정 단계명</th>
              <th className="px-3 py-2 text-right">투입 수량</th>
              <th className="px-3 py-2 text-right">양품 수량</th>
              <th className="px-3 py-2 text-right">불량 수량</th>
              <th className="px-3 py-2 text-right">불량률</th>
              <th className="px-3 py-2">가동 상태</th>
              <th className="px-3 py-2">수신 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.lineCode} — {i.lineName}</td>
                <td className="px-3 py-2 text-ink font-semibold">{i.opSeqName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.inputQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.goodQty.toLocaleString()} EA</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.defectQty > 0 ? "text-red-500" : "text-sub"}`}>{i.defectQty} EA</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.defectRatePct > 1.0 ? "text-red-500" : "text-blue-600"}`}>{i.defectRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.lineStatus === "정상가동" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {i.lineStatus}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
