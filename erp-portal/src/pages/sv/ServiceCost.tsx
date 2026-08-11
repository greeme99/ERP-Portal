// SV-006 서비스 비용관리 — AS 무상/유상 서비스 부품비·기술료·출장비 정산 및 서비스 손익 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ServiceCostRecord {
  id: string;
  asNo: string; // AS 접수번호
  customerName: string;
  materialName: string;
  warrantyType: "무상보증" | "유상서비스";
  partCost: number; // 부품비
  laborCost: number; // 기술료/인건비
  travelCost: number; // 출장비
  totalCost: number; // 총 서비스비용
  status: "정산완료" | "정산대기" | "청구완료";
  servicedAt: string;
}

export const serviceCostStore = createStore("sv.cost", [
  { id: "SVC-01", asNo: "AS-2026-012", customerName: "김철수 (개인)", materialName: "소형가전 무선청소기 FG-1001", warrantyType: "무상보증", partCost: 25000, laborCost: 15000, travelCost: 0, totalCost: 40000, status: "정산완료", servicedAt: "2026-07-20" },
  { id: "SVC-02", asNo: "AS-2026-018", customerName: "(주)한빛상사", materialName: "스마트 무선 로봇청소기 FG-1002", warrantyType: "유상서비스", partCost: 85000, laborCost: 30000, travelCost: 20000, totalCost: 135000, status: "청구완료", servicedAt: "2026-07-25" },
  { id: "SVC-03", asNo: "AS-2026-025", customerName: "이영희 (개인)", materialName: "소형가전 무선청소기 FG-1001", warrantyType: "무상보증", partCost: 18000, laborCost: 15000, travelCost: 0, totalCost: 33000, status: "정산완료", servicedAt: "2026-08-01" },
  { id: "SVC-04", asNo: "AS-2026-031", customerName: "대우물류(주)", materialName: "스마트 공기청정기 FG-2002", warrantyType: "유상서비스", partCost: 120000, laborCost: 40000, travelCost: 30000, totalCost: 190000, status: "정산대기", servicedAt: "2026-08-04" },
]);

export default function ServiceCost() {
  const records = useStore(serviceCostStore) as ServiceCostRecord[];
  const [warrantyFilter, setWarrantyFilter] = useState("전체");

  const filtered = records.filter((r) => warrantyFilter === "전체" || r.warrantyType === warrantyFilter);

  const totalCostSum = filtered.reduce((acc, r) => acc + r.totalCost, 0);
  const paidServiceRevenue = filtered.filter((r) => r.warrantyType === "유상서비스").reduce((acc, r) => acc + r.totalCost, 0);

  const excel = () =>
    downloadCsv(
      "서비스_비용정산_대장.csv",
      ["AS접수번호", "고객명", "제품명", "보증구분", "부품비(원)", "기술료(원)", "출장비(원)", "총비용(원)", "상태", "처리일자"],
      filtered.map((r) => [
        r.asNo,
        r.customerName,
        r.materialName,
        r.warrantyType,
        r.partCost,
        r.laborCost,
        r.travelCost,
        r.totalCost,
        r.status,
        r.servicedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. Service Management (서비스)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">서비스 비용관리 (SV-006)</h1>
          <span className="text-[11px] text-sub">AS 부품비 · 기술료 · 출장비 정산 및 무상/유상 손익 분석</span>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 서비스 발생 비용</div>
          <div className="text-xl font-bold mt-1 font-mono">{totalCostSum.toLocaleString()} <span className="text-xs font-normal">원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">유상 서비스 청구 매출</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{paidServiceRevenue.toLocaleString()} <span className="text-xs font-normal text-ink">원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">무상 보증 비율</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">
            {((records.filter((r) => r.warrantyType === "무상보증").length / records.length) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">보증 구분:</span>
          {["전체", "무상보증", "유상서비스"].map((w) => (
            <button
              key={w}
              onClick={() => setWarrantyFilter(w)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                warrantyFilter === w
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 서비스비용 대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">AS 접수번호</th>
              <th className="px-3 py-2">고객명</th>
              <th className="px-3 py-2">제품명</th>
              <th className="px-3 py-2">보증 구분</th>
              <th className="px-3 py-2 text-right">부품비</th>
              <th className="px-3 py-2 text-right">기술료</th>
              <th className="px-3 py-2 text-right">출장비</th>
              <th className="px-3 py-2 text-right">총 서비스비용</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">처리일자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{r.asNo}</td>
                <td className="px-3 py-2">{r.customerName}</td>
                <td className="px-3 py-2 text-sub">{r.materialName}</td>
                <td className="px-3 py-2 font-bold">
                  <span className={r.warrantyType === "무상보증" ? "text-amber-600" : "text-emerald-600"}>
                    {r.warrantyType}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono">{r.partCost.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono">{r.laborCost.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono">{r.travelCost.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{r.totalCost.toLocaleString()}원</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.status === "정산완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{r.servicedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
