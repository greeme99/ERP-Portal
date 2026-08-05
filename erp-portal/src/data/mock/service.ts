// 서비스(SV) Mock (Sprint 10) — Warranty, AS 접수/수리
import { createStore } from "../../services/store";

export const TODAY = "2026-07-03";

// 보증 만료일 = 출하일 + n개월 (연/월 단순 가산)
export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const total = (m - 1) + months;
  const ny = y + Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ── Warranty (보증 등록: 출하완료 제품) ───────────
export const warrantyStore = createStore("service.warranty", [
  { id: "W-26001", code: "W-26001", ref: "SO-26010", material: "FG-1001", customer: "C-1001", shipDate: "2026-07-01", months: 12, expiry: "2027-07-01", status: "유효" },
  { id: "W-25050", code: "W-25050", ref: "SO-25050", material: "FG-1003", customer: "C-1003", shipDate: "2025-05-20", months: 12, expiry: "2026-05-20", status: "만료" },
]);

// ── AS 접수 / 수리 ───────────────────────────────
export const asStore = createStore("service.repair", [
  { id: "AS-26001", code: "AS-26001", customer: "C-1003", material: "FG-1003", symptom: "전원 불량 (간헐 꺼짐)", receiveDate: "2026-06-28", status: "수리중", warranty: "유효", cost: 0, note: "" },
  { id: "AS-26002", code: "AS-26002", customer: "C-1001", material: "FG-1001", symptom: "가열 안됨 (히터 단선 의심)", receiveDate: "2026-06-20", status: "완료", warranty: "만료", cost: 32000, note: "히터 어셈블리 교체 (유상)" },
]);

export const AS_STATUS_STYLE: Record<string, string> = {
  접수: "bg-amber-100 text-amber-700",
  수리중: "bg-blue-100 text-blue-700",
  완료: "bg-emerald-100 text-emerald-700",
};

export const WARRANTY_STYLE: Record<string, string> = {
  유효: "bg-emerald-100 text-emerald-700",
  만료: "bg-red-100 text-red-700",
};
