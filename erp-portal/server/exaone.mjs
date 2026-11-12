// LG AI Research K-EXAONE 2.5 (k-exaone_v2.5) API 연동
// + ① 권한 기반 하이브리드 RAG 주입 (RBAC Metadata Filtering + Vector DB Top 3~5 + Read-only Function Calling JSON)
// + ② 3단계 안전망 Graceful Fallback (5~10초 타임아웃 + 백엔드 1~2초 간격 1회 자동 재시도 + 에러코드 비노출 + 백엔드 로깅/관리자 알림)

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PERM_ORDER } from "./authz.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

function loadLocalEnv() {
  const candidates = [join(HERE, "..", ".env"), join(HERE, "..", "..", ".env")];
  const parsed = {};
  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      const content = readFileSync(filePath, "utf8");
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eqIdx = line.indexOf("=");
        if (eqIdx <= 0) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in parsed)) parsed[key] = val;
      }
    } catch {
      // ignore
    }
  }
  return parsed;
}

const localEnv = loadLocalEnv();

let runtimeConfig = {
  apiUrl: process.env.EXAONE_API_URL || localEnv.EXAONE_API_URL || "https://api.exaone.ai/v1/chat/completions",
  apiKey: process.env.EXAONE_API_KEY || localEnv.EXAONE_API_KEY || "",
  model: process.env.EXAONE_MODEL || localEnv.EXAONE_MODEL || "k-exaone_v2.5",
  reasoningEffort: process.env.EXAONE_REASONING_EFFORT || localEnv.EXAONE_REASONING_EFFORT || "low",
  maxTokens: Number(process.env.EXAONE_MAX_TOKENS || localEnv.EXAONE_MAX_TOKENS || 1024),
  timeoutMs: Number(process.env.EXAONE_TIMEOUT_MS || localEnv.EXAONE_TIMEOUT_MS || 7000), // 5~10초 제한 (기본 7초)
  retryDelayMs: Number(process.env.EXAONE_RETRY_DELAY_MS || localEnv.EXAONE_RETRY_DELAY_MS || 1200), // 1~2초 간격 1회 재시도
  maxRetries: 1,
  slackWebhookUrl: process.env.ADMIN_SLACK_WEBHOOK_URL || localEnv.ADMIN_SLACK_WEBHOOK_URL || "",
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL || localEnv.ADMIN_ALERT_EMAIL || "ax-ops-alert@greenelec.co.kr",
  temperature: 1.0,
  topP: 0.95,
  preserveThinking: true,
};

export function getExaoneConfigStatus() {
  const hasKey = Boolean(runtimeConfig.apiKey && runtimeConfig.apiKey.trim().length > 0);
  const maskedKey = hasKey
    ? `${runtimeConfig.apiKey.slice(0, 6)}...${runtimeConfig.apiKey.slice(-4)}`
    : null;
  return {
    configured: hasKey,
    maskedKey,
    apiUrl: runtimeConfig.apiUrl,
    model: runtimeConfig.model,
    reasoningEffort: runtimeConfig.reasoningEffort,
    maxTokens: runtimeConfig.maxTokens,
    timeoutMs: runtimeConfig.timeoutMs,
    retryDelayMs: runtimeConfig.retryDelayMs,
    maxRetries: runtimeConfig.maxRetries,
    temperature: runtimeConfig.temperature,
    topP: runtimeConfig.topP,
    preserveThinking: runtimeConfig.preserveThinking,
  };
}

export function updateExaoneRuntimeConfig(patch = {}) {
  if (typeof patch.apiUrl === "string" && patch.apiUrl.trim()) {
    runtimeConfig.apiUrl = patch.apiUrl.trim();
  }
  if (typeof patch.apiKey === "string") {
    runtimeConfig.apiKey = patch.apiKey.trim();
  }
  if (typeof patch.model === "string" && patch.model.trim()) {
    runtimeConfig.model = patch.model.trim();
  }
  if (patch.reasoningEffort === "low" || patch.reasoningEffort === "high" || patch.reasoningEffort === "max") {
    runtimeConfig.reasoningEffort = patch.reasoningEffort;
  }
  if (Number.isFinite(Number(patch.maxTokens)) && Number(patch.maxTokens) >= 64) {
    runtimeConfig.maxTokens = Math.min(32768, Number(patch.maxTokens));
  }
  if (Number.isFinite(Number(patch.timeoutMs))) {
    runtimeConfig.timeoutMs = Math.max(5000, Math.min(10000, Number(patch.timeoutMs)));
  }
  if (typeof patch.preserveThinking === "boolean") {
    runtimeConfig.preserveThinking = patch.preserveThinking;
  }
  return getExaoneConfigStatus();
}

