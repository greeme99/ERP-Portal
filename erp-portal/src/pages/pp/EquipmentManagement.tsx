// PP-009 설비관리 (Equipment & Maintenance Management) — 생산 라인 설비 가동 상태·예방보전(PM) 스케줄·OEE 설비종합효율 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface EquipmentItem {
  id: string;
  equipCode: string;
  equipName: string;
  workCenterName: string;
  opStatus: "RUNNING" | "STOPPED" | "MAINTENANCE";
  oeeRatePct: number; // OEE 설비종합효율 (%)
  lastPmDate: string; // 최근 예방보전(PM) 점검일
  nextPmDate: string; // 차기 PM 예정일
  downtimeHours: number; // 당월 비가동 시간 (시간)
  manager: string;
}

export const equipmentStore = createStore("pp.equipment", [
  { id: "EQP-01", equipCode: "EQ-PRESS-01", equipName: "300톤 정밀 서보 사출 프레스", workCenterName: "1번 사출 프레스 작업장", opStatus: "RUNNING", oeeRatePct: 88.5, lastPmDate: "2026-07-15", nextPmDate: "2026-08-15", downtimeHours: 2.5, manager: "김설비 기정" },
  { id: "EQP-02", equipCode: "EQ-SMT-01", equipName: "고속 칩 마운터 SMT 1호기", workCenterName: "자동 SMT 라인 1호기", opStatus: "RUNNING", oeeRatePct: 92.0, lastPmDate: "2026-07-20", nextPmDate: "2026-08-20", downtimeHours: 1.0, manager: "이보전 과장" },
  { id: "EQP-03", equipCode: "EQ-ASSY-02", equipName: "자동 소손 방지 에이징 라인 2호", workCenterName: "품질 에이징 테스트실", opStatus: "MAINTENANCE", oeeRatePct: 76.5, lastPmDate: "2026-08-05", nextPmDate: "2026-08-06", downtimeHours: 14.0, manager: "박점검 대리" },
]);

export default function EquipmentManagement() {
  const list = useStore(equipmentStore) as EquipmentItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = list.filter((e) => statusFilter === "전체" || e.opStatus === statusFilter);

  const avgOee = (list.reduce((acc, e) => acc + e.oeeRatePct, 0) / (list.length || 1)).toFixed(1);
  const runningCount = list.filter((e) => e.opStatus === "RUNNING").length;

  const excel = () =>
    downloadCsv(
      "생산_설비관리_가동대장.csv",
      ["설비코드", "설비명", "작업장명", "가동상태", "OEE효율(%)", "최근PM일자", "차기PM예정일", "비가동시간(h)", "담당자"],
      filtered.map((e) => [
        e.equipCode,
        e.equipName,
        e.workCenterName,
        e.opStatus,
        `${e.oeeRatePct}%`,
        e.lastPmDate,
        e.nextPmDate,
        e.downtimeHours,
        e.manager,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. Production Planning (생산관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">설비관리 (PP-009)</h1>
          <span className="text-[11px] text-sub">생산라인 설비 실시간 가동 상태 · OEE 설비종합효율 · 예방보전(PM) 스케줄</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">평균 설비 종합 효율 (OEE)</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{avgOee}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">현재 가동중 (RUNNING) 설비</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{runningCount} / {list.length} <span className="text-xs font-normal text-ink">대</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">점검중 / 비가동 (MAINT/STOP)</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{list.length - runningCount} <span className="text-xs font-normal text-ink">대</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "RUNNING", "MAINTENANCE", "STOPPED"].map((st) => (
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
          📥 설비대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">설비 코드 / 명</th>
              <th className="px-3 py-2">작업장명</th>
              <th className="px-3 py-2">가동 상태</th>
              <th className="px-3 py-2 text-right">OEE 효율</th>
              <th className="px-3 py-2">최근 PM 점검일</th>
              <th className="px-3 py-2">차기 PM 예정일</th>
              <th className="px-3 py-2 text-right">비가동 시간</th>
              <th className="px-3 py-2">보전 담당자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{e.equipCode} — {e.equipName}</td>
                <td className="px-3 py-2 text-sub font-medium">{e.workCenterName}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    e.opStatus === "RUNNING" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    e.opStatus === "MAINTENANCE" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {e.opStatus}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{e.oeeRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 font-mono text-sub">{e.lastPmDate}</td>
                <td className="px-3 py-2 font-mono font-bold text-emerald-600">{e.nextPmDate}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{e.downtimeHours}시간</td>
                <td className="px-3 py-2 text-sub">{e.manager}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
