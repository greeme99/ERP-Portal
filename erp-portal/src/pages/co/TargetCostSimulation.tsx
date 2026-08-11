// CO-013 타겟코스팅시뮬레이션 (Target Costing & Design-to-Cost Simulation) — 신제품 목표원가 및 개발 기획 단계 원가절감 시뮬레이션
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface TargetCostItem {
  id: string;
  projectCode: string;
  productName: string; // 신제품 프로젝트명 (예: 차세대 프리미엄 무선청소기 V12, 스마트 공기청정기 PRO)
  targetPriceAmount: number; // 목표 출시 판매가 (KRW)
  targetMarginPct: number; // 목표 영업이익률 (%)
  allowableCostAmount: number; // 허용 목표원가 = TargetPrice * (1 - TargetMarginPct)
  currentDesignCost: number; // 현재 설계 반영 기획원가 (KRW)
  costGapAmount: number; // 원가 절감 목표 갭 (GAP) = DesignCost - AllowableCost
  status: "원가 절감 목표 달성" | "설계 변경 시뮬레이션 진행중";
}

export const targetCostStore = createStore("co.target_cost", [
  { id: "TC-01", projectCode: "PRJ-2026-V12", productName: "차세대 로봇청소기 AI-V12", targetPriceAmount: 890000, targetMarginPct: 35.0, allowableCostAmount: 578500, currentDesignCost: 610000, costGapAmount: 31500, status: "설계 변경 시뮬레이션 진행중" },
  { id: "TC-02", projectCode: "PRJ-2026-AIR", productName: "대용량 UV 공기청정기 AIR-PRO", targetPriceAmount: 650000, targetMarginPct: 40.0, allowableCostAmount: 390000, currentDesignCost: 388000, costGapAmount: -2000, status: "원가 절감 목표 달성" },
]);

export default function TargetCostSimulation() {
  const items = useStore(targetCostStore) as TargetCostItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status === statusFilter);

  const excel = () =>
    downloadCsv(
      "관리회계_타겟코스팅_원가시뮬레이션_대장.csv",
      ["프로젝트코드", "신제품명", "목표판매가", "목표이익률(%)", "허용목표원가", "현재설계원가", "원가절감GAP", "상태"],
      filtered.map((i) => [
        i.projectCode,
        i.productName,
        i.targetPriceAmount,
        `${i.targetMarginPct}%`,
        i.allowableCostAmount,
        i.currentDesignCost,
        i.costGapAmount,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. Cost Accounting (관리회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">타겟코스팅시뮬레이션 (CO-013)</h1>
          <span className="text-[11px] text-sub">신제품 개발 기획 단계 목표원가(Target Costing) 산정 · 허용원가 대비 설계 원가절감 시뮬레이션</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">개발 프로젝트 평균 목표이익률</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">37.5%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">원가 절감 목표 달성 프로젝트</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">1 <span className="text-xs font-normal text-ink">개</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">설계 원가절감 시뮬레이션 진행중</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">1 <span className="text-xs font-normal text-ink">개</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "원가 절감 목표 달성", "진행중"].map((s) => (
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
          📥 타겟코스팅 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">프로젝트 코드</th>
              <th className="px-3 py-2">신제품 프로젝트명</th>
              <th className="px-3 py-2 text-right">목표 출시가</th>
              <th className="px-3 py-2 text-right">목표 이익률</th>
              <th className="px-3 py-2 text-right">허용 목표원가</th>
              <th className="px-3 py-2 text-right">현재 설계원가</th>
              <th className="px-3 py-2 text-right">원가절감 GAP</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.projectCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.productName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.targetPriceAmount.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.targetMarginPct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.allowableCostAmount.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono text-ink">{i.currentDesignCost.toLocaleString()}원</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.costGapAmount > 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {i.costGapAmount > 0 ? `+${i.costGapAmount.toLocaleString()}원 (초과)` : `${i.costGapAmount.toLocaleString()}원 (절감)`}
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.costGapAmount > 0 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
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
