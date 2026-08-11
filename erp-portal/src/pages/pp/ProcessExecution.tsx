// PP-007 공정실적 — 라인별 공정 진척 현황·양품/불량 실적 및 OEE 설비가동률 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ProcessProgress {
  id: string;
  woNo: string;
  lineName: string;
  processName: "사출공정" | "SMT공정" | "조립공정" | "포장공정";
  planQty: number;
  goodQty: number;
  defectQty: number;
  progressRate: number; // %
  oeeRate: number; // 설비 종합 가동률 (%)
  status: "진행중" | "완료" | "대기";
  updatedAt: string;
}

export const processProgressStore = createStore("pp.process_progress", [
  { id: "PRC-01", woNo: "WO-2026-0701", lineName: "A라인 (소형가전)", processName: "조립공정", planQty: 500, goodQty: 490, defectQty: 10, progressRate: 100.0, oeeRate: 92.5, status: "완료", updatedAt: "2026-07-28" },
  { id: "PRC-02", woNo: "WO-2026-0702", lineName: "B라인 (로봇청소기)", processName: "SMT공정", planQty: 300, goodQty: 240, defectQty: 4, progressRate: 81.3, oeeRate: 88.0, status: "진행중", updatedAt: "2026-08-02" },
  { id: "PRC-03", woNo: "WO-2026-0801", lineName: "C라인 (전자기판)", processName: "사출공정", planQty: 1000, goodQty: 750, defectQty: 15, progressRate: 76.5, oeeRate: 94.2, status: "진행중", updatedAt: "2026-08-04" },
  { id: "PRC-04", woNo: "WO-2026-0802", lineName: "A라인 (소형가전)", processName: "포장공정", planQty: 400, goodQty: 0, defectQty: 0, progressRate: 0.0, oeeRate: 0.0, status: "대기", updatedAt: "2026-08-05" },
]);

export default function ProcessExecution() {
  const list = useStore(processProgressStore) as ProcessProgress[];
  const [procFilter, setProcFilter] = useState("전체");

  const filtered = list.filter((p) => procFilter === "전체" || p.processName === procFilter);

  const totalGood = filtered.reduce((acc, p) => acc + p.goodQty, 0);
  const totalDefect = filtered.reduce((acc, p) => acc + p.defectQty, 0);
  const avgOee = (filtered.filter((p) => p.oeeRate > 0).reduce((acc, p) => acc + p.oeeRate, 0) / (filtered.filter((p) => p.oeeRate > 0).length || 1)).toFixed(1);

  const excel = () =>
    downloadCsv(
      "생산_공정실적_진척대장.csv",
      ["작업지시번호", "라인명", "공정명", "계획수량", "양품실적", "불량실적", "진척률(%)", "OEE가동률(%)", "상태", "수정일자"],
      filtered.map((p) => [
        p.woNo,
        p.lineName,
        p.processName,
        p.planQty,
        p.goodQty,
        p.defectQty,
        `${p.progressRate}%`,
        `${p.oeeRate}%`,
        p.status,
        p.updatedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. Production Management (생산관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공정실적관리 (PP-007)</h1>
          <span className="text-[11px] text-sub">라인별/공정별 실시간 진척율 · 양품 및 불량 집계 · 설비 종합 가동률(OEE)</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 양품 생산 실적</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{totalGood.toLocaleString()} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">공정 불량 수량</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{totalDefect.toLocaleString()} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 OEE 가동률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgOee}%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">공정:</span>
          {["전체", "사출공정", "SMT공정", "조립공정", "포장공정"].map((pr) => (
            <button
              key={pr}
              onClick={() => setProcFilter(pr)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                procFilter === pr
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {pr}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 공정실적 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">작업지시번호</th>
              <th className="px-3 py-2">라인명</th>
              <th className="px-3 py-2">공정명</th>
              <th className="px-3 py-2 text-right">계획수량</th>
              <th className="px-3 py-2 text-right">양품 / 불량</th>
              <th className="px-3 py-2 text-right">진척률</th>
              <th className="px-3 py-2 text-right">OEE 가동률</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{p.woNo}</td>
                <td className="px-3 py-2">{p.lineName}</td>
                <td className="px-3 py-2 text-sub font-medium">{p.processName}</td>
                <td className="px-3 py-2 text-right font-mono">{p.planQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono">
                  <span className="text-emerald-600 font-bold">{p.goodQty}</span> / <span className={p.defectQty > 0 ? "text-red-500 font-bold" : ""}>{p.defectQty}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{p.progressRate.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{p.oeeRate > 0 ? `${p.oeeRate.toFixed(1)}%` : "-"}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status === "완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    p.status === "진행중" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
