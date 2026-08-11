// AiAnomalyDetectionControl.tsx (Realtime AI Anomaly & Fraud Detection Center) — 전사 이상 전표 및 보안 이상 탐지 관제
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface AnomalyDetectItem {
  id: string;
  anomalyRuleId: string;
  detectedTargetModule: string; // 탐지 모듈 (예: FI 회계 전표, LE 재고 수불, COM 보안 감사)
  anomalyDescription: string; // 이상 내용 (예: 주말 야간 이상 대량 재고 차감 시도, 여신 한도 200% 초과 수주 등록)
  riskLevelGrade: "고위험 (High Risk)" | "중위험 (Medium Risk)" | "경미 (Low Risk)";
  aiResolutionAction: "Hermes AI 자동 승인 보류 & 계정 임시 차단" | "감사팀 실시간 알림 발송";
  detectedTimestamp: string;
}

export const anomalyStore = createStore("dashboard.anomaly", [
  { id: "ANO-01", anomalyRuleId: "RULE-FI-08", detectedTargetModule: "FI 재무회계 모듈", anomalyDescription: "결산 승인 없이 차대 변동 전표 대량 입력 탐지", riskLevelGrade: "고위험 (High Risk)", aiResolutionAction: "Hermes AI 자동 승인 보류 & 계정 임시 차단", detectedTimestamp: "2026-08-06 23:45" },
  { id: "ANO-02", anomalyRuleId: "RULE-LE-12", detectedTargetModule: "LE 물류 재고 모듈", anomalyDescription: "LOT 이동 전표 없이 특정 불량 창고 자재 출고 시도", riskLevelGrade: "중위험 (Medium Risk)", aiResolutionAction: "감사팀 실시간 알림 발송", detectedTimestamp: "2026-08-06 20:10" },
  { id: "ANO-03", anomalyRuleId: "RULE-SEC-03", detectedTargetModule: "COM 보안 감사 모듈", anomalyDescription: "비인가 외부 IP에서 전사 고객 마스터 대량 다운로드", riskLevelGrade: "고위험 (High Risk)", aiResolutionAction: "Hermes AI 자동 승인 보류 & 계정 임시 차단", detectedTimestamp: "2026-08-06 19:30" },
]);

export default function AiAnomalyDetectionControl() {
  const items = useStore(anomalyStore) as AnomalyDetectItem[];
  const [riskFilter, setRiskFilter] = useState("전체");

  const filtered = items.filter((i) => riskFilter === "전체" || i.riskLevelGrade.includes(riskFilter));

  const excel = () =>
    downloadCsv(
      "전사_AI_이상탐지_보안관제_대장.csv",
      ["룰ID", "탐지모듈", "이상내용", "위험도", "AI조치내용", "탐지일시"],
      filtered.map((i) => [
        i.anomalyRuleId,
        i.detectedTargetModule,
        i.anomalyDescription,
        i.riskLevelGrade,
        i.aiResolutionAction,
        i.detectedTimestamp,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">00. Executive & AI Command (AI 보안/이상 관제)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">전사 AI 이상 탐지 & 실시간 비정상 관제</h1>
          <span className="text-[11px] text-sub">Hermes AI 실시간 트랜잭션 마이닝 · 회계/재고/보안 이상 패턴 실시간 차단 및 관제 센터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">Hermes AI 탐지 위험 트랜잭션 건수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">고위험(High Risk) 즉시 차단 이행률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">데이터 무결성 손실 예방율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0% (Zero Loss)</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">위험도:</span>
          {["전체", "고위험", "중위험"].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                riskFilter === r
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 AI이상탐지 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">탐지 룰 ID</th>
              <th className="px-3 py-2">대상 ERP 모듈</th>
              <th className="px-3 py-2">탐지된 이상 거래 / 패턴 내용</th>
              <th className="px-3 py-2">위험도 등급</th>
              <th className="px-3 py-2">Hermes AI 자동 대응 조치</th>
              <th className="px-3 py-2">탐지 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.anomalyRuleId}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.detectedTargetModule}</td>
                <td className="px-3 py-2 font-bold text-purple-700 text-[11px]">{i.anomalyDescription}</td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      i.riskLevelGrade.includes("High Risk")
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {i.riskLevelGrade}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub font-medium text-[11px]">{i.aiResolutionAction}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.detectedTimestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
