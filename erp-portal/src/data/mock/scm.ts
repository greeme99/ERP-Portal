// SCM 계획 Mock (Sprint 9) — 수요예측 시계열, MAPE
import { createStore } from "../../services/store";

// ── 수요예측 (FG별 월별 예측 vs 실적) ────────────
// actual 0 = 미래/미확정 (MAPE 계산 제외)
export const forecastStore = createStore("scm.forecast", [
  { id: "F-1001-04", material: "FG-1001", month: "2026-04", forecast: 1400, actual: 1500 },
  { id: "F-1001-05", material: "FG-1001", month: "2026-05", forecast: 1600, actual: 1450 },
  { id: "F-1001-06", material: "FG-1001", month: "2026-06", forecast: 1500, actual: 1580 },
  { id: "F-1001-07", material: "FG-1001", month: "2026-07", forecast: 1500, actual: 0 },
  { id: "F-1001-08", material: "FG-1001", month: "2026-08", forecast: 1700, actual: 0 },

  { id: "F-1002-04", material: "FG-1002", month: "2026-04", forecast: 550, actual: 600 },
  { id: "F-1002-05", material: "FG-1002", month: "2026-05", forecast: 620, actual: 580 },
  { id: "F-1002-06", material: "FG-1002", month: "2026-06", forecast: 600, actual: 610 },
  { id: "F-1002-07", material: "FG-1002", month: "2026-07", forecast: 600, actual: 0 },
  { id: "F-1002-08", material: "FG-1002", month: "2026-08", forecast: 700, actual: 0 },

  { id: "F-1003-04", material: "FG-1003", month: "2026-04", forecast: 3800, actual: 4000 },
  { id: "F-1003-05", material: "FG-1003", month: "2026-05", forecast: 4200, actual: 3900 },
  { id: "F-1003-06", material: "FG-1003", month: "2026-06", forecast: 4000, actual: 4300 },
  { id: "F-1003-07", material: "FG-1003", month: "2026-07", forecast: 5000, actual: 0 },
  { id: "F-1003-08", material: "FG-1003", month: "2026-08", forecast: 5200, actual: 0 },
]);

export const CURRENT_MONTH = "2026-07";

// MAPE (Mean Absolute Percentage Error) — 실적 있는 월만
export function mape(rows: { forecast: number; actual: number }[]) {
  const valid = rows.filter((r) => r.actual > 0);
  if (valid.length === 0) return null;
  const sum = valid.reduce((s, r) => s + Math.abs(r.actual - r.forecast) / r.actual, 0);
  return (sum / valid.length) * 100;
}

// 예측 정확도 = 100 - MAPE
export const accuracy = (m: number | null) => (m === null ? null : Math.max(0, 100 - m));

// S&OP 합의 상태 저장
export const sopStore = createStore("scm.sop", [
  { id: "SOP-2607", month: "2026-07", status: "검토중", note: "" },
]);
