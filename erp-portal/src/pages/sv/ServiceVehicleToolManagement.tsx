// SV-013 출장차량공구관리 (Service Vehicle & Tool Inventory Management) — 출장 수리 차량 및 전용 계측 공구 적재 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ServiceVehicleItem {
  id: string;
  vehicleNo: string; // 출장 차량 번호 (예: 12가 3456 레이 밴)
  assignedCenterName: string; // 소속 AS 센터 (예: 서울 강남 메가 AS센터)
  assignedEngineerName: string; // 담당 기사 성명
  accumulatedDistanceKm: number; // 누적 주행 거리 (km)
  loadedToolKitStatus: "전용 공구세트 풀세트 적재" | "정밀 계측기 교정 필요"; // 계측 공구 상태
  nextMaintenanceDate: string; // 차량 차기 정기 점검일
  status: "운행 가능" | "점검 정비중";
}

export const vehicleToolStore = createStore("sv.vehicle_tool", [
  { id: "VEH-01", vehicleNo: "12가 3456 (레이 밴)", assignedCenterName: "서울 강남 메가 AS센터", assignedEngineerName: "김동선 테크니션", accumulatedDistanceKm: 42500, loadedToolKitStatus: "전용 공구세트 풀세트 적재", nextMaintenanceDate: "2026-10-15", status: "운행 가능" },
  { id: "VEH-02", vehicleNo: "56나 7890 (캐스퍼 밴)", assignedCenterName: "경기 성남/분당 AS센터", assignedEngineerName: "박출장 기사", accumulatedDistanceKm: 31000, loadedToolKitStatus: "정밀 계측기 교정 필요", nextMaintenanceDate: "2026-09-01", status: "운행 가능" },
]);

export default function ServiceVehicleToolManagement() {
  const items = useStore(vehicleToolStore) as ServiceVehicleItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status.includes(statusFilter));

  const excel = () =>
    downloadCsv(
      "서비스_출장차량_공구관리_대장.csv",
      ["차량번호", "소속센터", "담당엔지니어", "누적주행거리(km)", "공구적재상태", "차기점검일", "운행상태"],
      filtered.map((i) => [
        i.vehicleNo,
        i.assignedCenterName,
        i.assignedEngineerName,
        `${i.accumulatedDistanceKm}km`,
        i.loadedToolKitStatus,
        i.nextMaintenanceDate,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. Customer Service (고객서비스)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">출장차량공구관리 (SV-013)</h1>
          <span className="text-[11px] text-sub">전국 출장 AS 전용 차량 주행거리 관리 · 차량 적재 정밀 수리 공구 키트 점검</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">운행 중인 출장 전용 차량</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">대</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">차량 평균 누적 주행거리</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.accumulatedDistanceKm, 0) / (filtered.length || 1)).toLocaleString()} <span className="text-xs font-normal text-ink">km</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">공구 키트 수명 이행률</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "운행 가능"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === s
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 차량공구 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">출장 차량 번호</th>
              <th className="px-3 py-2">소속 AS 센터</th>
              <th className="px-3 py-2">담당 기사 성명</th>
              <th className="px-3 py-2 text-right">누적 주행거리</th>
              <th className="px-3 py-2">적재 공구키트 상태</th>
              <th className="px-3 py-2">차량 차기 점검일</th>
              <th className="px-3 py-2">운행 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.vehicleNo}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.assignedCenterName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.assignedEngineerName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.accumulatedDistanceKm.toLocaleString()}km</td>
                <td className="px-3 py-2 font-semibold text-emerald-600 text-[11px]">{i.loadedToolKitStatus}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.nextMaintenanceDate}</td>
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
