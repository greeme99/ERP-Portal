// FI/CO Mock — 전표, 매출채권(AR), 매입채무(AP), 표준원가 롤업
import { createStore, Entity } from "../../services/store";

// ── 전표 (FI-001) ────────────────────────────────
export interface JLine {
  account: string;
  dr: number;
  cr: number;
}

export const journalStore = createStore("finance.journal", [
  {
    id: "JV-26001", code: "JV-26001", date: "2026-07-01", desc: "6월 급여 지급", ref: "-", status: "전기",
    lines: [
      { account: "급여", dr: 185000000, cr: 0 },
      { account: "보통예금", dr: 0, cr: 185000000 },
    ] as JLine[],
  },
  {
    id: "JV-26002", code: "JV-26002", date: "2026-07-02", desc: "공장 임차료", ref: "-", status: "작성",
    lines: [
      { account: "지급임차료", dr: 42000000, cr: 0 },
      { account: "보통예금", dr: 0, cr: 42000000 },
    ] as JLine[],
  },
]);

export const ACCOUNTS = [
  "외상매출금", "제품매출", "원재료", "외상매입금", "보통예금",
  "급여", "지급임차료", "제조경비", "재공품", "제품",
];

// ── 매출채권 AR / 매입채무 AP ────────────────────
export const arStore = createStore("finance.ar", [
  { id: "AR-26001", code: "AR-26001", ref: "SO-25098", customer: "C-1003", amount: 152000000, invoiceDate: "2026-05-20", dueDate: "2026-06-19", status: "미수" },
]);

export const apStore = createStore("finance.ap", [
  { id: "AP-26001", code: "AP-26001", ref: "PO-25087", vendor: "V-1002", amount: 68000000, invoiceDate: "2026-06-01", dueDate: "2026-07-31", status: "미지급" },
]);

// 자금관리 기초 잔액 (Sprint 11)
export const OPENING_CASH = 500000000;
// 운영비 계정 (손익계산서 판관비/자금 출금 집계)
export const OPEX_ACCOUNTS = ["급여", "지급임차료", "제조경비"];

// ── 표준원가 롤업 (CO-001) — Sprint 7 원가 현실화 ─
// 잎(BOM 하위 없음) = 구매단가
// 상위 = (Σ하위 표준원가×소요량 [재료비] + labor [노무비]) × (1+제조간접비율)
export const OVERHEAD_RATE = 0.15;

export function stdCost(material: string, mats: Entity[], boms: Entity[]): number {
  const children = boms.filter((b) => b.parent === material);
  const m = mats.find((x) => x.code === material);
  if (children.length === 0) return m?.price ?? 0;
  const matCost = children.reduce((s, b) => s + stdCost(b.child, mats, boms) * b.qty, 0);
  return (matCost + (m?.labor ?? 0)) * (1 + OVERHEAD_RATE);
}

// 최상위 1단계 원가 구성 분해 (재료비/노무비/간접비)
export function costBreakdown(material: string, mats: Entity[], boms: Entity[]) {
  const children = boms.filter((b) => b.parent === material);
  const m = mats.find((x) => x.code === material);
  const matCost = children.reduce((s, b) => s + stdCost(b.child, mats, boms) * b.qty, 0);
  const labor = m?.labor ?? 0;
  const overhead = (matCost + labor) * OVERHEAD_RATE;
  return { matCost, labor, overhead, total: matCost + labor + overhead };
}

export const jvBalanced = (lines: JLine[]) => {
  const dr = lines.reduce((s, l) => s + l.dr, 0);
  const cr = lines.reduce((s, l) => s + l.cr, 0);
  return { dr, cr, ok: dr === cr && dr > 0 };
};
