// CO-001 원가요소마스터 (Cost Element Master) — 재료비·노무비·경비 원가 요소 및 직접비 vs 간접비 분류 마스터
import { useState } from "react";
import { useStore, createStore, nextId } from "../../services/store";
import MassUpdateBar, { MassColumn } from "../../components/common/MassUpdateBar";

export interface CostElementItem {
  id: string;
  costElementCode: string;
  costElementName: string; // 원가 요소명 (예: 원자재 직접재료비, 생산직 직접노무비, 설비전력비)
  costCategory: "직접재료비" | "직접노무비" | "제조경비" | "판매관리비";
  costBehavior: "변동비 (Variable)" | "고정비 (Fixed)";
  allocationKey: string; // 간접비 배부 키 (예: 작업시간 기준, 매출액 비례)
  glAccountCode: string;
}

export const costElementStore = createStore("co.cost_element", [
  { id: "CEL-01", costElementCode: "CO-5001", costElementName: "원자재 직접재료비", costCategory: "직접재료비", costBehavior: "변동비 (Variable)", allocationKey: "BOM 실제 투입량 직접집계", glAccountCode: "ACC-5001" },
  { id: "CEL-02", costElementCode: "CO-5002", costElementName: "생산라인 직접노무비", costCategory: "직접노무비", costBehavior: "변동비 (Variable)", allocationKey: "작업장 공정 작업시간 비례", glAccountCode: "ACC-5002" },
  { id: "CEL-03", costElementCode: "CO-5003", costElementName: "공장 설비 전력비 및 동력비", costCategory: "제조경비", costBehavior: "변동비 (Variable)", allocationKey: "작업장 설비 가동시간 비례", glAccountCode: "ACC-5003" },
  { id: "CEL-04", costElementCode: "CO-5004", costElementName: "생산설비 기계 감가상각비", costCategory: "제조경비", costBehavior: "고정비 (Fixed)", allocationKey: "공정 자산가액 비율 배부", glAccountCode: "ACC-5004" },
]);

export default function CostElementMaster() {
  const items = useStore(costElementStore) as CostElementItem[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = items.filter((i) => catFilter === "전체" || i.costCategory === catFilter);

  // 기준정보 일괄 다운로드/업로드 컬럼
  const massColumns: MassColumn[] = [
    { key: "costElementCode", label: "원가요소코드", required: true },
    { key: "costElementName", label: "원가요소명", required: true },
    { key: "costCategory", label: "원가분류", type: "select", options: ["직접재료비", "직접노무비", "제조경비", "판매관리비"] },
    { key: "costBehavior", label: "원가행태", type: "select", options: ["변동비 (Variable)", "고정비 (Fixed)"] },
    { key: "allocationKey", label: "배부키" },
    { key: "glAccountCode", label: "GL계정코드" },
  ];

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. Controlling (관리회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">원가요소마스터 (CO-001)</h1>
          <span className="text-[11px] text-sub">직접재료비 · 노무비 · 제조경비 원가 요소 및 변동비 vs 고정비 분류 마스터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 원가 요소 계정 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">종</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">변동비 (Variable) 요소 비중</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {((items.filter((i) => i.costBehavior.includes("변동비")).length / (items.length || 1)) * 100).toFixed(0)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">제조경비 배부 키 세팅</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">분류:</span>
          {["전체", "직접재료비", "직접노무비", "제조경비"].map((c) => (
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
        <div className="flex gap-1">
          <MassUpdateBar
            title="원가요소마스터"
            filename="관리회계_원가요소_마스터.csv"
            store={costElementStore}
            rows={filtered}
            columns={massColumns}
            newRow={() => ({ id: nextId("CE"), costElementCode: "", costElementName: "", costCategory: "제조경비", costBehavior: "변동비 (Variable)", allocationKey: "", glAccountCode: "" })}
          />
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">원가요소 코드 / 명</th>
              <th className="px-3 py-2">원가 분류</th>
              <th className="px-3 py-2">변동비 / 고정비</th>
              <th className="px-3 py-2">간접비 배부 기준 키 (Rule)</th>
              <th className="px-3 py-2">연동 G/L 계정</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.costElementCode} — {i.costElementName}</td>
                <td className="px-3 py-2 font-bold text-emerald-600">{i.costCategory}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.costBehavior.includes("변동비") ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-purple-100 text-purple-700 border border-purple-200"
                  }`}>
                    {i.costBehavior}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub font-medium">{i.allocationKey}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.glAccountCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
