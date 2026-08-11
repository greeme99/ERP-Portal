// EsgCarbonManagement.tsx (ESG Carbon Footprint & Renewable Energy Control) — 전사 ESG 탄소 배출량 및 RE100 관제 센터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface EsgCarbonItem {
  id: string;
  facilityName: string; // 사업장/공장명 (예: 평택 제1 스마트공장, 광주 제2 공장, 서울 본사 타워)
  scope1DirectEmissionsTon: number; // Scope 1 직접 배출량 (tCO2eq)
  scope2IndirectEmissionsTon: number; // Scope 2 전력 간접 배출량 (tCO2eq)
  scope3SupplyChainEmissionsTon: number; // Scope 3 공급망 운송 배출량 (tCO2eq)
  renewableEnergyRatioPct: number; // 재생에너지(태양광) 사용 비율 (%)
  esgRatingGrade: "A+ (최우수)" | "A (우수)" | "B+ (양호)";
  status: "목표 이행중 (Compliant)";
}

export const esgStore = createStore("dashboard.esg", [
  { id: "ESG-01", facilityName: "평택 제1 스마트 생산공장", scope1DirectEmissionsTon: 124.5, scope2IndirectEmissionsTon: 450.2, scope3SupplyChainEmissionsTon: 210.8, renewableEnergyRatioPct: 35.8, esgRatingGrade: "A+ (최우수)", status: "목표 이행중 (Compliant)" },
  { id: "ESG-02", facilityName: "광주 제2 생산공장", scope1DirectEmissionsTon: 98.2, scope2IndirectEmissionsTon: 320.0, scope3SupplyChainEmissionsTon: 180.4, renewableEnergyRatioPct: 28.4, esgRatingGrade: "A (우수)", status: "목표 이행중 (Compliant)" },
  { id: "ESG-03", facilityName: "서울 본사 사옥", scope1DirectEmissionsTon: 12.0, scope2IndirectEmissionsTon: 85.4, scope3SupplyChainEmissionsTon: 45.0, renewableEnergyRatioPct: 42.0, esgRatingGrade: "A+ (최우수)", status: "목표 이행중 (Compliant)" },
]);

export default function EsgCarbonManagement() {
  const items = useStore(esgStore) as EsgCarbonItem[];
  const [gradeFilter, setGradeFilter] = useState("전체");

  const filtered = items.filter((i) => gradeFilter === "전체" || i.esgRatingGrade.includes(gradeFilter));

  const totalEmissions = filtered.reduce((acc, i) => acc + i.scope1DirectEmissionsTon + i.scope2IndirectEmissionsTon + i.scope3SupplyChainEmissionsTon, 0);

  const excel = () =>
    downloadCsv(
      "전사_ESG_탄소배출량_RE100_관제_대장.csv",
      ["사업장명", "Scope1배출(톤)", "Scope2배출(톤)", "Scope3배출(톤)", "재생에너지비율(%)", "ESG평가등급", "상태"],
      filtered.map((i) => [
        i.facilityName,
        i.scope1DirectEmissionsTon,
        i.scope2IndirectEmissionsTon,
        i.scope3SupplyChainEmissionsTon,
        `${i.renewableEnergyRatioPct}%`,
        i.esgRatingGrade,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">00. Executive & AI Command (ESG 관제)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">ESG 탄소 배출량 & RE100 관제 센터</h1>
          <span className="text-[11px] text-sub">Scope 1·2·3 전사 온실가스 배출량 실시간 모니터링 · 태양광 재생 에너지 사용율 및 ESG 등급 관제</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 누적 온실가스 총 배출량</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{totalEmissions.toFixed(1)} <span className="text-xs font-normal text-ink">tCO2eq</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 재생에너지(RE100) 전환율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.renewableEnergyRatioPct, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">전사 통합 ESG 평가 등급</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">A+ (최우수)</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">등급:</span>
          {["전체", "A+", "A"].map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                gradeFilter === g
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 ESG탄소배출 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">사업장 / 공장명</th>
              <th className="px-3 py-2 text-right">Scope 1 (직접 배출)</th>
              <th className="px-3 py-2 text-right">Scope 2 (전력 배출)</th>
              <th className="px-3 py-2 text-right">Scope 3 (운송 배출)</th>
              <th className="px-3 py-2 text-right">재생에너지 (RE100) 비율</th>
              <th className="px-3 py-2">ESG 평가 등급</th>
              <th className="px-3 py-2">목표 이행 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-bold text-blue-600 text-[11px]">{i.facilityName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.scope1DirectEmissionsTon.toFixed(1)} tCO2eq</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.scope2IndirectEmissionsTon.toFixed(1)} tCO2eq</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.scope3SupplyChainEmissionsTon.toFixed(1)} tCO2eq</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.renewableEnergyRatioPct.toFixed(1)}%</td>
                <td className="px-3 py-2 font-bold text-purple-600 text-[11px]">{i.esgRatingGrade}</td>
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
