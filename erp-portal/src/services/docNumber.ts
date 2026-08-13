// 문서번호 채번 — 전표·발주서처럼 사용자에게 보이고 감사 대상이 되는 번호.
//
// nextId() 와 역할이 다르다.
//   nextId()      기술 키(행 id). 서버 구간 예약을 쓰므로 번호에 구멍이 생길 수 있다.
//                 마스터 데이터에서는 사용자가 code 를 직접 입력하므로 구멍이 보이지 않는다.
//   nextDocCode() 문서번호. 문서유형·기간별로 구멍 없이 1씩 올린다.
//
// 형식은 seed 와 동일하게 <유형>-<YY><3자리 이상 연번> 이다. 예: PO-26054
import { getBackendStatus, requestDocNumber } from "./restBackend";

const DOC_SEQ_PAD = 3;

/** 문서번호를 문자열로 만든다. */
export function formatDocCode(docType: string, period: string, seq: number): string {
  return `${docType}-${period}${String(seq).padStart(DOC_SEQ_PAD, "0")}`;
}

/** 문서번호를 분해한다. 형식이 다르면 null. */
export function parseDocCode(code: string): { docType: string; period: string; seq: number } | null {
  const m = /^([A-Z][A-Z0-9]{0,7})-([0-9]{2})([0-9]{3,6})$/.exec(String(code ?? ""));
  if (!m) return null;
  const seq = Number(m[3]);
  return Number.isSafeInteger(seq) ? { docType: m[1], period: m[2], seq } : null;
}

/**
 * 프로토타입 기준 회계연도 2자리. 화면 데이터가 2026년 기준이므로 "26" 을 쓴다.
 * ponytail: 회계기간 마스터가 생기면 그곳에서 가져온다.
 */
export const CURRENT_DOC_PERIOD = "26";

/** 이미 존재하는 번호들에서 해당 유형·기간의 최대 연번을 찾는다. */
export function maxDocSeq(codes: readonly string[], docType: string, period: string): number {
  let max = 0;
  for (const code of codes) {
    const parsed = parseDocCode(code);
    if (parsed && parsed.docType === docType && parsed.period === period) {
      max = Math.max(max, parsed.seq);
    }
  }
  return max;
}

/**
 * 다음 문서번호를 발급한다.
 *
 * REST 모드에서는 서버가 채번하므로 여러 클라이언트가 같은 번호를 받지 않는다.
 * 서버가 없으면(localStorage 모드) 기존 번호의 최대값 + 1 을 쓴다 — 단일
 * 클라이언트이므로 이것으로 무결번이 유지된다.
 *
 * @param existingCodes 같은 store 의 현재 code 목록 (폴백 계산과 충돌 방지에 쓴다)
 */
export async function nextDocCode(
  docType: string,
  existingCodes: readonly string[],
  period: string = CURRENT_DOC_PERIOD
): Promise<string> {
  const localNext = maxDocSeq(existingCodes, docType, period) + 1;

  if (getBackendStatus() === "rest") {
    const issued = await requestDocNumber(docType, period);
    // 서버 수위가 화면 데이터보다 낮으면 로컬을 따른다.
    // seed 처럼 서버에 아직 저장되지 않은 번호가 화면에만 있는 경우가 있다.
    // 이때 서버 번호를 그대로 쓰면 기존 번호와 겹치거나 뒤로 돌아간다.
    // (생성된 행이 서버에 저장되면 서버가 code 를 관찰해 수위를 올리므로 다음부터는 서버가 앞선다)
    if (issued && issued.seq >= localNext) return issued.number;
  }
  return formatDocCode(docType, period, localNext);
}
