// 인쇄 서식·전표의 금액 계산. 부가세율과 반올림 규칙을 한 곳에 둔다.
// (구매발주서·거래명세서는 공급가액에 세액을 더하고, 매출전표는 총액에서 나눈다)

export const VAT_RATE = 0.1;

export interface VatSplit {
  supply: number; // 공급가액
  vat: number;    // 부가세
  total: number;  // 합계
}

/** 공급가액에 부가세를 더한다 (세액 별도 문서: 발주서·거래명세서) */
export function addVat(supply: number): VatSplit {
  const base = Math.max(0, Math.round(Number(supply) || 0));
  const vat = Math.round(base * VAT_RATE);
  return { supply: base, vat, total: base + vat };
}

/**
 * 부가세가 포함된 총액을 공급가액과 세액으로 나눈다 (세액 포함 문서: 매출전표).
 * 반올림 오차가 생겨도 supply + vat === total 이 항상 성립하도록 세액을 잔액으로 잡는다.
 * 전표의 차대 평형이 깨지지 않게 하는 것이 목적이다.
 */
export function splitVat(total: number): VatSplit {
  const gross = Math.max(0, Math.round(Number(total) || 0));
  const supply = Math.round(gross / (1 + VAT_RATE));
  return { supply, vat: gross - supply, total: gross };
}
