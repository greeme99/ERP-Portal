// SV-009 출장AS동선매핑 (Field Engineer GPS & Route Mapping) — 출장 AS 엔지니어 실시간 위치 및 최적 방문 동선 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface FieldEngineerRouteItem {
  id: string;
  engineerId: string;
  engineerName: string; // 엔지니어 성명 (예: 김동선 엔지니어, 박출장 기사)
  serviceRegion: string; // 관할 방문 지역 (예: 서울 강남/서초권역, 경기 성남/분당권역)
  currentGpsLocation: string; // 현재 GPS 위치 (예: 서울 서초구 반포동)
  assignedTodayJobsCount: number; // 오늘 할당된 출장 방문 건수
  completedJobsCount: number; // 현재 완료한 방문 건수
  routeOptimizationDistanceKm: number; // 최적 동선 이동 거리 (km)
  onTimeArrivalPct: number; // 고객 약속 시간 정시 도착률 (%)
  status: "이동중 (En Route)" | "수리작업중 (On Site)" | "업무 종료";
}

export const fieldRouteStore = createStore("sv.field_route", [
  { id: "ENG-01", engineerId: "ENG-ST01", engineerName: "김동선 테크니션", serviceRegion: "서울 강남/서초권역", currentGpsLocation: "서울 서초구 반포동 아파트 102동", assignedTodayJobsCount: 6, completedJobsCount: 4, routeOptimizationDistanceKm: 18.5, onTimeArrivalPct: 100.0, status: "수리작업중 (On Site)" },
  { id: "ENG-02", engineerId: "ENG-ST02", engineerName: "박출장 기사", serviceRegion: "경기 성남/분당권역", currentGpsLocation: "경기 성남시 분당구 정자동", assignedTodayJobsCount: 5, completedJobsCount: 3, routeOptimizationDistanceKm: 22.0, onTimeArrivalPct: 96.0, status: "이동중 (En Route)" },
]);

export default function FieldServiceLocationMapping() {
  const items = useStore(fieldRouteStore) as FieldEngineerRouteItem[];
  const [regionFilter, setRegionFilter] = useState("전체");

  const filtered = items.filter((i) => regionFilter === "전체" || i.serviceRegion.includes(regionFilter));

  const totalAssigned = filtered.reduce((acc, i) => acc + i.assignedTodayJobsCount, 0);
  const totalCompleted = filtered.reduce((acc, i) => acc + i.completedJobsCount, 0);

  const excel = () =>
    downloadCsv(
      "서비스_출장AS_엔지니어_동선매핑_대장.csv",
      ["기사ID", "엔지니어명", "관할지역", "현재위치", "할당건수", "완료건수", "이동거리(km)", "정시도착률(%)", "상태"],
      filtered.map((i) => [
        i.engineerId,
        i.engineerName,
        i.serviceRegion,
        i.currentGpsLocation,
        i.assignedTodayJobsCount,
        i.completedJobsCount,
        `${i.routeOptimizationDistanceKm}km`,
        `${i.onTimeArrivalPct}%`,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. Customer Service (고객서비스)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">출장AS동선매핑 (SV-009)</h1>
          <span className="text-[11px] text-sub">전국 출장 AS 엔지니어 실시간 GPS 위치 모니터링 · 최적 방문 경로 매핑 및 이동 효율화</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">오늘 총 출장 방문 완료율</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">
            {((totalCompleted / (totalAssigned || 1)) * 100).toFixed(1)}% <span className="text-xs font-normal text-ink">({totalCompleted}/{totalAssigned}건)</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">엔지니어 정시 도착 준수율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.onTimeArrivalPct, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">동선 최적화 일평균 절감 거리</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">6.4 <span className="text-xs font-normal text-ink">km 절감</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">지역:</span>
          {["전체", "서울", "경기"].map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                regionFilter === r
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 동선매핑 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">기사 ID / 성명</th>
              <th className="px-3 py-2">관할 방문 권역</th>
              <th className="px-3 py-2">현재 GPS 위치</th>
              <th className="px-3 py-2 text-right">오늘 할당 / 완료</th>
              <th className="px-3 py-2 text-right">최적 동선 거리</th>
              <th className="px-3 py-2 text-right">정시 도착률</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">
                  <div className="font-bold font-mono text-blue-600">{i.engineerId}</div>
                  <div className="text-[11px] text-ink font-semibold">{i.engineerName}</div>
                </td>
                <td className="px-3 py-2 text-sub font-medium">{i.serviceRegion}</td>
                <td className="px-3 py-2 text-emerald-600 font-semibold text-[11px]">{i.currentGpsLocation}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-ink">{i.completedJobsCount} / {i.assignedTodayJobsCount}건</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.routeOptimizationDistanceKm}km</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.onTimeArrivalPct.toFixed(1)}%</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.status.includes("작업중") ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
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
