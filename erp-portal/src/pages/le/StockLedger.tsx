// LE-003 수불관리 (Stock Ledger) — 창고/품목별 기초재고·당월입고·당월출고·기말재고 수불 이력 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface StockLedgerItem {
  id: string;
  txCode: string;
  txDate: string;
  txType: "구매입고" | "생산출고" | "완성품입고" | "매출출고" | "재고이동";
  warehouseName: string;
  materialCode: string;
  materialName: string;
  lotNo: string;
  qty: number; // 수불 수량 (입고 +, 출고 -)
  unit: string;
  handledBy: string;
}

export const stockLedgerStore = createStore("le.stock_ledger", [
  { id: "TX-01", txCode: "TX-2026-0701", txDate: "2026-07-25 14:00", txType: "구매입고", warehouseName: "원자재 창고 A", materialCode: "RM-3004", materialName: "전자 락 스위치 250V", lotNo: "LOT-2607-021", qty: 5900, unit: "EA", handledBy: "이물류 대리" },
  { id: "TX-02", txCode: "TX-2026-0702", txDate: "2026-07-26 09:30", txType: "생산출고", warehouseName: "원자재 창고 A", materialCode: "SF-2001", materialName: "전자기판 모듈", lotNo: "LOT-2607-011", qty: -500, unit: "EA", handledBy: "김생산 과장" },
  { id: "TX-03", txCode: "TX-2026-0703", txDate: "2026-07-26 17:00", txType: "완성품입고", warehouseName: "제품 창고 B", materialCode: "FG-1001", materialName: "소형가전 무선청소기", lotNo: "LOT-FG-2607-99", qty: 490, unit: "EA", handledBy: "김생산 과장" },
  { id: "TX-04", txCode: "TX-2026-0704", txDate: "2026-07-27 11:15", txType: "매출출고", warehouseName: "제품 창고 B", materialCode: "FG-1001", materialName: "소형가전 무선청소기", lotNo: "LOT-FG-2607-99", qty: -400, unit: "EA", handledBy: "박출하 주임" },
]);

export default function StockLedger() {
  const items = useStore(stockLedgerStore) as StockLedgerItem[];
  const [typeFilter, setTypeFilter] = useState("전체");

  const filtered = items.filter((i) => typeFilter === "전체" || i.txType === typeFilter);

  const totalIn = filtered.filter((i) => i.qty > 0).reduce((acc, i) => acc + i.qty, 0);
  const totalOut = filtered.filter((i) => i.qty < 0).reduce((acc, i) => acc + Math.abs(i.qty), 0);

  const excel = () =>
    downloadCsv(
      "물류_창고_수불관리_대장.csv",
      ["수불코드", "수불일시", "수불구분", "창고명", "품목코드", "품목명", "LOT번호", "수불수량", "단위", "담당자"],
      filtered.map((i) => [
        i.txCode,
        i.txDate,
        i.txType,
        i.warehouseName,
        i.materialCode,
        i.materialName,
        i.lotNo,
        i.qty,
        i.unit,
        i.handledBy,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">04. Logistics Execution (물류실행)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">수불관리 (LE-003)</h1>
          <span className="text-[11px] text-sub">창고/품목/LOT별 기초 · 입고 · 출고 · 기말 실재고 수불 이력 실시간 조치</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">총 당월 입고 수량</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">+{totalIn.toLocaleString()} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">총 당월 출고 수량</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">-{totalOut.toLocaleString()} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">순 재고 변동량</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{(totalIn - totalOut).toLocaleString()} <span className="text-xs font-normal text-ink">EA</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">수불구분:</span>
          {["전체", "구매입고", "생산출고", "완성품입고", "매출출고"].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                typeFilter === tp
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 수불대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">수불 코드 / 일시</th>
              <th className="px-3 py-2">수불 구분</th>
              <th className="px-3 py-2">창고명</th>
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2">LOT 번호</th>
              <th className="px-3 py-2 text-right">수불 수량</th>
              <th className="px-3 py-2">담당자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">
                  <div className="font-bold">{i.txCode}</div>
                  <div className="text-[11px] text-sub">{i.txDate}</div>
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.txType.includes("입고") ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {i.txType}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium">{i.warehouseName}</td>
                <td className="px-3 py-2 text-sub">{i.materialCode} — {i.materialName}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.lotNo}</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.qty > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {i.qty > 0 ? `+${i.qty.toLocaleString()}` : i.qty.toLocaleString()} {i.unit}
                </td>
                <td className="px-3 py-2 text-sub">{i.handledBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
