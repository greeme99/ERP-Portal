// CO-007 차이분석 — 표준원가 vs 실제원가 요소별(재료비·노무비·경비) 원가 차이(Variance) 및 유리/불리 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CostVarianceItem {
  id: string;
  costElement: "직접재료비" | "직접노무비" | "변동제조간접비" | "고정제조간접비";
  materialName: string;
  stdCost: number; // 표준원가 (KRW)
  actualCost: number; // 실제원가 (KRW)
  varianceAmount: number; // 차이금액 = Actual - Std (KRW)
  varianceType: "유리 (Favorable)" | "불리 (Unfavorable)" | "동일";
  mainReason: string; // 차이 원인 (예: 원자재 시세 상승, 조립 수율 개선)
  period: string;
}

export const varianceAnalysisStore = createStore("co.variance_analysis", [
  { id: "VAR-01", costElement: "직접재료비", materialName: "FG-1001 소형가전 무선청소기", stdCost: 32500, actualCost: 34200, varianceAmount: 1700, varianceType: "불리 (Unfavorable)", mainReason: "국제 ABS 수지 레진 원자재 단가 +5.2% 상승", period: "2026-07" },
  { id: "VAR-02", costElement: "직접노무비", materialName: "FG-1001 소형가전 무선청소기", stdCost: 12000, actualCost: 11100, varianceAmount: -900, varianceType: "유리 (Favorable)", mainReason: "A라인 조립 공정 자동화로 작업 공수 7.5% 감소", period: "2026-07" },
  { id: "VAR-03", costElement: "변동제조간접비", materialName: "FG-1001 소형가전 무선청소기", stdCost: 5913, actualCost: 5113, varianceAmount: -800, varianceType: "유리 (Favorable)", mainReason: "공정 불량률 감소(PPM 개선)로 소모성 공구비 절감", period: "2026-07" },
  { id: "VAR-04", costElement: "직접재료비", materialName: "FG-1002 스마트 로봇청소기", stdCost: 110000, actualCost: 114500, varianceAmount: 4500, varianceType: "불리 (Unfavorable)", mainReason: "Li-Ion 배터리 셀 수입 단가 인상", period: "2026-07" },
]);

export default function VarianceAnalysis() {
  const items = useStore(varianceAnalysisStore) as CostVarianceItem[];
  const [elemFilter, setElemFilter] = useState("전체");

  const filtered = items.filter((i) => elemFilter === "전체" || i.costElement === elemFilter);

  const totalVariance = filtered.reduce((acc, i) => acc + i.varianceAmount, 0);

  const excel = () =>
    downloadCsv(
      "관리회계_표준원가_차이분석대장.csv",
      ["원가요소", "품목명", "표준원가(원)", "실제원가(원)", "차이금액(원)", "차이성격", "주요원인", "기준월"],
      filtered.map((i) => [
        i.costElement,
        i.materialName,
        i.stdCost,
        i.actualCost,
        i.varianceAmount,
        i.varianceType,
        i.mainReason,
        i.period,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. Controlling (관리회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">차이분석 (CO-007)</h1>
          <span className="text-[11px] text-sub">표준원가 vs 실제원가 요소별 차이(Variance) 및 유리/불리(F/U) 원인 분석</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 원가 차이 (Actual - Std)</div>
          <div className={`text-xl font-bold mt-1 font-mono ${totalVariance > 0 ? "text-red-500" : "text-emerald-600"}`}>
            {totalVariance > 0 ? `+${totalVariance.toLocaleString()}` : totalVariance.toLocaleString()} <span className="text-xs font-normal text-ink">원/대</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">유리한 차이 (Favorable) 건수</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{items.filter((i) => i.varianceType.includes("유리")).length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">불리한 차이 (Unfavorable) 건수</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{items.filter((i) => i.varianceType.includes("불리")).length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">원가요소:</span>
          {["전체", "직접재료비", "직접노무비", "변동제조간접비"].map((el) => (
            <button
              key={el}
              onClick={() => setElemFilter(el)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                elemFilter === el
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {el}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 차이분석 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">원가 요소</th>
              <th className="px-3 py-2">품목명</th>
              <th className="px-3 py-2 text-right">표준원가 (Std)</th>
              <th className="px-3 py-2 text-right">실제원가 (Actual)</th>
              <th className="px-3 py-2 text-right">원가 차이</th>
              <th className="px-3 py-2">차이 성격</th>
              <th className="px-3 py-2">주요 변동 원인</th>
              <th className="px-3 py-2">기준월</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.costElement}</td>
                <td className="px-3 py-2 text-sub">{i.materialName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.stdCost.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-medium">{i.actualCost.toLocaleString()}원</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.varianceAmount > 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {i.varianceAmount > 0 ? `+${i.varianceAmount.toLocaleString()}` : i.varianceAmount.toLocaleString()}원
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.varianceType.includes("유리") ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {i.varianceType}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub text-[11px] font-medium">{i.mainReason}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
