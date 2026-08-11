// SD-008 반품관리 — 고객 반품 접수·사유분석·재입고/폐기 및 매출차감(RMA)
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SalesReturnItem {
  id: string;
  rmaNo: string; // RMA 번호
  soNo: string;
  customerName: string;
  materialCode: string;
  materialName: string;
  returnQty: number;
  reason: "기능불량" | "외관손상" | "오배송" | "단순변심";
  disposition: "재입고(양품)" | "재작업" | "폐기";
  refundAmount: number; // 환불/매출차감액 (KRW)
  status: "접수" | "검사중" | "승인완료" | "처리기각";
  returnedAt: string;
}

export const salesReturnStore = createStore("sd.return", [
  { id: "RMA-01", rmaNo: "RMA-2026-001", soNo: "SO-26071", customerName: "삼성전자 글로벌", materialCode: "FG-1001", materialName: "소형가전 무선청소기", returnQty: 5, reason: "기능불량", disposition: "재작업", refundAmount: 750000, status: "승인완료", returnedAt: "2026-07-25" },
  { id: "RMA-02", rmaNo: "RMA-2026-002", soNo: "SO-26075", customerName: "LG전자", materialCode: "FG-1002", materialName: "스마트 무선 로봇청소기", returnQty: 2, reason: "외관손상", disposition: "재입고(양품)", refundAmount: 500000, status: "승인완료", returnedAt: "2026-07-29" },
  { id: "RMA-03", rmaNo: "RMA-2026-003", soNo: "SO-26078", customerName: "쿠쿠전자", materialCode: "FG-2001", materialName: "전자기판 컨트롤러 모듈", returnQty: 10, reason: "오배송", disposition: "재입고(양품)", refundAmount: 400000, status: "검사중", returnedAt: "2026-08-02" },
  { id: "RMA-04", rmaNo: "RMA-2026-004", soNo: "SO-26079", customerName: "한일전기", materialCode: "FG-1001", materialName: "소형가전 무선청소기", returnQty: 1, reason: "단순변심", disposition: "폐기", refundAmount: 150000, status: "접수", returnedAt: "2026-08-05" },
]);

export default function SalesReturn() {
  const returns = useStore(salesReturnStore) as SalesReturnItem[];
  const [reasonFilter, setReasonFilter] = useState("전체");

  const filtered = returns.filter((r) => reasonFilter === "전체" || r.reason === reasonFilter);

  const totalReturnQty = filtered.reduce((acc, r) => acc + r.returnQty, 0);
  const totalRefund = filtered.reduce((acc, r) => acc + r.refundAmount, 0);

  const excel = () =>
    downloadCsv(
      "영업_반품관리_대장.csv",
      ["RMA번호", "수주번호", "고객사", "품목코드", "품목명", "반품수량", "반품사유", "후속조치", "매출차감액(원)", "상태", "접수일자"],
      filtered.map((r) => [
        r.rmaNo,
        r.soNo,
        r.customerName,
        r.materialCode,
        r.materialName,
        r.returnQty,
        r.reason,
        r.disposition,
        r.refundAmount,
        r.status,
        r.returnedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">반품관리 (SD-008)</h1>
          <span className="text-[11px] text-sub">고객 RMA 반품 접수 · 품질 판정 · 재입고 및 매출차감</span>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 반품 수량</div>
          <div className="text-xl font-bold mt-1 font-mono">{totalReturnQty} <span className="text-xs font-normal">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">매출 차감 금액 (환불)</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{totalRefund.toLocaleString()} <span className="text-xs font-normal text-ink">원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">RMA 승인완료 건수</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {returns.filter((r) => r.status === "승인완료").length} <span className="text-xs font-normal text-ink">건</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">사유 필터:</span>
          {["전체", "기능불량", "외관손상", "오배송", "단순변심"].map((rs) => (
            <button
              key={rs}
              onClick={() => setReasonFilter(rs)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                reasonFilter === rs
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {rs}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 반품대장 Excel 다운로드
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">RMA 번호</th>
              <th className="px-3 py-2">수주번호</th>
              <th className="px-3 py-2">고객사</th>
              <th className="px-3 py-2">품목명</th>
              <th className="px-3 py-2 text-right">반품수량</th>
              <th className="px-3 py-2">반품 사유</th>
              <th className="px-3 py-2">후속 조치</th>
              <th className="px-3 py-2 text-right">매출 차감액</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">접수일자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{r.rmaNo}</td>
                <td className="px-3 py-2 font-mono text-sub">{r.soNo}</td>
                <td className="px-3 py-2">{r.customerName}</td>
                <td className="px-3 py-2">{r.materialName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-red-500">{r.returnQty} EA</td>
                <td className="px-3 py-2 text-sub font-medium">{r.reason}</td>
                <td className="px-3 py-2 text-sub">{r.disposition}</td>
                <td className="px-3 py-2 text-right font-mono">{r.refundAmount.toLocaleString()}원</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.status === "승인완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{r.returnedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
