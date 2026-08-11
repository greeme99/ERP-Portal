// COM-013 워크플로우 자동화 (Workflow Automation & Event Trigger Rules) — ERP 시스템 전가 이벤트 트리거·자동화 승인 및 알림 규칙 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface WorkflowRuleItem {
  id: string;
  ruleCode: string;
  ruleName: string;
  triggerEvent: string; // 트리거 조건 이벤트 (예: 구매 요청 PR 5천만원 이상, 여신 한도 90% 초과)
  actionTask: string; // 실행 처리 작업 (예: 임원 승인 자동 라우팅, 담당자 SMS/메일 즉시 경보)
  executionModule: string; // 실행 대상 모듈
  activeYn: "Y" | "N";
  lastTriggeredTime: string; // 최근 이벤트 실행 일시
}

export const workflowRuleStore = createStore("com.workflow_rule", [
  { id: "WF-01", ruleCode: "WF-RULE-01", ruleName: "구매 요청(PR) 예산 초과 자동 결재 라우팅", triggerEvent: "구매 요청 금액이 부서 잔여 예산을 초과 시", actionTask: "경영기획팀 및 임원 자동 승인 결재선 변경 라우팅", executionModule: "MM 구매자재 / COM 결재", activeYn: "Y", lastTriggeredTime: "2026-08-05 14:30" },
  { id: "WF-02", ruleCode: "WF-RULE-02", ruleName: "고객 수주 여신 한도 경보 및 출하 보류 트리거", triggerEvent: "고객 여신 잔여액이 수주 금액보다 작을 때", actionTask: "영업 담당자 즉시 경보 및 자동 출하 보류(Hold) 생성", executionModule: "SD 영업관리 / LE 물류", activeYn: "Y", lastTriggeredTime: "2026-08-06 09:15" },
  { id: "WF-03", ruleCode: "WF-RULE-03", ruleName: "MRP 자재 소요량 부족 시 자동 PR 생성", triggerEvent: "생산 계획 확정 시 자재 안전재고 이하 감지", actionTask: "구매 요청(PR) 문서 자동 스케줄링 생성", executionModule: "PP 생산 / MM 구매", activeYn: "Y", lastTriggeredTime: "2026-08-06 10:00" },
]);

export default function WorkflowAutomation() {
  const items = useStore(workflowRuleStore) as WorkflowRuleItem[];
  const [activeFilter, setActiveFilter] = useState("전체");

  const filtered = items.filter((i) => activeFilter === "전체" || i.activeYn === activeFilter);

  const excel = () =>
    downloadCsv(
      "시스템_워크플로우_자동화_규칙_대장.csv",
      ["규칙코드", "규칙명", "트리거이벤트", "실행처리작업", "대상모듈", "활성여부", "최근실행일시"],
      filtered.map((i) => [
        i.ruleCode,
        i.ruleName,
        i.triggerEvent,
        i.actionTask,
        i.executionModule,
        i.activeYn,
        i.lastTriggeredTime,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">워크플로우 자동화 (COM-013)</h1>
          <span className="text-[11px] text-sub">전사 업무 이벤트 트리거(Trigger) · 자동 승인 라우팅 및 위험 경보 처리 규칙 마스터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">활성화 (Active) 자동화 규칙 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.filter((i) => i.activeYn === "Y").length} <span className="text-xs font-normal text-ink">개 규칙</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">오늘 자동화 규칙 실행 건수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">14 <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">자동화 성공 이행률</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">활성:</span>
          {["전체", "Y"].map((a) => (
            <button
              key={a}
              onClick={() => setActiveFilter(a)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeFilter === a
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 워크플로우 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">규칙 코드 / 규칙명</th>
              <th className="px-3 py-2">트리거 이벤트 조건</th>
              <th className="px-3 py-2">자동 실행 처리 작업</th>
              <th className="px-3 py-2">연동 실행 모듈</th>
              <th className="px-3 py-2">활성 여부</th>
              <th className="px-3 py-2">최근 실행 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">
                  <div className="font-bold font-mono text-blue-600">{i.ruleCode}</div>
                  <div className="text-[11px] text-ink font-semibold">{i.ruleName}</div>
                </td>
                <td className="px-3 py-2 font-semibold text-red-500 text-[11px]">{i.triggerEvent}</td>
                <td className="px-3 py-2 font-medium text-emerald-600 text-[11px]">{i.actionTask}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.executionModule}</td>
                <td className="px-3 py-2 font-bold font-mono text-sub">{i.activeYn}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.lastTriggeredTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
