// SV-011 무상수리센터분석 (Warranty Repair & Cost Analytics) — 전국 AS 센터별 무상 보증 수리 비율 및 서비스 원가 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface WarrantyRepairCenterItem {
  id: string;
  centerCode: string;
  centerName: string; // AS 센터명 (예: 서울 강남 메가 센터, 부산 서면 센터, 대구 동성로 센터)
  totalRepairsCount: number; // 월 총 수리 처리 건수
  warrantyFreeRepairsCount: number; // 무상 보증 수리 건수
  warrantyFreeRatioPct: number; // 무상 수리 비율 (%)
  warrantyPartsCostAmount: number; // 무상 부품비 발생액 (KRW)
  paidConversionRatePct: number; // 유상 수리 전환율 (%)
  status: "정상 가동" | "품질 원가 점검 필요";
}

export const warrantyCenterStore = createStore("sv.warranty_center", [
  { id: "WRC-01", centerCode: "AS-CTR-01", centerName: "서울 강남 메가 AS센터", totalRepairsCount: 450, warrantyFreeRepairsCount: 315, warrantyFreeRatioPct: 70.0, warrantyPartsCostAmount: 18900000, paidConversionRatePct: 30.0, status: "정상 가동" },
  { id: "WRC-02", centerCode: "AS-CTR-02", centerName: "부산 서면 AS센터", totalRepairsCount: 280, warrantyFreeRepairsCount: 210, warrantyFreeRatioPct: 75.0, warrantyPartsCostAmount: 13500000, paidConversionRatePct: 25.0, status: "정상 가동" },
  { id: "WRC-03", centerCode: "AS-CTR-03", centerName: "대구 동성로 AS센터", totalRepairsCount: 190, warrantyFreeRepairsCount: 155, warrantyFreeRatioPct: 81.5, warrantyPartsCostAmount: 11200000, paidConversionRatePct: 18.5, status: "품질 원가 점검 필요" },
]);

export default function WarrantyRepairAnalytics() {
  const items = useStore(warrantyCenterStore) as WarrantyRepairCenterItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status.includes(statusFilter));

  const totalCost = filtered.reduce((acc, i) => acc + i.warrantyPartsCostAmount, 0);

  const excel = () =>
    downloadCsv(
      "서비스_무상수리_센터별_원가분석_대장.csv",
      ["센터코드", "AS센터명", "총수리건수", "무상수리건수", "무상비율(%)", "무상부품비", "유상전환율(%)", "상태"],
      filtered.map((i) => [
        i.centerCode,
        i.centerName,
        i.totalRepairsCount,
        i.warrantyFreeRepairsCount,
        `${i.warrantyFreeRatioPct}%`,
        i.warrantyPartsCostAmount,
        `${i.paidConversionRatePct}%`,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. Customer Service (고객서비스)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">무상수리센터분석 (SV-011)</h1>
          <span className="text-[11px] text-sub">전국 AS 서비스 센터별 무상 보증 수리 비율 · 서비스 원가 및 유상 전환율 모니터링</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 무상 보증 수리 부품비</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalCost / 10000000).toFixed(1)} <span className="text-xs font-normal text-ink">천만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 무상 수리 비중</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.warrantyFreeRatioPct, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">평균 유상 수리 전환율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.paidConversionRatePct, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "정상", "점검 필요"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === s
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 센터분석 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">AS 센터 코드</th>
              <th className="px-3 py-2">AS 센터명</th>
              <th className="px-3 py-2 text-right">총 수리 건수</th>
              <th className="px-3 py-2 text-right">무상 수리 건수</th>
              <th className="px-3 py-2 text-right">무상 수리 비율</th>
              <th className="px-3 py-2 text-right">발생 무상 부품비</th>
              <th className="px-3 py-2 text-right">유상 전환율</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.centerCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.centerName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.totalRepairsCount.toLocaleString()}건</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.warrantyFreeRepairsCount.toLocaleString()}건</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.warrantyFreeRatioPct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.warrantyPartsCostAmount / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 text-right font-mono text-blue-600 font-bold">{i.paidConversionRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.status.includes("점검") ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
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
