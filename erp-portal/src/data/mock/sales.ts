// SD 트랜잭션 Mock — 견적/수주
import { createStore } from "../../services/store";

export interface DocLine {
  material: string; // material code
  qty: number;
  price: number;
}

export const quotationStore = createStore("sales.quotation", [
  {
    id: "QT-26001", code: "QT-26001", customer: "C-1001", date: "2026-06-22", validTo: "2026-07-22",
    status: "승인", lines: [{ material: "FG-1001", qty: 2000, price: 82000 }] as DocLine[],
  },
  {
    id: "QT-26002", code: "QT-26002", customer: "C-2001", date: "2026-06-28", validTo: "2026-07-28",
    status: "작성", lines: [
      { material: "FG-1002", qty: 500, price: 228000 },
      { material: "FG-1003", qty: 3000, price: 34000 },
    ] as DocLine[],
  },
  {
    id: "QT-26003", code: "QT-26003", customer: "C-1002", date: "2026-07-01", validTo: "2026-08-01",
    status: "작성", lines: [{ material: "FG-1003", qty: 5000, price: 33500 }] as DocLine[],
  },
]);

export const salesOrderStore = createStore("sales.order", [
  {
    id: "SO-26010", code: "SO-26010", customer: "C-1001", orderDate: "2026-06-25", dueDate: "2026-07-15",
    status: "출하예약", lines: [{ material: "FG-1001", qty: 800, price: 82000 }] as DocLine[],
  },
  {
    id: "SO-26011", code: "SO-26011", customer: "C-1002", orderDate: "2026-06-30", dueDate: "2026-07-20",
    status: "등록", lines: [
      { material: "FG-1003", qty: 1500, price: 33500 },
      { material: "FG-1002", qty: 200, price: 228000 },
    ] as DocLine[],
  },
  {
    id: "SO-26012", code: "SO-26012", customer: "C-2002", orderDate: "2026-07-02", dueDate: "2026-08-10",
    status: "등록", lines: [{ material: "FG-1001", qty: 1200, price: 79000 }] as DocLine[],
  },
]);

export const docTotal = (lines: DocLine[]) =>
  lines.reduce((s, l) => s + l.qty * l.price, 0);

// ATP: 현재고 - 미출하 수주 할당량
export function atpQty(materialCode: string, stock: number, orders: any[], excludeId?: string) {
  const allocated = orders
    .filter((o) => o.status !== "출하완료" && o.id !== excludeId)
    .flatMap((o) => o.lines as DocLine[])
    .filter((l) => l.material === materialCode)
    .reduce((s, l) => s + l.qty, 0);
  return stock - allocated;
}
