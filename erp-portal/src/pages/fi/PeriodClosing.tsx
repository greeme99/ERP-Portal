// FI-007 결산관리 — 월별/분기별 회계 결산 체크리스트·자동 마감 전표 생성 및 재무제표 확정 프로세스
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ClosingStep {
  id: string;
  closingPeriod: string; // 결산월 (예: 2026-07)
  stepNo: number;
  stepName: string;
  category: "자재/재고" | "고정자산" | "외화/금융" | "손익/전표";
  status: "마감완료" | "진행중" | "미시작";
  handledBy: string;
  completedAt: string;
}

export const periodClosingStore = createStore("fi.period_closing", [
  { id: "CLS-01", closingPeriod: "2026-07", stepNo: 1, stepName: "수불마감 및 재고 이동 수불 이력 확정", category: "자재/재고", status: "마감완료", handledBy: "이물류", completedAt: "2026-07-31 18:00" },
  { id: "CLS-02", closingPeriod: "2026-07", stepNo: 2, stepName: "고정자산 당월 감가상각비 자동 전표 계상", category: "고정자산", status: "마감완료", handledBy: "김자산", completedAt: "2026-07-31 19:30" },
  { id: "CLS-03", closingPeriod: "2026-07", stepNo: 3, stepName: "외화 채권/채무 기말 환율 평가 전표 계상", category: "외화/금융", status: "마감완료", handledBy: "박자금", completedAt: "2026-07-31 20:15" },
  { id: "CLS-04", closingPeriod: "2026-07", stepNo: 4, stepName: "제조간접비 실제원가 정산 및 차이 배부", category: "손익/전표", status: "마감완료", handledBy: "최원가", completedAt: "2026-08-01 10:00" },
  { id: "CLS-05", closingPeriod: "2026-07", stepNo: 5, stepName: "손익 계정 마감 및 당기순손익 이월", category: "손익/전표", status: "마감완료", handledBy: "정회계", completedAt: "2026-08-01 11:30" },
  { id: "CLS-06", closingPeriod: "2026-08", stepNo: 1, stepName: "수불마감 및 재고 이동 수불 이력 확정", category: "자재/재고", status: "진행중", handledBy: "이물류", completedAt: "-" },
]);

export default function PeriodClosing() {
  const steps = useStore(periodClosingStore) as ClosingStep[];
  const [periodFilter, setPeriodFilter] = useState("2026-07");

  const filtered = steps.filter((s) => s.closingPeriod === periodFilter);

  const completedSteps = filtered.filter((s) => s.status === "마감완료").length;
  const progressRate = filtered.length > 0 ? ((completedSteps / filtered.length) * 100).toFixed(0) : "0";

  const excel = () =>
    downloadCsv(
      `재무_결산프로세스_${periodFilter}.csv`,
      ["결산월", "단계번호", "단계명", "구분", "상태", "담당자", "완료일시"],
      filtered.map((s) => [
        s.closingPeriod,
        s.stepNo,
        s.stepName,
        s.category,
        s.status,
        s.handledBy,
        s.completedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. Financial Accounting (재무회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">결산관리 (FI-007)</h1>
          <span className="text-[11px] text-sub">월별/분기별 결산 체크리스트 · 수불/상각/원가 마감 6단계 프로세스</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">선택 결산월 마감 진행률</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{progressRate}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">완료된 결산 단계</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{completedSteps} / {filtered.length} <span className="text-xs font-normal text-ink">단계</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">결산 마감 상태</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {Number(progressRate) === 100 ? "마감 완료 (Locked)" : "진행중 (Open)"}
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">결산월:</span>
          {["2026-07", "2026-08"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                periodFilter === p
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {p}월
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 결산 리포트 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">단계</th>
              <th className="px-3 py-2">프로세스 단계명</th>
              <th className="px-3 py-2">구분</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">담당자</th>
              <th className="px-3 py-2">완료 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">Step {s.stepNo}</td>
                <td className="px-3 py-2 font-medium">{s.stepName}</td>
                <td className="px-3 py-2 text-sub">{s.category}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.status === "마감완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    s.status === "진행중" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub">{s.handledBy}</td>
                <td className="px-3 py-2 font-mono text-sub">{s.completedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
