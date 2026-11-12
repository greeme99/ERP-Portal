// AI Copilot — 3단계 하이브리드 아키텍처 (Rule-base ➔ LG K-EXAONE 2.5 + 권한 기반 하이브리드 RAG ➔ 3단계 안전망 Graceful Fallback)
// ① RAG 주입: 비정형 매뉴얼(Vector DB Top 3~5 Chunks) + 정형 트랜잭션(Read-only Function Calling JSON) + RBAC Metadata Filtering
// ② 미연결 처리: 타임아웃(5~10초) + 백엔드 1회 자동 재시도(1~2초) + 에러코드 비노출 + 1단계 추천 키워드 / ERP 메뉴 링크 / 헬프데스크 문의 버튼
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AI_AGENTS, matchRuleBasedQuestion } from "../../services/insights";
import { useAuthz } from "../../services/authz";
import {
  askExaone25,
  ExaoneChatMessage,
  ExaoneConfigStatus,
  ExaoneUsage,
  fetchExaoneConfig,
  RagVectorChunk,
  ReadOnlyFunctionCallResult,
  ReasoningEffort,
  RecommendedContact,
  RecommendedMenuLink,
  updateExaoneConfig,
} from "../../services/exaoneClient";

interface Msg {
  role: "user" | "ai";
  text: string;
  tier?: 1 | 2 | 3;
  badge?: string;
  userFriendlyNotice?: string;
  reasoningContent?: string | null;
  usage?: ExaoneUsage | null;
  vectorDocs?: RagVectorChunk[];
  functionCalls?: ReadOnlyFunctionCallResult[];
  blockedCalls?: ReadOnlyFunctionCallResult[];
  recommendedRuleKeywords?: string[];
  recommendedMenus?: RecommendedMenuLink[];
  recommendedContacts?: RecommendedContact[];
  originalQuery?: string;
}

