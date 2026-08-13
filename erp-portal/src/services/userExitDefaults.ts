// 기본 제공 User Exit — 실제 업무 규칙을 훅으로 등록한 예시이자 동작 검증 대상.
//
// 각 Exit 은 requires 로 필요한 권한을 선언한다. 현재 사용자가 그 권한을
// 갖지 못하면 Exit 은 바이패스되고 표준 로직만 수행된다.
// (예: 영업 담당자는 재무 모듈 권한이 없어 여신 검사 Exit 이 돌지 않는다)
import { registerUserExit } from "./userExit";

/** 발주 1건 승인 한도 — 이 금액을 넘으면 구매 승인 권한자만 통과시킨다. */
export const PO_APPROVAL_LIMIT = 100_000_000;

export function registerDefaultUserExits() {
  // ── SD: 수주 저장 전 여신한도 검사 ────────────────────────────
  // 재무(fi) 조회 권한이 있는 사용자만 여신 판정을 수행한다.
  registerUserExit({
    id: "EXIT_SD_CREDIT_CHECK",
    label: "여신한도 검사",
    point: "sd.order.beforeSave",
    requires: { moduleId: "fi", level: "조회" },
    run: ({ document, extra }) => {
      const total = Number(document.total) || 0;
      const limit = Number(extra?.creditLimit) || 0;
      const used = Number(extra?.creditUsed) || 0;
      if (limit <= 0) return { ok: true };
      if (used + total > limit) {
        return {
          ok: false,
          message: `여신한도 초과 — 한도 ${limit.toLocaleString()}원, 사용 ${used.toLocaleString()}원, 신규 ${total.toLocaleString()}원`,
        };
      }
      const ratio = ((used + total) / limit) * 100;
      if (ratio >= 90) {
        return { ok: true, warn: true, message: `여신 소진율 ${ratio.toFixed(1)}% — 수금 확인 필요` };
      }
      return { ok: true };
    },
  });

  // ── MM: 발주 저장 전 승인 한도 검사 ───────────────────────────
  // 구매(mm) 승인 권한자만 한도 초과 발주를 낼 수 있다.
  registerUserExit({
    id: "EXIT_MM_PO_LIMIT",
    label: "발주 승인한도 검사",
    point: "mm.po.beforeSave",
    requires: { moduleId: "mm", level: "편집" },
    run: ({ document, user }) => {
      const amount = Number(document.amount) || 0;
      if (amount <= PO_APPROVAL_LIMIT) return { ok: true };
      // 한도 초과분은 승인 권한이 있어야 한다. requires 는 편집이므로
      // 여기서 역할을 한 번 더 본다(관리자 또는 구매 담당).
      const role = String(user?.role ?? "");
      if (role === "관리자" || role === "구매") {
        return {
          ok: true,
          warn: true,
          message: `승인한도 ${PO_APPROVAL_LIMIT.toLocaleString()}원 초과 (${amount.toLocaleString()}원) — 사후 결재 필요`,
        };
      }
      return {
        ok: false,
        message: `승인한도 ${PO_APPROVAL_LIMIT.toLocaleString()}원 초과 (${amount.toLocaleString()}원) — 구매 승인권자만 발주할 수 있습니다`,
      };
    },
  });

  // ── FI: 전표 저장 전 차대 평형 검사 ───────────────────────────
  // 회계(fi) 편집 권한자만 전표 검증을 수행한다.
  registerUserExit({
    id: "EXIT_FI_JV_BALANCE",
    label: "전표 차대 평형 검사",
    point: "fi.journal.beforeSave",
    requires: { moduleId: "fi", level: "편집" },
    run: ({ document }) => {
      const dr = Number(document.debit) || 0;
      const cr = Number(document.credit) || 0;
      if (dr === cr) return { ok: true };
      return {
        ok: false,
        message: `차대 불일치 — 차변 ${dr.toLocaleString()} / 대변 ${cr.toLocaleString()}`,
      };
    },
  });
}
