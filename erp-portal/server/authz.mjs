// 서버측 인가 재검증.
//
// 한계를 분명히 한다: 이 프로토타입은 인증이 없다. 사용자 신원은 요청 헤더로
// 오므로 위조할 수 있고, 따라서 이것은 암호학적 보안 경계가 아니다.
// 목적은 (1) 클라이언트 우회로 인한 오조작 방지 (2) 감사 흔적 확보다.
// 운영 전환 시 세션/토큰 검증으로 교체해야 한다.

// 저장 키 → 모듈 id. 클라이언트 MODULES 와 같은 축을 쓴다.
const KEY_PREFIX_MODULE = [
  ["master.", "mdm"],
  ["mdm.", "mdm"],
  ["sales.", "sd"],
  ["sd.", "sd"],
  ["scm.", "scm"],
  ["procurement.", "mm"],
  ["mm.", "mm"],
  ["logistics.", "le"],
  ["le.", "le"],
  ["production.", "pp"],
  ["pp.", "pp"],
  ["quality.", "qm"],
  ["quality2.", "qm"],
  ["qm.", "qm"],
  ["pdm.", "plm"],
  ["plm.", "plm"],
  ["finance.", "fi"],
  ["fi.", "fi"],
  ["co.", "co"],
  ["marketing.", "mk"],
  ["analytics.", "mk"],
  ["mk.", "mk"],
  ["service.", "sv"],
  ["sv.", "sv"],
  ["platform.", "com"],
  ["com.", "com"],
  ["dashboard.", "com"],
];

export const PERM_ORDER = ["없음", "조회", "편집", "승인"];
const ADMIN_ROLE = "관리자";

export function moduleForKey(key) {
  const hit = KEY_PREFIX_MODULE.find(([prefix]) => String(key).startsWith(prefix));
  return hit ? hit[1] : null;
}

const rank = (level) => Math.max(0, PERM_ORDER.indexOf(level));

/** 쓰기 메서드가 요구하는 권한 등급. 삭제는 승인, 나머지 쓰기는 편집. */
export function requiredLevel(method) {
  if (method === "DELETE") return "승인";
  if (method === "POST" || method === "PUT" || method === "PATCH") return "편집";
  return "조회";
}

/**
 * 요청 헤더에서 사용자 신원을 읽는다. 위조 가능하므로 신뢰 경계가 아니다.
 * X-ERP-User-Role / X-ERP-User-Status / X-ERP-User-Id
 *
 * [AUTH-SEAM 3/3] 신원의 검증. 여기가 진짜 신뢰 경계가 될 자리다.
 * 운영 전환 시 이 함수를 토큰 서명 검증(또는 세션 조회)으로 바꾸고, 검증
 * 실패는 401 로 돌려준다. 반환 형태({id, role, status})를 유지하면 아래
 * checkAuthz 와 index.mjs 의 canApproveModule 은 손대지 않아도 된다.
 * 함께 없앨 것 — checkAuthz 의 "헤더 없으면 통과" 분기(테스트 호환용).
 * 절차는 문서 4.6 §5.
 */
export function identityFromHeaders(headers) {
  const decode = (v) => {
    if (typeof v !== "string" || v.length > 256) return "";
    try {
      return decodeURIComponent(v);
    } catch {
      return "";
    }
  };
  return {
    id: decode(headers["x-erp-user-id"]),
    role: decode(headers["x-erp-user-role"]),
    status: decode(headers["x-erp-user-status"]),
  };
}

/**
 * 저장된 권한 매트릭스(platform.permission)로 판정한다.
 * 헤더가 없으면 통과시킨다 — 인가를 도입하기 전 클라이언트와 호환을 유지하고,
 * 서버 단독 운영(스크립트·테스트)을 막지 않기 위해서다.
 */
export function checkAuthz({ identity, permissionRows, key, method }) {
  if (!identity?.role) return { allowed: true, reason: "신원 헤더 없음 — 검사 생략" };

  if (identity.status && identity.status !== "활성") {
    return { allowed: false, reason: `비활성 사용자입니다 (${identity.id || "-"})` };
  }
  if (identity.role === ADMIN_ROLE) return { allowed: true, reason: "관리자" };

  const moduleId = moduleForKey(key);
  if (!moduleId) return { allowed: true, reason: `모듈 매핑 없음 (${key})` };

  const need = requiredLevel(method);
  if (need === "조회") return { allowed: true, reason: "읽기" };

  const row = (permissionRows ?? []).find((r) => r?.role === identity.role);
  const actual = row?.perms?.[moduleId];
  const level = PERM_ORDER.includes(actual) ? actual : "없음";

  if (rank(level) >= rank(need)) return { allowed: true, reason: `${moduleId} ${level}` };
  return {
    allowed: false,
    reason: `${moduleId} 모듈 권한 부족 — 필요 ${need}, 보유 ${level} (역할: ${identity.role})`,
  };
}
