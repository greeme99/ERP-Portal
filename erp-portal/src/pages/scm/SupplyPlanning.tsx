// SCM-003 공급계획 (Supply Planning) — 거점별/주차별 공급 계획·생산 CAPA 할당 및 공급 부족(Shortage) 사전 예측
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SupplyPlanItem {
  id: string;
  planCode: string;
  plantName: string; // 공장 거점 (예: 평택1공장, 창원2공장)
  materialCode: string;
  materialName: string;
  weekNo: string; // 주차 (예: W32, W33)
  demandQty: number; // 요구 수요량
  supplyPlanQty: number; // 공급 확정 계획 수량
  capaAllocated: number; // 생산 CAPA 할당률 (%)
  shortageQty: number; // 공급 부족 예상량
  status: "확정" | "조정중";
}

export const supplyPlanStore = createStore("scm.supply_plan", [
  { id: "SPL-01", planCode: "SP-2026-W32-01", plantName: "평택1공장", materialCode: "FG-1001", materialName: "소형가전 무선청소기", weekNo: "2026-W32", demandQty: 1200, supplyPlanQty: 1200, capaAllocated: 95.0, shortageQty: 0, status: "확정" },
  { id: "SPL-02", planCode: "SP-2026-W32-02", plantName: "창원2공장", materialCode: "FG-1002", materialName: "스마트 무선 로봇청소기", weekNo: "2026-W32", demandQty: 800, supplyPlanQty: 750, capaAllocated: 100.0, shortageQty: 50, status: "조정중" },
  { id: "SPL-03", planCode: "SP-2026-W33-01", plantName: "평택1공장", materialCode: "FG-2001", materialName: "전자기판 컨트롤러 모듈", weekNo: "2026-W33", demandQty: 2500, supplyPlanQty: 2500, capaAllocated: 88.0, shortageQty: 0, status: "확정" },
]);

export default function SupplyPlanning() {
  const plans = useStore(supplyPlanStore) as SupplyPlanItem[];
  const [plantFilter, setPlantFilter] = useState("전체");

  const filtered = plans.filter((p) => plantFilter === "전체" || p.plantName === plantFilter);

  const totalDemand = filtered.reduce((acc, p) => acc + p.demandQty, 0);
  const totalSupply = filtered.reduce((acc, p) => acc + p.supplyPlanQty, 0);
  const totalShortage = filtered.reduce((acc, p) => acc + p.shortageQty, 0);

  const excel = () =>
    downloadCsv(
      "SCM_공급계획_대장.csv",
      ["계획코드", "공장거점", "품목코드", "품목명", "주차", "요구수요량", "공급계획량", "CAPA할당률(%)", "부족예상량", "상태"],
      filtered.map((p) => [
        p.planCode,
        p.plantName,
        p.materialCode,
        p.materialName,
        p.weekNo,
        p.demandQty,
        p.supplyPlanQty,
        `${p.capaAllocated}%`,
        p.shortageQty,
        p.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">02. Supply Chain Management (SCM)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공급계획 (SCM-003)</h1>
          <span className="text-[11px] text-sub">거점/주차별 공급 할당 · 생산 CAPA 이용률 · Shortage(공급부족) 사전 대응</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 요구 수요 수량</div>
          <div className="text-xl font-bold mt-1 font-mono">{totalDemand.toLocaleString()} <span className="text-xs font-normal">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">확정 공급 계획 수량</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{totalSupply.toLocaleString()} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">공급 부족 (Shortage) 예상</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{totalShortage.toLocaleString()} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">공장 거점:</span>
          {["전체", "평택1공장", "창원2공장"].map((pl) => (
            <button
              key={pl}
              onClick={() => setPlantFilter(pl)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                plantFilter === pl
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {pl}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 공급계획 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">계획코드</th>
              <th className="px-3 py-2">공장 거점</th>
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2">주차</th>
              <th className="px-3 py-2 text-right">요구 수요량</th>
              <th className="px-3 py-2 text-right">공급 계획량</th>
              <th className="px-3 py-2 text-right">CAPA 할당률</th>
              <th className="px-3 py-2 text-right">Shortage 예상</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{p.planCode}</td>
                <td className="px-3 py-2 font-medium">{p.plantName}</td>
                <td className="px-3 py-2">{p.materialCode} — {p.materialName}</td>
                <td className="px-3 py-2 font-mono text-sub">{p.weekNo}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{p.demandQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{p.supplyPlanQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{p.capaAllocated.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-red-500">{p.shortageQty > 0 ? `${p.shortageQty} EA` : "-"}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status === "확정" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {p.status}
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
