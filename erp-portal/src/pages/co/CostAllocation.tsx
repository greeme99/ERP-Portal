// CO-009 배부관리 — 원가센터별 간접비 배부 기준(작업시간/생산량/인건비) 설정 및 제조간접비 배부 집계
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface AllocationRule {
  id: string;
  costCenter: string;
  overheadType: string;
  totalPoolAmount: number; // 총 배부대상 간접비
  basis: "작업시간" | "생산량" | "직접노무비";
  targetLineA: number; // A라인 배부율(%)
  targetLineB: number; // B라인 배부율(%)
  status: "확정" | "시뮬레이션";
}

export const allocationStore = createStore("co.allocation", [
  { id: "AL-01", costCenter: "사출공정센터", overheadType: "설비감가상각비 & 전력비", totalPoolAmount: 45000000, basis: "작업시간", targetLineA: 60, targetLineB: 40, status: "확정" },
  { id: "AL-02", costCenter: "SMT공정센터", overheadType: "공정간접노무비", totalPoolAmount: 32000000, basis: "직접노무비", targetLineA: 45, targetLineB: 55, status: "확정" },
  { id: "AL-03", costCenter: "조립/포장센터", overheadType: "포장재/소모품비", totalPoolAmount: 18000000, basis: "생산량", targetLineA: 70, targetLineB: 30, status: "확정" },
  { id: "AL-04", costCenter: "공장관리부서", overheadType: "공장인프라/안전관리비", totalPoolAmount: 25000000, basis: "작업시간", targetLineA: 50, targetLineB: 50, status: "시뮬레이션" },
]);

export default function CostAllocation() {
  const rules = useStore(allocationStore) as AllocationRule[];
  const [basisFilter, setBasisFilter] = useState("전체");

  const filtered = rules.filter((r) => basisFilter === "전체" || r.basis === basisFilter);

  const totalPoolSum = filtered.reduce((acc, r) => acc + r.totalPoolAmount, 0);

  const excel = () =>
    downloadCsv(
      "제조간접비_배부분석.csv",
      ["원가센터", "비용항목", "총배부금액", "배부기준", "A라인 배부금액", "B라인 배부금액", "상태"],
      filtered.map((r) => [
        r.costCenter,
        r.overheadType,
        r.totalPoolAmount,
        r.basis,
        Math.round(r.totalPoolAmount * (r.targetLineA / 100)),
        Math.round(r.totalPoolAmount * (r.targetLineB / 100)),
        r.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. Controlling (관리회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">배부관리 (CO-009)</h1>
          <span className="text-[11px] text-sub">원가센터 간접비 배부 규칙 · 작업시간/노무비/생산량 기준 배부</span>
        </div>
      </div>

      {/* 배부 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 배부 대상 간접비</div>
          <div className="text-xl font-bold mt-1">{(totalPoolSum / 10000).toLocaleString()} <span className="text-xs font-normal">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">A 라인 배부 합계</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {(filtered.reduce((acc, r) => acc + r.totalPoolAmount * (r.targetLineA / 100), 0) / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">B 라인 배부 합계</div>
          <div className="text-xl font-bold text-purple-600 mt-1">
            {(filtered.reduce((acc, r) => acc + r.totalPoolAmount * (r.targetLineB / 100), 0) / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">배부 기준 필터:</span>
          {["전체", "작업시간", "생산량", "직접노무비"].map((b) => (
            <button
              key={b}
              onClick={() => setBasisFilter(b)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                basisFilter === b
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 배부분석 Excel 다운로드
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">원가센터</th>
              <th className="px-3 py-2">비용 항목</th>
              <th className="px-3 py-2 text-right">총 배부금액</th>
              <th className="px-3 py-2">배부 기준</th>
              <th className="px-3 py-2 text-right">A라인 (비율/금액)</th>
              <th className="px-3 py-2 text-right">B라인 (비율/금액)</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const amountA = Math.round(r.totalPoolAmount * (r.targetLineA / 100));
              const amountB = Math.round(r.totalPoolAmount * (r.targetLineB / 100));
              return (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-medium">{r.costCenter}</td>
                  <td className="px-3 py-2 text-sub">{r.overheadType}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">{r.totalPoolAmount.toLocaleString()}원</td>
                  <td className="px-3 py-2 font-medium text-blue-600">{r.basis}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    <span className="text-sub text-[11px]">({r.targetLineA}%)</span> {amountA.toLocaleString()}원
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    <span className="text-sub text-[11px]">({r.targetLineB}%)</span> {amountB.toLocaleString()}원
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === "확정" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
