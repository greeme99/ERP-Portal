// SV-012 재방문수리방지분석 (Re-visit Repair & Service Quality Analysis) — 동일 고장 30일 이내 재방문 수리 원인 분석 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface RevisitRepairItem {
  id: string;
  revisitTicketNo: string;
  customerName: string;
  modelName: string; // 대상 가전 모델
  initialRepairDate: string; // 최초 수리 일자
  revisitRepairDate: string; // 30일 이내 재방문 수리 일자
  revisitCauseCategory: "초기 오진단" | "교체 부품 자체 불량" | "현장 조립 불량"; // 재방문 원인 분석
  engineerName: string;
  revisitRatePct: number; // 엔지니어별 재방문 비율 (%)
  status: "원인 분석 완료" | "품질 재교육 완료";
}

export const revisitRepairStore = createStore("sv.revisit_repair", [
  { id: "REV-01", revisitTicketNo: "AS-REV-2026-01", customerName: "김*선 고객", modelName: "프리미엄 무선청소기 V11", initialRepairDate: "2026-07-15", revisitRepairDate: "2026-08-02", revisitCauseCategory: "교체 부품 자체 불량", engineerName: "김동선 테크니션", revisitRatePct: 1.2, status: "원인 분석 완료" },
  { id: "REV-02", revisitTicketNo: "AS-REV-2026-02", customerName: "박*우 고객", modelName: "로봇청소기 AI-V12", initialRepairDate: "2026-07-20", revisitRepairDate: "2026-08-05", revisitCauseCategory: "초기 오진단", engineerName: "박출장 기사", revisitRatePct: 2.8, status: "품질 재교육 완료" },
]);

export default function RevisitRepairAnalysis() {
  const items = useStore(revisitRepairStore) as RevisitRepairItem[];
  const [causeFilter, setCauseFilter] = useState("전체");

  const filtered = items.filter((i) => causeFilter === "전체" || i.revisitCauseCategory.includes(causeFilter));

  const avgRevisitRate = filtered.reduce((acc, i) => acc + i.revisitRatePct, 0) / (filtered.length || 1);

  const excel = () =>
    downloadCsv(
      "서비스_재방문수리_원인분석_대장.csv",
      ["재접수번호", "고객명", "모델명", "최초수리일", "재방문일", "재방문원인", "담당엔지니어", "재방문율(%)", "상태"],
      filtered.map((i) => [
        i.revisitTicketNo,
        i.customerName,
        i.modelName,
        i.initialRepairDate,
        i.revisitRepairDate,
        i.revisitCauseCategory,
        i.engineerName,
        `${i.revisitRatePct}%`,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. Customer Service (고객서비스)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">재방문수리방지분석 (SV-012)</h1>
          <span className="text-[11px] text-sub">30일 이내 동일 고장 재방문 수리(Revisit Repair) 원인 분류 및 서비스 품질 재교육 모니터링</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 평균 재방문 수리율</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{avgRevisitRate.toFixed(2)}% <span className="text-xs font-normal text-ink">(목표 ≤ 2.0%)</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">당월 재방문 수리 발생 건수</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">품질 재교육 조치 완료율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {((items.filter((i) => i.status.includes("재교육")).length / (items.length || 1)) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">원인:</span>
          {["전체", "오진단", "부품 불량", "조립 불량"].map((c) => (
            <button
              key={c}
              onClick={() => setCauseFilter(c)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                causeFilter === c
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 재방문수리 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">재접수 번호</th>
              <th className="px-3 py-2">고객명</th>
              <th className="px-3 py-2">대상 가전 모델</th>
              <th className="px-3 py-2">최초 수리일</th>
              <th className="px-3 py-2">재방문 수리일</th>
              <th className="px-3 py-2">재방문 발생 원인</th>
              <th className="px-3 py-2">담당 엔지니어</th>
              <th className="px-3 py-2 text-right">기사 재방문율</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.revisitTicketNo}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.customerName}</td>
                <td className="px-3 py-2 text-ink font-semibold">{i.modelName}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.initialRepairDate}</td>
                <td className="px-3 py-2 font-mono text-red-500 font-bold">{i.revisitRepairDate}</td>
                <td className="px-3 py-2 font-semibold text-purple-700 text-[11px]">{i.revisitCauseCategory}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.engineerName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-amber-600">{i.revisitRatePct.toFixed(1)}%</td>
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
