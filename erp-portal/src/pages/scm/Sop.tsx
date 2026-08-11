// SCM-002 S&OP — 3주 ~ 24주 주단위 버킷 확장 & Contingency Plan 비상대책 시뮬레이션
import { useState } from "react";
import { materialStore } from "../../data/mock/master";
import { salesOrderStore } from "../../data/mock/sales";
import { mpsStore, mpsWeeklyStore } from "../../data/mock/production";
import {
  forecastStore,
  contingencyStore,
  sopStore,
  CURRENT_WEEK,
  WEEK_BUCKETS,
  ContingencySimItem,
} from "../../data/mock/scm";
import { useStore, downloadCsv } from "../../services/store";

const CONTINGENCY_OPTIONS = [
  { id: "outsourcing", name: "🏭 비상 외주(Outsourcing) 할당", owner: "생산팀", avgCost: 15000000 },
  { id: "airFreight", name: "✈️ 긴급 항공 수송 (Air Freight)", owner: "물류팀", avgCost: 8500000 },
  { id: "altPart", name: "🔄 대치 자재 (Alt Part) 전환", owner: "연구/구매팀", avgCost: 4000000 },
  { id: "reschedule", name: "📅 수주 납기 조정 / 할당", owner: "영업팀", avgCost: 2000000 },
];

