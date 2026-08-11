// SD-009 채권관리 (AR & Collection History) — 고객사별 외상매출금 채권 잔액·수금 예정일·DSO 회수 기간 및 여신 한제 통제
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SalesCreditItem {
  id: string;
  customerCode: string;
  customerName: string;
  creditLimit: number; // 부여 여신 한도 (KRW)
  arBalance: number; // 외상매출 채권 잔액 (KRW)
  overdueAmount: number; // 연체 채권 금액 (KRW)
  dsoDays: number; // DSO 채권회수기간 (일)
  expectedCollectDate: string; // 예정 수금일
  status: "정상 회수" | "연체 주의" | "여신 초과 위험";
}

export const salesCreditStore = createStore("sd.sales_credit", [
  { id: "SCD-01", customerCode: "CUS-1001", customerName: "삼성전자 글로벌", creditLimit: 3200000000, arBalance: 3167200000, overdueAmount: 0, dsoDays: 32, expectedCollectDate: "2026-08-25", status: "정상 회수" },
  { id: "SCD-02", customerCode: "CUS-1002", customerName: "LG전자", creditLimit: 1500000000, arBalance: 850000000, overdueAmount: 0, dsoDays: 28, expectedCollectDate: "2026-08-15", status: "정상 회수" },
  { id: "SCD-03", customerCode: "CUS-1004", customerName: "한일전기", creditLimit: 300000000, arBalance: 280000000, overdueAmount: 45000000, dsoDays: 65, expectedCollectDate: "2026-08-10", status: "연체 주의" },
]);

export default function SalesCreditCollection() {
  const items = useStore(salesCreditStore) as SalesCreditItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status === statusFilter);

  const totalAr = filtered.reduce((acc, i) => acc + i.arBalance, 0);
  const totalOverdue = filtered.reduce((acc, i) => acc + i.overdueAmount, 0);

  const excel = () =>
    downloadCsv(
      "영업_채권_여신수금_관리대장.csv",
      ["고객코드", "고객사명", "여신한도(원)", "채권잔액(원)", "연체금액(원)", "DSO(일)", "예정수금일", "상태"],
      filtered.map((i) => [
        i.customerCode,
        i.customerName,
        i.creditLimit,
        i.arBalance,
        i.overdueAmount,
        i.dsoDays,
        i.expectedCollectDate,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">채권관리 (SD-009)</h1>
          <span className="text-[11px] text-sub">고객사별 외상매출금 채권 잔액 · 연체 DSO 회수 기간 · 수금 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 외상매출 채권 잔액</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalAr / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">총 연체 미수금 채권</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{(totalOverdue / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 DSO 회수 기간</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(items.reduce((acc, i) => acc + i.dsoDays, 0) / (items.length || 1)).toFixed(0)} <span className="text-xs font-normal text-ink">일</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "정상 회수", "연체 주의"].map((st) => (
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
          📥 채권대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">고객코드 / 명</th>
              <th className="px-3 py-2 text-right">여신 한도</th>
              <th className="px-3 py-2 text-right">채권 잔액</th>
              <th className="px-3 py-2 text-right">연체 금액</th>
              <th className="px-3 py-2 text-right">DSO 회수기간</th>
              <th className="px-3 py-2">예정 수금일</th>
              <th className="px-3 py-2">채권 관리 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.customerCode} — {i.customerName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{(i.creditLimit / 100000000).toFixed(1)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.arBalance / 100000000).toFixed(2)}억원</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.overdueAmount > 0 ? "text-red-500" : "text-sub"}`}>
                  {i.overdueAmount > 0 ? `${(i.overdueAmount / 10000).toLocaleString()}만원` : "-"}
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.dsoDays}일</td>
                <td className="px-3 py-2 font-mono text-sub">{i.expectedCollectDate}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.status === "정상 회수" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.status}
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
