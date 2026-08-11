// CO-005 원가배부 (Cost Allocation & Overhead Distribution) — 공통 제조간접비·보조부문 Cost Center 간 배부 및 집계
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CostAllocationItem {
  id: string;
  sourceCcCode: string;
  sourceCcName: string; // 배부 전 코스트센터 (예: CC-9001 공장 공통 지원팀)
  targetCcCode: string;
  targetCcName: string; // 배부 대상 코스트센터 (예: CC-2001 프레스/SMT 생산1팀)
  costElementName: string; // 원가 요소명 (예: 공장 설비 전력비 및 동력비)
  allocatedAmount: number; // 배부 집계 금액 (KRW)
  allocationRule: string; // 배부 기준 룰 (예: 작업장 설비 가동시간 비례 45%)
  period: string;
}

export const costAllocStore = createStore("co.cost_alloc_dist", [
  { id: "ALC-01", sourceCcCode: "CC-9001", sourceCcName: "공장 공통 지원센터", targetCcCode: "CC-2001", targetCcName: "프레스/SMT 생산1팀 CC", costElementName: "공장 설비 전력비 및 동력비", allocatedAmount: 28500000, allocationRule: "작업장 가동시간 비례 (55%)", period: "2026-07" },
  { id: "ALC-02", sourceCcCode: "CC-9001", sourceCcName: "공장 공통 지원센터", targetCcCode: "CC-2002", targetCcName: "메인 조립 2팀 CC", costElementName: "생산설비 기계 감가상각비", allocatedAmount: 18200000, allocationRule: "공정 자산가액 비례 (45%)", period: "2026-07" },
]);

export default function CostAllocationDistribution() {
  const items = useStore(costAllocStore) as CostAllocationItem[];
  const [periodFilter, setPeriodFilter] = useState("전체");

  const filtered = items.filter((i) => periodFilter === "전체" || i.period === periodFilter);

  const totalAllocated = filtered.reduce((acc, i) => acc + i.allocatedAmount, 0);

  const excel = () =>
    downloadCsv(
      "관리회계_제조간접비_원가배부_대장.csv",
      ["배부원SourceCC", "배부원CC명", "배부처TargetCC", "배부처CC명", "원가요소명", "배부금액(원)", "배부기준Rule", "기준월"],
      filtered.map((i) => [
        i.sourceCcCode,
        i.sourceCcName,
        i.targetCcCode,
        i.targetCcName,
        i.costElementName,
        i.allocatedAmount,
        i.allocationRule,
        i.period,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. Controlling (관리회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">원가배부 (CO-005)</h1>
          <span className="text-[11px] text-sub">보조부문 및 공통 제조간접비 코스트센터 간 배부 룰(Rule) 집계</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 배부 제조간접비 금액</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalAllocated / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">배부 사이클 수행 상태</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">마감 완료 (100.0%)</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">배부 룰 적합성 검증</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">PASS</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">기준월:</span>
          {["전체", "2026-07"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                periodFilter === p
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 원가배부 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">배부원 (Source CC)</th>
              <th className="px-3 py-2">배부처 (Target CC)</th>
              <th className="px-3 py-2">원가 요소명</th>
              <th className="px-3 py-2 text-right">배부 집계 금액</th>
              <th className="px-3 py-2">배부 기준 룰 (Allocation Rule)</th>
              <th className="px-3 py-2">기준월</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.sourceCcCode} — {i.sourceCcName}</td>
                <td className="px-3 py-2 font-bold text-emerald-600">{i.targetCcCode} — {i.targetCcName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.costElementName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.allocatedAmount / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 text-purple-700 font-medium text-[11px]">{i.allocationRule}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
