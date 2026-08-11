// PP-001 생산 종합대시보드 (Production Planning Dashboard & Line Monitoring) — 생산라인별 일일 계획 대비 실적·종합설비효율(OEE)·비가동 집계
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface PpDashboardItem {
  id: string;
  lineCode: string;
  lineName: string; // 생산 라인명 (예: SMT 1호기 자동라인, 무선청소기 메인 조립 A라인)
  targetQty: number; // 목표 생산 수량 (EA)
  actualGoodQty: number; // 실제 양품 생산 수량 (EA)
  defectQty: number; // 불량 발생 수량 (EA)
  achievementRatePct: number; // 목표 달성률 (%) = Good / Target
  oeeRatePct: number; // 종합설비효율 OEE (%)
  downtimeMinutes: number; // 라인 비가동 시간 (분)
  status: "가동중" | "비가동 (정비)";
}

export const ppDashboardStore = createStore("pp.dashboard_master", [
  { id: "PPD-01", lineCode: "LINE-SMT-01", lineName: "자동 SMT 라인 1호기", targetQty: 1000, actualGoodQty: 980, defectQty: 20, achievementRatePct: 98.0, oeeRatePct: 92.5, downtimeMinutes: 15, status: "가동중" },
  { id: "PPD-02", lineCode: "LINE-ASSY-A", lineName: "소형가전 무선청소기 조립 A라인", targetQty: 500, actualGoodQty: 490, defectQty: 10, achievementRatePct: 98.0, oeeRatePct: 88.0, downtimeMinutes: 25, status: "가동중" },
  { id: "PPD-03", lineCode: "LINE-PRESS-01", lineName: "1번 사출 프레스 라인", targetQty: 2000, actualGoodQty: 1950, defectQty: 50, achievementRatePct: 97.5, oeeRatePct: 95.0, downtimeMinutes: 0, status: "가동중" },
]);

export default function PpDashboardMaster() {
  const items = useStore(ppDashboardStore) as PpDashboardItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status === statusFilter);

  const totalGood = filtered.reduce((acc, i) => acc + i.actualGoodQty, 0);
  const totalTarget = filtered.reduce((acc, i) => acc + i.targetQty, 0);
  const avgOee = filtered.reduce((acc, i) => acc + i.oeeRatePct, 0) / (filtered.length || 1);

  const excel = () =>
    downloadCsv(
      "생산_종합대시보드_라인_실적_대장.csv",
      ["라인코드", "라인명", "목표수량(EA)", "양품수량(EA)", "불량수량(EA)", "달성률(%)", "OEE효율(%)", "비가동시간(분)", "상태"],
      filtered.map((i) => [
        i.lineCode,
        i.lineName,
        i.targetQty,
        i.actualGoodQty,
        i.defectQty,
        `${i.achievementRatePct.toFixed(1)}%`,
        `${i.oeeRatePct.toFixed(1)}%`,
        i.downtimeMinutes,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">04. Production Planning (생산관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">생산 종합대시보드 (PP-001)</h1>
          <span className="text-[11px] text-sub">생산 라인별 일일 목표 대비 양품 수량 실적 · 종합설비효율(OEE) 및 라인 비가동 모니터링</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 일일 목표 달성률</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">
            {((totalGood / (totalTarget || 1)) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 종합설비효율 (OEE)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgOee.toFixed(1)}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">당일 총 양품 생산 실적</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {totalGood.toLocaleString()} <span className="text-xs font-normal text-ink">EA</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "가동중"].map((st) => (
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
          📥 생산대시보드 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">라인 코드 / 라인명</th>
              <th className="px-3 py-2 text-right">목표 생산량</th>
              <th className="px-3 py-2 text-right">양품 생산량</th>
              <th className="px-3 py-2 text-right">불량 발생량</th>
              <th className="px-3 py-2 text-right">목표 달성률</th>
              <th className="px-3 py-2 text-right">종합설비효율 (OEE)</th>
              <th className="px-3 py-2 text-right">비가동 시간</th>
              <th className="px-3 py-2">가동 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">
                  <div className="font-bold font-mono text-blue-600">{i.lineCode}</div>
                  <div className="text-[11px] text-ink font-semibold">{i.lineName}</div>
                </td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.targetQty.toLocaleString()}EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.actualGoodQty.toLocaleString()}EA</td>
                <td className="px-3 py-2 text-right font-mono text-amber-600">{i.defectQty}EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.achievementRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.oeeRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.downtimeMinutes}분</td>
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
