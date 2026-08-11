// FI-009 세무관리 — 전자세금계산서(매출/매입) 발행 대장·부가가치세(VAT) 신고 및 원천징수 세액 집계
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface TaxInvoice {
  id: string;
  invoiceNo: string; // 승인번호 (24자)
  type: "매출세금계산서" | "매입세금계산서";
  partnerName: string; // 거래처명
  businessNo: string; // 사업자등록번호
  supplyAmount: number; // 공급가액 (KRW)
  vatAmount: number; // 부가가치세액 (KRW)
  totalAmount: number; // 합계금액 (KRW)
  ntsStatus: "국세청전송완료" | "전송대기" | "반려";
  issuedAt: string;
}

export const taxInvoiceStore = createStore("fi.tax_invoice", [
  { id: "TAX-01", invoiceNo: "20260731-41000123-0001", type: "매출세금계산서", partnerName: "삼성전자(주)", businessNo: "124-81-00123", supplyAmount: 32800000, vatAmount: 3280000, totalAmount: 36080000, ntsStatus: "국세청전송완료", issuedAt: "2026-07-31" },
  { id: "TAX-02", invoiceNo: "20260801-41000123-0002", type: "매입세금계산서", partnerName: "LG화학(주)", businessNo: "107-86-12345", supplyAmount: 16000000, vatAmount: 1600000, totalAmount: 17600000, ntsStatus: "국세청전송완료", issuedAt: "2026-08-01" },
  { id: "TAX-03", invoiceNo: "20260802-41000123-0003", type: "매입세금계산서", partnerName: "LS전선(주)", businessNo: "116-81-67890", supplyAmount: 23000000, vatAmount: 2300000, totalAmount: 25300000, ntsStatus: "국세청전송완료", issuedAt: "2026-08-02" },
  { id: "TAX-04", invoiceNo: "20260804-41000123-0004", type: "매출세금계산서", partnerName: "(주)쿠쿠전자", businessNo: "135-85-45678", supplyAmount: 18500000, vatAmount: 1850000, totalAmount: 20350000, ntsStatus: "전송대기", issuedAt: "2026-08-04" },
]);

export default function TaxManagement() {
  const invoices = useStore(taxInvoiceStore) as TaxInvoice[];
  const [typeFilter, setTypeFilter] = useState("전체");

  const filtered = invoices.filter((i) => typeFilter === "전체" || i.type === typeFilter);

  // 매출 부가세 - 매입 부가세 = 납부/환급 예상 부가세
  const salesVat = invoices.filter((i) => i.type === "매출세금계산서").reduce((acc, i) => acc + i.vatAmount, 0);
  const purchaseVat = invoices.filter((i) => i.type === "매입세금계산서").reduce((acc, i) => acc + i.vatAmount, 0);
  const netVatPayable = salesVat - purchaseVat;

  const excel = () =>
    downloadCsv(
      "세무_전자세금계산서_대장.csv",
      ["승인번호", "구분", "거래처명", "사업자번호", "공급가액(원)", "부가세액(원)", "합계금액(원)", "국세청승인상태", "발행일자"],
      filtered.map((i) => [
        i.invoiceNo,
        i.type,
        i.partnerName,
        i.businessNo,
        i.supplyAmount,
        i.vatAmount,
        i.totalAmount,
        i.ntsStatus,
        i.issuedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. Financial Accounting (재무회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">세무관리 (FI-009)</h1>
          <span className="text-[11px] text-sub">전자세금계산서 대장 · 매출/매입 부가가치세(VAT) 정산 · 국세청 전송 모니터링</span>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">매출 부가가치세 (예수금)</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">+{salesVat.toLocaleString()} <span className="text-xs font-normal text-ink">원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">매입 부가가치세 (대급금)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">-{purchaseVat.toLocaleString()} <span className="text-xs font-normal text-ink">원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">차감 납부 예상 VAT</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{netVatPayable.toLocaleString()} <span className="text-xs font-normal text-ink">원</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">계산서 구분:</span>
          {["전체", "매출세금계산서", "매입세금계산서"].map((t) => (
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
          📥 세금계산서 대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">승인번호</th>
              <th className="px-3 py-2">구분</th>
              <th className="px-3 py-2">거래처명</th>
              <th className="px-3 py-2">사업자등록번호</th>
              <th className="px-3 py-2 text-right">공급가액</th>
              <th className="px-3 py-2 text-right">부가세액 (10%)</th>
              <th className="px-3 py-2 text-right">합계금액</th>
              <th className="px-3 py-2">국세청 전송상태</th>
              <th className="px-3 py-2">발행일자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium text-[11px]">{i.invoiceNo}</td>
                <td className="px-3 py-2 font-bold">
                  <span className={i.type === "매출세금계산서" ? "text-emerald-600" : "text-blue-600"}>{i.type}</span>
                </td>
                <td className="px-3 py-2">{i.partnerName}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.businessNo}</td>
                <td className="px-3 py-2 text-right font-mono">{i.supplyAmount.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-amber-600">{i.vatAmount.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{i.totalAmount.toLocaleString()}원</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.ntsStatus === "국세청전송완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.ntsStatus}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.issuedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
