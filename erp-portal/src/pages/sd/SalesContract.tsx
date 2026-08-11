// SD-005 판매계약관리 — 장기 공급 계약대장·계약단가·수량 보장 및 만료 예정 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SalesContractItem {
  id: string;
  contractNo: string; // 계약번호
  customerName: string;
  materialCode: string;
  materialName: string;
  contractQty: number; // 계약수량
  contractPrice: number; // 계약단가
  totalAmount: number; // 총 계약금액
  startDate: string;
  endDate: string;
  status: "진행중" | "만료예정" | "만료";
}

export const salesContractStore = createStore("sd.contract", [
  { id: "CNT-01", contractNo: "CT-2026-001", customerName: "삼성전자 글로벌", materialCode: "FG-1001", materialName: "소형가전 무선청소기", contractQty: 10000, contractPrice: 145000, totalAmount: 1450000000, startDate: "2026-01-01", endDate: "2026-12-31", status: "진행중" },
  { id: "CNT-02", contractNo: "CT-2026-002", customerName: "LG전자", materialCode: "FG-1002", materialName: "스마트 무선 로봇청소기", contractQty: 5000, contractPrice: 240000, totalAmount: 1200000000, startDate: "2026-02-01", endDate: "2026-08-31", status: "만료예정" },
  { id: "CNT-03", contractNo: "CT-2026-003", customerName: "쿠쿠전자", materialCode: "FG-2001", materialName: "전자기판 컨트롤러 모듈", contractQty: 20000, contractPrice: 42000, totalAmount: 840000000, startDate: "2026-03-01", endDate: "2027-02-28", status: "진행중" },
]);

export default function SalesContract() {
  const contracts = useStore(salesContractStore) as SalesContractItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = contracts.filter((c) => statusFilter === "전체" || c.status === statusFilter);

  const totalContractVal = filtered.reduce((acc, c) => acc + c.totalAmount, 0);

  const excel = () =>
    downloadCsv(
      "영업_판매계약_대장.csv",
      ["계약번호", "고객사", "품목코드", "품목명", "계약수량", "계약단가(원)", "총계약금액(원)", "계약시작일", "계약종료일", "상태"],
      filtered.map((c) => [
        c.contractNo,
        c.customerName,
        c.materialCode,
        c.materialName,
        c.contractQty,
        c.contractPrice,
        c.totalAmount,
        c.startDate,
        c.endDate,
        c.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">판매계약관리 (SD-005)</h1>
          <span className="text-[11px] text-sub">고객사별 장기 공급 계약 · 연간 보장 수량 · 계약 단가 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 체결 계약 금액</div>
          <div className="text-xl font-bold mt-1 font-mono">{(totalContractVal / 100000000).toFixed(2)} <span className="text-xs font-normal">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">진행중 계약 건수</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{contracts.filter((c) => c.status === "진행중").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">만료 예정 (30일 이내)</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{contracts.filter((c) => c.status === "만료예정").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "진행중", "만료예정", "만료"].map((st) => (
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
          📥 판매계약 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">계약번호</th>
              <th className="px-3 py-2">고객사</th>
              <th className="px-3 py-2">품목명</th>
              <th className="px-3 py-2 text-right">계약 수량</th>
              <th className="px-3 py-2 text-right">계약 단가</th>
              <th className="px-3 py-2 text-right">총 계약금액</th>
              <th className="px-3 py-2">계약 기간</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{c.contractNo}</td>
                <td className="px-3 py-2 font-medium">{c.customerName}</td>
                <td className="px-3 py-2 text-sub">{c.materialName}</td>
                <td className="px-3 py-2 text-right font-mono">{c.contractQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono">{c.contractPrice.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{c.totalAmount.toLocaleString()}원</td>
                <td className="px-3 py-2 font-mono text-sub">{c.startDate} ~ {c.endDate}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.status === "진행중" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {c.status}
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
