// PP 생산 Mock — MPS, 작업지시, BOM 다단계 전개(MRP)
import { createStore, Entity } from "../../services/store";

// ── MPS 생산계획 (2026-07, FG별) ─────────────────
export const mpsStore = createStore("production.mps", [
  { id: "MPS-FG-1001", material: "FG-1001", month: "2026-07", forecast: 1500, plan: 2000 },
  { id: "MPS-FG-1002", material: "FG-1002", month: "2026-07", forecast: 600, plan: 800 },
  { id: "MPS-FG-1003", material: "FG-1003", month: "2026-07", forecast: 4000, plan: 5000 },
]);

// 라인 생산능력 (월, EA)
export const CAPACITY = 9000;

// ── 작업지시 (WO) ────────────────────────────────
export const woStore = createStore("production.work-order", [
  { id: "WO-26071", code: "WO-26071", material: "FG-1001", qty: 1000, startDate: "2026-07-01", dueDate: "2026-07-10", status: "진행", good: 0, defect: 0 },
  { id: "WO-26072", code: "WO-26072", material: "SF-2003", qty: 2000, startDate: "2026-07-02", dueDate: "2026-07-08", status: "계획", good: 0, defect: 0 },
  { id: "WO-26070", code: "WO-26070", material: "FG-1003", qty: 2000, startDate: "2026-06-25", dueDate: "2026-07-02", status: "완료", good: 1968, defect: 32 },
]);

// ── BOM 다단계 전개 (MRP 소요량 계산) ────────────
export function explodeBom(material: string, qty: number, boms: Entity[], acc: Record<string, number>) {
  for (const b of boms.filter((x) => x.parent === material)) {
    acc[b.child] = (acc[b.child] ?? 0) + b.qty * qty;
    explodeBom(b.child, b.qty * qty, boms, acc);
  }
}

export const WO_STYLE: Record<string, string> = {
  계획: "bg-amber-100 text-amber-700",
  진행: "bg-blue-100 text-blue-700",
  완료: "bg-emerald-100 text-emerald-700",
};
