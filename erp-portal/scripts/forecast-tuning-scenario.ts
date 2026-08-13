// SCM-001 예측 파라미터 튜닝 엔진 검증 — 파라미터 주입, 정규화, 백테스트, 최적화
import {
  DEFAULT_PARAMS,
  normalizeParams,
  runAiStatisticalForecastEngine,
  backtestForecast,
  optimizeSmoothing,
  calcHoltWinters,
  calcMovingAverage,
} from "../src/services/aiStatsModel";

let pass = 0;
let fail = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (ok) { pass++; console.log(`PASS | ${label}`); }
  else { fail++; console.log(`FAIL | ${label}${detail ? ` — ${detail}` : ""}`); }
};

// 추세가 있는 합성 이력 16주
const history = Array.from({ length: 16 }, (_, i) => 1000 + i * 40 + Math.round(Math.sin(i) * 30));

console.log("\n[1] 기본값은 기존 동작과 동일하다 (회귀 방지)");
{
  const withDefaults = runAiStatisticalForecastEngine(history, 17, 8);
  const explicit = runAiStatisticalForecastEngine(history, 17, 8, DEFAULT_PARAMS);
  check(
    JSON.stringify(withDefaults) === JSON.stringify(explicit),
    "params 를 생략하면 DEFAULT_PARAMS 와 같은 결과"
  );
  check(DEFAULT_PARAMS.alpha === 0.4 && DEFAULT_PARAMS.beta === 0.2, "기본 α=0.4, β=0.2 유지");
  check(withDefaults.length === 8 && withDefaults[0].week === "2026-W43", "17주차부터 8주를 산출한다");

  // 앙상블이 가중합과 일치하는지 직접 검산
  const r = withDefaults[0];
  const expected = Math.round(r.holtWinters * 0.5 + r.movingAverage * 0.3 + r.linearRegression * 0.2);
  check(r.ensembleAi === expected, "앙상블이 가중합과 일치한다", `${r.ensembleAi} vs ${expected}`);
}

console.log("\n[2] 파라미터 정규화 — 신뢰 경계 입력 보정");
{
  check(normalizeParams({ alpha: 5 }).alpha === 1, "α 상한 초과는 1로 clamp");
  check(normalizeParams({ alpha: -3 }).alpha === 0.01, "α 하한 미만은 0.01로 clamp");
  check(normalizeParams({ beta: 99 }).beta === 1, "β 상한 clamp");
  check(normalizeParams({ maWindow: 2.7 }).maWindow === 3, "이동평균 창은 정수로 반올림");
  check(normalizeParams({ maWindow: 999 }).maWindow === 16, "이동평균 창 상한 16");
  check(normalizeParams({ ciPct: -5 }).ciPct === 0, "신뢰구간 음수는 0");

  const n = normalizeParams({ wHoltWinters: 2, wMovingAverage: 1, wLinearRegression: 1 });
  const sum = n.wHoltWinters + n.wMovingAverage + n.wLinearRegression;
  check(Math.abs(sum - 1) < 1e-9, "가중치 합이 1로 정규화된다", `sum=${sum}`);
  check(Math.abs(n.wHoltWinters - 0.5) < 1e-9, "2:1:1 은 50/25/25 가 된다");

  const zero = normalizeParams({ wHoltWinters: 0, wMovingAverage: 0, wLinearRegression: 0 });
  check(zero.wHoltWinters === 1, "가중치가 전부 0이면 Holt 100% 로 되돌린다 (0 나눗셈 방지)");

  const nan = normalizeParams({ alpha: Number.NaN, ciPct: Number.NaN });
  check(nan.alpha >= 0.01 && Number.isFinite(nan.ciPct), "NaN 입력도 유효값으로 보정된다");
}

console.log("\n[3] 파라미터가 실제로 결과를 바꾼다");
{
  const low = runAiStatisticalForecastEngine(history, 17, 8, { alpha: 0.05 });
  const high = runAiStatisticalForecastEngine(history, 17, 8, { alpha: 0.95 });
  check(low[0].holtWinters !== high[0].holtWinters, "α 변경이 Holt 예측을 바꾼다", `${low[0].holtWinters} vs ${high[0].holtWinters}`);

  const wide = runAiStatisticalForecastEngine(history, 17, 8, { ciPct: 20 });
  const narrow = runAiStatisticalForecastEngine(history, 17, 8, { ciPct: 1 });
  check(
    wide[0].upperBound - wide[0].lowerBound > narrow[0].upperBound - narrow[0].lowerBound,
    "신뢰구간 폭이 넓어진다"
  );

  const onlyMa = runAiStatisticalForecastEngine(history, 17, 8, {
    wHoltWinters: 0, wMovingAverage: 1, wLinearRegression: 0,
  });
  check(onlyMa[0].ensembleAi === onlyMa[0].movingAverage, "이동평균 100% 면 앙상블이 이동평균과 같다");

  const ma2 = calcMovingAverage(history, 1, 2)[0];
  const ma8 = calcMovingAverage(history, 1, 8)[0];
  check(ma2 !== ma8, "이동평균 창 크기가 결과를 바꾼다", `${ma2} vs ${ma8}`);

  // β=0 이면 추세가 초기값에 고정되어 선형으로 뻗는다
  const flat = calcHoltWinters(history, 3, 0.5, 0);
  check(flat[1] - flat[0] === flat[2] - flat[1], "β=0 이면 증분이 일정하다");
}

