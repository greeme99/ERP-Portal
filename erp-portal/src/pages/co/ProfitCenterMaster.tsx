// CO-003 손익센터마스터 (Profit Center Master) — 사업부별 독자 손익(매출·원가·영업이익) 집계 손익센터 마스터
import { useState } from "react";
import { useStore, createStore, nextId } from "../../services/store";
import MassUpdateBar, { MassColumn } from "../../components/common/MassUpdateBar";

export interface ProfitCenterItem {
  id: string;
  profitCenterCode: string;
  profitCenterName: string;
  businessUnit: string; // 사업부명 (예: 프리미엄 소형가전 사업부, 로봇청소기 사업부)
  buHeadName: string; // 사업부장 성명
  targetSalesAmount: number; // 사업부 연간 매출 목표 (KRW)
  targetMarginRatePct: number; // 목표 영업이익률 (%)
  status: "운영중" | "신설예정";
}

export const profitCenterStore = createStore("co.profit_center", [
  { id: "PC-01", profitCenterCode: "PC-100", profitCenterName: "소형가전 무선청소기 사업부 PC", businessUnit: "소형가전 사업본부", buHeadName: "정사업 전무", targetSalesAmount: 15000000000, targetMarginRatePct: 15.0, status: "운영중" },
  { id: "PC-02", profitCenterCode: "PC-200", profitCenterName: "스마트 로봇청소기 사업부 PC", businessUnit: "로봇가전 사업본부", buHeadName: "최로봇 상무", targetSalesAmount: 8500000000, targetMarginRatePct: 18.5, status: "운영중" },
  { id: "PC-03", profitCenterCode: "PC-300", profitCenterName: "전자기판 모듈 부품 사업부 PC", businessUnit: "전자부품 사업본부", buHeadName: "강부품 이사", targetSalesAmount: 4200000000, targetMarginRatePct: 12.0, status: "운영중" },
]);

export default function ProfitCenterMaster() {
  const items = useStore(profitCenterStore) as ProfitCenterItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status === statusFilter);

  const totalSalesTarget = filtered.reduce((acc, i) => acc + i.targetSalesAmount, 0);

  // 기준정보 일괄 다운로드/업로드 컬럼
  const massColumns: MassColumn[] = [
    { key: "profitCenterCode", label: "손익센터코드", required: true },
    { key: "profitCenterName", label: "손익센터명", required: true },
    { key: "businessUnit", label: "사업부명" },
    { key: "buHeadName", label: "사업부장" },
    { key: "targetSalesAmount", label: "목표매출(원)", type: "number" },
    { key: "targetMarginRatePct", label: "목표영업이익률(%)", type: "number" },
    { key: "status", label: "상태", type: "select", options: ["운영중", "신설예정"] },
  ];

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">09. Controlling (관리회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">손익센터마스터 (CO-003)</h1>
          <span className="text-[11px] text-sub">사업부 단위 독자 손익(매출 · 매출원가 · 영업이익) 집계 손익센터(Profit Center) 마스터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 총 손익센터 매출 목표</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalSalesTarget / 100000000).toFixed(0)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 목표 영업이익률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(items.reduce((acc, i) => acc + i.targetMarginRatePct, 0) / (items.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">운영 손익센터 개수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개소</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "운영중"].map((st) => (
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
        <div className="flex gap-1">
          <MassUpdateBar
            title="손익센터"
            filename="관리회계_손익센터_마스터.csv"
            store={profitCenterStore}
            rows={filtered}
            columns={massColumns}
            newRow={() => ({ id: nextId("PC"), profitCenterCode: "", profitCenterName: "", businessUnit: "", buHeadName: "", targetSalesAmount: 0, targetMarginRatePct: 0, status: "운영중" })}
          />
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">손익센터 코드 / 명</th>
              <th className="px-3 py-2">소속 사업본부</th>
              <th className="px-3 py-2">사업부장 성명</th>
              <th className="px-3 py-2 text-right">사업부 매출 목표액</th>
              <th className="px-3 py-2 text-right">목표 영업이익률</th>
              <th className="px-3 py-2">운영 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.profitCenterCode} — {i.profitCenterName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.businessUnit}</td>
                <td className="px-3 py-2 text-ink font-semibold">{i.buHeadName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.targetSalesAmount / 100000000).toFixed(0)}억원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.targetMarginRatePct.toFixed(1)}%</td>
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
