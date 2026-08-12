// SCM-001 AI 통계예측 시계열 모델 엔진
// 1. Holt 선형추세 지수평활 (Double Exponential Smoothing) — level(α) + trend(β)
//    주의: 계절 성분(γ)이 없으므로 엄밀히는 Holt-Winters(삼중)가 아니다.
//    주간 계절성을 추정하려면 계절 주기의 최소 2배 이력이 필요한데 현재 이력은 16주다.
//    이력이 확보되면 삼중 평활로 확장한다.
// 2. 이동평균 (Moving Average)
// 3. 선형 추세 회귀 (Linear Trend Regression)
// 17주 ~ 24주차 AI 통계예측 자동 산출 및 신뢰구간 (Confidence Interval) 계산
//
// 모든 파라미터는 ForecastParams 로 주입한다. 화면(SCM-001)의 튜닝 패널이
// 값을 바꾸면 같은 엔진이 다른 결과를 내고, 백테스트 MAPE 로 우열을 판정한다.

export interface ForecastParams {
  alpha: number;        // level 평활 계수 (0~1) — 높으면 최근값에 민감
  beta: number;         // trend 평활 계수 (0~1) — 높으면 추세 변화에 민감
  maWindow: number;     // 이동평균 창 크기 (주)
  wHoltWinters: number; // 앙상블 가중 — Holt
  wMovingAverage: number;
  wLinearRegression: number;
  ciPct: number;        // 신뢰구간 폭 (%)
}

