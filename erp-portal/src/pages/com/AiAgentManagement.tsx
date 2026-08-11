// COM-011 AI Agent 관리 — 5개 ERP 특화 AI Agent(수요예측·재고최적화·품질예측·원가이상·자금리스크) 모니터링 및 추론 가동 설정
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface AiAgentItem {
  id: string;
  agentCode: string;
  agentName: string;
  targetDomain: string; // 담당 업무 (예: Demand Forecasting, Cost Anomaly)
  modelAccuracyPct: number; // 모델 추론 정확도 (%)
  totalInferences: number; // 누적 추론 횟수
  detectedInsightsCount: number; // 감지된 핵심 인사이트 수
  status: "ACTIVE" | "TRAINING" | "IDLE";
  lastTrainedAt: string;
}

export const aiAgentStore = createStore("com.ai_agent", [
  { id: "AGT-01", agentCode: "AGENT-DEMAND-01", agentName: "수요예측 AI Agent (Demand Forecasting)", targetDomain: "SCM / 영업 demand", modelAccuracyPct: 94.2, totalInferences: 1250, detectedInsightsCount: 42, status: "ACTIVE", lastTrainedAt: "2026-08-01" },
  { id: "AGT-02", agentCode: "AGENT-STOCK-02", agentName: "재고최적화 AI Agent (Safety Stock Optimization)", targetDomain: "물류 / 재고 소진 리스크", modelAccuracyPct: 91.8, totalInferences: 3400, detectedInsightsCount: 18, status: "ACTIVE", lastTrainedAt: "2026-08-02" },
  { id: "AGT-03", agentCode: "AGENT-QUALITY-03", agentName: "품질예측 AI Agent (Defect Anomaly Detection)", targetDomain: "품질 / SPC 공정 수율", modelAccuracyPct: 88.5, totalInferences: 890, detectedInsightsCount: 7, status: "ACTIVE", lastTrainedAt: "2026-08-03" },
  { id: "AGT-04", agentCode: "AGENT-COST-04", agentName: "원가이상 감지 AI Agent (Cost Variance Anomaly)", targetDomain: "관리회계 / 제조원가", modelAccuracyPct: 96.0, totalInferences: 540, detectedInsightsCount: 15, status: "TRAINING", lastTrainedAt: "2026-08-05" },
  { id: "AGT-05", agentCode: "AGENT-CASH-05", agentName: "자금리스크 AI Agent (Cashflow Risk Predictor)", targetDomain: "재무 / 채권 이탈 위험", modelAccuracyPct: 93.1, totalInferences: 420, detectedInsightsCount: 9, status: "ACTIVE", lastTrainedAt: "2026-08-04" },
]);

export default function AiAgentManagement() {
  const agents = useStore(aiAgentStore) as AiAgentItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = agents.filter((a) => statusFilter === "전체" || a.status === statusFilter);

  const avgAcc = (agents.reduce((acc, a) => acc + a.modelAccuracyPct, 0) / agents.length).toFixed(1);
  const totalInsights = agents.reduce((acc, a) => acc + a.detectedInsightsCount, 0);

  const excel = () =>
    downloadCsv(
      "시스템_AI_Agent_운영대장.csv",
      ["에이전트코드", "에이전트명", "담당도메인", "추론정확도(%)", "누적추론횟수", "감지인사이트수", "상태", "최근학습일자"],
      filtered.map((a) => [
        a.agentCode,
        a.agentName,
        a.targetDomain,
        `${a.modelAccuracyPct}%`,
        a.totalInferences,
        a.detectedInsightsCount,
        a.status,
        a.lastTrainedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">13. Common / Platform (공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">AI Agent 관리 (COM-011)</h1>
          <span className="text-[11px] text-sub">5개 ERP 전용 AI Agent (수요·재고·품질·원가·자금) 자율 추론 및 헬스 모니터링</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">평균 AI 모델 추론 정확도</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{avgAcc}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">감지된 핵심 이상 인사이트</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{totalInsights} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">실시간 가동 에이전트</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {agents.filter((a) => a.status === "ACTIVE").length} / {agents.length} <span className="text-xs font-normal text-ink">개</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "ACTIVE", "TRAINING", "IDLE"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === st
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 AI Agent 대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">에이전트 코드 / 명</th>
              <th className="px-3 py-2">담당 업무 도메인</th>
              <th className="px-3 py-2 text-right">모델 추론 정확도</th>
              <th className="px-3 py-2 text-right">누적 추론 횟수</th>
              <th className="px-3 py-2 text-right">감지 인사이트 수</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">최근 학습일자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{a.agentCode} — {a.agentName}</td>
                <td className="px-3 py-2 text-sub font-medium">{a.targetDomain}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{a.modelAccuracyPct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{a.totalInferences.toLocaleString()}회</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{a.detectedInsightsCount}건</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    a.status === "TRAINING" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{a.lastTrainedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
