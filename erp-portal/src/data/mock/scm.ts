// SCM 계획 Mock — 주단위 (Weekly Bucket Plan Cycle: W27 ~ W50, 총 24주)
// W27~W42 (1~16주): 수기 / 영업 실적 연동 예측
// W43~W50 (17~24주): AI 통계예측
// 3주~24주 (W29~W50): S&OP 및 재고과부족 Contingency Plan 시뮬레이션 Store
import { createStore } from "../../services/store";

export interface ForecastItem {
  id: string;
  material: string;
  week: string;       // 예: "2026-W27"
  weekSeq: number;    // 1 ~ 24
  forecast: number;   // 수기/기본 예측량
  actual: number;     // 실적 (0 = 미래/미확정)
  aiForecast?: number; // AI 통계예측값
  isAi: boolean;      // 17~24주차 AI 통계예측 여부
}

export interface ContingencySimItem {
  id: string;
  material: string;
  week: string;            // 2026-W27 ~ 2026-W50
  weekSeq: number;         // 1 ~ 24
  demand: number;          // 주간 수요 (예측+수주)
  supply: number;          // 주간 공급 (생산계획+입고)
  projectedStock: number;  // 예상 기말재고
  safetyStock: number;     // 안전재고
  status: "안정" | "주의" | "결품위험";
  contingencyPlan: string; // "정상운영" | "비상 외주 할당" | "긴급 항공수송" | "대치자재 전환" | "수주 납기조정"
  actionOwner: string;     // 담당부서 (생산팀, 구매팀, 영업팀, 품질팀)
  costImpact: number;      // 비상대책 실행 시 발생 예상 비용(원)
}

// 24주차 주차 버킷 생성 헬퍼
export const WEEK_BUCKETS = Array.from({ length: 24 }, (_, i) => {
  const seq = i + 1;
  const weekNum = 27 + i;
  return {
    week: `2026-W${String(weekNum).padStart(2, "0")}`,
    seq,
    isAi: seq >= 17, // 17~24주차는 AI 통계예측
  };
});

export const CURRENT_WEEK = "2026-W27";
export const CURRENT_MONTH = "2026-07";

// 주별 완제품 초기 모의 데이터
const generateInitialForecasts = (): ForecastItem[] => {
  const materials = ["FG-1001", "FG-1002", "FG-1003"];
  const baseData: Record<string, { fBase: number; aBase: number }> = {
    "FG-1001": { fBase: 360, aBase: 370 },
    "FG-1002": { fBase: 150, aBase: 145 },
    "FG-1003": { fBase: 1000, aBase: 1020 },
  };

  const list: ForecastItem[] = [];
  materials.forEach((mat) => {
    const { fBase, aBase } = baseData[mat];
    WEEK_BUCKETS.forEach(({ week, seq, isAi }) => {
      const id = `F-${mat}-${week}`;
      const actual = seq <= 3 ? Math.round(aBase + (Math.sin(seq) * 20)) : 0;
      const forecast = Math.round(fBase + (Math.cos(seq) * 25));
      const aiForecast = isAi ? Math.round(forecast * (1 + (Math.sin(seq) * 0.05))) : undefined;

      list.push({
        id,
        material: mat,
        week,
        weekSeq: seq,
        forecast,
        actual,
        aiForecast,
        isAi,
      });
    });
  });
  return list;
};

// 3주~24주 재고과부족 Contingency Plan 시뮬레이션 모의 데이터 생성
const generateInitialContingencyData = (): ContingencySimItem[] => {
  const materials = ["FG-1001", "FG-1002", "FG-1003"];
  const baseStock: Record<string, { init: number; safety: number }> = {
    "FG-1001": { init: 1730, safety: 500 },
    "FG-1002": { init: 380, safety: 300 },
    "FG-1003": { init: 2150, safety: 800 },
  };

  const list: ContingencySimItem[] = [];

  materials.forEach((mat) => {
    let currentInv = baseStock[mat].init;
    const safety = baseStock[mat].safety;

    WEEK_BUCKETS.forEach(({ week, seq }) => {
      const demand = Math.round(400 + Math.sin(seq * 0.5) * 150);
      const supply = Math.round(380 + Math.cos(seq * 0.5) * 120);

      currentInv = currentInv + supply - demand;
      let status: "안정" | "주의" | "결품위험" = "안정";
      let plan = "정상운영";
      let owner = "SCM팀";
      let cost = 0;

      if (currentInv < 0) {
        status = "결품위험";
        if (seq % 3 === 0) {
          plan = "비상 외주 할당";
          owner = "생산팀";
          cost = 15000000;
        } else if (seq % 3 === 1) {
          plan = "긴급 항공수송 (Air Freight)";
          owner = "물류팀";
          cost = 8500000;
        } else {
          plan = "대치자재 전환 및 수주 조정";
          owner = "영업/구매팀";
          cost = 4000000;
        }
      } else if (currentInv < safety) {
        status = "주의";
        plan = "생산 잔업 / 안전재고 보충";
        owner = "생산팀";
        cost = 2500000;
      }

      list.push({
        id: `CTG-${mat}-${week}`,
        material: mat,
        week,
        weekSeq: seq,
        demand,
        supply,
        projectedStock: currentInv,
        safetyStock: safety,
        status,
        contingencyPlan: plan,
        actionOwner: owner,
        costImpact: cost,
      });
    });
  });

  return list;
};

export const forecastStore = createStore("scm.forecast", generateInitialForecasts());
export const contingencyStore = createStore("scm.contingency", generateInitialContingencyData());

// MAPE (Mean Absolute Percentage Error) — 실적 있는 주차만
export function mape(rows: ForecastItem[]) {
  const valid = rows.filter((r) => r.actual > 0);
  if (valid.length === 0) return null;
  const sum = valid.reduce((s, r) => s + Math.abs(r.actual - r.forecast) / r.actual, 0);
  return (sum / valid.length) * 100;
}

// 예측 정확도 = 100 - MAPE
export const accuracy = (m: number | null) => (m === null ? null : Math.max(0, 100 - m));

// 주별 S&OP 합의 상태 저장
export const sopStore = createStore("scm.sop", [
  { id: "SOP-26W27", week: "2026-W27", status: "검토중", note: "주단위 S&OP 합의 진행중" },
  { id: "SOP-26W28", week: "2026-W28", status: "검토중", note: "" },
]);

// SCM-001 품목별 AI 예측 파라미터 (튜닝 패널 저장값).
// 행이 없으면 DEFAULT_PARAMS 를 쓴다 — 즉 "저장하지 않음 = 기본값"이다.
// 품목마다 수요 패턴이 달라 파라미터를 품목 단위로 보관한다.
export const forecastParamStore = createStore("scm.forecast_params", []);
