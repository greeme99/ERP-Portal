// 인쇄/PDF 서식 검증 — 전표 금액 계산의 회계 불변식을 확인한다.
// (서식 렌더링 자체는 브라우저 네이티브 인쇄이므로 실제 화면에서 확인한다)
import { VAT_RATE, addVat, splitVat } from "../src/services/documentMath";

let pass = 0;
let fail = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (ok) { pass++; console.log(`PASS | ${label}`); }
  else { fail++; console.log(`FAIL | ${label}${detail ? ` — ${detail}` : ""}`); }
};

console.log("\n[1] addVat — 세액 별도 문서 (구매발주서·거래명세서)");
{
  const r = addVat(1_000_000);
  check(r.supply === 1_000_000 && r.vat === 100_000 && r.total === 1_100_000, "100만원 → 세액 10만, 합계 110만", JSON.stringify(r));
  check(VAT_RATE === 0.1, "부가세율은 10%");

  const zero = addVat(0);
  check(zero.supply === 0 && zero.vat === 0 && zero.total === 0, "0원은 0으로 처리");

  const neg = addVat(-5000);
  check(neg.supply === 0 && neg.total === 0, "음수 입력은 0으로 보정");

  const nan = addVat(Number.NaN);
  check(nan.total === 0 && Number.isFinite(nan.total), "NaN 입력도 유한값");

  const odd = addVat(3_333_333);
  check(odd.supply + odd.vat === odd.total, "반올림이 있어도 supply + vat === total", JSON.stringify(odd));
}

console.log("\n[2] splitVat — 세액 포함 문서 (매출전표)");
{
  const r = splitVat(1_100_000);
  check(r.supply === 1_000_000 && r.vat === 100_000 && r.total === 1_100_000, "110만원 → 공급가 100만, 세액 10만", JSON.stringify(r));

  const zero = splitVat(0);
  check(zero.total === 0 && zero.supply === 0 && zero.vat === 0, "0원은 0으로 처리");

  const neg = splitVat(-1000);
  check(neg.total === 0, "음수 입력은 0으로 보정");
}

console.log("\n[3] 매출전표 차대 평형 — 회계 불변식");
{
  // 임의 금액 2000건에서 차변(매출채권) = 대변(제품매출 + 부가세예수금) 이어야 한다.
  // 반올림 때문에 한 건이라도 깨지면 전표가 마감되지 않는다.
  let broken: number[] = [];
  for (let i = 1; i <= 2000; i++) {
    const total = i * 7919; // 소수가 잘 떨어지지 않는 배수
    const { supply, vat } = splitVat(total);
    if (supply + vat !== splitVat(total).total) broken.push(total);
  }
  check(broken.length === 0, "2000건 모두 차대가 평형이다", `깨진 건수 ${broken.length}: ${broken.slice(0, 3)}`);

  // 실제 seed 금액(AR-26001)으로도 확인
  const real = splitVat(152_000_000);
  check(real.supply + real.vat === real.total, "seed 금액 152,000,000 평형", JSON.stringify(real));
  check(real.supply === 138_181_818, "공급가액이 총액/1.1 반올림과 일치", String(real.supply));
}

console.log("\n[4] addVat 과 splitVat 의 왕복 오차");
{
  // 공급가 → 총액 → 다시 공급가 로 돌아왔을 때 1원 이내여야 한다
  let worst = 0;
  for (let supply = 1; supply <= 5000; supply++) {
    const total = addVat(supply).total;
    const back = splitVat(total).supply;
    worst = Math.max(worst, Math.abs(back - supply));
  }
  check(worst <= 1, "왕복 오차가 1원 이내다", `최대 ${worst}원`);
}

console.log(`\n═══ 결과: PASS ${pass} / FAIL ${fail} — ${fail === 0 ? "✅ 인쇄 서식 금액 검증 성공" : "❌ 실패 있음"} ═══`);
process.exit(fail === 0 ? 0 : 1);
