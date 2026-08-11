// MM-009 공급사 포털 (Supplier Portal) — 협력사 견적 제출·납품 일정(ASN) 등록·대금 지급 현황 공유
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SupplierPortalItem {
  id: string;
  vendorCode: string;
  vendorName: string;
  poNumber: string; // 발주 번호
  materialName: string;
  orderQty: number;
  deliveryDate: string; // 약속 납기일
  asnStatus: "ASN등록완료" | "납품중" | "미등록";
  paymentStatus: "지급완료" | "검수확인중";
}

export const supplierPortalStore = createStore("mm.supplier_portal", [
  { id: "SUP-01", vendorCode: "VEND-2001", vendorName: "협성정밀 (금형/사출)", poNumber: "PO-2026-0715", materialName: "무선청소기 메인 하우징 사출품", orderQty: 1000, deliveryDate: "2026-08-10", asnStatus: "ASN등록완료", paymentStatus: "검수확인중" },
  { id: "SUP-02", vendorCode: "VEND-2002", vendorName: "대진전자 (PCB/SMT)", poNumber: "PO-2026-0718", materialName: "전자기판 모듈 SF-2001", orderQty: 500, deliveryDate: "2026-08-08", asnStatus: "납품중", paymentStatus: "검수확인중" },
  { id: "SUP-03", vendorCode: "VEND-2003", vendorName: "한국원자재 (동선/수지)", poNumber: "PO-2026-0701", materialName: "RM-3004 전자 락 스위치", orderQty: 5900, deliveryDate: "2026-07-29", asnStatus: "ASN등록완료", paymentStatus: "지급완료" },
]);

export default function SupplierPortal() {
  const items = useStore(supplierPortalStore) as SupplierPortalItem[];
  const [asnFilter, setAsnFilter] = useState("전체");

  const filtered = items.filter((i) => asnFilter === "전체" || i.asnStatus === asnFilter);

  const excel = () =>
    downloadCsv(
      "구매_공급사_협력포털_대장.csv",
      ["협력사코드", "협력사명", "발주번호", "품목명", "발주수량", "약속납기일", "ASN상태", "지급상태"],
      filtered.map((i) => [
        i.vendorCode,
        i.vendorName,
        i.poNumber,
        i.materialName,
        i.orderQty,
        i.deliveryDate,
        i.asnStatus,
        i.paymentStatus,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">03. Materials Management (구매자재)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공급사 포털 (MM-009)</h1>
          <span className="text-[11px] text-sub">외부 협력사 입출고 통보 · 사전출하시지서(ASN) 등록 · 대금 정산 공유</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">협력사 발주 진행 건수</div>
          <div className="text-xl font-bold mt-1 font-mono">{items.length} <span className="text-xs font-normal">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">ASN 사전 출하 통보 완료</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{items.filter((i) => i.asnStatus === "ASN등록완료").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">대금 지급 완료 건수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{items.filter((i) => i.paymentStatus === "지급완료").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">ASN 상태:</span>
          {["전체", "ASN등록완료", "납품중"].map((st) => (
            <button
              key={st}
              onClick={() => setAsnFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                asnFilter === st
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 공급사 포털 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">협력사 코드 / 명</th>
              <th className="px-3 py-2">발주 번호</th>
              <th className="px-3 py-2">품목명</th>
              <th className="px-3 py-2 text-right">발주 수량</th>
              <th className="px-3 py-2">약속 납기일</th>
              <th className="px-3 py-2">ASN 출하 상태</th>
              <th className="px-3 py-2">대금 정산 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.vendorCode} — {i.vendorName}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.poNumber}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.materialName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{i.orderQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 font-mono text-sub">{i.deliveryDate}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.asnStatus}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.paymentStatus === "지급완료" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.paymentStatus}
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