export default function Sop() {
  const mats = useStore(materialStore);
  const ctgItems = useStore(contingencyStore) as ContingencySimItem[];
  const sops = useStore(sopStore);

  const [selectedWeek, setSelectedWeek] = useState<string>("2026-W29");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("FG-1001");
  const [contingencyModal, setContingencyModal] = useState<{
    isOpen: boolean;
    item?: ContingencySimItem;
  }>({ isOpen: false });

  const sop = sops.find((s) => s.week === CURRENT_WEEK) ?? sops[0];
  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;

  const materials = ["FG-1001", "FG-1002", "FG-1003"];

  // 3~24주차 (W29~W50) 주차 리스트
  const week24List = WEEK_BUCKETS.filter((w) => w.seq >= 3);

  // 선택한 품목의 3~24주 시뮬레이션 행
  const simRows = ctgItems.filter((c) => c.material === selectedMaterial && c.weekSeq >= 3);

  // 결품 위험 주차 수
  const riskWeekCount = simRows.filter((r) => r.status === "결품위험").length;
  const totalCostImpact = simRows.reduce((s, r) => s + r.costImpact, 0);

  const handleApplyContingency = (ctgId: string, optionName: string, owner: string, cost: number) => {
    contingencyStore.update(ctgId, {
      status: "안정",
      contingencyPlan: optionName,
      actionOwner: owner,
      costImpact: cost,
    });
    alert(`[Contingency Plan 수립 완료]\n대책: ${optionName}\n주관부서: ${owner}\n추가 비용: ${cost.toLocaleString()}원`);
    setContingencyModal({ isOpen: false });
  };

  const excel = () =>
    downloadCsv("3_24주_SOP_Contingency.csv", ["주차", "품목", "수요", "공급", "예상기말재고", "안전재고", "상태", "비상대책", "주관부서", "비용"],
      simRows.map((r) => [r.week, r.material, r.demand, r.supply, r.projectedStock, r.safetyStock, r.status, r.contingencyPlan, r.actionOwner, r.costImpact]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">02. SCM (Supply Chain)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">S&OP 판매·운영 계획 (SCM-002) — 3주~24주 Contingency Plan</h1>
          <span className="text-[11px] text-sub">3주~24주 주단위 버킷 · 재고과부족 시뮬레이션 & 비상공급대책 의사결정</span>
        </div>
      </div>

      {/* 요약 KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">선택 품목</div>
          <div className="text-base font-bold text-accent mt-1">{selectedMaterial} — {matName(selectedMaterial)}</div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">결품 위험 주차 (3~24주)</div>
          <div className={`text-xl font-bold mt-1 ${riskWeekCount > 0 ? "text-red-500" : "text-emerald-500"}`}>
            {riskWeekCount}개 주차
          </div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">Contingency 비상 비용</div>
          <div className="text-xl font-bold mt-1 text-amber-600 font-mono">{(totalCostImpact / 1e4).toLocaleString()}만원</div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">S&OP 합의 상태</div>
          <div className="mt-1">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
              3~24주 시뮬레이션 가동중
            </span>
          </div>
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-main">품목 선택:</span>
          {materials.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMaterial(m)}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                selectedMaterial === m ? "bg-accent text-white" : "bg-surface text-sub hover:text-main border border-line"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 시뮬레이션 Excel
        </button>
      </div>

      {/* 3주~24주 주단위 S&OP 시뮬레이션 테이블 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
          <span className="font-bold text-[13px] text-main">
            📊 {selectedMaterial} 3주~24주 (W29~W50) 주단위 재고과부족 시뮬레이션
          </span>
          <span className="text-[11px] text-sub">위험 주차 'Contingency 수립' 클릭 시 비상대책 실행</span>
        </div>

        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">주차</th>
              <th className="px-3 py-2 text-right">주간 수요</th>
              <th className="px-3 py-2 text-right">주간 공급</th>
              <th className="px-3 py-2 text-right">예상 기말재고</th>
              <th className="px-3 py-2 text-right">안전재고</th>
              <th className="px-3 py-2">재고 상태</th>
              <th className="px-3 py-2">Contingency Plan 비상대책</th>
              <th className="px-3 py-2">주관부서</th>
              <th className="px-3 py-2 text-right">발생비용</th>
              <th className="px-3 py-2 text-center">의사결정</th>
            </tr>
          </thead>
          <tbody>
            {simRows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft transition-colors">
                <td className="px-3 py-2 font-bold text-accent font-mono">{r.week} ({r.weekSeq}주차)</td>
                <td className="px-3 py-2 text-right font-mono">{r.demand.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono">{r.supply.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${r.projectedStock < 0 ? "text-red-500" : r.projectedStock < r.safetyStock ? "text-amber-500" : "text-emerald-600"}`}>
                  {r.projectedStock.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right font-mono text-sub">{r.safetyStock.toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.status === "결품위험" ? "bg-red-100 text-red-700" : r.status === "주의" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium text-main">{r.contingencyPlan}</td>
                <td className="px-3 py-2 text-sub">{r.actionOwner}</td>
                <td className="px-3 py-2 text-right font-mono">{r.costImpact > 0 ? `${(r.costImpact / 1e4).toLocaleString()}만원` : "-"}</td>
                <td className="px-3 py-2 text-center">
                  {r.status === "결품위험" ? (
                    <button
                      onClick={() => setContingencyModal({ isOpen: true, item: r })}
                      className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap animate-pulse"
                    >
                      ⚡ 대책 수립
                    </button>
                  ) : (
                    <span className="text-emerald-600 text-[10px] font-bold">정상</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contingency Plan 비상대책 수립 모달 */}
      {contingencyModal.isOpen && contingencyModal.item && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-panel border border-line rounded-xl w-full max-w-lg shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-line flex justify-between items-center bg-surface">
              <h3 className="font-bold text-base text-main flex items-center gap-2">
                ⚡ S&OP Contingency Plan (비상 공급 대책 수립)
              </h3>
              <button onClick={() => setContingencyModal({ isOpen: false })} className="text-sub hover:text-main text-lg">✕</button>
            </div>

            <div className="p-4 space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-700">
                <div className="font-bold text-sm">
                  ⚠️ {contingencyModal.item.week} {contingencyModal.item.material} 결품 위험 탐지
                </div>
                <div className="mt-1">
                  예상 기말재고: <span className="font-bold">{contingencyModal.item.projectedStock.toLocaleString()} EA</span> (부족 수량: {Math.abs(contingencyModal.item.projectedStock).toLocaleString()} EA)
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-main">수립할 비상 대책 선택:</span>
                {CONTINGENCY_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => handleApplyContingency(contingencyModal.item!.id, opt.name, opt.owner, opt.avgCost)}
                    className="p-3 border border-line rounded-lg bg-surface hover:bg-accent-soft cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="font-bold text-main group-hover:text-accent">{opt.name}</div>
                      <div className="text-[11px] text-sub">주관: {opt.owner}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-amber-600 font-bold">{(opt.avgCost / 1e4).toLocaleString()}만원</div>
                      <span className="text-[10px] text-accent font-semibold">적용 →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-line bg-surface flex justify-end">
              <button onClick={() => setContingencyModal({ isOpen: false })} className="px-4 py-1.5 rounded bg-panel border border-line font-bold text-main">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
