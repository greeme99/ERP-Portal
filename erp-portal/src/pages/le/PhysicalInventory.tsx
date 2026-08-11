// LE-006 재고조사 (Physical Inventory Count) — 원자재/반제품/완제품 창고 실사 재고조사 및 장부 vs 실사 수량 차이 조정
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface PhysicalInventoryItem {
  id: string;
  countPlanNo: string;
  warehouseName: string;
  materialCode: string;
  materialName: string;
  systemBookQty: number; // 장부 재고 수량
  physicalCountQty: number; // 실사 측정 재고 수량
  varianceQty: number; // 수량 차이 = Physical - Book
  varianceAmount: number; // 금액 차이 (KRW)
  status: "정상 일치" | "재고 조정 필요" | "조정 승인 완료";
  countedAt: string;
}

export const physicalInventoryStore = createStore("le.physical_inventory", [
  { id: "PHY-01", countPlanNo: "CNT-2026-07A", warehouseName: "원자재 1창고", materialCode: "RM-3004", materialName: "표준형 락 스위치 250V", systemBookQty: 7800, physicalCountQty: 7800, varianceQty: 0, varianceAmount: 0, status: "정상 일치", countedAt: "2026-07-31" },
  { id: "PHY-02", countPlanNo: "CNT-2026-07A", warehouseName: "완제품 중앙창고", materialCode: "FG-1001", materialName: "소형가전 무선청소기", systemBookQty: 1730, physicalCountQty: 1728, varianceQty: -2, varianceAmount: -100826, status: "재고 조정 필요", countedAt: "2026-07-31" },
  { id: "PHY-03", countPlanNo: "CNT-2026-07A", warehouseName: "반제품 라인창고", materialCode: "SF-2001", materialName: "전자기판 모듈", systemBookQty: 360, physicalCountQty: 360, varianceQty: 0, varianceAmount: 0, status: "정상 일치", countedAt: "2026-07-31" },
]);

export default function PhysicalInventory() {
  const items = useStore(physicalInventoryStore) as PhysicalInventoryItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status === statusFilter);

  const totalVarianceAmount = filtered.reduce((acc, i) => acc + i.varianceAmount, 0);

  const excel = () =>
    downloadCsv(
      "물류_창고_실사재고조사_대장.csv",
      ["조사계획번호", "창고명", "품목코드", "품목명", "장부재고", "실사재고", "수량차이", "금액차이(원)", "상태", "조사일시"],
      filtered.map((i) => [
        i.countPlanNo,
        i.warehouseName,
        i.materialCode,
        i.materialName,
        i.systemBookQty,
        i.physicalCountQty,
        i.varianceQty,
        i.varianceAmount,
        i.status,
        i.countedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">04. Logistics Execution (물류관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">재고조사 (LE-006)</h1>
          <span className="text-[11px] text-sub">창고 실사 재고조사(Physical Count) · 장부 대비 수량 차이 조정 및 재고 정확도 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 재고 정확도 (Inventory Accuracy)</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">99.8%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">총 수량 차이 손익 금액</div>
          <div className={`text-xl font-bold mt-1 font-mono ${totalVarianceAmount >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
            {totalVarianceAmount.toLocaleString()} <span className="text-xs font-normal text-ink">원</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">재고 조정 필요 품목</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {items.filter((i) => i.status === "재고 조정 필요").length} <span className="text-xs font-normal text-ink">건</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "정상 일치", "재고 조정 필요"].map((st) => (
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
          📥 재고조사 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">조사 계획번호</th>
              <th className="px-3 py-2">창고명</th>
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2 text-right">장부 재고</th>
              <th className="px-3 py-2 text-right">실사 재고</th>
              <th className="px-3 py-2 text-right">수량 차이</th>
              <th className="px-3 py-2 text-right">차이 금액</th>
              <th className="px-3 py-2">조사 상태</th>
              <th className="px-3 py-2">조사 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">{i.countPlanNo}</td>
                <td className="px-3 py-2 font-medium">{i.warehouseName}</td>
                <td className="px-3 py-2 text-sub">{i.materialCode} — {i.materialName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.systemBookQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.physicalCountQty.toLocaleString()} EA</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.varianceQty < 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {i.varianceQty > 0 ? `+${i.varianceQty}` : i.varianceQty} EA
                </td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.varianceAmount < 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {i.varianceAmount.toLocaleString()}원
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.status === "정상 일치" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.countedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
