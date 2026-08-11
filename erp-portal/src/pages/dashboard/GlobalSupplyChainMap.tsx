// GlobalSupplyChainMap.tsx (GIS Vessel & Global Logistics Command Map) — 글로벌 공급망 GIS 수송 및 항만 통관 관제
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface GlobalScmVesselItem {
  id: string;
  containerShipId: string; // 컨테이너선/항공편 (예: HMM SEOUL 2026-08V, KAL-CARGO 805)
  originPortLocation: string; // 출발항 (예: 일본 오사카항, 베트남 하이퐁항, 한국 부산항)
  destinationPortLocation: string; // 도착항 (예: 한국 인천항, 미국 LA 롱비치항, 독일 함부르크항)
  cargoMaterialDetails: string; // 화물 적재 내용 (예: BLDC 모터 자재 RM-3004 7,000개, 청소기 완성품 500대)
  estimatedArrivalEta: string; // 입항 예정일 (ETA)
  logisticsRiskIndex: "정시 운항 (Low Risk)" | "기상 악화 1일 지연" | "통관 검사 대기";
  shipmentStatus: "해상 수송중 (In-Transit)" | "통관 완료 입고";
}

export const scmMapStore = createStore("dashboard.scm_map", [
  { id: "SHIP-01", containerShipId: "HMM SEOUL 0806V", originPortLocation: "일본 오사카 (Osaka, JP)", destinationPortLocation: "대한민국 부산항 (Busan, KR)", cargoMaterialDetails: "초고속 BLDC 수입 모터 키트 (RM-3004 7,000EA)", estimatedArrivalEta: "2026-08-08 14:00", logisticsRiskIndex: "정시 운항 (Low Risk)", shipmentStatus: "해상 수송중 (In-Transit)" },
  { id: "SHIP-02", containerShipId: "PACIFIC EXPRESS 12", originPortLocation: "대한민국 부산항 (Busan, KR)", destinationPortLocation: "미국 LA 롱비치항 (Long Beach, US)", cargoMaterialDetails: "스마트 로봇청소기 프리미엄 수출 물량 (FG-1001 400대)", estimatedArrivalEta: "2026-08-18 09:00", logisticsRiskIndex: "정시 운항 (Low Risk)", shipmentStatus: "해상 수송중 (In-Transit)" },
]);

export default function GlobalSupplyChainMap() {
  const items = useStore(scmMapStore) as GlobalScmVesselItem[];
  const [portFilter, setPortFilter] = useState("전체");

  const filtered = items.filter((i) => portFilter === "전체" || i.destinationPortLocation.includes(portFilter));

  const excel = () =>
    downloadCsv(
      "글로벌_공급망_수송_항만통관_관제_대장.csv",
      ["선박/항공편ID", "출발항", "도착항", "화물적재내용", "입항예정일(ETA)", "물류위험지수", "수송상태"],
      filtered.map((i) => [
        i.containerShipId,
        i.originPortLocation,
        i.destinationPortLocation,
        i.cargoMaterialDetails,
        i.estimatedArrivalEta,
        i.logisticsRiskIndex,
        i.shipmentStatus,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">00. Executive & AI Command (물류 관제)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">글로벌 공급망 GIS 수송 및 물류 관제</h1>
          <span className="text-[11px] text-sub">해외 원자재 입하선 및 북미/유럽 수출 선박 실시간 위치 · ETA 입항 예정일 및 항만 통관 관제</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">실시간 해상 수송 중 선박/항공 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">척 / 편</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">정시 ETA 입항 이행률 (On-Time ETA)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">수출입 통관 위험 지수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">안정 (Low Risk)</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">도착항:</span>
          {["전체", "부산", "LA"].map((p) => (
            <button
              key={p}
              onClick={() => setPortFilter(p)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                portFilter === p
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 해상물류관제 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">선박 / 항공편 ID</th>
              <th className="px-3 py-2">출발항 (Origin)</th>
              <th className="px-3 py-2">도착항 (Destination)</th>
              <th className="px-3 py-2">화물 적재 내용</th>
              <th className="px-3 py-2 font-mono">입항 예정일 (ETA)</th>
              <th className="px-3 py-2">물류 위험 지수</th>
              <th className="px-3 py-2">수송 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.containerShipId}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.originPortLocation}</td>
                <td className="px-3 py-2 font-medium text-purple-700">{i.destinationPortLocation}</td>
                <td className="px-3 py-2 font-bold text-emerald-600 text-[11px]">{i.cargoMaterialDetails}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.estimatedArrivalEta}</td>
                <td className="px-3 py-2 font-medium text-ink text-[11px]">{i.logisticsRiskIndex}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.shipmentStatus}
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
