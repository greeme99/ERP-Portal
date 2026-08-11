// MM-008 원재료 구매 — 수지/금속/화학 원자재 품목별 구매발주·국제 원자재 시세 단가 반영 및 예산 검증
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface RawMaterialOrder {
  id: string;
  poNo: string;
  materialCode: string;
  materialName: string;
  category: "수지/레진" | "금속/동" | "전자부품" | "포장재";
  orderQty: number; // 발주 수량 (kg 또는 EA)
  unitPrice: number; // 단가 (KRW)
  totalAmount: number; // 발주 금액 (KRW)
  supplierName: string;
  deliveryDueDate: string;
  status: "발주완료" | "입고대기" | "검사중";
}

export const rawMaterialStore = createStore("mm.raw_material", [
  { id: "RMP-01", poNo: "PO-2607-001", materialCode: "RM-3001", materialName: "ABS 수지 레진 (ABS-750)", category: "수지/레진", orderQty: 5000, unitPrice: 3200, totalAmount: 16000000, supplierName: "LG화학", deliveryDueDate: "2026-08-10", status: "입고대기" },
  { id: "RMP-02", poNo: "PO-2607-002", materialCode: "RM-3002", materialName: "고순도 동선 (Cu-99.9%)", category: "금속/동", orderQty: 2000, unitPrice: 11500, totalAmount: 23000000, supplierName: "LS전선", deliveryDueDate: "2026-08-12", status: "발주완료" },
  { id: "RMP-03", poNo: "PO-2608-001", materialCode: "RM-3003", materialName: "PP 방염 수지 (PP-VO)", category: "수지/레진", orderQty: 3000, unitPrice: 2800, totalAmount: 8400000, supplierName: "롯데케미칼", deliveryDueDate: "2026-08-15", status: "발주완료" },
  { id: "RMP-04", poNo: "PO-2608-002", materialCode: "RM-3004", materialName: "BLDC 모터 코어 자재", category: "전자부품", orderQty: 7000, unitPrice: 5500, totalAmount: 38500000, supplierName: "성문전자", deliveryDueDate: "2026-08-08", status: "검사중" },
]);

export default function RawMaterialProcurement() {
  const orders = useStore(rawMaterialStore) as RawMaterialOrder[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = orders.filter((o) => catFilter === "전체" || o.category === catFilter);

  const totalAmountSum = filtered.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalQtySum = filtered.reduce((acc, o) => acc + o.orderQty, 0);

  const excel = () =>
    downloadCsv(
      "원재료_구매발주_대장.csv",
      ["발주번호", "품목코드", "품목명", "카테고리", "발주수량", "단가(원)", "발주금액(원)", "공급사", "납기예정일", "상태"],
      filtered.map((o) => [
        o.poNo,
        o.materialCode,
        o.materialName,
        o.category,
        o.orderQty,
        o.unitPrice,
        o.totalAmount,
        o.supplierName,
        o.deliveryDueDate,
        o.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">03. Procurement Management (구매관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">원재료 구매 (MM-008)</h1>
          <span className="text-[11px] text-sub">수지/금속/전자 원자재 발주대장 · 단가 동향 및 납기일자 관리</span>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 원재료 발주 금액</div>
          <div className="text-xl font-bold mt-1 font-mono">{(totalAmountSum / 10000).toLocaleString()} <span className="text-xs font-normal">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">총 발주 수량</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{totalQtySum.toLocaleString()} <span className="text-xs font-normal text-ink">단위</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">진행중 발주 건수</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {orders.filter((o) => o.status === "입고대기" || o.status === "발주완료").length} <span className="text-xs font-normal text-ink">건</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">카테고리:</span>
          {["전체", "수지/레진", "금속/동", "전자부품"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                catFilter === cat
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 원재료 구매 대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">발주번호</th>
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2">카테고리</th>
              <th className="px-3 py-2 text-right">발주 수량</th>
              <th className="px-3 py-2 text-right">단가 (원)</th>
              <th className="px-3 py-2 text-right">발주 금액</th>
              <th className="px-3 py-2">공급사</th>
              <th className="px-3 py-2">납기 예정일</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{o.poNo}</td>
                <td className="px-3 py-2">{o.materialCode} — {o.materialName}</td>
                <td className="px-3 py-2 text-sub">{o.category}</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{o.orderQty.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono">{o.unitPrice.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">{o.totalAmount.toLocaleString()}원</td>
                <td className="px-3 py-2">{o.supplierName}</td>
                <td className="px-3 py-2 font-mono text-sub">{o.deliveryDueDate}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    o.status === "입고대기" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {o.status}
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