console.log("\n[4] 백테스트");
{
  const bt = backtestForecast(history, DEFAULT_PARAMS, 4);
  check(bt.mapePct !== null, "MAPE 를 산출한다", JSON.stringify(bt.mapePct));
  check(bt.trainCount === 12 && bt.validateCount === 4, "학습 12주 / 검증 4주로 분할한다", `${bt.trainCount}/${bt.validateCount}`);
  check(bt.points.length === 4, "검증 포인트가 4개다");
  check(
    bt.accuracyPct !== null && Math.abs(bt.accuracyPct - (100 - (bt.mapePct ?? 0))) < 1e-9,
    "정확도 = 100 - MAPE"
  );
  check(bt.points.every((p) => p.actual === history[p.index]), "검증 포인트의 실제값이 이력과 일치한다");

  const short = backtestForecast([100, 200], DEFAULT_PARAMS, 4);
  check(short.mapePct === null, "이력이 3개 미만이면 null 을 준다");

  const zeros = backtestForecast([0, 0, 0, 0, 0, 0], DEFAULT_PARAMS, 2);
  check(zeros.mapePct === null, "검증 구간 실적이 모두 0이면 null (0 나눗셈 방지)");

  // 검증 구간이 이력보다 길면 학습 구간을 최소 2개는 남긴다
  const clamped = backtestForecast(history, DEFAULT_PARAMS, 999);
  check(clamped.trainCount >= 2, "검증 구간이 과도하면 학습 구간을 2개 이상 남긴다", `train=${clamped.trainCount}`);
}

console.log("\n[5] 자동 최적화");
{
  const best = optimizeSmoothing(history, DEFAULT_PARAMS, 4);
  check(best !== null, "최적 α·β 를 찾는다", JSON.stringify(best));
  const baseline = backtestForecast(history, DEFAULT_PARAMS, 4).mapePct ?? Infinity;
  check((best?.mapePct ?? Infinity) <= baseline, "최적값의 MAPE 가 기본값보다 낮거나 같다", `${best?.mapePct?.toFixed(3)} <= ${baseline.toFixed(3)}`);

  // 최적화가 보고한 MAPE 가 실제로 재현되는지 확인
  const replay = backtestForecast(history, { ...DEFAULT_PARAMS, alpha: best!.alpha, beta: best!.beta }, 4).mapePct;
  check(Math.abs((replay ?? -1) - best!.mapePct) < 1e-9, "보고한 MAPE 가 재현된다", `${replay} vs ${best!.mapePct}`);

  check(best!.alpha >= 0.01 && best!.alpha <= 1 && best!.beta >= 0 && best!.beta <= 1, "최적값이 유효 범위 안이다");

  const none = optimizeSmoothing([1, 2], DEFAULT_PARAMS, 4);
  check(none === null, "이력이 부족하면 null 을 준다");
}

console.log("\n[6] 품목별 파라미터 저장 (영속화)");
{
  const { forecastParamStore } = await import("../src/data/mock/scm");
  const savedFor = (material: string) => forecastParamStore.getAll().find((r) => r.material === material);

  check(forecastParamStore.getAll().length === 0, "초기에는 저장된 파라미터가 없다 (= 기본값)");

  forecastParamStore.create({ id: "FP-1", material: "FG-1001", ...normalizeParams({ alpha: 0.85, beta: 0.95 }) });
  const row = savedFor("FG-1001");
  check(!!row, "품목 파라미터를 저장한다");
  check(row?.alpha === 0.85 && row?.beta === 0.95, "저장한 alpha/beta 가 보존된다", JSON.stringify(row));
  check(savedFor("FG-1002") === undefined, "다른 품목은 영향받지 않는다 (품목별 분리)");

  const withSaved = runAiStatisticalForecastEngine(history, 17, 8, row as never);
  const withDefault = runAiStatisticalForecastEngine(history, 17, 8);
  check(withSaved[0].ensembleAi !== withDefault[0].ensembleAi, "저장값이 예측 결과에 반영된다");

  forecastParamStore.create({
    id: "FP-2",
    material: "FG-1003",
    ...normalizeParams({ alpha: 9, wHoltWinters: 2, wMovingAverage: 1, wLinearRegression: 1 }),
  });
  const r3 = savedFor("FG-1003")!;
  check(r3.alpha === 1, "저장 시 alpha 가 clamp 된다");
  check(Math.abs(r3.wHoltWinters + r3.wMovingAverage + r3.wLinearRegression - 1) < 1e-9, "저장 시 가중치 합이 1이다");

  forecastParamStore.update("FP-1", { alpha: 0.3 });
  check(savedFor("FG-1001")?.alpha === 0.3, "저장값을 갱신할 수 있다");

  forecastParamStore.remove(["FP-1"]);
  check(savedFor("FG-1001") === undefined, "저장값을 삭제하면 기본값으로 돌아간다");
}

console.log(`\n═══ 결과: PASS ${pass} / FAIL ${fail} — ${fail === 0 ? "✅ 예측 튜닝 엔진 검증 성공" : "❌ 실패 있음"} ═══`);
process.exit(fail === 0 ? 0 : 1);
