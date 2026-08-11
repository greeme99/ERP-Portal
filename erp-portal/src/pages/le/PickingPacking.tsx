// LE-007 피킹/패킹 (Warehouse Picking & Packing) — 창고 출하 지시별 로케이션 피킹 리스트·바코드 검수 및 포장 패킹 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface PickingPackingItem {
  id: string;
  pickingTaskNo: string;
  soNumber: string;
  customerName: string;
  locationBin: string; // 피킹 랙 로케이션 (예: Zone-A-01-2)
  materialCode: string;
  materialName: string;
  orderedQty: number;
  pickedQty: number; // 피킹 완료 수량
  packingStatus: "피킹 대기" | "피킹 진행중" | "검수/패킹완료";
  workerName: string;
}

export const pickingPackingStore = createStore("le.picking_packing", [
  { id: "PCK-01", pickingTaskNo: "TASK-2026-0801", soNumber: "SO-26078", customerName: "삼성전자 글로벌", locationBin: "WH1-ZONE-FG-A1", materialCode: "FG-1001", materialName: "소형가전 무선청소기", orderedQty: 400, pickedQty: 400, packingStatus: "검수/패킹완료", workerName: "김물류 반장" },
  { id: "PCK-02", pickingTaskNo: "TASK-2026-0802", soNumber: "SO-26079", customerName: "LG전자", locationBin: "WH1-ZONE-FG-B2", materialCode: "FG-1002", materialName: "스마트 무선 로봇청소기", orderedQty: 250, pickedQty: 180, packingStatus: "피킹 진행중", workerName: "이패킹 사원" },
]);

export default function PickingPacking() {
  const items = useStore(pickingPackingStore) as PickingPackingItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.packingStatus === statusFilter);

  const excel = () =>
    downloadCsv(
      "물류_창고_피킹패킹_작업대장.csv",
      ["피킹작업번호", "수주번호", "고객사명", "랙로케이션", "품목코드", "품목명", "지시수량", "피킹수량", "패킹상태", "작업자"],
      filtered.map((i) => [
        i.pickingTaskNo,
        i.soNumber,
        i.customerName,
        i.locationBin,
        i.materialCode,
        i.materialName,
        i.orderedQty,
        i.pickedQty,
        i.packingStatus,
        i.workerName,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">04. Logistics Execution (물류관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">피킹/패킹 (LE-007)</h1>
          <span className="text-[11px] text-sub">창고 출하지시 로케이션 피킹 리스트 · 바코드 오출하 검수 · 패킹(Packing) 포장 처리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 피킹 작업 건수</div>
          <div className="text-xl font-bold mt-1 font-mono">{items.length} <span className="text-xs font-normal">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">검수/패킹 완료 건수</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {items.filter((i) => i.packingStatus === "검수/패킹완료").length} <span className="text-xs font-normal text-ink">건</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">오출하 검수 합격률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "피킹 진행중", "검수/패킹완료"].map((st) => (
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
          📥 피킹패킹 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">피킹 작업번호</th>
              <th className="px-3 py-2">수주번호 / 고객사</th>
              <th className="px-3 py-2">랙 로케이션 (Bin)</th>
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2 text-right">지시 수량</th>
              <th className="px-3 py-2 text-right">피킹 완료량</th>
              <th className="px-3 py-2">패킹 상태</th>
              <th className="px-3 py-2">작업자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">{i.pickingTaskNo}</td>
                <td className="px-3 py-2 font-medium">
                  <div>{i.customerName}</div>
                  <div className="text-[11px] text-sub">{i.soNumber}</div>
                </td>
                <td className="px-3 py-2 font-mono text-purple-600 font-bold">{i.locationBin}</td>
                <td className="px-3 py-2 text-sub">{i.materialCode} — {i.materialName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.orderedQty.toLocaleString()} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.pickedQty.toLocaleString()} EA</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.packingStatus === "검수/패킹완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}>
                    {i.packingStatus}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub">{i.workerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
