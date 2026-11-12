// AI Copilot 3단계 하이브리드 아키텍처 자동 검증 시나리오
// 1. 1단계 Rule-base 매칭 및 비정형 질문 2단계 Fallback 분기 검증
// 2. ① 권한 기반 하이브리드 RAG: Vector DB Top 3~5 Chunks + Read-only Function Calling JSON + RBAC Metadata Filtering 차단 검증
// 3. ② 3단계 안전망(Graceful Fallback): 타임아웃(5~10초) + 1회 자동 재시도 + 에러코드 비노출 + 추천 키워드/메뉴 링크/담당자 버튼 + SQLite audit_logs 관리자 알림 적재 검증

import { matchRuleBasedQuestion } from "../src/services/insights";
import {
  callExaoneChat,
  executeReadOnlyFunctionCalls,
  searchVectorKnowledgeBaseWithRbac,
} from "../server/exaone.mjs";
import { createStorage } from "../server/storage.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, "..", "data");

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string, detail = "") {
  if (cond) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label} ${detail ? `— ${detail}` : ""}`);
  }
}

async function main() {
  console.log("=== [AI Copilot 3단계 하이브리드 & EXAONE 2.5 연동 시나리오 검증] ===");
  const storage = createStorage(DATA_DIR);
  await storage.init();

  const permRows = (await storage.read("platform.permission")) ?? [];

  // 1. 1단계 Rule-base vs 2단계 Fallback 분기 검증
  const r1 = matchRuleBasedQuestion("부족 자재 알려줘");
  assert(r1.matched === true && r1.tier === 1 && r1.agentName === "AI Buyer", "1단계 Rule-base 정형 질의 매칭 (AI Buyer)");

  const r2 = matchRuleBasedQuestion("배터리셀 RM-3001 리드타임 지연 시 화요일 입고 역산 규정과 대책 알려줘");
  assert(r2.matched === false && r2.tier === 2, "비정형 복합 질의 2단계 EXAONE 2.5 Fallback 분기 판별");

  // 2. ①-A Vector DB Top 3~5 Chunks 검색 + RBAC Metadata Filtering 검증
  const adminIdentity = { id: "U-1001", role: "관리자", status: "활성" };
  const vecResAdmin = searchVectorKnowledgeBaseWithRbac(
    "화요일 입고 기준 리드타임 역산 규정과 24주 Holt 예측 매뉴얼",
    adminIdentity,
    permRows,
    4
  );
  assert(
    vecResAdmin.chunks.length >= 3 && vecResAdmin.chunks.length <= 5,
    `Vector DB 비정형 매뉴얼 상위 3~5개 Chunk 추출 (${vecResAdmin.chunks.length}건)`
  );
  assert(
    vecResAdmin.chunks[0].docId === "DOC-PP-02" || vecResAdmin.chunks[0].docId === "DOC-SCM-01",
    `Vector DB 코사인 유사도 1위 문서 정확도 확인 (${vecResAdmin.chunks[0].docId}: ${vecResAdmin.chunks[0].title})`
  );

  // RBAC Metadata Filtering: 비활성 사용자 또는 권한 없는 모듈 차단 확인
  const inactiveIdentity = { id: "U-9999", role: "영업", status: "비활성" };
  const vecResBlocked = searchVectorKnowledgeBaseWithRbac("재무 분개전표 차대평형 규정", inactiveIdentity, permRows, 4);
  assert(
    vecResBlocked.blockedModules.includes("fi") && vecResBlocked.chunks.length === 0,
    "RBAC Metadata Filtering: 권한 없는 사용자 Vector DB 문서 주입 원천 차단"
  );

  // 3. ①-B 정형 트랜잭션 Read-only Function Calling (JSON) + RBAC 차단 검증
  const fnResAdmin = await executeReadOnlyFunctionCalls({
    query: "RM-3001 배터리셀 재고와 SO-26001 전표 상태 알려줘",
    storage,
    identity: adminIdentity,
    permissionRows: permRows,
  });
  assert(
    fnResAdmin.calls.some((c: any) => c.tool === "get_realtime_inventory" && c.status === "OK"),
    "Read-only Function Calling: get_realtime_inventory JSON 추출 성공"
  );
  assert(
    fnResAdmin.calls.some((c: any) => c.tool === "get_voucher_status" && c.status === "OK"),
    "Read-only Function Calling: get_voucher_status JSON 추출 성공"
  );

  const fnResBlocked = await executeReadOnlyFunctionCalls({
    query: "분개전표 JV-26001 차대평형 및 채권 AR 상태 조회",
    storage,
    identity: inactiveIdentity,
    permissionRows: permRows,
  });
  assert(
    fnResBlocked.blockedCalls.length > 0 && fnResBlocked.blockedCalls[0].status === "RBAC_BLOCKED",
    "RBAC Function Calling 보안 차단: 권한 없는 부서 트랜잭션 EXAONE 주입 차단"
  );

  // 4. ② 3단계 안전망 (Graceful Fallback) + 1회 자동 재시도 + 에러코드 비노출 + 백엔드 로깅/관리자 알림 검증
  const fallbackRes = await callExaoneChat({
    messages: [{ role: "user", content: "배터리셀 RM-3001 장납기 리스크 대응 방안은?" }],
    storage,
    identity: adminIdentity,
    timeoutMs: 5000,
    // 유효하지 않은 로컬 주소로 네트워크 순단 시뮬레이션 (1회 자동 재시도 후 3단계 안전망 진입 검증)
    apiKeyOverride: "test-key-for-retry-simulation",
    apiUrlOverride: "http://127.0.0.1:59999/v1/chat/completions",
  });

  assert(fallbackRes.ok === true && fallbackRes.tier === 3 && fallbackRes.mode === "safety_net_3tier", "3단계 안전망(Graceful Fallback) 정상 전환");
  assert(
    fallbackRes.attempts === 2,
    `백엔드 1회 자동 재시도 수행 확인 (총 시도 횟수: ${fallbackRes.attempts}회)`
  );
  assert(
    fallbackRes.userFriendlyNotice === "현재 AI 상세 분석 서버의 응답이 지연되고 있습니다." &&
      !fallbackRes.content.includes("ECONNREFUSED") &&
      !fallbackRes.content.includes("59999"),
    "사용자 화면(UI) 친절 안내 문구 표시 및 시스템 내부 에러 코드 완전 비노출 확인"
  );
  assert(
    Array.isArray(fallbackRes.recommendedRuleKeywords) && fallbackRes.recommendedRuleKeywords.length > 0,
    `3단계 안전망 대안 1: 1단계 Rule-base 유사 추천 키워드 제공 (${fallbackRes.recommendedRuleKeywords.join(", ")})`
  );
  assert(
    Array.isArray(fallbackRes.recommendedMenus) && fallbackRes.recommendedMenus.length > 0,
    `3단계 안전망 대안 2: 관련 ERP 메뉴 바로가기 링크 제공 (${fallbackRes.recommendedMenus.map((m: any) => m.tcode).join(", ")})`
  );
  assert(
    Array.isArray(fallbackRes.recommendedContacts) && fallbackRes.recommendedContacts.length > 0,
    `3단계 안전망 대안 3: 헬프데스크/담당자 문의 버튼 제공 (${fallbackRes.recommendedContacts.map((c: any) => c.name).join(", ")})`
  );

  // 백엔드 SQLite audit_logs 적재 확인
  const alertLogs = await storage.listAuditLogs("ai.exaone", 5);
  assert(
    alertLogs.length > 0 && alertLogs[0].action === "ALERT" && alertLogs[0].summary.includes("관리자 알림 발송됨"),
    `백엔드 SQLite audit_logs 에러 적재 및 관리자 알림 기록 확인 (${alertLogs[0]?.summary})`
  );

  storage.close();
  console.log(`\n결과: PASS ${passed} / FAIL ${failed}`);
  if (failed > 0) process.exit(1);
}

main();
