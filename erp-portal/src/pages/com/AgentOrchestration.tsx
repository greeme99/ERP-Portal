// COM-014 AI에이전트 오케스트레이션 (Hermes Agent Orchestration & Task Control) — 헤르메스(Hermes) 자율형 AI 에이전트 실행 및 모니터링
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface AgentOrchestrationItem {
  id: string;
  agentId: string;
  agentName: string; // 헤르메스 에이전트 명 (예: Hermes-MRP-Agent, Hermes-Demand-Forecast)
  assignedDomain: string; // 담당 ERP 도메인 (예: PP 생산/자재소요, SCM 수요예측, CO 원가탐지)
  activeStatus: "자율 실행중 (Active)" | "대기중 (Idle)" | "점검중";
  tasksProcessed: number; // 수행 처리한 태스크 수
  lastExecutionTime: string;
  llmModelVersion: string;
}

export const agentOrchestrStore = createStore("com.agent_orchestr", [
  { id: "AGO-01", agentId: "HERMES-01", agentName: "Hermes MRP 자재소요 전개 에이전트", assignedDomain: "PP 생산계획 & MM 구매자재", activeStatus: "자율 실행중 (Active)", tasksProcessed: 1250, lastExecutionTime: "2026-08-06 16:50", llmModelVersion: "Gemini-2.5-Pro-Agentic" },
  { id: "AGO-02", agentId: "HERMES-02", agentName: "Hermes SCM AI 수요예측 엔진", assignedDomain: "SCM 공급망 & SD 영업", activeStatus: "자율 실행중 (Active)", tasksProcessed: 890, lastExecutionTime: "2026-08-06 16:00", llmModelVersion: "Gemini-2.5-Flash-Lite" },
  { id: "AGO-03", agentId: "HERMES-03", agentName: "Hermes CO 원가 이상 탐지 에이전트", assignedDomain: "CO 관리회계 & FI 재무회계", activeStatus: "자율 실행중 (Active)", tasksProcessed: 430, lastExecutionTime: "2026-08-06 15:30", llmModelVersion: "Gemini-2.5-Pro-Agentic" },
]);

export default function AgentOrchestration() {
  const items = useStore(agentOrchestrStore) as AgentOrchestrationItem[];
  const [domainFilter, setDomainFilter] = useState("전체");

  const filtered = items.filter((i) => domainFilter === "전체" || i.assignedDomain.includes(domainFilter));

  const totalTasks = filtered.reduce((acc, i) => acc + i.tasksProcessed, 0);

  const excel = () =>
    downloadCsv(
      "시스템_AI_에이전트_오케스트레이션_대장.csv",
      ["에이전트ID", "에이전트명", "담당도메인", "가동상태", "처리태스크수", "최근실행일시", "LLM모델버전"],
      filtered.map((i) => [
        i.agentId,
        i.agentName,
        i.assignedDomain,
        i.activeStatus,
        i.tasksProcessed,
        i.lastExecutionTime,
        i.llmModelVersion,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">AI에이전트 오케스트레이션 (COM-014)</h1>
          <span className="text-[11px] text-sub">헤르메스(Hermes) 자율형 AI 에이전트 통합 제어 및 멀티 에이전트 자율 태스크 모니터링</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">자율 실행중인 AI 에이전트</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.filter((i) => i.activeStatus.includes("Active")).length} <span className="text-xs font-normal text-ink">개 에이전트</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">누적 자율 수행 태스크 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{totalTasks.toLocaleString()} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">에이전트 응답 성공률</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">도메인:</span>
          {["전체", "PP", "SCM", "CO"].map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                domainFilter === d
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 에이전트 오케스트레이션 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">에이전트 ID / 명</th>
              <th className="px-3 py-2">담당 ERP 도메인</th>
              <th className="px-3 py-2">가동 상태</th>
              <th className="px-3 py-2 text-right">수행 태스크 수</th>
              <th className="px-3 py-2">최근 실행 일시</th>
              <th className="px-3 py-2">LLM 모델 버전</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">
                  <div className="font-bold font-mono text-blue-600">{i.agentId}</div>
                  <div className="text-[11px] text-ink font-semibold">{i.agentName}</div>
                </td>
                <td className="px-3 py-2 text-sub font-medium">{i.assignedDomain}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.activeStatus}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.tasksProcessed.toLocaleString()}건</td>
                <td className="px-3 py-2 font-mono text-sub">{i.lastExecutionTime}</td>
                <td className="px-3 py-2 font-mono text-purple-600 font-bold">{i.llmModelVersion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
