// 시장분석(MK) Mock (Sprint 12) — 제품군별 시장규모·점유율·성장률
import { createStore } from "../../services/store";

// 금액 단위: 억원 (국내 연간 시장 기준)
export const marketStore = createStore("analytics.market", [
  { id: "M-1", category: "에어프라이어", marketSize: 4200, ourSales: 620, growth: 8.5, topRival: "필립스", rivalShare: 22 },
  { id: "M-2", category: "무선청소기", marketSize: 9800, ourSales: 540, growth: 12.3, topRival: "다이슨", rivalShare: 35 },
  { id: "M-3", category: "전기포트", marketSize: 1500, ourSales: 310, growth: 3.2, topRival: "쿠쿠", rivalShare: 18 },
]);

// 자사 점유율 = ourSales / marketSize × 100
export const share = (our: number, size: number) => (size > 0 ? (our / size) * 100 : 0);