export default function CopilotPanel() {
  const navigate = useNavigate();
  const authz = useAuthz();

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      tier: 1,
      badge: "3단계 하이브리드 AI 가동중",
      text: "ERP AI Copilot입니다.\n· 1단계: Rule-base 5대 Agent 즉시 응답\n· 2단계: LG K-EXAONE 2.5 (k-exaone_v2.5) + RBAC 하이브리드 RAG (Vector DB 매뉴얼 + Read-only API JSON)\n· 3단계(안전망): 응답 지연(5~10초) 시 추천 키워드·메뉴 바로가기·헬프데스크 자동 연결",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyStep, setBusyStep] = useState("");
  const [forceExaone, setForceExaone] = useState(false);
  const [helpdeskToast, setHelpdeskToast] = useState<string | null>(null);

  // EXAONE 설정 상태
  const [showConfig, setShowConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState<ExaoneConfigStatus | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("low");
  const [timeoutMs, setTimeoutMs] = useState<number>(7000);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchExaoneConfig().then((st) => {
      setConfigStatus(st);
      setReasoningEffort(st.reasoningEffort || "low");
      setTimeoutMs(st.timeoutMs || 7000);
    });
  }, []);

  const push = (m: Msg) => setMsgs((p) => [...p, m]);

  const runAgent = (name: string) => {
    const agent = AI_AGENTS.find((a) => a.name === name);
    if (!agent || busy) return;
    push({ role: "user", text: `${agent.name} 실행` });
    setBusy(true);
    setBusyStep("⚡ 1단계 Rule-base Agent 실시간 분석 중…");
    setTimeout(() => {
      push({
        role: "ai",
        tier: 1,
        badge: `⚡ 1단계 Rule-base · ${agent.name}`,
        text: agent.run(),
        originalQuery: `${agent.name} 결과를 바탕으로 2단계 EXAONE 심층 대응 전략을 수립해줘`,
      });
      setBusy(false);
      setBusyStep("");
    }, 200);
  };

  const invokeStage2Exaone = async (queryText: string, historySnapshot: Msg[]) => {
    setBusy(true);
    setBusyStep(
      `🧠 2단계 LG K-EXAONE 2.5 호출 중 (RBAC Vector RAG + Read-only JSON, 제한 ${(timeoutMs / 1000).toFixed(0)}초)…`
    );

    const chatHistory: ExaoneChatMessage[] = historySnapshot
      .slice(-6)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));
    chatHistory.push({ role: "user", content: queryText });

    const res = await askExaone25(chatHistory, {
      reasoningEffort,
      timeoutMs,
      userIdentity: {
        id: String(authz.user?.id ?? "U-1001"),
        role: String(authz.user?.role ?? "관리자"),
        status: String(authz.user?.status ?? "활성"),
      },
    });

    if (res.tier === 2 && res.mode === "live_api") {
      push({
        role: "ai",
        tier: 2,
        badge: `🧠 2단계 LG K-EXAONE 2.5 (${res.model})`,
        text: res.content,
        reasoningContent: res.reasoningContent,
        usage: res.usage,
        vectorDocs: res.vectorDocs,
        functionCalls: res.functionCalls,
        blockedCalls: res.blockedCalls,
        recommendedMenus: res.recommendedMenus,
      });
    } else {
      // 3단계 안전망 (Graceful Fallback — 시스템 에러 코드 비노출)
      push({
        role: "ai",
        tier: 3,
        badge: "🛡️ 3단계 안전망 (Graceful Fallback)",
        userFriendlyNotice: res.userFriendlyNotice || "현재 AI 상세 분석 서버의 응답이 지연되고 있습니다.",
        text: res.content,
        vectorDocs: res.vectorDocs,
        functionCalls: res.functionCalls,
        blockedCalls: res.blockedCalls,
        recommendedRuleKeywords: res.recommendedRuleKeywords,
        recommendedMenus: res.recommendedMenus,
        recommendedContacts: res.recommendedContacts,
      });
    }

    setBusy(false);
    setBusyStep("");
  };

  const ask = async (rawText: string, forceStage2 = false) => {
    const text = rawText.trim();
    if (!text || busy) return;

    const currentHistory = [...msgs];
    push({ role: "user", text });
    setInput("");

    if (!forceStage2 && !forceExaone) {
      const match = matchRuleBasedQuestion(text);
      if (match.matched) {
        setBusy(true);
        setBusyStep(`⚡ 1단계 Rule-base (${match.agentName}) 실행 중…`);
        setTimeout(() => {
          push({
            role: "ai",
            tier: 1,
            badge: `⚡ 1단계 Rule-base · ${match.agentName}`,
            text: match.response,
            originalQuery: text,
          });
          setBusy(false);
          setBusyStep("");
        }, 200);
        return;
      }
    }

    await invokeStage2Exaone(text, currentHistory);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    const updated = await updateExaoneConfig({
      apiKey: apiKeyInput.trim() ? apiKeyInput.trim() : undefined,
      reasoningEffort,
      timeoutMs,
    });
    setConfigStatus(updated);
    setApiKeyInput("");
    setSavingConfig(false);
    setShowConfig(false);
  };

  const handleContactHelpdesk = (c: RecommendedContact) => {
    setHelpdeskToast(
      `✅ [${c.dept} ${c.name} (${c.ext})] 앞으로 문의 내용 및 현재 화면 컨텍스트가 전달되었습니다.`
    );
    setTimeout(() => setHelpdeskToast(null), 4000);
  };

  return (
    <aside className="w-80 shrink-0 border-l border-line bg-panel flex flex-col">
      {/* 상단 헤더 */}
      <div className="px-3.5 py-2.5 border-b border-line flex items-center justify-between">
        <div>
          <div className="font-bold text-[13px] flex items-center gap-1.5">
            <span>🤖 AI Copilot</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-semibold">
              Rule ➔ EXAONE 2.5 ➔ 안전망
            </span>
          </div>
          <div className="text-[10px] text-sub mt-0.5">
            RBAC: <span className="font-semibold text-ink">{String(authz.user?.name ?? "관리자")} ({String(authz.user?.role ?? "관리자")})</span>{" "}
            ·{" "}
            {configStatus?.configured ? (
              <span className="text-emerald-600 font-semibold">EXAONE 연결됨</span>
            ) : (
              <span className="text-amber-600">3단계 안전망 활성</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowConfig((v) => !v)}
          className="px-2 py-1 rounded border border-line text-[11px] hover:bg-accent-soft shrink-0"
          title="LG EXAONE 2.5 API 및 타임아웃 설정"
        >
          ⚙️ 설정
        </button>
      </div>

      {/* 헬프데스크 전송 알림 토스트 */}
      {helpdeskToast && (
        <div className="mx-3 mt-2 p-2 rounded bg-emerald-600 text-white text-[11px] shadow flex items-center justify-between">
          <span>{helpdeskToast}</span>
          <button onClick={() => setHelpdeskToast(null)} className="ml-2 font-bold">✕</button>
        </div>
      )}

      {/* EXAONE 2.5 설정 패널 */}
      {showConfig && (
        <div className="p-3 border-b border-line bg-surface space-y-2 text-[11px]">
          <div className="font-bold text-ink flex items-center justify-between">
            <span>LG K-EXAONE 2.5 & 3단계 안전망 설정</span>
            <span className="font-mono text-[10px] text-purple-600">k-exaone_v2.5</span>
          </div>
          <div>
            <label className="block text-sub mb-0.5">
              Bearer API Key {configStatus?.maskedKey ? `(등록됨: ${configStatus.maskedKey})` : "(미등록)"}
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="https://api.exaone.ai $EXAONE_API_KEY"
              className="w-full px-2 py-1 rounded border border-line bg-panel text-[11px] outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-sub">추론 강도 (reasoning_effort):</label>
            <select
              value={reasoningEffort}
              onChange={(e) => setReasoningEffort(e.target.value as ReasoningEffort)}
              className="px-2 py-1 rounded border border-line bg-panel text-[11px]"
            >
              <option value="low">low (고속 응답)</option>
              <option value="high">high (심층 수리·분석)</option>
              <option value="max">max (최대 추론)</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-sub">타임아웃 기준 (1회 재시도 포함):</label>
            <select
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(Number(e.target.value))}
              className="px-2 py-1 rounded border border-line bg-panel text-[11px]"
            >
              <option value={5000}>5초 (빠른 폴백)</option>
              <option value={7000}>7초 (권장 표준)</option>
              <option value={10000}>10초 (최대 대기)</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={forceExaone}
              onChange={(e) => setForceExaone(e.target.checked)}
            />
            <span>모든 질문을 2단계 K-EXAONE 2.5로 직접 전송</span>
          </label>
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              onClick={() => setShowConfig(false)}
              className="px-2.5 py-1 rounded border border-line text-[11px] hover:bg-panel"
            >
              닫기
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="px-2.5 py-1 rounded bg-accent text-white text-[11px] font-semibold disabled:opacity-50"
            >
              {savingConfig ? "저장 중…" : "적용"}
            </button>
          </div>
        </div>
      )}

      {/* 1단계 Rule-base 5대 Agent 버튼 */}
      <div className="px-3 py-2 border-b border-line">
        <div className="text-[11px] text-sub mb-1 flex items-center justify-between">
          <span>1단계 Rule-base Agents</span>
          <span className="text-[10px] text-purple-600 font-medium">미지원 질의 시 2단계 자동 전환</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {AI_AGENTS.map((a) => (
            <button
              key={a.name}
              title={a.desc}
              onClick={() => runAgent(a.name)}
              disabled={busy}
              className="px-2 py-1 rounded-full border border-line text-[11px] hover:bg-accent-soft disabled:opacity-50"
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      {/* 대화 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[96%] px-3 py-2 rounded-lg text-[12px] whitespace-pre-line ${
              m.role === "user" ? "ml-auto bg-accent text-white" : "bg-accent-soft text-ink border border-line"
            }`}
          >
            {/* 단계 배지 */}
            {m.role === "ai" && m.badge && (
              <div className="mb-1.5 flex items-center justify-between gap-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    m.tier === 2
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : m.tier === 3
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  {m.badge}
                </span>
                {m.usage?.total_tokens !== undefined && (
                  <span className="text-[9px] text-sub font-mono">
                    tok: {m.usage.total_tokens} (추론 {m.usage.reasoning_tokens ?? 0})
                  </span>
                )}
              </div>
            )}

            {/* 3단계 안전망: 친절한 지연 안내 배너 (시스템 에러 코드 비노출) */}
            {m.role === "ai" && m.tier === 3 && m.userFriendlyNotice && (
              <div className="mb-2 px-2.5 py-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-[11px]">
                ⏳ {m.userFriendlyNotice}
              </div>
            )}

            {/* 권한 기반 하이브리드 RAG 주입 근거 (Vector DB Chunks + Read-only Function Calling JSON) */}
            {m.role === "ai" && ((m.vectorDocs && m.vectorDocs.length > 0) || (m.functionCalls && m.functionCalls.length > 0)) && (
              <details className="mb-1.5 rounded bg-surface/90 border border-line px-2 py-1 text-[10px] text-sub">
                <summary className="cursor-pointer font-semibold text-ink select-none">
                  🔒 RBAC 하이브리드 RAG 컨텍스트 (매뉴얼 {m.vectorDocs?.length ?? 0}건 · API JSON {m.functionCalls?.length ?? 0}건)
                </summary>
                <div className="mt-1 pt-1 border-t border-line space-y-1 font-mono text-[10px]">
                  {m.vectorDocs && m.vectorDocs.length > 0 && (
                    <div>
                      <div className="font-bold text-purple-700">[Vector DB Top Chunks]</div>
                      {m.vectorDocs.map((d) => (
                        <div key={d.docId} className="truncate">
                          · {d.docId} ({d.tcode}): {d.title} (유사도 {d.similarity})
                        </div>
                      ))}
                    </div>
                  )}
                  {m.functionCalls && m.functionCalls.length > 0 && (
                    <div>
                      <div className="font-bold text-emerald-700">[Read-only Function Calling (JSON)]</div>
                      {m.functionCalls.map((fc, idx) => (
                        <div key={idx} className="truncate">
                          · {fc.tool}({fc.moduleId.toUpperCase()}) → {fc.status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* 2단계 K-EXAONE 2.5 reasoning_content */}
            {m.role === "ai" && m.reasoningContent && (
              <details className="mb-1.5 rounded bg-surface/80 border border-line px-2 py-1 text-[11px] text-sub">
                <summary className="cursor-pointer font-semibold text-purple-700 select-none">
                  💭 K-EXAONE 2.5 추론 과정 (reasoning_content)
                </summary>
                <div className="mt-1 pt-1 border-t border-line font-mono text-[10px] whitespace-pre-line leading-relaxed">
                  {m.reasoningContent}
                </div>
              </details>
            )}

            <div>{m.text}</div>

            {/* 대안 1: 1단계 Rule-base 유사 추천 키워드 버튼 */}
            {m.role === "ai" && m.recommendedRuleKeywords && m.recommendedRuleKeywords.length > 0 && (
              <div className="mt-2 pt-2 border-t border-line/70 space-y-1">
                <div className="text-[10px] font-bold text-sub">⚡ 1단계 Rule-base 추천 분석 키워드:</div>
                <div className="flex flex-wrap gap-1">
                  {m.recommendedRuleKeywords.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => ask(kw, false)}
                      disabled={busy}
                      className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      ⚡ &ldquo;{kw}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 대안 2: 관련 ERP 메뉴 바로가기 링크 */}
            {m.role === "ai" && m.recommendedMenus && m.recommendedMenus.length > 0 && (
              <div className="mt-2 pt-2 border-t border-line/70 space-y-1">
                <div className="text-[10px] font-bold text-sub">🔗 관련 ERP 메뉴 바로가기:</div>
                <div className="flex flex-wrap gap-1">
                  {m.recommendedMenus.map((menu) => (
                    <button
                      key={menu.path}
                      onClick={() => navigate(menu.path)}
                      className="px-2 py-0.5 rounded border border-accent bg-panel text-accent text-[10px] font-semibold hover:bg-accent hover:text-white transition-colors"
                    >
                      [{menu.tcode}] {menu.name} →
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 대안 3: 헬프데스크 / 담당자 문의 버튼 */}
            {m.role === "ai" && m.recommendedContacts && m.recommendedContacts.length > 0 && (
              <div className="mt-2 pt-2 border-t border-line/70 space-y-1">
                <div className="text-[10px] font-bold text-sub">📞 헬프데스크 / 담당자 연결:</div>
                <div className="flex flex-col gap-1">
                  {m.recommendedContacts.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => handleContactHelpdesk(c)}
                      className="px-2 py-1 rounded border border-line bg-surface hover:bg-panel text-left text-[10px] flex items-center justify-between"
                    >
                      <span>
                        👤 <b>{c.dept} {c.name}</b> ({c.role})
                      </span>
                      <span className="font-mono text-accent font-semibold">{c.ext} 문의 →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 1단계 응답에서 2단계 K-EXAONE 2.5 심층 추론 호출 버튼 */}
            {m.role === "ai" && m.tier === 1 && m.originalQuery && (
              <div className="mt-2 pt-1.5 border-t border-line/60 flex justify-end">
                <button
                  onClick={() => ask(m.originalQuery!, true)}
                  disabled={busy}
                  className="text-[10px] px-2 py-0.5 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  🧠 2단계 K-EXAONE 2.5 심층 추론 실행
                </button>
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 rounded px-2.5 py-1.5 animate-pulse">
            {busyStep || "분석 중…"}
          </div>
        )}
      </div>

      {/* 질문 입력 영역 */}
      <div className="p-3 border-t border-line flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(input)}
          placeholder="질문 입력 (미지원 질문은 EXAONE 2.5 자동 연결)"
          className="flex-1 px-2.5 py-1.5 rounded border border-line bg-surface text-[12px] outline-none focus:border-accent"
        />
        <button
          onClick={() => ask(input)}
          disabled={busy}
          className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold disabled:opacity-50 shrink-0"
        >
          전송
        </button>
      </div>
    </aside>
  );
}
