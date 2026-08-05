// 마케팅(MK) Mock (Sprint 11) — 캠페인/판촉비/ROI
import { createStore } from "../../services/store";

export const campaignStore = createStore("marketing.campaign", [
  { id: "CP-26001", code: "CP-26001", name: "여름 소형가전 프로모션", channel: "온라인", budget: 80000000, spent: 62000000, revenue: 340000000, start: "2026-06-01", status: "진행" },
  { id: "CP-26002", code: "CP-26002", name: "에어프라이어 신제품 런칭", channel: "TV/디지털", budget: 150000000, spent: 148000000, revenue: 520000000, start: "2026-05-10", status: "종료" },
  { id: "CP-26003", code: "CP-26003", name: "청소기 리뷰 인플루언서", channel: "SNS", budget: 30000000, spent: 12000000, revenue: 45000000, start: "2026-07-01", status: "진행" },
]);

export const CP_STATUS_STYLE: Record<string, string> = {
  진행: "bg-blue-100 text-blue-700",
  종료: "bg-emerald-100 text-emerald-700",
  중단: "bg-red-100 text-red-700",
};

export const CHANNELS = ["온라인", "TV/디지털", "SNS", "오프라인", "제휴"];

// ROI = (기여매출 − 집행비) / 집행비 × 100
export const roi = (revenue: number, spent: number) => (spent > 0 ? ((revenue - spent) / spent) * 100 : 0);