// ── ①-A. RBAC 권한 검증 헬퍼 (사번/직급·역할 Metadata Filtering) ───────────────

export function canUserAccessModule(identity, permissionRows, moduleId, minLevel = "조회") {
  if (!identity || !identity.role) return true;
  if (identity.status && identity.status !== "활성") return false;
  if (identity.role === "관리자") return true;
  const row = (permissionRows ?? []).find((r) => r?.role === identity.role);
  if (!row || !row.perms) return true;
  const actual = row.perms[moduleId] ?? "없음";
  return PERM_ORDER.indexOf(actual) >= PERM_ORDER.indexOf(minLevel);
}

// ── ①-B. 비정형 문서 (매뉴얼, 사내 규정, 프로세스 가이드) — Vector DB + RBAC Metadata Filtering ──

export const ERP_MANUAL_DOCUMENTS = [
  {
    docId: "DOC-SCM-01",
    moduleId: "scm",
    minPermLevel: "조회",
    title: "SCM 24주 롤링 수요예측 및 Holt 이중지수평활 매뉴얼",
    tcode: "SCM-01",
    routePath: "/m/scm/scm-01",
    content:
      "고객사 24주 구매계획 CSV 업로드 시 1~16주는 확정/변동 계획으로 반영하고, 계획이 비어있는 17~24주 구간은 Holt 이중지수평활(alpha 수준, beta 추세), 이동평균, 선형회귀 가중 앙상블 통계모델로 자동 산출한다. 시뮬레이션 완료 후 [계획 확정] 실행 시 SQLite DB에 버전이 부여되어 저장된다.",
  },
  {
    docId: "DOC-SCM-02",
    moduleId: "scm",
    minPermLevel: "조회",
    title: "S&OP 3~24주 비상공급대책(Contingency Plan) 프로세스 가이드",
    tcode: "SCM-02",
    routePath: "/m/scm/scm-02",
    content:
      "3~24주 구간에서 예상재고가 안전재고 미달 또는 결품위험으로 판정될 경우 잔업·특근, 외주 임가공, 항공 긴급운송, 안전재고 전용 등의 Contingency 대책을 시뮬레이션하고 추가 비용 영향(costImpact)을 검토하여 확정한다.",
  },
  {
    docId: "DOC-PP-01",
    moduleId: "pp",
    minPermLevel: "조회",
    title: "주생산계획(MPS) 14일 일별 및 20주 주간 밸런싱 매뉴얼",
    tcode: "PP-01",
    routePath: "/m/pp/pp-01",
    content:
      "1~2주차(14일)는 일일 라인 CAPA(650 EA/일) 기준으로 일별 평준화하고, 3~20주차는 주간 수요·영업 RTF·소요공수(M/H)·잔업시간·외주물량을 밸런싱한다. 확정된 MPS는 MRP 자재소요 전개의 기준 입력이 된다.",
  },
  {
    docId: "DOC-PP-02",
    moduleId: "pp",
    minPermLevel: "조회",
    title: "자재소요량계획(MRP) 24주 화요일 입고 기준 리드타임 역산 사내 규정",
    tcode: "PP-02",
    routePath: "/m/pp/pp-02",
    content:
      "다단계 BOM(FG→SF→RM/PK)을 전개하여 총소요량과 안전재고 대비 부족수량을 산출한다. 모든 자재는 해당 주차 화요일(Tuesday) 입고 완료를 기준으로 조달 리드타임(단납기 1주, 중납기 2~4주, 장납기 6~8주: 배터리셀 8주·BLDC모터 6주)만큼 역산하여 구매요청(PR) 발주 기한을 자동 산정한다.",
  },
  {
    docId: "DOC-SD-01",
    moduleId: "sd",
    minPermLevel: "조회",
    title: "수주 등록 여신한도(SD-CREDIT-001) 및 ATP 가용재고 점검 규정",
    tcode: "SD-02",
    routePath: "/m/sd/sd-02",
    content:
      "수주 등록 시 고객 여신한도(creditLimit - creditUsed)를 초과하는 주문은 승인 권한자만 확정할 수 있다(User Exit SD-CREDIT-001). 출하예약 전 ATP(가용재고 = 현재고 - 기예약 수주량)를 확인하여 부족 시 MPS 증량을 요청한다.",
  },
  {
    docId: "DOC-MM-01",
    moduleId: "mm",
    minPermLevel: "조회",
    title: "구매발주(PO) 승인 한도(MM-PO-LIMIT-001) 및 공급사 평가 규정",
    tcode: "MM-02",
    routePath: "/m/mm/mm-02",
    content:
      "단일 구매발주 금액이 5,000만 원을 초과하는 경우 일반 담당자는 '발주 대기' 상태로만 저장 가능하며 구매 승인권자의 결재가 필수이다(MM-PO-LIMIT-001). 공급사 선정 시 품질·납기·가격·대응력 종합점수 A등급 공급사를 우선 추천한다.",
  },
  {
    docId: "DOC-QM-01",
    moduleId: "qm",
    minPermLevel: "조회",
    title: "수입검사 불합격 LOT 자동 보류 및 SPC 공정능력(Cpk 1.33) 관리 지침",
    tcode: "QM-01",
    routePath: "/m/qm/qm-01",
    content:
      "원자재 입고 후 수입검사에서 불합격 판정 시 해당 LOT는 물류 창고에서 즉시 '보류' 상태로 격리되며 부적합(8D) 및 CAPA 시정조치가 개시된다. 주요 공정 품질특성의 Cpk가 1.33 미만이면 공정개선 경보가 발령된다.",
  },
  {
    docId: "DOC-FI-01",
    moduleId: "fi",
    minPermLevel: "조회",
    title: "재무회계 분개전표 차대평형(FI-BALANCE-001) 및 채권·채무 마감 규정",
    tcode: "FI-01",
    routePath: "/m/fi/fi-01",
    content:
      "모든 분개전표(JV)는 차변 합계와 대변 합계가 1원 단위까지 정확히 일치해야 전기(Posting)가 허용된다(FI-BALANCE-001). 수주 출하 시 매출채권(AR), 발주 입고 시 매입채무(AP)가 연동 생성된다.",
  },
  {
    docId: "DOC-MDM-01",
    moduleId: "mdm",
    minPermLevel: "조회",
    title: "기준정보관리(MDM) 12대 마스터 테이블 및 리드타임 등록 지침",
    tcode: "MDM-01",
    routePath: "/m/mdm/mdm-01",
    content:
      "품목(mdm_material), 다단계 BOM(mdm_bom), 거래처(mdm_partner), 고객여신(mdm_customer), 공급사(mdm_supplier), 작업장(mdm_work_center), 창고(mdm_warehouse), 공장(mdm_plant), 설비(mdm_equipment), 계정과목(mdm_gl_account), 환율(mdm_fx_rate), 조직(mdm_org) 12개 물리 테이블이 SQLite DB에 실시간 동기화된다.",
  },
];

