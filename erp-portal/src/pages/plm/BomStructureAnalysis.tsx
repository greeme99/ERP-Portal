// PLM-010 BOM 구성분석 (BOM Structure Analysis & Indented Tree) — 제품 완제품-반제품-원자재 다단계 Multi-Level BOM 트리 및 원가 구성비 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface BomStructureItem {
  id: string;
  parentMaterialCode: string;
  level: number; // BOM Level (0: 완제품, 1: 반제품, 2: 원자재)
  componentCode: string;
  componentName: string;
  quantityPerParent: number; // 단위투입 소요량
  unitOfMeasure: string;
  unitCost: number; // 부품 단가 (KRW)
  totalCostContribution: number; // 총원가 기여액 = Quantity * UnitCost
  costSharePct: number; // 완제품 대비 원가 비중 (%)
}

export const bomStructureStore = createStore("plm.bom_structure", [
  { id: "BOM-LVL-00", parentMaterialCode: "FG-1001", level: 0, componentCode: "FG-1001", componentName: "소형가전 무선청소기 완제품", quantityPerParent: 1, unitOfMeasure: "EA", unitCost: 50413, totalCostContribution: 50413, costSharePct: 100.0 },
  { id: "BOM-LVL-01", parentMaterialCode: "FG-1001", level: 1, componentCode: "SF-2001", componentName: "BLDC 모터 전자기판 메인 조립 모듈", quantityPerParent: 1, unitOfMeasure: "EA", unitCost: 28500, totalCostContribution: 28500, costSharePct: 56.5 },
  { id: "BOM-LVL-02A", parentMaterialCode: "FG-1001", level: 2, componentCode: "RM-3004", componentName: "표준형 락 스위치 250V 10A", quantityPerParent: 1, unitOfMeasure: "EA", unitCost: 6500, totalCostContribution: 6500, costSharePct: 12.9 },
  { id: "BOM-LVL-02B", parentMaterialCode: "FG-1001", level: 2, componentCode: "RM-3001", componentName: "ABS 프레스 사출 외관 하우징 쉘", quantityPerParent: 2, unitOfMeasure: "EA", unitCost: 4500, totalCostContribution: 9000, costSharePct: 17.8 },
  { id: "BOM-LVL-02C", parentMaterialCode: "FG-1001", level: 2, componentCode: "RM-3002", componentName: "리튬이온 팩 배터리 셀 25.2V", quantityPerParent: 1, unitOfMeasure: "EA", unitCost: 6413, totalCostContribution: 6413, costSharePct: 12.7 },
]);

export default function BomStructureAnalysis() {
  const items = useStore(bomStructureStore) as BomStructureItem[];
  const [selectedFg, setSelectedFg] = useState("FG-1001");

  const filtered = items.filter((i) => i.parentMaterialCode === selectedFg);

  const totalFgCost = filtered.find((i) => i.level === 0)?.unitCost || 50413;

  const excel = () =>
    downloadCsv(
      "연구개발_MultiLevel_BOM_구성분석.csv",
      ["모품목코드", "Level", "자품목코드", "자품목명", "투입소요량", "단위", "부품단가(원)", "총원가가공비(원)", "원가비중(%)"],
      filtered.map((i) => [
        i.parentMaterialCode,
        i.level,
        i.componentCode,
        i.componentName,
        i.quantityPerParent,
        i.unitOfMeasure,
        i.unitCost,
        i.totalCostContribution,
        `${i.costSharePct}%`,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. Engineering Management (연구개발)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">BOM 구성분석 (PLM-010)</h1>
          <span className="text-[11px] text-sub">완제품-반제품-원자재 Multi-Level Indented BOM 트리 구조 및 자재 원가 비중(%) 분석</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">대상 완제품 표준원가</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{totalFgCost.toLocaleString()} <span className="text-xs font-normal text-ink">원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">총 자재 BOM 품목 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{filtered.length} <span className="text-xs font-normal text-ink">종</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">최고 원가 비중 자재</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">SF-2001 <span className="text-xs font-normal text-ink">(56.5%)</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">완제품 선택:</span>
          {["FG-1001"].map((fg) => (
            <button
              key={fg}
              onClick={() => setSelectedFg(fg)}
              className="px-2.5 py-1 rounded text-[11px] font-bold bg-accent text-white"
            >
              {fg} (소형가전 무선청소기)
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 Indented BOM Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">BOM Level 계층</th>
              <th className="px-3 py-2">부품 코드 / 부품명</th>
              <th className="px-3 py-2 text-right">투입 단위 소요량</th>
              <th className="px-3 py-2 text-right">부품 단가</th>
              <th className="px-3 py-2 text-right">총 원가 기여액</th>
              <th className="px-3 py-2 text-right">원가 구성 비중</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    i.level === 0 ? "bg-purple-100 text-purple-700 border border-purple-200" :
                    i.level === 1 ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-surface border border-line text-sub"
                  }`}>
                    {".".repeat(i.level * 2)} L{i.level}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium">
                  <span className={i.level === 0 ? "font-bold text-ink" : i.level === 1 ? "font-semibold text-blue-600 pl-2" : "pl-4 text-sub"}>
                    {i.componentCode} — {i.componentName}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.quantityPerParent} {i.unitOfMeasure}</td>
                <td className="px-3 py-2 text-right font-mono font-medium">{i.unitCost.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.totalCostContribution.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.costSharePct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
