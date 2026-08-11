// SD-010 영업활동/기회관리 (Sales Opportunity & Pipeline) — B2B 수주 딜(Lead~Won) 파이프라인 단계별 성공확률·계약기대금액 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SalesOpportunityItem {
  id: string;
  oppCode: string;
  customerName: string;
  oppName: string;
  pipelineStage: "리드 발굴" | "견적제출" | "계약협상" | "수주성공(Won)" | "실패(Lost)";
  expectedValue: number; // 계약 기대 금액 (KRW)
  winProbabilityPct: number; // 수주 성공 확률 (%)
  salesRep: string;
  nextAction: string;
  targetClosureDate: string;
}

export const salesOppStore = createStore("sd.sales_opp", [
  { id: "OPP-01", oppCode: "OPP-2026-081", customerName: "삼성전자 글로벌", oppName: "2026년 하반기 프리미엄 청소기 OEM 2만대 공급 딜", pipelineStage: "계약협상", expectedValue: 1200000000, winProbabilityPct: 85, salesRep: "이영업 팀장", nextAction: "여신한도 승인 및 계약서 최종 검토", targetClosureDate: "2026-08-20" },
  { id: "OPP-02", oppCode: "OPP-2026-082", customerName: "쿠쿠전자", oppName: "신형 로봇청소기 메인 PCB 컨트롤러 공급 딜", pipelineStage: "견적제출", expectedValue: 450000000, winProbabilityPct: 60, salesRep: "김수주 대리", nextAction: "단가 인하 요구 조건 재협상", targetClosureDate: "2026-08-25" },
  { id: "OPP-03", oppCode: "OPP-2026-083", customerName: "한일전기", oppName: "소형 모터 조립품 수주건", pipelineStage: "수주성공(Won)", expectedValue: 280000000, winProbabilityPct: 100, salesRep: "박영업 과장", nextAction: "수주 SO 등록 및 PP 생산 일정 공유", targetClosureDate: "2026-07-30" },
]);

export default function SalesOpportunity() {
  const items = useStore(salesOppStore) as SalesOpportunityItem[];
  const [stageFilter, setStageFilter] = useState("전체");

  const filtered = items.filter((i) => stageFilter === "전체" || i.pipelineStage.includes(stageFilter));

  const totalExpected = filtered.reduce((acc, i) => acc + i.expectedValue, 0);
  const weightedPipeline = filtered.reduce((acc, i) => acc + (i.expectedValue * (i.winProbabilityPct / 100)), 0);

  const excel = () =>
    downloadCsv(
      "영업_수주_파이프라인_대장.csv",
      ["기회코드", "고객사명", "영업기회명", "파이프라인단계", "계약기대금액(원)", "성공확률(%)", "영업담당자", "차기액션", "목표체결일"],
      filtered.map((i) => [
        i.oppCode,
        i.customerName,
        i.oppName,
        i.pipelineStage,
        i.expectedValue,
        `${i.winProbabilityPct}%`,
        i.salesRep,
        i.nextAction,
        i.targetClosureDate,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">영업활동 (SD-010)</h1>
          <span className="text-[11px] text-sub">B2B 수주 딜(Opportunity) 파이프라인 단계별 성공확률 및 가중 기대매출 분석</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 계약 기대 파이프라인 금액</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalExpected / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">성공확률 가중 파이프라인 금액</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{(weightedPipeline / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">수주 성공 (Won) 건수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{items.filter((i) => i.pipelineStage.includes("Won")).length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">단계:</span>
          {["전체", "견적제출", "계약협상", "Won"].map((st) => (
            <button
              key={st}
              onClick={() => setStageFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                stageFilter === st
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 파이프라인 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">기회 코드 / 영업기회명</th>
              <th className="px-3 py-2">고객사명</th>
              <th className="px-3 py-2">파이프라인 단계</th>
              <th className="px-3 py-2 text-right">계약 기대금액</th>
              <th className="px-3 py-2 text-right">성공 확률</th>
              <th className="px-3 py-2">영업 담당자</th>
              <th className="px-3 py-2">차기 실행 계획 (Next Action)</th>
              <th className="px-3 py-2">목표 체결일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">
                  <div className="font-bold font-mono">{i.oppCode}</div>
                  <div className="text-[11px] text-sub">{i.oppName}</div>
                </td>
                <td className="px-3 py-2 text-ink font-medium">{i.customerName}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.pipelineStage.includes("Won") ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    i.pipelineStage.includes("협상") ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-purple-100 text-purple-700 border border-purple-200"
                  }`}>
                    {i.pipelineStage}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.expectedValue / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.winProbabilityPct}%</td>
                <td className="px-3 py-2 text-sub">{i.salesRep}</td>
                <td className="px-3 py-2 text-ink text-[11px] font-medium">{i.nextAction}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.targetClosureDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
