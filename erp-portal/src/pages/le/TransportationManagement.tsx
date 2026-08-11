// LE-008 운송관리 (TMS) — 배차 계획·운송 차량(톤수별) 배정·배송 경로 및 정시 도착률(OTD) 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ShipmentDispatch {
  id: string;
  dispatchNo: string; // 배차번호
  vehicleNo: string; // 차량번호 (예: 경기80바 1234)
  truckType: "1톤 용달" | "3.5톤 카고" | "11톤 윙바디";
  driverName: string;
  routeRegion: "수도권" | "충청/전라권" | "경상/부산권";
  destCustomer: string;
  freightCost: number; // 운송비용 (KRW)
  status: "배차완료" | "운송중" | "배송완료" | "지연";
  dispatchedAt: string;
}

export const tmsStore = createStore("le.tms", [
  { id: "TMS-01", dispatchNo: "DSP-2026-0801", vehicleNo: "경기80바 1234", truckType: "3.5톤 카고", driverName: "박운송", routeRegion: "수도권", destCustomer: "삼성전자 수원물류센터", freightCost: 250000, status: "배송완료", dispatchedAt: "2026-08-01" },
  { id: "TMS-02", dispatchNo: "DSP-2026-0802", vehicleNo: "서울82아 5678", truckType: "11톤 윙바디", driverName: "이물류", routeRegion: "경상/부산권", destCustomer: "LG전자 창원공장", freightCost: 650000, status: "운송중", dispatchedAt: "2026-08-03" },
  { id: "TMS-03", dispatchNo: "DSP-2026-0803", vehicleNo: "인천81자 9012", truckType: "1톤 용달", driverName: "김신속", routeRegion: "수도권", destCustomer: "쿠쿠전자 시흥공장", freightCost: 120000, status: "배송완료", dispatchedAt: "2026-08-04" },
  { id: "TMS-04", dispatchNo: "DSP-2026-0804", vehicleNo: "충남83배 3456", truckType: "3.5톤 카고", driverName: "최안전", routeRegion: "충청/전라권", destCustomer: "한일전기 천안물류", freightCost: 320000, status: "배차완료", dispatchedAt: "2026-08-05" },
]);

export default function TransportationManagement() {
  const dispatches = useStore(tmsStore) as ShipmentDispatch[];
  const [regionFilter, setRegionFilter] = useState("전체");

  const filtered = dispatches.filter((d) => regionFilter === "전체" || d.routeRegion === regionFilter);

  const totalFreight = filtered.reduce((acc, d) => acc + d.freightCost, 0);
  const completedCount = filtered.filter((d) => d.status === "배송완료").length;

  const excel = () =>
    downloadCsv(
      "운송_TMS_배차대장.csv",
      ["배차번호", "차량번호", "차종", "운전자", "운송권역", "도착지", "운송비용(원)", "상태", "배차일자"],
      filtered.map((d) => [
        d.dispatchNo,
        d.vehicleNo,
        d.truckType,
        d.driverName,
        d.routeRegion,
        d.destCustomer,
        d.freightCost,
        d.status,
        d.dispatchedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">04. Logistics Management (물류관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">운송관리 TMS (LE-008)</h1>
          <span className="text-[11px] text-sub">차량 배차계획 · 톤수별 차량 배정 · 운송비용 및 경로 실시간 모니터링</span>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 운송 비용</div>
          <div className="text-xl font-bold mt-1 font-mono">{totalFreight.toLocaleString()} <span className="text-xs font-normal">원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">배송 완료율</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {((completedCount / dispatches.length) * 100).toFixed(0)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">총 배차 차량</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{dispatches.length} <span className="text-xs font-normal text-ink">대</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">권역 필터:</span>
          {["전체", "수도권", "충청/전라권", "경상/부산권"].map((reg) => (
            <button
              key={reg}
              onClick={() => setRegionFilter(reg)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                regionFilter === reg
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 TMS 배차대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">배차번호</th>
              <th className="px-3 py-2">차량번호</th>
              <th className="px-3 py-2">차종</th>
              <th className="px-3 py-2">운전자</th>
              <th className="px-3 py-2">운송 권역</th>
              <th className="px-3 py-2">도착지 고객사</th>
              <th className="px-3 py-2 text-right">운송비용</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">배차일자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{d.dispatchNo}</td>
                <td className="px-3 py-2 font-mono">{d.vehicleNo}</td>
                <td className="px-3 py-2 text-sub">{d.truckType}</td>
                <td className="px-3 py-2 font-medium">{d.driverName}</td>
                <td className="px-3 py-2 text-sub">{d.routeRegion}</td>
                <td className="px-3 py-2">{d.destCustomer}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{d.freightCost.toLocaleString()}원</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    d.status === "배송완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    d.status === "운송중" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{d.dispatchedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
