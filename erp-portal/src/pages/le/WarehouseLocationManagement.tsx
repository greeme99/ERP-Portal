// LE-009 로케이션관리 (Warehouse Location & Storage Bin Management) — 창고 구역·로케이션 랙(Rack/Bin) 적재 CAPA 및 재고 위치 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface LocationBinItem {
  id: string;
  locationCode: string;
  warehouseName: string;
  zoneCategory: "A구역 (원자재랙)" | "B구역 (반제품랙)" | "C구역 (완제품랙)" | "D구역 (위험물/시품)";
  maxCapacityQty: number; // 최대 적재 가능 수량 (EA)
  currentStockQty: number; // 현재 실제 적재 수량 (EA)
  occupancyRatePct: number; // 랙 점유율 (%) = current / max
  tempHumidityCond: string; // 온습도 관리 조건 (예: 상온 20℃, 습도 50% 이하)
  status: "정상 적재" | "포화" | "공간 여유";
}

export const locationBinStore = createStore("le.location_bin", [
  { id: "LOC-01", locationCode: "WH1-A-01-01", warehouseName: "제1 원자재 창고", zoneCategory: "A구역 (원자재랙)", maxCapacityQty: 10000, currentStockQty: 7800, occupancyRatePct: 78.0, tempHumidityCond: "상온 20℃ (습도 50% 이하)", status: "정상 적재" },
  { id: "LOC-02", locationCode: "WH1-B-02-03", warehouseName: "제1 원자재 창고", zoneCategory: "B구역 (반제품랙)", maxCapacityQty: 2000, currentStockQty: 360, occupancyRatePct: 18.0, tempHumidityCond: "상온 22℃", status: "공간 여유" },
  { id: "LOC-03", locationCode: "WH2-C-01-05", warehouseName: "제2 완제품 자동창고", zoneCategory: "C구역 (완제품랙)", maxCapacityQty: 3000, currentStockQty: 1730, occupancyRatePct: 57.7, tempHumidityCond: "항온항습 18℃/45%", status: "정상 적재" },
]);

export default function WarehouseLocationManagement() {
  const items = useStore(locationBinStore) as LocationBinItem[];
  const [zoneFilter, setZoneFilter] = useState("전체");

  const filtered = items.filter((i) => zoneFilter === "전체" || i.zoneCategory.includes(zoneFilter));

  const avgOccupancy = filtered.reduce((acc, i) => acc + i.occupancyRatePct, 0) / (filtered.length || 1);

  const excel = () =>
    downloadCsv(
      "물류_창고_로케이션_랙_적재_대장.csv",
      ["로케이션코드", "창고명", "구역분류", "최대적재CAPA(EA)", "현재적재량(EA)", "랙점유율(%)", "온습도관리조건", "상태"],
      filtered.map((i) => [
        i.locationCode,
        i.warehouseName,
        i.zoneCategory,
        i.maxCapacityQty,
        i.currentStockQty,
        `${i.occupancyRatePct.toFixed(1)}%`,
        i.tempHumidityCond,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">03. Logistics Execution (물류실행)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">로케이션관리 (LE-009)</h1>
          <span className="text-[11px] text-sub">창고 구역(Zone) 및 로케이션 랙(Rack/Storage Bin) 적재 CAPA · 실적 점유율 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">등록 창고 로케이션 랙 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">개소</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 랙 적재 점유율 (Occupancy)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgOccupancy.toFixed(1)}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">현재 총 적재 재고량</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {filtered.reduce((acc, i) => acc + i.currentStockQty, 0).toLocaleString()} <span className="text-xs font-normal text-ink">EA</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">구역:</span>
          {["전체", "A구역", "B구역", "C구역"].map((z) => (
            <button
              key={z}
              onClick={() => setZoneFilter(z)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                zoneFilter === z
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 로케이션 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">로케이션 코드</th>
              <th className="px-3 py-2">창고명</th>
              <th className="px-3 py-2">구역 분류</th>
              <th className="px-3 py-2 text-right">최대 CAPA</th>
              <th className="px-3 py-2 text-right">현재 적재량</th>
              <th className="px-3 py-2 text-right">랙 점유율</th>
              <th className="px-3 py-2">온습도 관리 조건</th>
              <th className="px-3 py-2">적재 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.locationCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.warehouseName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.zoneCategory}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.maxCapacityQty.toLocaleString()}EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.currentStockQty.toLocaleString()}EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.occupancyRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-sub text-[11px]">{i.tempHumidityCond}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.status === "포화" ? "bg-red-100 text-red-700 border border-red-200" :
                    i.status === "공간 여유" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
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
