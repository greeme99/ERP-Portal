// PP-008 가동률 분석 (Work Center Capacity & OEE Analytics) — 작업장별 가동률(%)·부하율·생산 능력(CAPA) 추이 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CapacityItem {
  id: string;
  workCenterCode: string;
  workCenterName: string;
  period: string;
  availableHours: number; // 사용 가능 CAPA 시간 (h)
  operatingHours: number; // 실제 가동 시간 (h)
  utilizationRatePct: number; // 가동률 (%) = Operating / Available
  loadRatePct: number; // 부하율 (%)
  efficiencyStatus: "고가동" | "적정" | "저가동";
}

export const capacityStore = createStore("pp.capacity", [
  { id: "CAP-01", workCenterCode: "WC-PRESS-01", workCenterName: "1번 사출 프레스 작업장", period: "2026-07", availableHours: 176, operatingHours: 162, utilizationRatePct: 92.0, loadRatePct: 95.0, efficiencyStatus: "고가동" },
  { id: "CAP-02", workCenterCode: "WC-SMT-01", workCenterName: "자동 SMT 라인 1호기", period: "2026-07", availableHours: 176, operatingHours: 168, utilizationRatePct: 95.5, loadRatePct: 98.0, efficiencyStatus: "고가동" },
  { id: "CAP-03", workCenterCode: "WC-ASSY-01", workCenterName: "메인 조립 A라인", period: "2026-07", availableHours: 176, operatingHours: 148, utilizationRatePct: 84.1, loadRatePct: 88.0, efficiencyStatus: "적정" },
  { id: "CAP-04", workCenterCode: "WC-TEST-01", workCenterName: "품질 에이징 테스트실", period: "2026-07", availableHours: 176, operatingHours: 120, utilizationRatePct: 68.2, loadRatePct: 70.0, efficiencyStatus: "저가동" },
]);

export default function CapacityAnalytics() {
  const items = useStore(capacityStore) as CapacityItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.efficiencyStatus === statusFilter);

  const avgUtil = (items.reduce((acc, i) => acc + i.utilizationRatePct, 0) / (items.length || 1)).toFixed(1);

  const excel = () =>
    downloadCsv(
      "생산_작업장_가동률분석_대장.csv",
      ["작업장코드", "작업장명", "기준월", "CAPA시간(h)", "실가동시간(h)", "가동률(%)", "부하율(%)", "효율상태"],
      filtered.map((i) => [
        i.workCenterCode,
        i.workCenterName,
        i.period,
        i.availableHours,
        i.operatingHours,
        `${i.utilizationRatePct}%`,
        `${i.loadRatePct}%`,
        i.efficiencyStatus,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. Production Planning (생산관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">가동률 분석 (PP-008)</h1>
          <span className="text-[11px] text-sub">작업장별 보유 CAPA 대비 실제 가동 시간 · 작업 부하율(%) 분석</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 평균 작업장 가동률</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{avgUtil}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">고가동 작업장 (90% 이상)</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{items.filter((i) => i.efficiencyStatus === "고가동").length} <span className="text-xs font-normal text-ink">개소</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">저가동 작업장 (70% 미만)</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{items.filter((i) => i.efficiencyStatus === "저가동").length} <span className="text-xs font-normal text-ink">개소</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">효율상태:</span>
          {["전체", "고가동", "적정", "저가동"].map((st) => (
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
          📥 가동률분석 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">작업장 코드 / 명</th>
              <th className="px-3 py-2">기준월</th>
              <th className="px-3 py-2 text-right">CAPA 시간</th>
              <th className="px-3 py-2 text-right">실제 가동시간</th>
              <th className="px-3 py-2 text-right">가동률 (%)</th>
              <th className="px-3 py-2 text-right">부하율 (%)</th>
              <th className="px-3 py-2">효율 평가</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.workCenterCode} — {i.workCenterName}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.period}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.availableHours}시간</td>
                <td className="px-3 py-2 text-right font-mono font-medium">{i.operatingHours}시간</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.utilizationRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.loadRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.efficiencyStatus === "고가동" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    i.efficiencyStatus === "적정" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.efficiencyStatus}
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
