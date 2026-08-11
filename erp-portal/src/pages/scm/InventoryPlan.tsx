// SCM-005 재고계획 — 3주 ~ 24주 주단위 버킷 확장 & 재고 과부족 시뮬레이션
import { useState } from "react";
import { materialStore, MaterialItem } from "../../data/mock/master";
import { mpsWeeklyStore } from "../../data/mock/production";
import { forecastStore, contingencyStore, WEEK_BUCKETS, ContingencySimItem } from "../../data/mock/scm";
import { useStore, downloadCsv } from "../../services/store";

export default function InventoryPlan() {
  const mats = useStore(materialStore) as MaterialItem[];
  const ctgItems = useStore(contingencyStore) as ContingencySimItem[];

  const [selectedMaterial, setSelectedMaterial] = useState<string>("FG-1001");
  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;

  const materials = ["FG-1001", "FG-1002", "FG-1003"];

  // 3~24주차 재고 과부족 시뮬레이션 행
  const simRows = ctgItems.filter((c) => c.material === selectedMaterial && c.weekSeq >= 3);
  const shortCount = simRows.filter((r) => r.status === "결품위험").length;
  const warningCount = simRows.filter((r) => r.status === "주의").length;

  const excel = () =>
    downloadCsv("3_24주_재고시뮬레이션.csv", ["주차", "품목", "수요", "공급", "예상기말재고", "안전재고", "상태"],
      simRows.map((r) => [r.week, r.material, r.demand, r.supply, r.projectedStock, r.safetyStock, r.status]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">02. SCM (Supply Chain)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">재고계획 (SCM-005) — 3주~24주 주단위 시뮬레이션</h1>
          <span className="text-[11px] text-sub">
            3주~24주 주단위 버킷 · 재고과부족 예측 · 안전재고 / 재주문 시점 시뮬레이션
          </span>
        </div>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">선택 품목</div>
          <div className="text-base font-bold text-accent mt-1">{selectedMaterial} — {matName(selectedMaterial)}</div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">결품 위험 주차 (3~24주)</div>
          <div className={`text-xl font-bold mt-1 ${shortCount > 0 ? "text-red-500" : "text-emerald-500"}`}>
            {shortCount}개 주차
          </div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">안전재고 주의 주차</div>
          <div className={`text-xl font-bold mt-1 ${warningCount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
            {warningCount}개 주차
          </div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">재고 시뮬레이션 범위</div>
          <div className="text-base font-bold text-purple-600 mt-1">22개 주차 (W29~W50)</div>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-main">품목 선택:</span>
          {materials.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMaterial(m)}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                selectedMaterial === m ? "bg-accent text-white" : "bg-surface text-sub hover:text-main border border-line"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 시뮬레이션 Excel
        </button>
      </div>

      {/* 3~24주 재고 시뮬레이션 테이블 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
          <span className="font-bold text-[13px] text-main">
            📈 {selectedMaterial} 3주~24주 주단위 예상 재고 추이 매트릭스
          </span>
          <span className="text-[11px] text-sub">수요-공급 밸런싱에 따른 기말재고 및 안전재고 보충 시점 예측</span>
        </div>

        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">주차</th>
              <th className="px-3 py-2 text-right">주간 수요</th>
              <th className="px-3 py-2 text-right">주간 입고/공급</th>
              <th className="px-3 py-2 text-right">예상 기말재고</th>
              <th className="px-3 py-2 text-right">안전재고 기준</th>
              <th className="px-3 py-2">재고 과부족 상태</th>
              <th className="px-3 py-2">추천 권고사항</th>
            </tr>
          </thead>
          <tbody>
            {simRows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft transition-colors">
                <td className="px-3 py-2 font-bold text-accent font-mono">{r.week} ({r.weekSeq}주차)</td>
                <td className="px-3 py-2 text-right font-mono">{r.demand.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono text-emerald-600">+{r.supply.toLocaleString()} EA</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${
                  r.projectedStock < 0 ? "text-red-500" : r.projectedStock < r.safetyStock ? "text-amber-500" : "text-emerald-600"
                }`}>
                  {r.projectedStock.toLocaleString()} EA
                </td>
                <td className="px-3 py-2 text-right font-mono text-sub">{r.safetyStock.toLocaleString()} EA</td>
                <td className="px-3 py-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    r.status === "결품위험" ? "bg-red-100 text-red-700" : r.status === "주의" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub">
                  {r.status === "결품위험"
                    ? `⚠️ 결품 위험 (${r.contingencyPlan})`
                    : r.status === "주의"
                    ? "안전재고 미달 (추가 발주 권장)"
                    : "안정 재고 유지"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
