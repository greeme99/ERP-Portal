// CO-002 코스트센터마스터 (Cost Center Master) — 부서·조직별 발생 비용 집계 코스트센터(Cost Center) 마스터
import { useState } from "react";
import { useStore, createStore, nextId } from "../../services/store";
import MassUpdateBar, { MassColumn } from "../../components/common/MassUpdateBar";

export interface CostCenterItem {
  id: string;
  costCenterCode: string;
  costCenterName: string;
  deptName: string;
  managerName: string;
  ccCategory: "생산직접 CC" | "생산간접 CC" | "관리/지원 CC" | "R&D연구 CC";
  allocatedBudget: number; // 연간/월간 할당 예산 (KRW)
  status: "사용중" | "폐지";
}

export const costCenterStore = createStore("co.cost_center", [
  { id: "CC-01", costCenterCode: "CC-1001", costCenterName: "구매자재 코스트센터", deptName: "구매자재팀", managerName: "이구매 팀장", ccCategory: "관리/지원 CC", allocatedBudget: 658350000, status: "사용중" },
  { id: "CC-02", costCenterCode: "CC-2001", costCenterName: "프레스/SMT 생산1팀 CC", deptName: "생산관리팀", managerName: "박생산 과장", ccCategory: "생산직접 CC", allocatedBudget: 1200000000, status: "사용중" },
  { id: "CC-03", costCenterCode: "CC-3001", costCenterName: "소형가전 R&D 연구소 CC", deptName: "R&D연구소", managerName: "김연구 수석", ccCategory: "R&D연구 CC", allocatedBudget: 450000000, status: "사용중" },
]);

export default function CostCenterMaster() {
  const items = useStore(costCenterStore) as CostCenterItem[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = items.filter((i) => catFilter === "전체" || i.ccCategory === catFilter);

  const totalBudget = filtered.reduce((acc, i) => acc + i.allocatedBudget, 0);

  // 기준정보 일괄 다운로드/업로드 컬럼
  const massColumns: MassColumn[] = [
    { key: "costCenterCode", label: "코스트센터코드", required: true },
    { key: "costCenterName", label: "코스트센터명", required: true },
    { key: "deptName", label: "부서명" },
    { key: "managerName", label: "책임자" },
    { key: "ccCategory", label: "센터분류", type: "select", options: ["생산직접 CC", "생산간접 CC", "관리/지원 CC", "R&D연구 CC"] },
    { key: "allocatedBudget", label: "할당예산(원)", type: "number" },
    { key: "status", label: "상태", type: "select", options: ["사용중", "폐지"] },
  ];

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. Controlling (관리회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">코스트센터마스터 (CO-002)</h1>
          <span className="text-[11px] text-sub">부서 및 제조 생산 조직별 발생 비용 집계 코스트센터(Cost Center) 마스터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 코스트센터 할당 예산</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalBudget / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">등록 코스트센터 개수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개소</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">생산 직접 코스트센터 비중</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {((items.filter((i) => i.ccCategory.includes("생산직접")).length / (items.length || 1)) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">분류:</span>
          {["전체", "생산직접 CC", "관리/지원 CC", "R&D연구 CC"].map((c) => (
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
            title="코스트센터"
            filename="관리회계_코스트센터_마스터.csv"
            store={costCenterStore}
            rows={filtered}
            columns={massColumns}
            newRow={() => ({ id: nextId("CC"), costCenterCode: "", costCenterName: "", deptName: "", managerName: "", ccCategory: "관리/지원 CC", allocatedBudget: 0, status: "사용중" })}
          />
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">코스트센터 코드 / 명</th>
              <th className="px-3 py-2">소속 부서명</th>
              <th className="px-3 py-2">책임자</th>
              <th className="px-3 py-2">CC 분류</th>
              <th className="px-3 py-2 text-right">할당 예산 금액</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.costCenterCode} — {i.costCenterName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.deptName}</td>
                <td className="px-3 py-2 text-ink font-semibold">{i.managerName}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.ccCategory.includes("생산직접") ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}>
                    {i.ccCategory}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.allocatedBudget / 100000000).toFixed(2)}억원</td>
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
