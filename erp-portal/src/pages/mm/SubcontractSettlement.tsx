// MM-007 외주가공 정산 (Subcontracting Settlement & Inspection) — 외주 협력사 임가공비·원자재 사급 입출고 정산 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SubcontractSettlementItem {
  id: string;
  settlementNo: string;
  vendorName: string; // 외주 협력사 (예: (주)한국정밀가공)
  processName: string; // 외주 임가공 공정 (예: 프레스 표면 도금 외주)
  completedQty: number; // 외주 수량 (EA)
  unitProcessingFee: number; // 단위 임가공비 (원/EA)
  scrapDeductionAmount: number; // 불량/손모 공제액 (KRW)
  netSettlementAmount: number; // 최종 정산 지급액 (KRW)
  settlementMonth: string;
  status: "정산 확정" | "승인 대기";
}

export const subSettlementStore = createStore("mm.sub_settlement", [
  { id: "STL-01", settlementNo: "SUB-2026-0701", vendorName: "(주)한국정밀가공", processName: "청소기 알루미늄 파이프 아노다이징 도금", completedQty: 1000, unitProcessingFee: 8500, scrapDeductionAmount: 150000, netSettlementAmount: 8350000, settlementMonth: "2026-07", status: "정산 확정" },
  { id: "STL-02", settlementNo: "SUB-2026-0702", vendorName: "대성전자SMT", processName: "PCB 기판 실장 표면처리 2차 외주", completedQty: 500, unitProcessingFee: 12000, scrapDeductionAmount: 0, netSettlementAmount: 6000000, settlementMonth: "2026-07", status: "정산 확정" },
]);

export default function SubcontractSettlement() {
  const items = useStore(subSettlementStore) as SubcontractSettlementItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status === statusFilter);

  const totalSettlement = filtered.reduce((acc, i) => acc + i.netSettlementAmount, 0);

  const excel = () =>
    downloadCsv(
      "구매_외주가공_정산_대장.csv",
      ["정산번호", "외주협력사", "임가공공정", "완료수량(EA)", "단위임가공비(원)", "불량공제액(원)", "최종정산금액(원)", "정산월", "상태"],
      filtered.map((i) => [
        i.settlementNo,
        i.vendorName,
        i.processName,
        i.completedQty,
        i.unitProcessingFee,
        i.scrapDeductionAmount,
        i.netSettlementAmount,
        i.settlementMonth,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">02. Materials Management (구매자재)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">외주가공 정산 (MM-007)</h1>
          <span className="text-[11px] text-sub">외주 협력사 공정 임가공비 집계 · 원자재 사급 손모율 및 불량 공제 정산</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 외주 임가공 정산 지급액</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalSettlement / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">월 외주 가공 실적 완료량</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {filtered.reduce((acc, i) => acc + i.completedQty, 0).toLocaleString()} <span className="text-xs font-normal text-ink">EA</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">외주 정산 확정율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "정산 확정"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === st
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 외주정산 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">정산 번호</th>
              <th className="px-3 py-2">외주 협력사명</th>
              <th className="px-3 py-2">외주 임가공 공정명</th>
              <th className="px-3 py-2 text-right">가공 완료량</th>
              <th className="px-3 py-2 text-right">단위 임가공비</th>
              <th className="px-3 py-2 text-right">불량 공제액</th>
              <th className="px-3 py-2 text-right">최종 정산액</th>
              <th className="px-3 py-2">정산월</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">{i.settlementNo}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.vendorName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.processName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.completedQty.toLocaleString()}EA</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.unitProcessingFee.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono text-amber-600">{i.scrapDeductionAmount > 0 ? `-${i.scrapDeductionAmount.toLocaleString()}원` : "0원"}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.netSettlementAmount / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 font-mono text-sub">{i.settlementMonth}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.status}
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
