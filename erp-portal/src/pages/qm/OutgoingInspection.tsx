// QM-004 출하검사 (OQC) — 완제품 출하 전 품질 판정·AQL 샘플링 검사 및 검사성적서 발행
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface OutgoingInsp {
  id: string;
  lotNo: string;
  materialCode: string;
  materialName: string;
  customerName: string;
  lotQty: number; // LOT 총 수량
  sampleQty: number; // 샘플링 수량
  defectQty: number; // 불량 수량
  aqlLevel: string; // AQL 기준 (예: AQL 0.65 Level II)
  judgment: "합격" | "불합격" | "재검사대기";
  inspector: string;
  inspectedAt: string;
}

export const outgoingInspStore = createStore("qm.outgoing_insp", [
  { id: "OQC-01", lotNo: "LOT-2607-001", materialCode: "FG-1001", materialName: "소형가전 무선청소기", customerName: "삼성전자 글로벌", lotQty: 500, sampleQty: 80, defectQty: 0, aqlLevel: "AQL 0.65 Level II", judgment: "합격", inspector: "김품질", inspectedAt: "2026-07-29" },
  { id: "OQC-02", lotNo: "LOT-2607-002", materialCode: "FG-1002", materialName: "스마트 무선 로봇청소기", customerName: "LG전자", lotQty: 300, sampleQty: 50, defectQty: 1, aqlLevel: "AQL 0.65 Level II", judgment: "합격", inspector: "이검사", inspectedAt: "2026-07-30" },
  { id: "OQC-03", lotNo: "LOT-2608-001", materialCode: "FG-2001", materialName: "전자기판 컨트롤러 모듈", customerName: "쿠쿠전자", lotQty: 1000, sampleQty: 125, defectQty: 4, aqlLevel: "AQL 0.40 Level II", judgment: "불합격", inspector: "박품질", inspectedAt: "2026-08-01" },
  { id: "OQC-04", lotNo: "LOT-2608-002", materialCode: "FG-1001", materialName: "소형가전 무선청소기", customerName: "한일전기", lotQty: 400, sampleQty: 50, defectQty: 0, aqlLevel: "AQL 0.65 Level II", judgment: "합격", inspector: "최신뢰", inspectedAt: "2026-08-03" },
]);

export default function OutgoingInspection() {
  const list = useStore(outgoingInspStore) as OutgoingInsp[];
  const [filterResult, setFilterResult] = useState("전체");

  const filtered = list.filter((i) => filterResult === "전체" || i.judgment === filterResult);

  const passRate = ((list.filter((i) => i.judgment === "합격").length / list.length) * 100).toFixed(1);
  const totalSample = list.reduce((acc, i) => acc + i.sampleQty, 0);
  const totalDefect = list.reduce((acc, i) => acc + i.defectQty, 0);
  const ppm = Math.round((totalDefect / totalSample) * 1000000);

  const excel = () =>
    downloadCsv(
      "출하검사_OQC_대장.csv",
      ["검사ID", "LOT 번호", "품목코드", "품목명", "고객사", "LOT수량", "샘플수량", "불량수량", "AQL기준", "판정", "검사자", "검사일자"],
      filtered.map((i) => [
        i.id,
        i.lotNo,
        i.materialCode,
        i.materialName,
        i.customerName,
        i.lotQty,
        i.sampleQty,
        i.defectQty,
        i.aqlLevel,
        i.judgment,
        i.inspector,
        i.inspectedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. Quality Management (품질관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">출하검사 (QM-004)</h1>
          <span className="text-[11px] text-sub">OQC 최종 제품 검사 · AQL 샘플링 · 출하 검사성적서</span>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">출하검사 합격률</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{passRate}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">샘플링 불량률 (PPM)</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{ppm.toLocaleString()} <span className="text-xs font-normal text-ink">PPM</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 검사 완료 LOT</div>
          <div className="text-xl font-bold mt-1 font-mono">{list.length} <span className="text-xs font-normal">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">판정 필터:</span>
          {["전체", "합격", "불합격", "재검사대기"].map((res) => (
            <button
              key={res}
              onClick={() => setFilterResult(res)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterResult === res
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {res}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 OQC 검사성적서 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">LOT 번호</th>
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2">고객사</th>
              <th className="px-3 py-2 text-right">LOT 수량</th>
              <th className="px-3 py-2 text-right">샘플 / 불량</th>
              <th className="px-3 py-2">AQL 기준</th>
              <th className="px-3 py-2">판정</th>
              <th className="px-3 py-2">검사자</th>
              <th className="px-3 py-2">검사일자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{i.lotNo}</td>
                <td className="px-3 py-2">{i.materialCode} — {i.materialName}</td>
                <td className="px-3 py-2 text-sub">{i.customerName}</td>
                <td className="px-3 py-2 text-right font-mono">{i.lotQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono">
                  {i.sampleQty} / <span className={i.defectQty > 0 ? "text-red-500 font-bold" : ""}>{i.defectQty}</span>
                </td>
                <td className="px-3 py-2 text-sub text-[11px]">{i.aqlLevel}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.judgment === "합격" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {i.judgment}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub">{i.inspector}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.inspectedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
