// MDM-005 작업장마스터 (Work Center Master) — 생산 라인별 공정 작업장·시간당 가공비 임율(Rate)·CAPA 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface WorkCenterMasterItem {
  id: string;
  workCenterCode: string;
  workCenterName: string;
  processCategory: "사출/프레스" | "자동 SMT" | "메인 조립" | "품질 에이징";
  hourlyLaborRate: number; // 시간당 노무비 임율 (원/h)
  hourlyOverheadRate: number; // 시간당 제조간접비 임율 (원/h)
  dailyCapacityHours: number; // 일일 가용 CAPA 시간 (h)
  status: "사용중" | "점검중";
  plantName: string;
}

export const workCenterMasterStore = createStore("mdm.work_center", [
  { id: "WC-01", workCenterCode: "WC-PRESS-01", workCenterName: "1번 사출 프레스 작업장", processCategory: "사출/프레스", hourlyLaborRate: 25000, hourlyOverheadRate: 35000, dailyCapacityHours: 16, status: "사용중", plantName: "제1제조공장" },
  { id: "WC-02", workCenterCode: "WC-SMT-01", workCenterName: "자동 SMT 라인 1호기", processCategory: "자동 SMT", hourlyLaborRate: 30000, hourlyOverheadRate: 48000, dailyCapacityHours: 24, status: "사용중", plantName: "제1제조공장" },
  { id: "WC-03", workCenterCode: "WC-ASSY-01", workCenterName: "메인 조립 A라인", processCategory: "메인 조립", hourlyLaborRate: 22000, hourlyOverheadRate: 18000, dailyCapacityHours: 16, status: "사용중", plantName: "제2제조공장" },
]);

export default function WorkCenterMaster() {
  const items = useStore(workCenterMasterStore) as WorkCenterMasterItem[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = items.filter((i) => catFilter === "전체" || i.processCategory === catFilter);

  const excel = () =>
    downloadCsv(
      "기준정보_작업장_가공임율_마스터.csv",
      ["작업장코드", "작업장명", "공정분류", "노무비임율(원/h)", "간접비임율(원/h)", "일가용CAPA(h)", "상태", "공장명"],
      filtered.map((i) => [
        i.workCenterCode,
        i.workCenterName,
        i.processCategory,
        i.hourlyLaborRate,
        i.hourlyOverheadRate,
        i.dailyCapacityHours,
        i.status,
        i.plantName,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">00. Master Data (기준정보)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">작업장마스터 (MDM-005)</h1>
          <span className="text-[11px] text-sub">생산 공정 라인 작업장별 시간당 노무비 · 가공간접비 임율(Rate) 마스터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">등록 작업장 총 개소</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">개소</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 작업장 시간당 가공비 (합계)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(items.reduce((acc, i) => acc + i.hourlyLaborRate + i.hourlyOverheadRate, 0) / (items.length || 1)).toLocaleString()} <span className="text-xs font-normal text-ink">원/h</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">일일 총 생산 CAPA 시간</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {items.reduce((acc, i) => acc + i.dailyCapacityHours, 0)} <span className="text-xs font-normal text-ink">시간/일</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">공정분류:</span>
          {["전체", "사출/프레스", "자동 SMT", "메인 조립"].map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                catFilter === c
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 작업장마스터 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">작업장 코드 / 명</th>
              <th className="px-3 py-2">공정 분류</th>
              <th className="px-3 py-2 text-right">노무비 임율 (원/h)</th>
              <th className="px-3 py-2 text-right">간접비 임율 (원/h)</th>
              <th className="px-3 py-2 text-right">시간당 총 임율</th>
              <th className="px-3 py-2 text-right">일 가용 CAPA</th>
              <th className="px-3 py-2">가동 상태</th>
              <th className="px-3 py-2">관할 공장</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.workCenterCode} — {i.workCenterName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.processCategory}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.hourlyLaborRate.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.hourlyOverheadRate.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.hourlyLaborRate + i.hourlyOverheadRate).toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.dailyCapacityHours}시간</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub">{i.plantName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
