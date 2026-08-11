// SV-010 부품재고세이프티관리 (Service Spare Parts Safety Stock Management) — 서비스 자재 세이프티 재고 수준 및 소진 경보 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface PartSafetyStockItem {
  id: string;
  centerCode: string;
  centerName: string; // AS 서비스 센터명 (예: 서울 강남 AS센터, 부산 서면 AS센터)
  partCode: string;
  partName: string; // 서비스 자재 부품명 (예: BLDC 모터 어셈블리, H13 헤파필터, 리튬이온 배터리 팩)
  currentStockQty: number; // 현재 보유 재고 수량 (EA)
  safetyStockQty: number; // 적정 안전재고 수량 (Min)
  replenishmentLeadDays: number; // 보충 입고 리드타임 (일)
  stockAlertLevel: "정상 수량" | "안전재고 미달 (재고 보충 필요)" | "긴급 품절 위험";
}

export const partSafetyStore = createStore("sv.part_safety", [
  { id: "SST-01", centerCode: "AS-CTR-01", centerName: "서울 강남 메가 AS센터", partCode: "PART-MTR-101", partName: "V11 스마트 BLDC 모터 어셈블리", currentStockQty: 45, safetyStockQty: 30, replenishmentLeadDays: 2, stockAlertLevel: "정상 수량" },
  { id: "SST-02", centerCode: "AS-CTR-01", centerName: "서울 강남 메가 AS센터", partCode: "PART-BAT-202", partName: "25.2V 고용량 리튬이온 배터리 팩", currentStockQty: 18, safetyStockQty: 25, replenishmentLeadDays: 3, stockAlertLevel: "안전재고 미달 (재고 보충 필요)" },
  { id: "SST-03", centerCode: "AS-CTR-02", centerName: "부산 서면 AS센터", partCode: "PART-FLT-102", partName: "H13 울트라 헤파필터", currentStockQty: 5, safetyStockQty: 20, replenishmentLeadDays: 2, stockAlertLevel: "긴급 품절 위험" },
]);

export default function ServicePartSafetyStock() {
  const items = useStore(partSafetyStore) as PartSafetyStockItem[];
  const [alertFilter, setAlertFilter] = useState("전체");

  const filtered = items.filter((i) => alertFilter === "전체" || i.stockAlertLevel.includes(alertFilter));

  const alertCount = items.filter((i) => !i.stockAlertLevel.includes("정상")).length;

  const excel = () =>
    downloadCsv(
      "서비스_부품재고_세이프티_관리_대장.csv",
      ["센터코드", "AS센터명", "부품코드", "부품명", "현재재고", "안전재고", "보충리드타임(일)", "재고경보상태"],
      filtered.map((i) => [
        i.centerCode,
        i.centerName,
        i.partCode,
        i.partName,
        i.currentStockQty,
        i.safetyStockQty,
        i.replenishmentLeadDays,
        i.stockAlertLevel,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. Customer Service (고객서비스)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">부품재고세이프티관리 (SV-010)</h1>
          <span className="text-[11px] text-sub">전국 AS 센터 서비스 부품 재고 세이프티(Min/Max) 수준 및 자동 재고 보충 경보</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">관리 서비스 부품 종류 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">종</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">안전재고 미달/품절 경보 부품</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{alertCount} <span className="text-xs font-normal text-ink">종</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">서비스 부품 평균 보충 리드타임</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.replenishmentLeadDays, 0) / (filtered.length || 1)).toFixed(1)} <span className="text-xs font-normal text-ink">일</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">경보:</span>
          {["전체", "정상", "미달", "품절"].map((a) => (
            <button
              key={a}
              onClick={() => setAlertFilter(a)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                alertFilter === a
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 부품세이프티 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">AS 센터명</th>
              <th className="px-3 py-2">부품 코드</th>
              <th className="px-3 py-2">서비스 자재 부품명</th>
              <th className="px-3 py-2 text-right">현재 보유재고</th>
              <th className="px-3 py-2 text-right">안전재고(Min)</th>
              <th className="px-3 py-2 text-right">보충 리드타임</th>
              <th className="px-3 py-2">재고 경보 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium text-ink">{i.centerName}</td>
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.partCode}</td>
                <td className="px-3 py-2 text-ink font-semibold">{i.partName}</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.currentStockQty < i.safetyStockQty ? "text-red-500" : "text-emerald-600"}`}>
                  {i.currentStockQty.toLocaleString()}EA
                </td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.safetyStockQty.toLocaleString()}EA</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.replenishmentLeadDays}일</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.stockAlertLevel.includes("긴급") ? "bg-red-100 text-red-700 border border-red-200" : i.stockAlertLevel.includes("미달") ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {i.stockAlertLevel}
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