// 기존 동작과 동일한 기본값. 화면에서 조정하지 않으면 이 값이 쓰인다.
export const DEFAULT_PARAMS: ForecastParams = {
  alpha: 0.4,
  beta: 0.2,
  maWindow: 4,
  wHoltWinters: 0.5,
  wMovingAverage: 0.3,
  wLinearRegression: 0.2,
  ciPct: 6.5,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 사용자 입력을 신뢰하지 않고 유효 범위로 보정한다. 가중치 합은 1로 정규화한다. */
export function normalizeParams(input: Partial<ForecastParams>): ForecastParams {
  const p = { ...DEFAULT_PARAMS, ...input };
  const alpha = clamp(Number(p.alpha) || 0, 0.01, 1);
  const beta = clamp(Number(p.beta) || 0, 0, 1);
  const maWindow = Math.round(clamp(Number(p.maWindow) || 1, 1, 16));
  const ciPct = clamp(Number(p.ciPct) || 0, 0, 50);

  const raw = [p.wHoltWinters, p.wMovingAverage, p.wLinearRegression].map((w) => Math.max(0, Number(w) || 0));
  const sum = raw[0] + raw[1] + raw[2];
  // 전부 0이면 Holt 100%로 되돌린다(0으로 나누지 않게).
  const [wH, wM, wL] = sum > 0 ? raw.map((w) => w / sum) : [1, 0, 0];

  return { alpha, beta, maWindow, ciPct, wHoltWinters: wH, wMovingAverage: wM, wLinearRegression: wL };
}

export interface AiForecastResult {
  week: string;
  seq: number;
  holtWinters: number;
  movingAverage: number;
  linearRegression: number;
  ensembleAi: number;       // 앙상블 AI 통계예측 최종 추천값
  confidencePct: number;    // 예측 신뢰도 (%)
  upperBound: number;       // 신뢰구간 상한
  lowerBound: number;       // 신뢰구간 하한
}

/**
 * 선형 추세 회귀 (Linear Regression: y = ax + b)
 */
export function calcLinearRegression(history: number[], futureCount: number): number[] {
  const n = history.length;
  if (n === 0) return Array(futureCount).fill(0);

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += history[i];
    sumXY += i * history[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  return Array.from({ length: futureCount }, (_, k) => {
    const x = n + k;
    return Math.max(0, Math.round(slope * x + intercept));
  });
}

/**
 * 이동평균 (Moving Average)
 */
export function calcMovingAverage(history: number[], futureCount: number, windowSize = 3): number[] {
  const n = history.length;
  if (n === 0) return Array(futureCount).fill(0);

  const recent = history.slice(Math.max(0, n - windowSize));
  const avg = Math.round(recent.reduce((s, v) => s + v, 0) / (recent.length || 1));

  return Array(futureCount).fill(avg);
}

/**
 * Holt-Winters 계절성 지수평균 추세 모델 (Double Exponential Smoothing)
 */
export function calcHoltWinters(history: number[], futureCount: number, alpha = 0.4, beta = 0.2): number[] {
  const n = history.length;
  if (n < 2) return Array(futureCount).fill(history[0] ?? 0);

  let level = history[0];
  let trend = history[1] - history[0];

  for (let i = 1; i < n; i++) {
    const value = history[i];
    const prevLevel = level;
    level = alpha * value + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  return Array.from({ length: futureCount }, (_, k) => {
    const forecastVal = Math.round(level + (k + 1) * trend);
    return Math.max(0, forecastVal);
  });
}

/**
 * 앙상블 AI 통계예측 엔진 실행.
 * params 를 주지 않으면 DEFAULT_PARAMS 로 기존과 동일하게 동작한다.
 */
export function runAiStatisticalForecastEngine(
  history: number[],
  startWeekSeq = 17,
  futureCount = 8,
  params: Partial<ForecastParams> = {}
): AiForecastResult[] {
  const p = normalizeParams(params);
  const hwList = calcHoltWinters(history, futureCount, p.alpha, p.beta);
  const maList = calcMovingAverage(history, futureCount, p.maWindow);
  const lrList = calcLinearRegression(history, futureCount);

  return Array.from({ length: futureCount }, (_, idx) => {
    const seq = startWeekSeq + idx;
    const week = `2026-W${String(26 + seq).padStart(2, "0")}`;

    const hw = hwList[idx];
    const ma = maList[idx];
    const lr = lrList[idx];

    const ensemble = Math.round(hw * p.wHoltWinters + ma * p.wMovingAverage + lr * p.wLinearRegression);

    const margin = Math.round(ensemble * (p.ciPct / 100));
    const upperBound = ensemble + margin;
    const lowerBound = Math.max(0, ensemble - margin);
    // 표시용 신뢰도 — 먼 주차일수록 낮아진다(통계적 산출값이 아니다).
    const confidencePct = Math.min(98.5, Math.max(88.0, 95.0 - idx * 0.8));

    return { week, seq, holtWinters: hw, movingAverage: ma, linearRegression: lr, ensembleAi: ensemble, confidencePct, upperBound, lowerBound };
  });
}

export interface BacktestResult {
  mapePct: number | null;   // 검증 구간 MAPE (%) — 낮을수록 좋다
  accuracyPct: number | null;
  trainCount: number;
  validateCount: number;
  points: { index: number; actual: number; predicted: number }[];
}

/**
 * 파라미터 우열을 판정하기 위한 홀드아웃 백테스트.
 * 이력의 앞부분으로 학습해 뒷부분을 예측하고 실제값과 비교한다.
 * 슬라이더를 움직였을 때 오차가 어떻게 변하는지 보여주는 근거가 된다.
 */
export function backtestForecast(
  history: number[],
  params: Partial<ForecastParams> = {},
  validateCount = 4
): BacktestResult {
  const p = normalizeParams(params);
  // 학습 구간이 최소 2개는 있어야 추세를 잡을 수 있다.
  const holdout = Math.min(Math.max(1, Math.trunc(validateCount)), Math.max(0, history.length - 2));
  if (history.length < 3 || holdout < 1) {
    return { mapePct: null, accuracyPct: null, trainCount: history.length, validateCount: 0, points: [] };
  }

  const train = history.slice(0, history.length - holdout);
  const actualTail = history.slice(history.length - holdout);
  const predicted = runAiStatisticalForecastEngine(train, 1, holdout, p).map((r) => r.ensembleAi);

  const points = actualTail.map((actual, i) => ({ index: train.length + i, actual, predicted: predicted[i] ?? 0 }));
  // 실적이 0인 구간은 백분율 오차를 정의할 수 없어 제외한다.
  const usable = points.filter((pt) => pt.actual > 0);
  if (usable.length === 0) {
    return { mapePct: null, accuracyPct: null, trainCount: train.length, validateCount: holdout, points };
  }

  const mapePct = (usable.reduce((sum, pt) => sum + Math.abs(pt.actual - pt.predicted) / pt.actual, 0) / usable.length) * 100;
  return {
    mapePct,
    accuracyPct: Math.max(0, 100 - mapePct),
    trainCount: train.length,
    validateCount: holdout,
    points,
  };
}

/**
 * 격자 탐색으로 백테스트 MAPE 가 가장 낮은 α·β 를 찾는다.
 * 가중치·신뢰구간은 사용자가 정한 값을 유지하고 평활 계수만 최적화한다.
 */
export function optimizeSmoothing(
  history: number[],
  base: Partial<ForecastParams> = {},
  validateCount = 4
): { alpha: number; beta: number; mapePct: number } | null {
  let best: { alpha: number; beta: number; mapePct: number } | null = null;
  for (let a = 5; a <= 95; a += 5) {
    for (let b = 0; b <= 95; b += 5) {
      const alpha = a / 100;
      const beta = b / 100;
      const { mapePct } = backtestForecast(history, { ...base, alpha, beta }, validateCount);
      if (mapePct === null) continue;
      if (!best || mapePct < best.mapePct) best = { alpha, beta, mapePct };
    }
  }
  return best;
}
