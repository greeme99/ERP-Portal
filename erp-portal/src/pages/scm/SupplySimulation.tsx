// SCM-008 공급망 시뮬레이션 (Supply Chain Simulation) — What-If 리스크 시나리오(수요폭증·원자재 수급차질)에 따른 재고 소진 및 납기 영향 시뮬레이션
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SimulationScenario {
  id: string;
  scenarioCode: string;
  scenarioName: string;
  triggerEvent: string; // 리스크 원인 (예: 대기업 수주 +30% 폭증, 해외 원자재 입고 2주 지연)
  targetProduct: string;
  simulatedStockDays: number; // 시뮬레이션 결과 재고 커버리지 (일)
  simulatedOtd: number; // 시뮬레이션 납기 준수율 OTD (%)
  shortageRisk: "심각 (Shortage 발생)" | "경고 (안전재고 미달)" | "정상";
  recommendedAction: string;
  updatedAt: string;
}

export const supplySimulationStore = createStore("scm.simulation", [
  { id: "SIM-01", scenarioCode: "SCN-2026-01", scenarioName: "하반기 소형가전 북미 수출 수요 30% 폭증", triggerEvent: "수요 예기치 않은 +30% 상승", targetProduct: "FG-1001 무선청소기", simulatedStockDays: 9, simulatedOtd: 84.5, shortageRisk: "심각 (Shortage 발생)", recommendedAction: "평택1공장 주말 잔업 편성 및 협력사 긴급 수주", updatedAt: "2026-08-01" },
  { id: "SIM-02", scenarioCode: "SCN-2026-02", scenarioName: "동선/수지 원자재 공급망 입고 2주 지연", triggerEvent: "글로벌 물류 선박 운항 차질 (2주 지연)", targetProduct: "RM-3001, RM-3002 원자재", simulatedStockDays: 14, simulatedOtd: 91.0, shortageRisk: "경고 (안전재고 미달)", recommendedAction: "국내 대체 공급사 비상 발주 수량 2,000kg 확보", updatedAt: "2026-08-04" },
]);

export default function SupplySimulation() {
  const scenarios = useStore(supplySimulationStore) as SimulationScenario[];
  const [riskFilter, setRiskFilter] = useState("전체");

  const filtered = scenarios.filter((s) => riskFilter === "전체" || s.shortageRisk.includes(riskFilter));

  const excel = () =>
    downloadCsv(
      "SCM_공급망_시뮬레이션_리포트.csv",
      ["시나리오코드", "시나리오명", "리스크원인", "대상품목", "예상재고커버리지(일)", "예상납기율(%)", "위험수준", "권장대응책", "분석일자"],
      filtered.map((s) => [
        s.scenarioCode,
        s.scenarioName,
        s.triggerEvent,
        s.targetProduct,
        s.simulatedStockDays,
        `${s.simulatedOtd}%`,
        s.shortageRisk,
        s.recommendedAction,
        s.updatedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">02. Supply Chain Management (SCM)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공급망 시뮬레이션 (SCM-008)</h1>
          <span className="text-[11px] text-sub">What-If 리스크 시나리오 · 수요 변동 및 물류 지연에 따른 납기/재고 영향 시뮬레이션</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 등록 시뮬레이션 시나리오</div>
          <div className="text-xl font-bold mt-1 font-mono">{scenarios.length} <span className="text-xs font-normal">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">심각 리스크 (Shortage 위험)</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{scenarios.filter((s) => s.shortageRisk.includes("심각")).length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">경고 리스크 (안전재고 미달)</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{scenarios.filter((s) => s.shortageRisk.includes("경고")).length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">위험수준:</span>
          {["전체", "심각", "경고"].map((rk) => (
            <button
              key={rk}
              onClick={() => setRiskFilter(rk)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                riskFilter === rk
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {rk}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 시뮬레이션 리포트 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">시나리오 코드 / 명</th>
              <th className="px-3 py-2">리스크 발생 트리거</th>
              <th className="px-3 py-2">대상 품목</th>
              <th className="px-3 py-2 text-right">예상 재고 커버리지</th>
              <th className="px-3 py-2 text-right">예상 OTD 납기율</th>
              <th className="px-3 py-2">위험 수준</th>
              <th className="px-3 py-2">권장 대응 가이드</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{s.scenarioCode} — {s.scenarioName}</td>
                <td className="px-3 py-2 text-sub font-medium">{s.triggerEvent}</td>
                <td className="px-3 py-2 text-sub">{s.targetProduct}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-red-500">{s.simulatedStockDays}일</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{s.simulatedOtd.toFixed(1)}%</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.shortageRisk.includes("심각") ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {s.shortageRisk}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub text-[11px] font-medium">{s.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
