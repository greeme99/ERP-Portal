// LE 물류 Mock — LOT, 재고 트랜잭션
import { createStore } from "../../services/store";

let lotSeq = 20;
export const newLotCode = () => {
  const persistedMax = lotStore.getAll().reduce((max, lot) => {
    const match = /^LOT-2607-(\d+)$/.exec(String(lot.code ?? lot.id));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  lotSeq = Math.max(lotSeq, persistedMax);
  return `LOT-2607-${String(++lotSeq).padStart(3, "0")}`;
};

// ── LOT 마스터 ──────────────────────────────────
export const lotStore = createStore("logistics.lot", [
  { id: "LOT-2606-001", code: "LOT-2606-001", material: "RM-3001", qty: 280000, wh: "WH-102", vendor: "V-1001", date: "2026-06-10", status: "가용" },
  { id: "LOT-2606-002", code: "LOT-2606-002", material: "RM-3001", qty: 200000, wh: "WH-102", vendor: "V-1001", date: "2026-06-24", status: "가용" },
  { id: "LOT-2606-003", code: "LOT-2606-003", material: "RM-3002", qty: 5200, wh: "WH-102", vendor: "V-1002", date: "2026-06-18", status: "가용" },
  { id: "LOT-2606-004", code: "LOT-2606-004", material: "RM-3003", qty: 610, wh: "WH-102", vendor: "V-2001", date: "2026-06-28", status: "가용" },
  { id: "LOT-2606-005", code: "LOT-2606-005", material: "FG-1001", qty: 1240, wh: "WH-101", vendor: "-", date: "2026-06-30", status: "가용" },
  { id: "LOT-2606-006", code: "LOT-2606-006", material: "FG-1003", qty: 2150, wh: "WH-101", vendor: "-", date: "2026-06-29", status: "가용" },
  { id: "LOT-2605-009", code: "LOT-2605-009", material: "RM-3004", qty: 0, wh: "WH-102", vendor: "V-1002", date: "2026-05-30", status: "소진" },
]);

// ── 재고 트랜잭션 이력 ───────────────────────────
export const txStore = createStore("logistics.transaction", [
  { id: "TX-1001", type: "입고", material: "RM-3003", qty: 800, from: "V-2001", to: "WH-102", lot: "LOT-2606-004", date: "2026-06-28", ref: "PO-26053" },
  { id: "TX-1002", type: "출고", material: "FG-1001", qty: 800, from: "WH-101", to: "C-1001", lot: "LOT-2606-005", date: "2026-07-01", ref: "SO-26010" },
  { id: "TX-1003", type: "이동", material: "FG-1003", qty: 500, from: "WH-101", to: "WH-201", lot: "LOT-2606-006", date: "2026-07-02", ref: "-" },
]);

export const TX_STYLE: Record<string, string> = {
  입고: "bg-emerald-100 text-emerald-700",
  출고: "bg-blue-100 text-blue-700",
  이동: "bg-amber-100 text-amber-700",
};
