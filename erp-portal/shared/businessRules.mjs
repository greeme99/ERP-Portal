// 업무 규칙 — 클라이언트와 서버가 **같은 파일**을 쓴다.
//
// 왜 .mjs 인가: 서버(server/*.mjs)는 빌드 단계가 없어 .ts 를 직접 import 할 수 없다.
// 규칙을 양쪽에 중복 구현하면 판정이 어긋날 수 있으므로, 의존성 없는 순수 함수로
// .mjs 에 두고 클라이언트(TS)는 allowJs + JSDoc 타입으로 가져다 쓴다.
//
// 여기 담는 규칙은 **자기완결**이어야 한다 — 문서 자신과 상수만으로 판정할 수 있어야
// 서버가 다른 저장 키를 조회하지 않고 검증할 수 있다.
// 여신한도처럼 외부 데이터가 필요한 규칙은 클라이언트 전용으로 남긴다.

/** 발주 1건 승인 한도 (원). 초과분은 승인 권한자만 통과시킨다. */
export const PO_APPROVAL_LIMIT = 100_000_000;

/**
 * @typedef {Object} RuleOutcome
 * @property {string} ruleId
 * @property {boolean} ok        false 면 저장을 중단한다
 * @property {boolean} [warn]    ok=true 와 함께 쓰면 경고만 하고 진행
 * @property {string} [message]
 */

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * 전표 차대 평형. 문서 자신만으로 판정되는 회계 불변식이다.
 * lines[{dr, cr}] 또는 {debit, credit} 둘 다 받는다.
 * @param {Record<string, any>} doc
 * @returns {RuleOutcome}
 */
export function checkJournalBalance(doc) {
  const ruleId = "RULE_FI_JV_BALANCE";
  const lines = Array.isArray(doc?.lines) ? doc.lines : null;
  const debit = lines ? lines.reduce((s, l) => s + num(l?.dr), 0) : num(doc?.debit);
  const credit = lines ? lines.reduce((s, l) => s + num(l?.cr), 0) : num(doc?.credit);

  // 라인도 없고 금액 필드도 없는 문서는 이 규칙의 대상이 아니다.
  if (!lines && !("debit" in (doc ?? {})) && !("credit" in (doc ?? {}))) {
    return { ruleId, ok: true };
  }
  if (debit === credit) return { ruleId, ok: true };
  return {
    ruleId,
    ok: false,
    message: `차대 불일치 — 차변 ${debit.toLocaleString()} / 대변 ${credit.toLocaleString()}`,
  };
}

/**
 * 발주 승인한도. 한도 초과는 승인 권한자만 경고로 통과한다.
 * @param {Record<string, any>} doc
 * @param {{ canApprove?: boolean }} [ctx]
 * @returns {RuleOutcome}
 */
export function checkPoApprovalLimit(doc, ctx) {
  const ruleId = "RULE_MM_PO_LIMIT";
  const amount = "amount" in (doc ?? {}) ? num(doc.amount) : num(doc?.qty) * num(doc?.price);
  if (amount <= PO_APPROVAL_LIMIT) return { ruleId, ok: true };

  const limitText = PO_APPROVAL_LIMIT.toLocaleString();
  if (ctx?.canApprove) {
    return {
      ruleId,
      ok: true,
      warn: true,
      message: `승인한도 ${limitText}원 초과 (${amount.toLocaleString()}원) — 사후 결재 필요`,
    };
  }
  return {
    ruleId,
    ok: false,
    message: `승인한도 ${limitText}원 초과 (${amount.toLocaleString()}원) — 승인 권한자만 발주할 수 있습니다`,
  };
}

/**
 * 여신한도. 고객 여신 데이터가 필요해 **클라이언트 전용**이다(서버는 검증하지 않는다).
 * @param {Record<string, any>} doc
 * @param {{ creditLimit?: number, creditUsed?: number, canApprove?: boolean }} [ctx]
 * @returns {RuleOutcome}
 */
export function checkCreditLimit(doc, ctx) {
  const ruleId = "RULE_SD_CREDIT";
  const total = num(doc?.total);
  const limit = num(ctx?.creditLimit);
  const used = num(ctx?.creditUsed);
  if (limit <= 0) return { ruleId, ok: true };

  if (used + total > limit) {
    const detail = `한도 ${limit.toLocaleString()}원, 사용 ${used.toLocaleString()}원, 신규 ${total.toLocaleString()}원`;
    if (ctx?.canApprove) {
      return { ruleId, ok: true, warn: true, message: `여신한도 초과 — ${detail} · 승인 권한으로 진행` };
    }
    return { ruleId, ok: false, message: `여신한도 초과 — ${detail}` };
  }
  const ratio = ((used + total) / limit) * 100;
  if (ratio >= 90) {
    return { ruleId, ok: true, warn: true, message: `여신 소진율 ${ratio.toFixed(1)}% — 수금 확인 필요` };
  }
  return { ruleId, ok: true };
}

/**
 * 저장 키 → 자기완결 규칙 바인딩. 서버가 이 표만 보고 검증한다.
 * 여신한도는 자기완결이 아니므로 여기 없다.
 * @type {Record<string, { ruleId: string, check: (doc: Record<string, any>, ctx?: any) => RuleOutcome, approvalModule?: string }>}
 */
export const SELF_CONTAINED_RULES = {
  "finance.journal": { ruleId: "RULE_FI_JV_BALANCE", check: checkJournalBalance },
  "procurement.order": { ruleId: "RULE_MM_PO_LIMIT", check: checkPoApprovalLimit, approvalModule: "mm" },
};
