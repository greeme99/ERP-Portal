// SD-007 출하현황 (Delivery & Shipment Status) — 수주건별 출하지시·운송 차량 배차·배송 실시간 트래킹 및 OTD 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface DeliveryStatusItem {
  id: string;
  deliveryNo: string;
  soNumber: string;
  customerName: string;
  productName: string;
  shippedQty: number;
  deliveryDate: string;
  truckNo: string; // 배차 차량번호 (예: 80가 1234)
  driverContact: string;
  shipmentStatus: "배송완료" | "배송중" | "출하대기";
  otdStatus: "정상 준수" | "지연";
}

export const deliveryStatusStore = createStore("sd.delivery_status", [
  { id: "DLV-01", deliveryNo: "DLV-2026-0701", soNumber: "SO-26078", customerName: "삼성전자 글로벌", productName: "소형가전 무선청소기 FG-1001", shippedQty: 400, deliveryDate: "2026-07-27", truckNo: "경기 82자 5678 (11톤 윙바디)", driverContact: "김운송 (010-1234-5678)", shipmentStatus: "배송완료", otdStatus: "정상 준수" },
  { id: "DLV-02", deliveryNo: "DLV-2026-0702", soNumber: "SO-26079", customerName: "LG전자", productName: "스마트 무선 로봇청소기 FG-1002", shippedQty: 250, deliveryDate: "2026-08-05", truckNo: "서울 80가 9912 (5톤 탑차)", driverContact: "이배송 (010-8888-9999)", shipmentStatus: "배송중", otdStatus: "정상 준수" },
  { id: "DLV-03", deliveryNo: "DLV-2026-0703", soNumber: "SO-26080", customerName: "쿠쿠전자", productName: "전자기판 컨트롤러 모듈 SF-2001", shippedQty: 1000, deliveryDate: "2026-08-07", truckNo: "미배차", driverContact: "-", shipmentStatus: "출하대기", otdStatus: "정상 준수" },
]);

export default function DeliveryStatus() {
  const items = useStore(deliveryStatusStore) as DeliveryStatusItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.shipmentStatus === statusFilter);

  const totalQty = filtered.reduce((acc, i) => acc + i.shippedQty, 0);

  const excel = () =>
    downloadCsv(
      "영업_수주_출하배송_현황대장.csv",
      ["출하번호", "수주번호", "고객사명", "제품명", "출하수량", "출하일자", "차량번호", "기사연락처", "배송상태", "OTD상태"],
      filtered.map((i) => [
        i.deliveryNo,
        i.soNumber,
        i.customerName,
        i.productName,
        i.shippedQty,
        i.deliveryDate,
        i.truckNo,
        i.driverContact,
        i.shipmentStatus,
        i.otdStatus,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">출하현황 (SD-007)</h1>
          <span className="text-[11px] text-sub">수주건별 출하 지시 · 운송 배차 및 위치 트래킹 · OTD 납기 준수율 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 출하 수량</div>
          <div className="text-xl font-bold mt-1 font-mono">{totalQty.toLocaleString()} <span className="text-xs font-normal">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">배송 완료 수량</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {items.filter((i) => i.shipmentStatus === "배송완료").reduce((acc, i) => acc + i.shippedQty, 0).toLocaleString()} <span className="text-xs font-normal text-ink">EA</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">OTD 정시 출하 준수율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "배송완료", "배송중", "출하대기"].map((st) => (
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
          📥 출하현황 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">출하 번호</th>
              <th className="px-3 py-2">수주 번호 / 고객사</th>
              <th className="px-3 py-2">제품명</th>
              <th className="px-3 py-2 text-right">출하 수량</th>
              <th className="px-3 py-2">출하 일자</th>
              <th className="px-3 py-2">배차 차량번호 / 연락처</th>
              <th className="px-3 py-2">배송 상태</th>
              <th className="px-3 py-2">OTD</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">{i.deliveryNo}</td>
                <td className="px-3 py-2 font-medium">
                  <div>{i.customerName}</div>
                  <div className="text-[11px] text-sub">{i.soNumber}</div>
                </td>
                <td className="px-3 py-2 text-sub font-medium">{i.productName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.shippedQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 font-mono text-sub">{i.deliveryDate}</td>
                <td className="px-3 py-2 text-sub">
                  <div>{i.truckNo}</div>
                  <div className="text-[11px]">{i.driverContact}</div>
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.shipmentStatus === "배송완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    i.shipmentStatus === "배송중" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.shipmentStatus}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.otdStatus}
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
