// MM 구매 Mock — 부서예산, PR, PO, 공급사 평가
import { createStore } from "../../services/store";

// ── 부서 예산 (PR 예산체크용) ────────────────────
export const budgetStore = createStore("procurement.budget", [
  { id: "생산팀", dept: "생산팀", budget: 800000000, used: 620000000 },
  { id: "구매팀", dept: "구매팀", budget: 500000000, used: 210000000 },
  { id: "연구소", dept: "연구소", budget: 300000000, used: 275000000 },
  { id: "품질팀", dept: "품질팀", budget: 150000000, used: 80000000 },
  { id: "영업팀", dept: "영업팀", budget: 200000000, used: 95000000 },
  { id: "마케팅팀", dept: "마케팅팀", budget: 260000000, used: 222000000 },
  { id: "물류팀", dept: "물류팀", budget: 180000000, used: 110000000 },
]);

// ── 구매요청 PR (MM-001: 승인 Workflow·예산체크) ─
export const prStore = createStore("procurement.request", [
  { id: "PR-26031", code: "PR-26031", dept: "생산팀", material: "RM-3001", qty: 300000, amount: 3600000, reqDate: "2026-06-28", dueDate: "2026-07-20", status: "승인" },
  { id: "PR-26032", code: "PR-26032", dept: "생산팀", material: "RM-3004", qty: 2000, amount: 6400000, reqDate: "2026-07-01", dueDate: "2026-07-25", status: "승인대기" },
  { id: "PR-26033", code: "PR-26033", dept: "연구소", material: "RM-3005", qty: 500, amount: 2700000, reqDate: "2026-07-02", dueDate: "2026-08-01", status: "승인대기" },
  { id: "PR-26034", code: "PR-26034", dept: "품질팀", material: "RM-3002", qty: 300, amount: 555000, reqDate: "2026-06-25", dueDate: "2026-07-10", status: "반려" },
]);

// ── 구매발주 PO (MM-002: 공급사 배정·납기 관리) ──
export const poStore = createStore("procurement.order", [
  { id: "PO-26051", code: "PO-26051", pr: "PR-26031", vendor: "V-1001", material: "RM-3001", qty: 300000, price: 11, orderDate: "2026-06-29", dueDate: "2026-07-18", status: "발주" },
  { id: "PO-26052", code: "PO-26052", pr: "-", vendor: "V-1002", material: "RM-3002", qty: 3000, price: 1780, orderDate: "2026-06-20", dueDate: "2026-06-30", status: "발주" },
  { id: "PO-26053", code: "PO-26053", pr: "-", vendor: "V-2001", material: "RM-3003", qty: 800, price: 17800, orderDate: "2026-06-15", dueDate: "2026-07-05", status: "입고완료" },
]);

// ── 공급사 평가 (MM-003: 품질·납기·가격·대응) ────
export const vendorEvalStore = createStore("procurement.vendor-evaluation", [
  { id: "V-1001", code: "V-1001", name: "삼화콘덴서", quality: 92, delivery: 88, price: 85, response: 90 },
  { id: "V-1002", code: "V-1002", name: "대덕전자", quality: 95, delivery: 91, price: 78, response: 86 },
  { id: "V-2001", code: "V-2001", name: "Shenzhen Motor Co.", quality: 81, delivery: 72, price: 94, response: 75 },
]);

export const evalTotal = (r: { quality: number; delivery: number; price: number; response: number }) =>
  Math.round(r.quality * 0.35 + r.delivery * 0.3 + r.price * 0.2 + r.response * 0.15);

export const evalGrade = (total: number) => (total >= 90 ? "S" : total >= 80 ? "A" : total >= 70 ? "B" : "C");
