// SCM-006 공급위험관리 — 공급사 단일조달·재고커버리지·품질PPM 기반 공급망 리스크 산출 및 대응
import { materialStore, partnerStore, bomStore } from "../../data/mock/master";
import { mpsStore, explodeBom } from "../../data/mock/production";
import { useStore, downloadCsv } from "../../services/store";

export default function RiskManagement() {
  const mats = useStore(materialStore);
  const partners = useStore(partnerStore);
  const boms = useStore(bomStore);
  const mps = useStore(mpsStore);

  // BOM 소요량 산출
  const req: Record<string, number> = {};
  mps.forEach((p) => explodeBom(p.material, p.plan, boms, req));

  const suppliers = partners.filter((p) => p.type === "공급사" || p.type === "협력사");

  const rows = mats
    .filter((m) => m.status === "사용")
    .map((m) => {
      const demand = req[m.code] ?? (m.type === "완제품" ? 1000 : 500);
      const daily = demand / 30;
      const coverageDays = daily > 0 ? m.stock / daily : 999;

      // 해당 품목 주 공급사 매핑
      const primaryVendor = suppliers.find((s) => s.name.includes("전자") || s.name.includes("패키징") || s.name.includes("부품")) ?? suppliers[0];
      const vendorScore = primaryVendor?.creditLimit ? 85 : 80;

      // 리스크 항목 점수화 (0~100)
      const stockRisk = coverageDays < 15 ? 40 : coverageDays < 30 ? 20 : 5;
      const singleSourceRisk = m.type !== "완제품" ? 30 : 10;
      const vendorQualityRisk = vendorScore < 85 ? 30 : 10;

      const totalRiskScore = stockRisk + singleSourceRisk + vendorQualityRisk;
      const riskLevel = totalRiskScore >= 70 ? "HIGH" : totalRiskScore >= 40 ? "MEDIUM" : "LOW";

      const actionGuide = riskLevel === "HIGH"
        ? "안전재고 상향 & 대체 공급사 확보"
        : riskLevel === "MEDIUM"
        ? "재고 모니터링 & 납기 리드타임 관리"
        : "정상 운영";

      return {
        id: m.id,
        code: m.code,
        name: m.name,
        type: m.type,
        stock: m.stock,
        coverageDays: coverageDays === 999 ? "∞" : coverageDays.toFixed(0),
        vendorName: primaryVendor ? primaryVendor.name : "자체 생산",
        vendorScore,
        riskScore: totalRiskScore,
        riskLevel,
        actionGuide,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const highRiskCount = rows.filter((r) => r.riskLevel === "HIGH").length;
  const medRiskCount = rows.filter((r) => r.riskLevel === "MEDIUM").length;

  const excel = () =>
    downloadCsv(
      "공급위험관리_리스크리포트.csv",
      ["품목코드", "품목명", "구분", "현재고", "커버리지(일)", "주공급사", "공급사평점", "위험점수", "위험등급", "대응가이드"],
      rows.map((r) => [
        r.code,
        r.name,
        r.type,
        r.stock,
        r.coverageDays,
        r.vendorName,
        r.vendorScore,
        r.riskScore,
        r.riskLevel,
        r.actionGuide,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">02. SCM (Supply Chain Management)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공급위험관리 (SCM-006)</h1>
          <span className="text-[11px] text-sub">단일조달 · 재고 소진위험 · 공급사 품질 리스크 통합 진단</span>
        </div>
      </div>

      {/* 리스크 스코어 카드 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 진단 품목</div>
          <div className="text-xl font-bold mt-1">{rows.length} <span className="text-xs font-normal">종</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">고위험 (HIGH)</div>
          <div className="text-xl font-bold text-red-500 mt-1">{highRiskCount} <span className="text-xs font-normal text-ink">종</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">중위험 (MEDIUM)</div>
          <div className="text-xl font-bold text-amber-500 mt-1">{medRiskCount} <span className="text-xs font-normal text-ink">종</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">저위험 (LOW)</div>
          <div className="text-xl font-bold text-emerald-500 mt-1">{rows.length - highRiskCount - medRiskCount} <span className="text-xs font-normal text-ink">종</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <span className="text-sub">
          💡 리스크 지수 = 재고 부족 위험(최대 40pt) + 단일조달 위험(최대 30pt) + 공급사 평가 위험(최대 30pt)
        </span>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 Risk Report Download
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2 text-right">현재고</th>
              <th className="px-3 py-2 text-right">커버리지</th>
              <th className="px-3 py-2">주 공급사</th>
              <th className="px-3 py-2 text-right">공급사 평점</th>
              <th className="px-3 py-2 text-right">위험 점수</th>
              <th className="px-3 py-2">위험 등급</th>
              <th className="px-3 py-2">대응 가이드</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{r.code} — {r.name}</td>
                <td className="px-3 py-2 text-sub">{r.type}</td>
                <td className="px-3 py-2 text-right font-mono">{r.stock.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono">{r.coverageDays}{r.coverageDays !== "∞" && "일"}</td>
                <td className="px-3 py-2">{r.vendorName}</td>
                <td className="px-3 py-2 text-right font-mono">{r.vendorScore}점</td>
                <td className="px-3 py-2 text-right font-bold font-mono">{r.riskScore}</td>
                <td className="px-3 py-2">
                  {r.riskLevel === "HIGH" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                      HIGH
                    </span>
                  )}
                  {r.riskLevel === "MEDIUM" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                      MEDIUM
                    </span>
                  )}
                  {r.riskLevel === "LOW" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      LOW
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-sub">{r.actionGuide}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
