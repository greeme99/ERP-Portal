// LG AI Research K-EXAONE 2.5 (k-exaone_v2.5) 클라이언트 서비스
// - ① 권한 기반 하이브리드 RAG 주입 (Vector DB Top 3~5 + Read-only Function Calling JSON + RBAC Metadata Filtering)
// - ② 3단계 안전망 Graceful Fallback (5~10초 타임아웃 + 백엔드 1회 자동 재시도 + 에러코드 비노출 + 1단계 추천 키워드 / ERP 메뉴 링크 / 헬프데스크 문의 버튼)

import { buildErpContextForLlm } from "./insights";

export type ReasoningEffort = "low" | "high" | "max";

export interface ExaoneChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ExaoneUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  reasoning_tokens?: number;
}

export interface RagVectorChunk {
  docId: string;
  moduleId: string;
  title: string;
  tcode: string;
  routePath: string;
  content: string;
  similarity: number;
}

export interface ReadOnlyFunctionCallResult {
  tool: string;
  moduleId: string;
  params: unknown;
  status: "OK" | "RBAC_BLOCKED";
  resultJson?: unknown;
  reason?: string;
}

export interface RecommendedMenuLink {
  tcode: string;
  name: string;
  path: string;
  module: string;
}

export interface RecommendedContact {
  dept: string;
  name: string;
  ext: string;
  email: string;
  role: string;
}

export interface ExaoneChatResponse {
  ok: boolean;
  tier: 2 | 3;
  mode: "live_api" | "safety_net_3tier";
  model: string;
  attempts?: number;
  userFriendlyNotice?: string;
  content: string;
  reasoningContent?: string | null;
  usage?: ExaoneUsage | null;
  vectorDocs?: RagVectorChunk[];
  functionCalls?: ReadOnlyFunctionCallResult[];
  blockedCalls?: ReadOnlyFunctionCallResult[];
  recommendedRuleKeywords?: string[];
  recommendedMenus?: RecommendedMenuLink[];
  recommendedContacts?: RecommendedContact[];
  adminNotified?: boolean;
}

export interface ExaoneConfigStatus {
  configured: boolean;
  maskedKey: string | null;
  apiUrl: string;
  model: string;
  reasoningEffort: ReasoningEffort;
  maxTokens: number;
  timeoutMs: number;
  retryDelayMs?: number;
  maxRetries?: number;
  temperature: number;
  topP: number;
  preserveThinking: boolean;
}

const LOCAL_STORAGE_KEY = "erp.exaone.config.v1";

interface LocalExaoneConfig {
  apiKey?: string;
  apiUrl?: string;
  reasoningEffort?: ReasoningEffort;
  maxTokens?: number;
  timeoutMs?: number;
  preserveThinking?: boolean;
}

export function loadLocalExaoneConfig(): LocalExaoneConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalExaoneConfig) : {};
  } catch {
    return {};
  }
}

export function saveLocalExaoneConfig(cfg: LocalExaoneConfig): void {
  try {
    const prev = loadLocalExaoneConfig();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...prev, ...cfg }));
  } catch {
    // ignore storage errors
  }
}

function resolveApiBase(): string {
  const envUrl = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ?? "").trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export async function fetchExaoneConfig(): Promise<ExaoneConfigStatus> {
  const local = loadLocalExaoneConfig();
  const base = resolveApiBase();
  try {
    const res = await fetch(`${base}/api/ai/exaone/config`, { method: "GET" });
    if (res.ok) {
      const json = await res.json();
      if (json?.ok && json.data) {
        const d = json.data as ExaoneConfigStatus;
        if (!d.configured && local.apiKey) {
          return {
            ...d,
            configured: true,
            maskedKey: `${local.apiKey.slice(0, 6)}...${local.apiKey.slice(-4)}`,
            reasoningEffort: local.reasoningEffort ?? d.reasoningEffort,
            timeoutMs: local.timeoutMs ?? d.timeoutMs ?? 7000,
          };
        }
        return d;
      }
    }
  } catch {
    // fallback to local config
  }
  const hasLocalKey = Boolean(local.apiKey && local.apiKey.trim().length > 0);
  return {
    configured: hasLocalKey,
    maskedKey: hasLocalKey && local.apiKey ? `${local.apiKey.slice(0, 6)}...${local.apiKey.slice(-4)}` : null,
    apiUrl: local.apiUrl || "https://api.exaone.ai/v1/chat/completions",
    model: "k-exaone_v2.5",
    reasoningEffort: local.reasoningEffort || "low",
    maxTokens: local.maxTokens || 1024,
    timeoutMs: local.timeoutMs || 7000,
    temperature: 1.0,
    topP: 0.95,
    preserveThinking: local.preserveThinking ?? true,
  };
}

