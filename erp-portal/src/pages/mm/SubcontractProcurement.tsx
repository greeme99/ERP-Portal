// MM-006 외주구매 — 외주 가공 발주대장·사급 자재 투입·임가공 단가 및 입고 정산
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SubcontractPO {
  id: string;
  poNo: string;
  partnerName: string;
  materialCode: string;
  materialName: string;
  orderQty: number; // 발주 수량
  processingUnitPrice: number; // 임가공 단가 (KRW)
  totalProcessingCost: number; // 총 임가공비 (KRW)
  suppliedMaterial: string; // 사급 자재명
  status: "발주완료" | "가공중" | "입고완료";
  dueDate: string;
}

export const subcontractPoStore = createStore("mm.subcontract_po", [
  { id: "SUB-01", poNo: "SPO-2026-001", partnerName: "(주)세화정밀", materialCode: "SF-2001", materialName: "메인 제어 PCB 모듈", orderQty: 1000, processingUnitPrice: 8500, totalProcessingCost: 8500000, suppliedMaterial: "RM-3004 BLDC 코어 외 3종", status: "가공중", dueDate: "2026-08-12" },
  { id: "SUB-02", poNo: "SPO-2026-002", partnerName: "대성사출(주)", materialCode: "SF-2002", materialName: "청소기 상부 하우징 사출품", orderQty: 2000, processingUnitPrice: 3200, totalProcessingCost: 6400000, suppliedMaterial: "RM-3001 ABS 수지 레진", status: "입고완료", dueDate: "2026-07-30" },
  { id: "SUB-03", poNo: "SPO-2026-003", partnerName: "신진도금", materialCode: "SF-2003", materialName: "금속 노즐 표면 도금부품", orderQty: 1500, processingUnitPrice: 4500, totalProcessingCost: 6750000, suppliedMaterial: "RM-3002 동선 파이프", status: "발주완료", dueDate: "2026-08-15" },
]);

export default function SubcontractProcurement() {
  const pos = useStore(subcontractPoStore) as SubcontractPO[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = pos.filter((p) => statusFilter === "전체" || p.status === statusFilter);

  const totalCost = filtered.reduce((acc, p) => acc + p.totalProcessingCost, 0);

  const excel = () =>
    downloadCsv(
      "구매_외주가공_발주대장.csv",
      ["외주발주번호", "외주협력사", "품목코드", "품목명", "발주수량", "임가공단가(원)", "총임가공비(원)", "사급자재", "상태", "납기예정일"],
      filtered.map((p) => [
        p.poNo,
        p.partnerName,
        p.materialCode,
        p.materialName,
        p.orderQty,
        p.processingUnitPrice,
        p.totalProcessingCost,
        p.suppliedMaterial,
        p.status,
        p.dueDate,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">03. Procurement Management (구매관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">외주구매 (MM-006)</h1>
          <span className="text-[11px] text-sub">외주 가공 발주대장 · 사급 자재 투입 관리 · 임가공비 정산</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 임가공비 금액</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalCost / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">진행중 외주 발주</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{pos.filter((p) => p.status !== "입고완료").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">등록 외주 협력사</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{new Set(pos.map((p) => p.partnerName)).size} <span className="text-xs font-normal text-ink">개사</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "발주완료", "가공중", "입고완료"].map((st) => (
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
          📥 외주구매 대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">외주발주번호</th>
              <th className="px-3 py-2">외주 협력사</th>
              <th className="px-3 py-2">품목명</th>
              <th className="px-3 py-2 text-right">발주수량</th>
              <th className="px-3 py-2 text-right">임가공 단가</th>
              <th className="px-3 py-2 text-right">총 임가공비</th>
              <th className="px-3 py-2">사급 자재</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">납기예정일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{p.poNo}</td>
                <td className="px-3 py-2 font-medium">{p.partnerName}</td>
                <td className="px-3 py-2 text-sub">{p.materialCode} — {p.materialName}</td>
                <td className="px-3 py-2 text-right font-mono">{p.orderQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono">{p.processingUnitPrice.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{p.totalProcessingCost.toLocaleString()}원</td>
                <td className="px-3 py-2 text-sub text-[11px]">{p.suppliedMaterial}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status === "입고완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    p.status === "가공중" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{p.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
