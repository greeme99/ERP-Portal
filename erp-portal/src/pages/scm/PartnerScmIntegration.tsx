// SCM-004 협력사 SCM (Partner SCM Integration) — 주요 자재·부품 협력사 납기 동기화 및 공급망 OTD·리드타임 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface PartnerScmItem {
  id: string;
  vendorCode: string;
  vendorName: string;
  suppliedMaterial: string; // 주요 공급 자재 (예: BLDC 무선 모터, 메인 PCB 기판)
  leadTimeDays: number; // 발주 납품 리스크 리드타임 (일)
  otdRatePct: number; // 적시 정기 납품률 OTD (%)
  safetyStockQty: number; // 협력사 권장 적정 안전재고 (EA)
  riskLevel: "안정" | "주의 (관심)" | "공급 경보";
}

export const partnerScmStore = createStore("scm.partner_scm", [
  { id: "PSCM-01", vendorCode: "VND-1001", vendorName: "(주)한성모터스", suppliedMaterial: "BLDC 초고속 무선 모터 SF-2001", leadTimeDays: 7, otdRatePct: 98.5, safetyStockQty: 2000, riskLevel: "안정" },
  { id: "PSCM-02", vendorCode: "VND-1002", vendorName: "대성전자", suppliedMaterial: "메인 제어 PCB 기판 마이크로 칩셋", leadTimeDays: 14, otdRatePct: 92.0, safetyStockQty: 5000, riskLevel: "주의 (관심)" },
  { id: "PSCM-03", vendorCode: "VND-1003", vendorName: "삼우배터리", suppliedMaterial: "고용량 리튬이온 배터리 셀 팩", leadTimeDays: 10, otdRatePct: 96.0, safetyStockQty: 3000, riskLevel: "안정" },
]);

export default function PartnerScmIntegration() {
  const items = useStore(partnerScmStore) as PartnerScmItem[];
  const [riskFilter, setRiskFilter] = useState("전체");

  const filtered = items.filter((i) => riskFilter === "전체" || i.riskLevel === riskFilter);

  const avgOtd = filtered.reduce((acc, i) => acc + i.otdRatePct, 0) / (filtered.length || 1);

  const excel = () =>
    downloadCsv(
      "SCM_협력사_공급망_연동_대장.csv",
      ["협력사코드", "협력사명", "주요공급자재", "리드타임(일)", "OTD납품률(%)", "안전재고수량(EA)", "공급리스크수준"],
      filtered.map((i) => [
        i.vendorCode,
        i.vendorName,
        i.suppliedMaterial,
        i.leadTimeDays,
        `${i.otdRatePct.toFixed(1)}%`,
        i.safetyStockQty,
        i.riskLevel,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. Supply Chain (공급망관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">협력사 SCM (SCM-004)</h1>
          <span className="text-[11px] text-sub">주요 부품 협력사 공급망 리드타임 동기화 · OTD 납품 이행률 및 적정 안전재고 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">협력사 평균 OTD 납품 이행률</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{avgOtd.toFixed(1)}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">연동 핵심 자재 협력사 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개사</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">평균 조달 리드타임</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.leadTimeDays, 0) / (filtered.length || 1)).toFixed(1)} <span className="text-xs font-normal text-ink">일</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">공급 리스크:</span>
          {["전체", "안정", "주의 (관심)"].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                riskFilter === r
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 협력사 SCM Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">협력사 코드 / 명</th>
              <th className="px-3 py-2">주요 공급 부품자재</th>
              <th className="px-3 py-2 text-right">조달 리드타임</th>
              <th className="px-3 py-2 text-right">OTD 납품 이행률</th>
              <th className="px-3 py-2 text-right">권장 안전재고</th>
              <th className="px-3 py-2">공급 리스크 수준</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.vendorCode} — {i.vendorName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.suppliedMaterial}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.leadTimeDays}일</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.otdRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.safetyStockQty.toLocaleString()}EA</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.riskLevel === "주의 (관심)" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {i.riskLevel}
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