export async function updateExaoneConfig(patch: {
  apiKey?: string;
  apiUrl?: string;
  reasoningEffort?: ReasoningEffort;
  maxTokens?: number;
  timeoutMs?: number;
  preserveThinking?: boolean;
}): Promise<ExaoneConfigStatus> {
  saveLocalExaoneConfig(patch);
  const base = resolveApiBase();
  try {
    const res = await fetch(`${base}/api/ai/exaone/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.ok && json.data) {
        return json.data as ExaoneConfigStatus;
      }
    }
  } catch {
    // ignore if backend not reachable
  }
  return fetchExaoneConfig();
}

/**
 * 클라이언트 오프라인/정적 환경용 3단계 안전망(Graceful Fallback) 빌더
 */
function buildClientSafetyNetFallback(query: string): ExaoneChatResponse {
  const q = query.toLowerCase();
  const isMm = /구매|발주|자재|공급사|pr|po|재고|배터리|모터/.test(q);
  const isFi = /손익|매출|재무|전표|채권|채무|원가/.test(q);

  return {
    ok: true,
    tier: 3,
    mode: "safety_net_3tier",
    model: "k-exaone_v2.5",
    userFriendlyNotice: "현재 AI 상세 분석 서버의 응답이 지연되고 있습니다.",
    content: [
      `현재 AI 상세 분석 서버의 응답이 지연되고 있습니다.`,
      ``,
      `업무 연속성을 위해 아래 1단계 Rule-base 추천 분석 키워드, 관련 ERP 메뉴 바로가기, 또는 담당자(헬프데스크) 문의를 이용해 주세요.`,
    ].join("\n"),
    recommendedRuleKeywords: isMm
      ? ["부족 자재 알려줘", "생산 스케줄 납기 리스크 점검"]
      : isFi
      ? ["이번 달 손익 요약해줘", "연체 채권 및 재무 KPI 알려줘"]
      : ["주단위 수요예측 분석해줘", "부족 자재 알려줘", "이번 달 손익 요약해줘"],
    recommendedMenus: isMm
      ? [
          { tcode: "PP-02", name: "자재소요량계획 (MRP 역산)", path: "/m/pp/pp-02", module: "PP" },
          { tcode: "MM-01", name: "구매요청 (PR) 관리", path: "/m/mm/mm-01", module: "MM" },
        ]
      : isFi
      ? [
          { tcode: "FI-01", name: "분개전표 관리", path: "/m/fi/fi-01", module: "FI" },
          { tcode: "CO-01", name: "표준/실제 제조원가 분석", path: "/m/co/co-01", module: "CO" },
        ]
      : [
          { tcode: "SCM-01", name: "수요예측 (24주 & AI 예측)", path: "/m/scm/scm-01", module: "SCM" },
          { tcode: "PP-01", name: "주생산계획 (MPS 14일/20주)", path: "/m/pp/pp-01", module: "PP" },
        ],
    recommendedContacts: [
      { dept: "혁신기획/AX헬프데스크", name: "김문규 팀장", ext: "내선 101", email: "mg.kim@greenelec.co.kr", role: "ERP·AI 헬프데스크" },
      { dept: "생산/SCM관리팀", name: "박준혁 수석", ext: "내선 204", email: "jh.park@greenelec.co.kr", role: "MPS/MRP 담당" },
    ],
  };
}

/**
 * 2단계 Fallback: LG AI Research K-EXAONE 2.5 (`k-exaone_v2.5`) 호출
 * - 요청자의 사번/직급·역할(identity) 헤더를 포함하여 RBAC Metadata Filtering 및 Read-only Function Calling 수행
 * - 타임아웃(5~10초) 초과 또는 장애 시 1회 자동 재시도 후 3단계 안전망(Graceful Fallback) 반환
 */
export async function askExaone25(
  messages: ExaoneChatMessage[],
  options?: {
    reasoningEffort?: ReasoningEffort;
    maxTokens?: number;
    timeoutMs?: number;
    userIdentity?: { id?: string; role?: string; status?: string };
  }
): Promise<ExaoneChatResponse> {
  const erpContext = buildErpContextForLlm();
  const localCfg = loadLocalExaoneConfig();
  const base = resolveApiBase();
  const timeoutMs = Math.max(5000, Math.min(10000, Number(options?.timeoutMs || localCfg.timeoutMs || 7000)));

  const payload = {
    messages,
    erpContext,
    reasoningEffort: options?.reasoningEffort || localCfg.reasoningEffort || "low",
    maxTokens: options?.maxTokens || localCfg.maxTokens || 1024,
    timeoutMs,
    temperature: 1.0,
    topP: 0.95,
    preserveThinking: localCfg.preserveThinking ?? true,
    apiKeyOverride: localCfg.apiKey || undefined,
    apiUrlOverride: localCfg.apiUrl || undefined,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.userIdentity?.id) {
    headers["X-ERP-User-Id"] = encodeURIComponent(String(options.userIdentity.id));
  }
  if (options?.userIdentity?.role) {
    headers["X-ERP-User-Role"] = encodeURIComponent(String(options.userIdentity.role));
  }
  if (options?.userIdentity?.status) {
    headers["X-ERP-User-Status"] = encodeURIComponent(String(options.userIdentity.status));
  }

  // 백엔드 프록시 (/api/ai/exaone/chat) 경유 호출 (타임아웃 여유 +2.5초: 서버 내부 1회 재시도 시간 보장)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs + 2500);
    const res = await fetch(`${base}/api/ai/exaone/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = (await res.json()) as ExaoneChatResponse;
    if (data && typeof data === "object" && "content" in data) {
      return data;
    }
  } catch {
    // 백엔드 미응답 시 클라이언트 3단계 안전망으로 즉시 방어
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  return buildClientSafetyNetFallback(lastUser);
}
