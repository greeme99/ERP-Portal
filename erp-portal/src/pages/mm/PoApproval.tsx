// MM-003 구매승인 (PO Authorization & Approval Workflow) — 구매요청(PR)·발주(PO) 금액별 전결 승인 결재선 및 예산 통제
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface PoApprovalItem {
  id: string;
  docNo: string; // 문서 번호 (PR 또는 PO 번호)
  docType: "구매요청 (PR)" | "발주서 (PO)";
  requestDept: string;
  requestor: string;
  supplierName: string;
  totalAmount: number; // 결재 신청 금액 (KRW)
  budgetCheckResult: "예산 범위 내" | "예산 초과 주의";
  approverRole: "구매팀장" | "사업본부장" | "대표이사";
  approvalStatus: "승인 대기" | "결재 승인" | "반려";
  requestedAt: string;
}

export const poApprovalStore = createStore("mm.po_approval", [
  { id: "APP-01", docNo: "PR-2026-0701", docType: "구매요청 (PR)", requestDept: "구매자재팀", requestor: "이구매 대리", supplierName: "한일정밀 주식회사", totalAmount: 38350000, budgetCheckResult: "예산 범위 내", approverRole: "구매팀장", approvalStatus: "결재 승인", requestedAt: "2026-07-03" },
  { id: "APP-02", docNo: "PO-2026-0801", docType: "발주서 (PO)", requestDept: "생산관리팀", requestor: "박생산 과장", supplierName: "대성전자 (BLDC 모터)", totalAmount: 125000000, budgetCheckResult: "예산 범위 내", approverRole: "사업본부장", approvalStatus: "승인 대기", requestedAt: "2026-08-04" },
]);

export default function PoApproval() {
  const items = useStore(poApprovalStore) as PoApprovalItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.approvalStatus === statusFilter);

  const excel = () =>
    downloadCsv(
      "구매_발주_전결승인_결재대장.csv",
      ["문서번호", "문서구분", "요청부서", "요청자", "공급사명", "신청금액(원)", "예산체크", "전결권자", "결재상태", "요청일시"],
      filtered.map((i) => [
        i.docNo,
        i.docType,
        i.requestDept,
        i.requestor,
        i.supplierName,
        i.totalAmount,
        i.budgetCheckResult,
        i.approverRole,
        i.approvalStatus,
        i.requestedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">03. Materials Management (구매자재)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">구매승인 (MM-003)</h1>
          <span className="text-[11px] text-sub">구매요청(PR) · 발주서(PO) 전결 금액별 결재 승인 Workflow 및 예산 잔액 통제</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 결재 대기 건수</div>
          <div className="text-xl font-bold mt-1 font-mono text-amber-600">
            {items.filter((i) => i.approvalStatus === "승인 대기").length} <span className="text-xs font-normal text-ink">건</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">결재 완료 금액</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {(items.filter((i) => i.approvalStatus === "결재 승인").reduce((acc, i) => acc + i.totalAmount, 0) / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">예산 정상 적합률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "승인 대기", "결재 승인"].map((st) => (
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
          📥 구매결재 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">문서 번호 / 구분</th>
              <th className="px-3 py-2">요청 부서 / 요청자</th>
              <th className="px-3 py-2">공급사명</th>
              <th className="px-3 py-2 text-right">신청 결재 금액</th>
              <th className="px-3 py-2">예산 통제 검토</th>
              <th className="px-3 py-2">전결 권한자</th>
              <th className="px-3 py-2">결재 상태</th>
              <th className="px-3 py-2">요청 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">
                  <div className="font-bold font-mono">{i.docNo}</div>
                  <div className="text-[11px] text-sub">{i.docType}</div>
                </td>
                <td className="px-3 py-2 text-sub">{i.requestDept} ({i.requestor})</td>
                <td className="px-3 py-2 text-ink font-semibold">{i.supplierName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.totalAmount / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.budgetCheckResult}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub font-medium">{i.approverRole}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.approvalStatus === "결재 승인" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.approvalStatus}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.requestedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
