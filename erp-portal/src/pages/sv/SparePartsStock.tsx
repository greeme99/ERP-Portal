// SV-003 AS부품재고 (Service Spare Parts Stock) — AS 센터별 수리 교체용 부품·소모품 재고 현황 및 안전재고 보충 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SparePartsItem {
  id: string;
  partCode: string;
  partName: string;
  centerName: string; // AS 서비스 센터명 (예: 강남 CS센터, 부산 CS센터)
  currentStockQty: number; // 현재 보유 재고 수량
  safetyStockQty: number; // 안전 재고 수량
  unitCost: number; // 부품 단가 (KRW)
  totalStockValue: number; // 재고 금액 = Stock * UnitCost
  reorderStatus: "정상" | "안전재고 미달(발주필요)" | "품절";
}

export const sparePartsStore = createStore("sv.spare_parts", [
  { id: "SPT-01", partCode: "RM-3004", partName: "표준형 락 스위치 250V", centerName: "강남 중앙 CS센터", currentStockQty: 150, safetyStockQty: 50, unitCost: 6500, totalStockValue: 975000, reorderStatus: "정상" },
  { id: "SPT-02", partCode: "RM-3002", partName: "리튬이온 팩 배터리 셀 25.2V", centerName: "강남 중앙 CS센터", currentStockQty: 15, safetyStockQty: 30, unitCost: 64130, totalStockValue: 961950, reorderStatus: "안전재고 미달(발주필요)" },
  { id: "SPT-03", partCode: "SF-2001", partName: "BLDC 모터 전자기판 메인 모듈", centerName: "부산 CS센터", currentStockQty: 8, safetyStockQty: 10, unitCost: 285000, totalStockValue: 2280000, reorderStatus: "안전재고 미달(발주필요)" },
]);

export default function SparePartsStock() {
  const items = useStore(sparePartsStore) as SparePartsItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.reorderStatus.includes(statusFilter));

  const totalValue = filtered.reduce((acc, i) => acc + i.totalStockValue, 0);

  const excel = () =>
    downloadCsv(
      "서비스_AS부품_재고현황_대장.csv",
      ["부품코드", "부품명", "AS센터명", "보유재고", "안전재고", "부품단가(원)", "재고금액(원)", "수급상태"],
      filtered.map((i) => [
        i.partCode,
        i.partName,
        i.centerName,
        i.currentStockQty,
        i.safetyStockQty,
        i.unitCost,
        i.totalStockValue,
        i.reorderStatus,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. Customer Service (고객서비스)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">AS부품재고 (SV-003)</h1>
          <span className="text-[11px] text-sub">전국 AS 센터별 수리용 Spare Parts 보유량 · 안전재고 보충 발주 알림</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 AS 부품 재고 금액</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalValue / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">안전재고 미달 품목 (보충 필요)</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">
            {items.filter((i) => i.reorderStatus.includes("미달")).length} <span className="text-xs font-normal text-ink">종</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">AS 부품 수급 적시 가용률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">96.5%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "정상", "미달"].map((st) => (
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
          📥 AS부품재고 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">부품 코드 / 부품명</th>
              <th className="px-3 py-2">AS 센터명</th>
              <th className="px-3 py-2 text-right">현재 보유재고</th>
              <th className="px-3 py-2 text-right">안전재고 수량</th>
              <th className="px-3 py-2 text-right">부품 단가</th>
              <th className="px-3 py-2 text-right">총 재고 금액</th>
              <th className="px-3 py-2">수급 보충 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.partCode} — {i.partName}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.centerName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.currentStockQty} EA</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.safetyStockQty} EA</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.unitCost.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.totalStockValue / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.reorderStatus === "정상" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.reorderStatus}
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