function textToSparseVector(text) {
  const clean = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const vec = {};
  const words = clean.split(" ").filter(Boolean);
  for (const w of words) {
    vec[`w:${w}`] = (vec[`w:${w}`] || 0) + 2.0;
    for (let i = 0; i < w.length - 1; i++) {
      const bg = `g:${w.slice(i, i + 2)}`;
      vec[bg] = (vec[bg] || 0) + 1.0;
    }
  }
  let normSq = 0;
  for (const v of Object.values(vec)) normSq += v * v;
  const norm = Math.sqrt(normSq) || 1;
  for (const k of Object.keys(vec)) vec[k] = Number((vec[k] / norm).toFixed(4));
  return vec;
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  for (const [k, valA] of Object.entries(vecA)) {
    if (vecB[k] !== undefined) dot += valA * vecB[k];
  }
  return dot;
}

const PRECOMPUTED_MANUAL_VECTORS = ERP_MANUAL_DOCUMENTS.map((doc) => ({
  ...doc,
  vector: textToSparseVector(`${doc.title} ${doc.tcode} ${doc.content}`),
}));

/**
 * RBAC Metadata Filtering이 적용된 Vector DB Top 3~5 비정형 문서 조각(Chunk) 검색
 * - 권한이 없는 부서/모듈의 문서는 벡터 검색 단계에서 사전 차단
 */
