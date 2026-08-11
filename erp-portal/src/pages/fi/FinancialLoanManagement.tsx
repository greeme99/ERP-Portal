// FI-011 차입금및파생상품 (Financial Loan & Derivative Management) — 금융기관 차입금·외화 차입 및 이자율/통화 파생상품 헤지 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface FinancialLoanItem {
  id: string;
  loanNo: string;
  financialBankName: string; // 금융기관 (예: 신한은행 본점, KB국민은행, 산업은행)
  loanTypeCategory: "시설자금 장기차입금" | "운전자금 단기차입금" | "외화 차입금 (USD)";
  principalAmount: number; // 원금 대출 금액 (KRW 또는 USD)
  interestRatePct: number; // 대출 금리 (%)
  maturityDate: string; // 만기 일자
  monthlyInterestFee: number; // 월 이자 비용 (KRW)
  status: "정상 상환중" | "만기 연장 대기";
}

export const financialLoanStore = createStore("fi.financial_loan", [
  { id: "LON-01", loanNo: "LOAN-2025-001", financialBankName: "KDB 산업은행", loanTypeCategory: "시설자금 장기차입금", principalAmount: 5000000000, interestRatePct: 4.2, maturityDate: "2028-12-31", monthlyInterestFee: 17500000, status: "정상 상환중" },
  { id: "LON-02", loanNo: "LOAN-2026-002", financialBankName: "신한은행 강남법인센터", loanTypeCategory: "운전자금 단기차입금", principalAmount: 2000000000, interestRatePct: 4.8, maturityDate: "2026-11-30", monthlyInterestFee: 8000000, status: "정상 상환중" },
  { id: "LON-03", loanNo: "LOAN-FX-001", financialBankName: "Citi Bank NY", loanTypeCategory: "외화 차입금 (USD)", principalAmount: 1000000, interestRatePct: 5.1, maturityDate: "2027-06-30", monthlyInterestFee: 42500, status: "정상 상환중" },
]);

export default function FinancialLoanManagement() {
  const items = useStore(financialLoanStore) as FinancialLoanItem[];
  const [typeFilter, setTypeFilter] = useState("전체");

  const filtered = items.filter((i) => typeFilter === "전체" || i.loanTypeCategory.includes(typeFilter));

  const totalPrincipalKrw = filtered
    .filter((i) => !i.loanTypeCategory.includes("USD"))
    .reduce((acc, i) => acc + i.principalAmount, 0);

  const excel = () =>
    downloadCsv(
      "재무_차입금_파생상품_관리_대장.csv",
      ["차입금번호", "금융기관명", "차입금구분", "원금금액", "대출금리(%)", "만기일자", "월이자비용", "상태"],
      filtered.map((i) => [
        i.loanNo,
        i.financialBankName,
        i.loanTypeCategory,
        i.principalAmount,
        `${i.interestRatePct}%`,
        i.maturityDate,
        i.monthlyInterestFee,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. Financial Accounting (재무회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">차입금및파생상품 (FI-011)</h1>
          <span className="text-[11px] text-sub">금융기관 시설자금 · 단기/장기 차입금 마스터 및 외화 금리/통화 파생상품 헤지 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 원화 차입금 잔액</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalPrincipalKrw / 100000000).toFixed(0)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 차입금 대출 금리</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.interestRatePct, 0) / (filtered.length || 1)).toFixed(2)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">외화 차입금 잔액 (USD)</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            $1,000,000 <span className="text-xs font-normal text-ink">USD</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">구분:</span>
          {["전체", "장기차입금", "단기차입금", "외화 차입금"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                typeFilter === t
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 차입금관리 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">차입금 번호</th>
              <th className="px-3 py-2">금융기관명</th>
              <th className="px-3 py-2">차입금 구분</th>
              <th className="px-3 py-2 text-right">차입 원금 금액</th>
              <th className="px-3 py-2 text-right">대출 금리</th>
              <th className="px-3 py-2">만기 예정일</th>
              <th className="px-3 py-2 text-right">월 발생 이자액</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.loanNo}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.financialBankName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.loanTypeCategory}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
                  {i.loanTypeCategory.includes("USD") ? `$${i.principalAmount.toLocaleString()}` : `${(i.principalAmount / 100000000).toFixed(0)}억원`}
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.interestRatePct.toFixed(2)}%</td>
                <td className="px-3 py-2 font-mono text-sub">{i.maturityDate}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">
                  {i.loanTypeCategory.includes("USD") ? `$${i.monthlyInterestFee.toLocaleString()}` : `${(i.monthlyInterestFee / 10000).toLocaleString()}만원`}
                </td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
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
