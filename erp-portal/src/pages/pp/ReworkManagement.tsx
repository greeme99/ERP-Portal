// PP-010 재작업관리 — 부적합 발생품 재작업 지시·투입/양품회수 수량·재작업 공수 및 수율 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ReworkOrder {
  id: string;
  reworkNo: string; // 재작업 지시번호
  originWoNo: string; // 원 작업지시번호
  materialCode: string;
  materialName: string;
  inputQty: number; // 재작업 투입 수량
  recoveredQty: number; // 회속 양품 수량
  scrappedQty: number; // 최종 폐기 수량
  reworkYield: number; // 회수 수율 (%)
  reworkManHours: number; // 재작업 공수 (시간)
  status: "재작업중" | "완료" | "대기";
  reworkedAt: string;
}

export const reworkOrderStore = createStore("pp.rework_order", [
  { id: "RW-01", reworkNo: "RWK-2026-001", originWoNo: "WO-2026-0701", materialCode: "FG-1001", materialName: "소형가전 무선청소기", inputQty: 10, recoveredQty: 8, scrappedQty: 2, reworkYield: 80.0, reworkManHours: 4.5, status: "완료", reworkedAt: "2026-07-29" },
  { id: "RW-02", reworkNo: "RWK-2026-002", originWoNo: "WO-2026-0702", materialCode: "SF-2001", materialName: "메인 제어 PCB 모듈", inputQty: 15, recoveredQty: 12, scrappedQty: 3, reworkYield: 80.0, reworkManHours: 6.0, status: "재작업중", reworkedAt: "2026-08-02" },
  { id: "RW-03", reworkNo: "RWK-2026-003", originWoNo: "WO-2026-0801", materialCode: "FG-1002", materialName: "스마트 무선 로봇청소기", inputQty: 8, recoveredQty: 7, scrappedQty: 1, reworkYield: 87.5, reworkManHours: 3.0, status: "대기", reworkedAt: "2026-08-04" },
]);

export default function ReworkManagement() {
  const reworks = useStore(reworkOrderStore) as ReworkOrder[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = reworks.filter((r) => statusFilter === "전체" || r.status === statusFilter);

  const totalInput = filtered.reduce((acc, r) => acc + r.inputQty, 0);
  const totalRecovered = filtered.reduce((acc, r) => acc + r.recoveredQty, 0);
  const avgYield = totalInput > 0 ? ((totalRecovered / totalInput) * 100).toFixed(1) : "0.0";

  const excel = () =>
    downloadCsv(
      "생산_재작업_지시대장.csv",
      ["재작업지시번호", "원작업지시번호", "품목코드", "품목명", "투입수량", "회수양품", "최종폐기", "수율(%)", "투입공수(시간)", "상태", "처리일자"],
      filtered.map((r) => [
        r.reworkNo,
        r.originWoNo,
        r.materialCode,
        r.materialName,
        r.inputQty,
        r.recoveredQty,
        r.scrappedQty,
        `${r.reworkYield}%`,
        r.reworkManHours,
        r.status,
        r.reworkedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. Production Management (생산관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">재작업관리 (PP-010)</h1>
          <span className="text-[11px] text-sub">부적합품 재작업 지시 · 양품 회수율 · 최종 폐기 및 재작업 공수 집계</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 재작업 투입 수량</div>
          <div className="text-xl font-bold mt-1 font-mono">{totalInput} <span className="text-xs font-normal">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">회수 양품 수량</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{totalRecovered} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 재작업 회수 수율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgYield}%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "재작업중", "완료", "대기"].map((st) => (
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
          📥 재작업대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">재작업 지시번호</th>
              <th className="px-3 py-2">원 작업지시번호</th>
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2 text-right">투입 수량</th>
              <th className="px-3 py-2 text-right">회수 양품</th>
              <th className="px-3 py-2 text-right">최종 폐기</th>
              <th className="px-3 py-2 text-right">회수 수율</th>
              <th className="px-3 py-2 text-right">재작업 공수</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{r.reworkNo}</td>
                <td className="px-3 py-2 font-mono text-sub">{r.originWoNo}</td>
                <td className="px-3 py-2">{r.materialCode} — {r.materialName}</td>
                <td className="px-3 py-2 text-right font-mono font-medium">{r.inputQty} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{r.recoveredQty} EA</td>
                <td className="px-3 py-2 text-right font-mono text-red-500 font-medium">{r.scrappedQty} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{r.reworkYield.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{r.reworkManHours}시간</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.status === "완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    r.status === "재작업중" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}>
                    {r.status}
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