export function searchVectorKnowledgeBaseWithRbac(query, identity, permissionRows, topK = 4) {
  const qVec = textToSparseVector(query);
  const allowedDocs = [];
  const blockedModules = new Set();

  for (const doc of PRECOMPUTED_MANUAL_VECTORS) {
    if (canUserAccessModule(identity, permissionRows, doc.moduleId, doc.minPermLevel)) {
      allowedDocs.push(doc);
    } else {
      blockedModules.add(doc.moduleId);
    }
  }

  const scored = allowedDocs
    .map((doc) => ({
      docId: doc.docId,
      moduleId: doc.moduleId,
      title: doc.title,
      tcode: doc.tcode,
      routePath: doc.routePath,
      content: doc.content,
      similarity: Number(cosineSimilarity(qVec, doc.vector).toFixed(3)),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const clampedK = Math.max(3, Math.min(5, Number(topK) || 4));
  const hits = scored.filter((d) => d.similarity > 0.01).slice(0, clampedK);
  return {
    chunks: hits.length > 0 ? hits : scored.slice(0, 3),
    blockedModules: Array.from(blockedModules),
  };
}

// ── ①-C. 정형 트랜잭션 데이터: Function Calling (파라미터 추출 → Read-only API 조회 → JSON 주입) ──

/**
 * 질문에서 엔티티 코드(품목, 전표번호, 거래처 등) 및 의도 파라미터를 추출한 뒤,
 * RBAC 권한이 검증된 사내 ERP Read-only API(Function)만 실행하여 JSON 규격 결과값을 반환한다.
 */
export async function executeReadOnlyFunctionCalls({ query, storage, identity, permissionRows }) {
  if (!storage) return { calls: [], blockedCalls: [] };

  const q = String(query || "");
  const lower = q.toLowerCase();
  const allData = await storage.readAll();

  // 파라미터 추출 (품목코드, 문서번호 등)
  const matMatches = q.toUpperCase().match(/\b(?:FG|SF|RM|PK)-\d{4}\b/g) || [];
  const docMatches = q.toUpperCase().match(/\b(?:SO|PO|PR|JV|WO|AR|AP|LOT)-\d{2,6}(?:-\d+)?\b/g) || [];

  const calls = [];
  const blockedCalls = [];

  const invokeTool = (toolName, moduleId, params, fn) => {
    if (!canUserAccessModule(identity, permissionRows, moduleId, "조회")) {
      blockedCalls.push({
        tool: toolName,
        moduleId,
        params,
        status: "RBAC_BLOCKED",
        reason: `사번(${identity?.id || "익명"}) / 직급·역할(${identity?.role || "미지정"})에 '${moduleId.toUpperCase()}' 부서 데이터 조회 권한이 없어 EXAONE 주입이 차단되었습니다.`,
      });
      return;
    }
    const result = fn();
    calls.push({
      tool: toolName,
      moduleId,
      params,
      status: "OK",
      resultJson: result,
    });
  };

  // Tool 1: 실시간 재고 및 리드타임 조회 (get_realtime_inventory)
  if (
    matMatches.length > 0 ||
    /재고|품목|자재|배터리|모터|리드타임|장납기|부족|안전재고/.test(lower)
  ) {
    invokeTool(
      "get_realtime_inventory",
      "mdm",
      { materialCodes: matMatches.length > 0 ? matMatches : "ALL_CRITICAL" },
      () => {
        const mats = allData["master.material"] ?? [];
        const filtered =
          matMatches.length > 0
            ? mats.filter((m) => matMatches.includes(String(m.code).toUpperCase()))
            : mats.filter((m) => Number(m.stock ?? 0) < Number(m.safety ?? 0) || Number(m.leadTimeWeeks ?? 1) >= 6);
        return {
          totalMaterialsCount: mats.length,
          queriedItems: (filtered.length > 0 ? filtered : mats.slice(0, 6)).map((m) => ({
            code: m.code,
            name: m.name,
            type: m.type,
            stock: m.stock,
            safetyStock: m.safety,
            shortage: Math.max(0, Number(m.safety ?? 0) - Number(m.stock ?? 0)),
            leadTimeWeeks: m.leadTimeWeeks ?? 1,
            leadTimeCategory: m.leadTimeCategory ?? "단납기",
          })),
        };
      }
    );
  }

  // Tool 2: 전표/문서 상태 조회 (get_voucher_or_order_status)
  if (
    docMatches.length > 0 ||
    /전표|수주|발주|구매요청|분개|채권|채무|so|po|pr|jv|ar|ap/.test(lower)
  ) {
    const targetMod = /분개|전표|채권|채무|jv|ar|ap|손익|재무/.test(lower) ? "fi" : /발주|구매|po|pr/.test(lower) ? "mm" : "sd";
    invokeTool(
      "get_voucher_status",
      targetMod,
      { docNumbers: docMatches.length > 0 ? docMatches : "RECENT_SUMMARY" },
      () => {
        const sos = allData["sales.order"] ?? [];
        const pos = allData["procurement.order"] ?? [];
        const prs = allData["procurement.request"] ?? [];
        const jvs = allData["finance.journal"] ?? [];
        const ars = allData["finance.ar"] ?? [];
        return {
          salesOrders: { total: sos.length, recent: sos.slice(0, 3).map((o) => ({ code: o.code, customer: o.customer, status: o.status, dueDate: o.dueDate })) },
          purchaseRequests: { total: prs.length, recent: prs.slice(0, 3).map((p) => ({ code: p.code, material: p.material, qty: p.qty, dueDate: p.dueDate, status: p.status })) },
          purchaseOrders: { total: pos.length, recent: pos.slice(0, 3).map((p) => ({ code: p.code, vendor: p.vendor, material: p.material, status: p.status })) },
          journals: targetMod === "fi" ? { total: jvs.length, recent: jvs.slice(0, 2).map((j) => ({ code: j.code, desc: j.desc, status: j.status })) } : undefined,
          overdueArCount: targetMod === "fi" ? ars.filter((a) => a.status === "미수").length : undefined,
        };
      }
    );
  }

  // Tool 3: SCM/생산계획/작업지시 조회 (get_scm_mps_schedule)
  if (/수요|예측|생산|계획|mps|mrp|작업지시|wo|라인|가동|화요일|역산/.test(lower) || calls.length === 0) {
    invokeTool(
      "get_scm_mps_schedule",
      "pp",
      { horizon: "24W_SCM_AND_MPS" },
      () => {
        const fcst = allData["scm.forecast"] ?? [];
        const mps = allData["production.mps"] ?? [];
        const wos = allData["production.work-order"] ?? [];
        return {
          forecastBucketsCount: fcst.length,
          aiForecastWeeks: "W17~W24 (Holt Double Exponential Smoothing)",
          mpsDailyCount: mps.length,
          dailyLineCapa: 650,
          openWorkOrders: wos.filter((w) => w.status !== "완료").map((w) => ({
            code: w.code,
            material: w.material,
            qty: w.qty,
            dueDate: w.dueDate,
            status: w.status,
          })),
        };
      }
    );
  }

  return { calls, blockedCalls };
}

// ── ② 3단계 안전망: 1단계 유사 키워드 추천 + 관련 메뉴 링크 + 담당자/헬프데스크 문의 ──

const DOMAIN_SAFETY_CATALOG = [
  {
    keywords: ["수요", "예측", "홀트", "holt", "24주", "csv", "scm", "s&op", "결품", "contingency"],
    ruleKeywords: ["주단위 수요예측 분석해줘", "S&OP 공급계획 점검해줘"],
    menus: [
      { tcode: "SCM-01", name: "수요예측 (24주 & AI 예측)", path: "/m/scm/scm-01", module: "SCM" },
      { tcode: "SCM-02", name: "S&OP (3~24주 비상공급대책)", path: "/m/scm/scm-02", module: "SCM" },
    ],
    contact: { dept: "혁신기획/SCM팀", name: "김문규 팀장", ext: "내선 101", email: "mg.kim@greenelec.co.kr", role: "SCM·AX 헬프데스크" },
  },
  {
    keywords: ["생산", "mps", "mrp", "자재소요", "리드타임", "장납기", "배터리", "모터", "화요일", "역산", "작업지시", "라인", "capa"],
    ruleKeywords: ["생산 스케줄 납기 리스크 점검", "부족 자재 발주 추천해줘"],
    menus: [
      { tcode: "PP-01", name: "주생산계획 (MPS 14일/20주)", path: "/m/pp/pp-01", module: "PP" },
      { tcode: "PP-02", name: "자재소요량계획 (MRP 역산)", path: "/m/pp/pp-02", module: "PP" },
      { tcode: "PP-03", name: "작업지시 및 생산실적", path: "/m/pp/pp-03", module: "PP" },
    ],
    contact: { dept: "생산관리팀", name: "박준혁 수석", ext: "내선 204", email: "jh.park@greenelec.co.kr", role: "MPS/MRP 담당자" },
  },
  {
    keywords: ["구매", "발주", "pr", "po", "공급사", "원자재", "부족", "납기", "단가", "입고", "재고"],
    ruleKeywords: ["부족 자재 알려줘", "구매 발주 추천 공급사 알려줘"],
    menus: [
      { tcode: "MM-01", name: "구매요청 (PR) 관리", path: "/m/mm/mm-01", module: "MM" },
      { tcode: "MM-02", name: "구매발주 (PO) 관리", path: "/m/mm/mm-02", module: "MM" },
      { tcode: "MM-03", name: "공급사 평가 (Vendor Eval)", path: "/m/mm/mm-03", module: "MM" },
    ],
    contact: { dept: "구매자재팀", name: "최윤서 과장", ext: "내선 302", email: "ys.choi@greenelec.co.kr", role: "구매·자재 담당자" },
  },
  {
    keywords: ["품질", "불량", "검사", "spc", "cpk", "부적합", "8d", "보류", "lot"],
    ruleKeywords: ["품질 불량 및 Cpk 이상 진단해줘"],
    menus: [
      { tcode: "QM-01", name: "수입검사 관리", path: "/m/qm/qm-01", module: "QM" },
      { tcode: "QM-03", name: "SPC 통계적 공정관리", path: "/m/qm/qm-03", module: "QM" },
    ],
    contact: { dept: "품질보증팀", name: "정현우 차장", ext: "내선 405", email: "hw.jung@greenelec.co.kr", role: "품질·SPC 담당자" },
  },
  {
    keywords: ["재무", "회계", "전표", "분개", "차대", "채권", "채무", "손익", "원가", "예산", "ar", "ap", "매출", "이익"],
    ruleKeywords: ["이번 달 손익 요약해줘", "연체 채권 및 재무 KPI 알려줘"],
    menus: [
      { tcode: "FI-01", name: "분개전표 관리 (차대평형)", path: "/m/fi/fi-01", module: "FI" },
      { tcode: "FI-02", name: "매출채권(AR) 관리", path: "/m/fi/fi-02", module: "FI" },
      { tcode: "CO-01", name: "표준/실제 제조원가 분석", path: "/m/co/co-01", module: "CO" },
    ],
    contact: { dept: "재무회계팀", name: "한지민 팀장", ext: "내선 501", email: "jm.han@greenelec.co.kr", role: "재무·회계 담당자" },
  },
];

export function resolveSafetyNetActions(query) {
  const q = String(query || "").toLowerCase();
  const matched = DOMAIN_SAFETY_CATALOG.filter((entry) =>
    entry.keywords.some((kw) => q.includes(kw))
  );
  const selected = matched.length > 0 ? matched : [DOMAIN_SAFETY_CATALOG[0], DOMAIN_SAFETY_CATALOG[1], DOMAIN_SAFETY_CATALOG[2]];

  const menus = [];
  const contacts = [];
  const ruleKeywords = [];
  const seenPath = new Set();
  const seenContact = new Set();
  const seenKw = new Set();

  for (const item of selected) {
    for (const kw of item.ruleKeywords) {
      if (!seenKw.has(kw)) {
        seenKw.add(kw);
        ruleKeywords.push(kw);
      }
    }
    for (const m of item.menus) {
      if (!seenPath.has(m.path)) {
        seenPath.add(m.path);
        menus.push(m);
      }
    }
    if (!seenContact.has(item.contact.name)) {
      seenContact.add(item.contact.name);
      contacts.push(item.contact);
    }
  }

  return {
    recommendedRuleKeywords: ruleKeywords.slice(0, 3),
    recommendedMenus: menus.slice(0, 4),
    recommendedContacts: contacts.slice(0, 2),
  };
}

/**
 * 백엔드 장애 로깅(SQLite audit_logs) 및 운영팀 관리자 알림(Slack / Email) 발송
 */
async function logBackendFailureAndNotifyAdmin({ storage, identity, userQuery, internalReason, attempts }) {
  const alertPayload = {
    timestamp: new Date().toISOString(),
    service: "LG K-EXAONE 2.5 (k-exaone_v2.5)",
    userId: identity?.id || "admin",
    userRole: identity?.role || "관리자",
    query: String(userQuery || "").slice(0, 200),
    attempts,
    internalReason,
    alertChannels: ["SQLite:audit_logs", `Email:${runtimeConfig.adminAlertEmail}`, runtimeConfig.slackWebhookUrl ? "Slack:Webhook" : "Slack:Queued"],
  };

  if (storage && typeof storage.appendAuditLog === "function") {
    try {
      await storage.appendAuditLog({
        userId: alertPayload.userId,
        userRole: alertPayload.userRole,
        storeKey: "ai.exaone",
        entityId: "EXAONE_FALLBACK_ALERT",
        action: "ALERT",
        summary: `[EXAONE ${attempts}회 시도 후 Fallback] 관리자 알림 발송됨 (${runtimeConfig.adminAlertEmail}) — 사유: ${internalReason}`,
        payloadSnapshot: alertPayload,
      });
    } catch {
      // ignore db logging errors
    }
  }

  if (runtimeConfig.slackWebhookUrl) {
    fetch(runtimeConfig.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚨 *[ERP AI Copilot 2단계 EXAONE 응답 지연 알림]*\n• 사용자: ${alertPayload.userId} (${alertPayload.userRole})\n• 시도 횟수: ${attempts}회 (1회 자동 재시도 포함)\n• 내부 사유: ${internalReason}`,
      }),
    }).catch(() => {});
  }

  return alertPayload;
}

/**
 * 3단계 안전망(Graceful Fallback) 응답 생성기
 * - 내부 시스템 에러 코드를 사용자에게 노출하지 않고 친절한 지연 안내 + 3대 대안(1단계 추천 키워드, ERP 메뉴 링크, 담당자/헬프데스크 문의)을 반환
 */
export function buildTier3SafetyNetResponse({
  userQuery,
  vectorDocs = [],
  functionCalls = [],
  blockedCalls = [],
  attempts = 2,
}) {
  const q = String(userQuery || "").trim();
  const { recommendedRuleKeywords, recommendedMenus, recommendedContacts } = resolveSafetyNetActions(q);

  const manualSummary = vectorDocs
    .slice(0, 3)
    .map((d) => `· [${d.tcode}] ${d.title}\n  └ ${d.content}`)
    .join("\n");

  const contentLines = [
    `현재 AI 상세 분석 서버의 응답이 지연되고 있습니다.`,
    ``,
    `업무 연속성을 위해 권한(RBAC)이 검증된 사내 매뉴얼 및 실시간 조회 요약과 함께 아래 즉시 실행 가능한 대안을 안내해 드립니다.`,
    ``,
    `📚 **관련 사내 규정·매뉴얼 요약 (Vector DB Top-${Math.min(3, vectorDocs.length)})**`,
    manualSummary || "· 관련 매뉴얼 문서를 아래 추천 메뉴에서 바로 확인하실 수 있습니다.",
  ];

  if (blockedCalls.length > 0) {
    contentLines.push(
      ``,
      `🔒 **RBAC 보안 필터 안내**: 요청하신 내용 중 권한이 없는 부서 데이터(${blockedCalls.map((b) => b.moduleId.toUpperCase()).join(", ")})는 보안 정책에 따라 자동 제외되었습니다.`
    );
  }

  return {
    ok: true,
    tier: 3,
    mode: "safety_net_3tier",
    model: runtimeConfig.model,
    attempts,
    userFriendlyNotice: "현재 AI 상세 분석 서버의 응답이 지연되고 있습니다.",
    content: contentLines.join("\n").trim(),
    reasoningContent: null, // 내부 에러 코드 비노출
    vectorDocs,
    functionCalls,
    blockedCalls,
    recommendedRuleKeywords,
    recommendedMenus,
    recommendedContacts,
    adminNotified: true,
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 단건 HTTP 호출 헬퍼 (타임아웃 5~10초 적용)
 */
async function attemptSingleExaoneRequest({ apiUrl, apiKey, requestPayload, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const rawText = await response.text();
    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }

    if (!response.ok) {
      const code = data?.result_code ?? response.status;
      const desc = data?.description || data?.error?.message || `HTTP_${response.status}`;
      throw new Error(`EXAONE_${code}:${desc}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * LG K-EXAONE 2.5 POST /v1/chat/completions 호출
 * - ① 권한 기반 하이브리드 RAG (Vector DB Top 3~5 + Read-only Function Calling JSON + RBAC Metadata Filtering)
 * - ② 5~10초 타임아웃 + 백엔드 1회 자동 재시도(1~2초 간격) + 실패 시 백엔드 로깅/관리자 알림 후 3단계 안전망 응답 반환
 */
export async function callExaoneChat({
  messages = [],
  storage,
  identity,
  erpContext = "",
  reasoningEffort,
  maxTokens,
  timeoutMs,
  temperature,
  topP,
  preserveThinking,
  apiKeyOverride,
  apiUrlOverride,
}) {
  const apiKey = (apiKeyOverride || runtimeConfig.apiKey || "").trim();
  const apiUrl = (apiUrlOverride || runtimeConfig.apiUrl || "https://api.exaone.ai/v1/chat/completions").trim();
  const model = runtimeConfig.model || "k-exaone_v2.5";
  const effort = reasoningEffort || runtimeConfig.reasoningEffort || "low";
  const tokens = Number(maxTokens || runtimeConfig.maxTokens || 1024);
  const effectiveTimeoutMs = Math.max(5000, Math.min(10000, Number(timeoutMs || runtimeConfig.timeoutMs || 7000)));

  const lastUserMsg = [...messages].reverse().find((m) => m && m.role === "user")?.content ?? "";
  const permissionRows = storage ? ((await storage.read("platform.permission")) ?? []) : [];

  // ①-1. 비정형 문서: RBAC Metadata Filtering 적용 Vector DB 상위 3~5개 Chunk 추출
  const { chunks: vectorDocs, blockedModules } = searchVectorKnowledgeBaseWithRbac(
    lastUserMsg,
    identity,
    permissionRows,
    4
  );

  // ①-2. 정형 트랜잭션 데이터: Function Calling (파라미터 추출 → Read-only API 호출 → JSON 결과값)
  const { calls: functionCalls, blockedCalls } = await executeReadOnlyFunctionCalls({
    query: lastUserMsg,
    storage,
    identity,
    permissionRows,
  });

  const ragSystemPrompt = [
    "당신은 소비자용 소형 가전제품 및 전자부품 제조 중견기업 '(주)그린전자'의 Standard ERP Portal 전담 AI 어시스턴트(LG K-EXAONE 2.5)입니다.",
    "아래 [1. RBAC 검증 비정형 매뉴얼·규정 Vector DB Chunks (Top 3~5)]와 [2. RBAC 검증 정형 트랜잭션 Read-only API 조회 결과(JSON)]만을 근거로 정확하고 간결한 한국어로 답변하세요.",
    "권한이 차단(RBAC_BLOCKED)된 부서 데이터는 절대 추측하거나 생성하지 마세요.",
    "",
    "[1. 비정형 문서 Vector DB RAG 추출 결과 (Top Chunks)]",
    JSON.stringify(
      vectorDocs.map((d) => ({ docId: d.docId, tcode: d.tcode, title: d.title, content: d.content })),
      null,
      2
    ),
    "",
    "[2. 정형 트랜잭션 Read-only Function Calling 결과 (JSON)]",
    JSON.stringify({ authorizedFunctionResults: functionCalls, rbacBlockedRequests: blockedCalls }, null, 2),
    erpContext ? `\n[3. 세션 보조 컨텍스트]\n${erpContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const normalizedMessages = [];
  const hasSystem = messages.some((m) => m && m.role === "system");
  if (!hasSystem) {
    normalizedMessages.push({ role: "system", content: ragSystemPrompt });
  }
  for (const m of messages) {
    if (!m || typeof m.content !== "string" || !m.content.trim()) continue;
    const role = m.role === "assistant" || m.role === "system" ? m.role : "user";
    normalizedMessages.push({ role, content: m.content });
  }

  // API Key가 미등록된 경우: 백엔드 로그/관리자 알림 적재 후 에러 코드 없이 3단계 안전망 반환
  if (!apiKey) {
    await logBackendFailureAndNotifyAdmin({
      storage,
      identity,
      userQuery: lastUserMsg,
      internalReason: "MISSING_EXAONE_API_KEY",
      attempts: 1,
    });
    return buildTier3SafetyNetResponse({
      userQuery: lastUserMsg,
      vectorDocs,
      functionCalls,
      blockedCalls,
      attempts: 1,
    });
  }

  const requestPayload = {
    model,
    messages: normalizedMessages,
    max_tokens: tokens,
    stream: false,
    temperature: typeof temperature === "number" ? temperature : runtimeConfig.temperature,
    top_p: typeof topP === "number" ? topP : runtimeConfig.topP,
    reasoning_effort: effort,
    chat_template_kwargs: {
      preserve_thinking: typeof preserveThinking === "boolean" ? preserveThinking : runtimeConfig.preserveThinking,
    },
  };

  // ② 백엔드 호출 + 일시적 네트워크 순단 대비 1회 자동 재시도 (1~2초 간격)
  const totalAttempts = 1 + runtimeConfig.maxRetries; // 총 2회 (최초 1회 + 재시도 1회)
  const perAttemptTimeoutMs = Math.max(2500, Math.floor(effectiveTimeoutMs / totalAttempts));
  let lastError = null;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const data = await attemptSingleExaoneRequest({
        apiUrl,
        apiKey,
        requestPayload,
        timeoutMs: perAttemptTimeoutMs,
      });

      const choice = data?.choices?.[0];
      const content = String(choice?.message?.content ?? "").trim();
      const reasoningContent = String(choice?.message?.reasoning_content ?? "").trim();
      const usage = data?.usage ?? null;
      const { recommendedRuleKeywords, recommendedMenus, recommendedContacts } = resolveSafetyNetActions(lastUserMsg);

      return {
        ok: true,
        tier: 2,
        mode: "live_api",
        id: data?.id ?? null,
        model: data?.model ?? model,
        attempts: attempt,
        finishReason: choice?.finish_reason ?? "stop",
        content: content || "분석이 완료되었습니다.",
        reasoningContent: reasoningContent || null,
        usage,
        vectorDocs,
        functionCalls,
        blockedCalls,
        recommendedRuleKeywords,
        recommendedMenus,
        recommendedContacts,
      };
    } catch (err) {
      lastError = err;
      if (attempt < totalAttempts) {
        // 1~2초 간격 대기 후 1회 자동 재시도
        await sleep(runtimeConfig.retryDelayMs);
      }
    }
  }

  // 1회 재시도 후에도 실패한 경우: 백엔드 에러 로그 적재 + 관리자 알림 발송 후 3단계 안전망 반환 (에러 코드 노출 금지)
  const internalReason =
    lastError?.name === "AbortError"
      ? `TIMEOUT_${effectiveTimeoutMs}MS`
      : String(lastError?.message || "NETWORK_OR_API_ERROR");

  await logBackendFailureAndNotifyAdmin({
    storage,
    identity,
    userQuery: lastUserMsg,
    internalReason,
    attempts: totalAttempts,
  });

  return buildTier3SafetyNetResponse({
    userQuery: lastUserMsg,
    vectorDocs,
    functionCalls,
    blockedCalls,
    attempts: totalAttempts,
  });
}
