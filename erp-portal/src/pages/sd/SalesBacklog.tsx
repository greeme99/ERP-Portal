// SD-006 수주 잔고 (Sales Order Backlog) — 고객사/품목별 수주 수량·출하 완료 수량·미출하 잔고 및 납기 예정일 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SalesBacklogItem {
  id: string;
  soNumber: string;
  customerName: string;
  materialCode: string;
  materialName: string;
  orderQty: number; // 총 수주 수량
  shippedQty: number; // 이미 출하 완료 수량
  backlogQty: number; // 미출하 잔고 수량 = Order - Shipped
  backlogAmount: number; // 잔고 금액 (KRW)
  scheduledDeliveryDate: string; // 납기 예정일
  status: "정상 진행" | "납기 임박" | "출하 완료";
}

export const salesBacklogStore = createStore("sd.sales_backlog", [
  { id: "BKL-01", soNumber: "SO-26078", customerName: "삼성전자 글로벌", materialCode: "FG-1001", materialName: "소형가전 무선청소기", orderQty: 1000, shippedQty: 400, backlogQty: 600, backlogAmount: 49200000, scheduledDeliveryDate: "2026-08-15", status: "정상 진행" },
  { id: "BKL-02", soNumber: "SO-26079", customerName: "LG전자", materialCode: "FG-1002", materialName: "스마트 무선 로봇청소기", orderQty: 500, shippedQty: 250, backlogQty: 250, backlogAmount: 43750000, scheduledDeliveryDate: "2026-08-10", status: "납기 임박" },
  { id: "BKL-03", soNumber: "SO-26080", customerName: "쿠쿠전자", materialCode: "SF-2001", materialName: "전자기판 모듈", orderQty: 2000, shippedQty: 2000, backlogQty: 0, backlogAmount: 0, scheduledDeliveryDate: "2026-07-30", status: "출하 완료" },
]);

export default function SalesBacklog() {
  const items = useStore(salesBacklogStore) as SalesBacklogItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status === statusFilter);

  const totalBacklogQty = filtered.reduce((acc, i) => acc + i.backlogQty, 0);
  const totalBacklogAmount = filtered.reduce((acc, i) => acc + i.backlogAmount, 0);

  const excel = () =>
    downloadCsv(
      "영업_미출하_수주잔고_대장.csv",
      ["수주번호", "고객사명", "품목코드", "품목명", "수주수량", "출하완료수량", "수주잔고수량", "잔고금액(원)", "납기예정일", "상태"],
      filtered.map((i) => [
        i.soNumber,
        i.customerName,
        i.materialCode,
        i.materialName,
        i.orderQty,
        i.shippedQty,
        i.backlogQty,
        i.backlogAmount,
        i.scheduledDeliveryDate,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">수주 잔고 (SD-006)</h1>
          <span className="text-[11px] text-sub">고객사/품목별 총 수주 수량 대비 출하 실적 및 미출하 수주 잔고(Backlog) 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">총 미출하 수주 잔고 수량</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{totalBacklogQty.toLocaleString()} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">총 수주 잔고 금액</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{(totalBacklogAmount / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">미출하 잔고 이행 진행률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(((items.reduce((acc, i) => acc + i.shippedQty, 0)) / (items.reduce((acc, i) => acc + i.orderQty, 0) || 1)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "정상 진행", "납기 임박", "출하 완료"].map((st) => (
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
          📥 수주잔고 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">수주 번호</th>
              <th className="px-3 py-2">고객사명</th>
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2 text-right">총 수주량</th>
              <th className="px-3 py-2 text-right">출하 완료량</th>
              <th className="px-3 py-2 text-right">수주 잔고량</th>
              <th className="px-3 py-2 text-right">잔고 금액</th>
              <th className="px-3 py-2">납기 예정일</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">{i.soNumber}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.customerName}</td>
                <td className="px-3 py-2 text-sub">{i.materialCode} — {i.materialName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.orderQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.shippedQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-amber-600">{i.backlogQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.backlogAmount / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 font-mono text-sub">{i.scheduledDeliveryDate}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.status === "출하 완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    i.status === "납기 임박" ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-700 border border-amber-200"
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
