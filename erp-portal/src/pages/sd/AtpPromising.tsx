// SD-014 납기약속 (Available To Promise & Order Promising) — 실시간 출하가능재고(ATP) 계산 및 수주 납기 자동 약속 시뮬레이션
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface AtpPromisingItem {
  id: string;
  materialCode: string;
  materialName: string;
  onHandStock: number; // 현재 창고 실재고 (EA)
  reservedStock: number; // 기존 수주 할당 예약재고 (EA)
  expectedProdQty: number; // 금주 생산 입고 예정량 (EA)
  availableAtpQty: number; // 출하 가용 재고 (ATP) = OnHand - Reserved + Expected
  requestedOrderQty: number; // 신규 요청 수주 수량
  promisedDeliveryDate: string; // 납기 확정 약속일
  atpFeasibility: "즉시 출하 가능" | "생산 후 출하" | "재고 부족";
}

export const atpPromisingStore = createStore("sd.atp_promising", [
  { id: "ATP-01", materialCode: "FG-1001", materialName: "소형가전 무선청소기", onHandStock: 1730, reservedStock: 2000, expectedProdQty: 500, availableAtpQty: 230, requestedOrderQty: 200, promisedDeliveryDate: "2026-08-08", atpFeasibility: "즉시 출하 가능" },
  { id: "ATP-02", materialCode: "FG-1002", materialName: "스마트 무선 로봇청소기", onHandStock: 450, reservedStock: 300, expectedProdQty: 200, availableAtpQty: 350, requestedOrderQty: 300, promisedDeliveryDate: "2026-08-12", atpFeasibility: "즉시 출하 가능" },
  { id: "ATP-03", materialCode: "SF-2001", materialName: "전자기판 모듈", onHandStock: 360, reservedStock: 500, expectedProdQty: 1000, availableAtpQty: 860, requestedOrderQty: 1000, promisedDeliveryDate: "2026-08-18", atpFeasibility: "생산 후 출하" },
]);

export default function AtpPromising() {
  const items = useStore(atpPromisingStore) as AtpPromisingItem[];
  const [feasibilityFilter, setFeasibilityFilter] = useState("전체");

  const filtered = items.filter((i) => feasibilityFilter === "전체" || i.atpFeasibility === feasibilityFilter);

  const excel = () =>
    downloadCsv(
      "영업_ATP_가용재고_납기약속_대장.csv",
      ["품목코드", "품목명", "실재고", "예약재고", "생산예정", "가용ATP재고", "요청수량", "약속납기일", "ATP판정"],
      filtered.map((i) => [
        i.materialCode,
        i.materialName,
        i.onHandStock,
        i.reservedStock,
        i.expectedProdQty,
        i.availableAtpQty,
        i.requestedOrderQty,
        i.promisedDeliveryDate,
        i.atpFeasibility,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">납기약속 (SD-014)</h1>
          <span className="text-[11px] text-sub">실시간 가용재고(ATP) 및 생산 예정량 연동 신규 수주 납기확정(Promising) 엔진</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">즉시 출하 가능 수주 건수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">
            {items.filter((i) => i.atpFeasibility === "즉시 출하 가능").length} <span className="text-xs font-normal text-ink">건</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">생산 입고 후 연동 출하</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {items.filter((i) => i.atpFeasibility === "생산 후 출하").length} <span className="text-xs font-normal text-ink">건</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">평균 약속 리드타임</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">3.5 <span className="text-xs font-normal text-ink">일 이내</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">판정:</span>
          {["전체", "즉시 출하 가능", "생산 후 출하"].map((f) => (
            <button
              key={f}
              onClick={() => setFeasibilityFilter(f)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                feasibilityFilter === f
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 ATP납기약속 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">품목 코드 / 품목명</th>
              <th className="px-3 py-2 text-right">창고 실재고</th>
              <th className="px-3 py-2 text-right">수주 할당재고</th>
              <th className="px-3 py-2 text-right">생산 입고예정</th>
              <th className="px-3 py-2 text-right">출하 가용 ATP</th>
              <th className="px-3 py-2 text-right">신규 요청 수량</th>
              <th className="px-3 py-2">약속 납기일</th>
              <th className="px-3 py-2">ATP 판정</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.materialCode} — {i.materialName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.onHandStock.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.reservedStock.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-medium text-blue-600">+{i.expectedProdQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.availableAtpQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-ink">{i.requestedOrderQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.promisedDeliveryDate}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.atpFeasibility === "즉시 출하 가능" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}>
                    {i.atpFeasibility}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
