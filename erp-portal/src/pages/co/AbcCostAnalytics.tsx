// CO-006 ABC원가 (Activity-Based Costing Analytics) — 활동동인(Activity Driver) 연동 제품/고객별 정밀 활동기준원가 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface AbcCostItem {
  id: string;
  activityCode: string;
  activityName: string; // 활동명 (예: 설비 금형 셋업 교체, 수입 검사, 포장 및 출하)
  activityDriver: string; // 활동 동인 (예: 셋업 횟수, 검사 건수, 주문 건수)
  driverQuantity: number; // 동인 발생 수량
  costPerDriver: number; // 동인 단위당 원가 (원/Driver)
  totalActivityCost: number; // 총 활동 원가 = Quantity * CostPerDriver (KRW)
  valueAddType: "가치창출 (VA)" | "비가치창출 (NVA)";
}

export const abcCostStore = createStore("co.abc_cost", [
  { id: "ABC-01", activityCode: "ACT-101", activityName: "프레스 금형 셋업 교체 활동", activityDriver: "금형 셋업 회수", driverQuantity: 45, costPerDriver: 150000, totalActivityCost: 6750000, valueAddType: "비가치창출 (NVA)" },
  { id: "ABC-02", activityCode: "ACT-102", activityName: "수입 자재 품질 수입검사 활동", activityDriver: "검사 샘플링 건수", driverQuantity: 154, costPerDriver: 45000, totalActivityCost: 6930000, valueAddType: "가치창출 (VA)" },
  { id: "ABC-03", activityCode: "ACT-103", activityName: "SMT 기판 부품 자매 실장 활동", activityDriver: "실장 소요 시간 (h)", driverQuantity: 168, costPerDriver: 78000, totalActivityCost: 13104000, valueAddType: "가치창출 (VA)" },
]);

export default function AbcCostAnalytics() {
  const items = useStore(abcCostStore) as AbcCostItem[];
  const [vaFilter, setVaFilter] = useState("전체");

  const filtered = items.filter((i) => vaFilter === "전체" || i.valueAddType.includes(vaFilter));

  const totalCost = filtered.reduce((acc, i) => acc + i.totalActivityCost, 0);

  const excel = () =>
    downloadCsv(
      "관리회계_ABC_활동기준원가_분석대장.csv",
      ["활동코드", "활동명", "활동동인Driver", "동인수량", "단위당원가(원)", "총활동원가(원)", "가치창출구분"],
      filtered.map((i) => [
        i.activityCode,
        i.activityName,
        i.activityDriver,
        i.driverQuantity,
        i.costPerDriver,
        i.totalActivityCost,
        i.valueAddType,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. Controlling (관리회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">ABC원가 (CO-006)</h1>
          <span className="text-[11px] text-sub">활동 동인(Activity Driver) 기반 정밀 원가 측정 및 비가치창출(NVA) 활동 원가 절감</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 활동기준 (ABC) 집계 원가</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalCost / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">가치창출 (VA) 활동 원가 비중</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {(((items.filter((i) => i.valueAddType.includes("VA") && !i.valueAddType.includes("NVA")).reduce((acc, i) => acc + i.totalActivityCost, 0)) / (items.reduce((acc, i) => acc + i.totalActivityCost, 0) || 1)) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">절감 타겟 비가치활동 (NVA) 원가</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">
            {(items.filter((i) => i.valueAddType.includes("NVA")).reduce((acc, i) => acc + i.totalActivityCost, 0) / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">구분:</span>
          {["전체", "VA", "NVA"].map((v) => (
            <button
              key={v}
              onClick={() => setVaFilter(v)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                vaFilter === v
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 ABC원가 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">활동 코드 / 활동명</th>
              <th className="px-3 py-2">활동 동인 (Activity Driver)</th>
              <th className="px-3 py-2 text-right">동인 발생 수량</th>
              <th className="px-3 py-2 text-right">동인 단위당 원가</th>
              <th className="px-3 py-2 text-right">총 활동 원가</th>
              <th className="px-3 py-2">가치 창출 구분</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.activityCode} — {i.activityName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.activityDriver}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.driverQuantity.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.costPerDriver.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.totalActivityCost / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.valueAddType.includes("NVA") ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {i.valueAddType}
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
