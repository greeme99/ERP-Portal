// 기본 제공 User Exit — 판정 로직은 shared/businessRules.mjs 의 순수 함수를 쓴다.
//
// 규칙 본문을 여기 두지 않는 이유: 서버(server/*.mjs)가 같은 파일을 import 해
// UI 를 우회한 요청에도 같은 판정을 적용한다. 규칙을 양쪽에 중복 구현하면
// 판정이 어긋난다.
//
// approval 은 "규칙 위반을 예외 승인할 권한"이다. Exit 자체는 항상 실행된다.
import { registerUserExit } from "./userExit";
import {
  checkCreditLimit,
  checkJournalBalance,
  checkPoApprovalLimit,
  PO_APPROVAL_LIMIT,
} from "../../shared/businessRules.mjs";

export { PO_APPROVAL_LIMIT };

export function registerDefaultUserExits() {
  // ── SD: 수주 저장 전 여신한도 검사 ────────────────────────────
  // 서버에서는 검증하지 않는다(고객 여신 데이터 조회가 필요 — 문서 4.5 §2.4 T-4).
  // 예외 승인은 재무회계 승인 권한자만 할 수 있다.
  registerUserExit({
    id: "EXIT_SD_CREDIT_CHECK",
    label: "여신한도 검사",
    point: "sd.order.beforeSave",
    approval: { moduleId: "fi", level: "승인" },
    run: ({ document, extra, canApprove }) =>
      checkCreditLimit(document, {
        creditLimit: Number(extra?.creditLimit) || 0,
        creditUsed: Number(extra?.creditUsed) || 0,
        canApprove,
      }),
  });

  // ── MM: 발주 저장 전 승인한도 검사 ───────────────────────────
  // 서버도 같은 함수로 검증한다(자기완결 규칙).
  registerUserExit({
    id: "EXIT_MM_PO_LIMIT",
    label: "발주 승인한도 검사",
    point: "mm.po.beforeSave",
    approval: { moduleId: "mm", level: "승인" },
    run: ({ document, canApprove }) => checkPoApprovalLimit(document, { canApprove }),
  });

  // ── FI: 전표 저장 전 차대 평형 검사 ───────────────────────────
  // 회계 불변식이라 예외 승인을 두지 않는다(approval 없음 = 아무도 못 넘긴다).
  registerUserExit({
    id: "EXIT_FI_JV_BALANCE",
    label: "전표 차대 평형 검사",
    point: "fi.journal.beforeSave",
    run: ({ document }) => checkJournalBalance(document),
  });
}
