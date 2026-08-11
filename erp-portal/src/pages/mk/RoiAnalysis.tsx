// MK-008 ROI 분석 — 마케팅 캠페인별 투입 예산·리드 수·전환 매출액 및 ROI / CAC 실시간 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CampaignRoi {
  id: string;
  campaignCode: string;
  campaignName: string;
  channel: "온라인/SNS" | "전시회/박람회" | "신문/방송" | "검색광고";
  spentBudget: number; // 집행 예산 (KRW)
  leadsCount: number; // 창출 리드 수
  convertedDeals: number; // 전환 수주 건수
  generatedRevenue: number; // 신규 매출 (KRW)
  status: "진행중" | "종료";
}

export const roiAnalysisStore = createStore("mk.roi", [
  { id: "ROI-01", campaignCode: "CMP-2026-01", campaignName: "2026 소형가전 신제품 런칭 릴스/쇼츠", channel: "온라인/SNS", spentBudget: 15000000, leadsCount: 450, convertedDeals: 38, generatedRevenue: 85000000, status: "종료" },
  { id: "ROI-02", campaignCode: "CMP-2026-02", campaignName: "제24회 서울 국제 스마트가전 박람회", channel: "전시회/박람회", spentBudget: 35000000, leadsCount: 220, convertedDeals: 15, generatedRevenue: 120000000, status: "종료" },
  { id: "ROI-03", campaignCode: "CMP-2026-03", campaignName: "네이버/구글 상단 키워드 검색광고", channel: "검색광고", spentBudget: 8000000, leadsCount: 310, convertedDeals: 24, generatedRevenue: 42000000, status: "진행중" },
  { id: "ROI-04", campaignCode: "CMP-2026-04", campaignName: "B2B 제조사 대상 하반기 브랜드 홍보", channel: "신문/방송", spentBudget: 20000000, leadsCount: 95, convertedDeals: 8, generatedRevenue: 65000000, status: "진행중" },
]);

export default function RoiAnalysis() {
  const campaigns = useStore(roiAnalysisStore) as CampaignRoi[];
  const [channelFilter, setChannelFilter] = useState("전체");

  const filtered = campaigns.filter((c) => channelFilter === "전체" || c.channel === channelFilter);

  const totalSpent = filtered.reduce((acc, c) => acc + c.spentBudget, 0);
  const totalRevenue = filtered.reduce((acc, c) => acc + c.generatedRevenue, 0);
  const totalLeads = filtered.reduce((acc, c) => acc + c.leadsCount, 0);
  const avgRoi = totalSpent > 0 ? (((totalRevenue - totalSpent) / totalSpent) * 100).toFixed(1) : "0.0";
  const avgCac = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0;

  const excel = () =>
    downloadCsv(
      "마케팅_캠페인_ROI_분석.csv",
      ["캠페인코드", "캠페인명", "채널", "집행예산(원)", "리드수", "전환건수", "창출매출(원)", "ROI(%)", "CAC(원/리드)", "상태"],
      filtered.map((c) => {
        const roi = c.spentBudget > 0 ? (((c.generatedRevenue - c.spentBudget) / c.spentBudget) * 100).toFixed(1) : "0";
        const cac = c.leadsCount > 0 ? Math.round(c.spentBudget / c.leadsCount) : 0;
        return [
          c.campaignCode,
          c.campaignName,
          c.channel,
          c.spentBudget,
          c.leadsCount,
          c.convertedDeals,
          c.generatedRevenue,
          `${roi}%`,
          cac,
          c.status,
        ];
      })
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. Marketing Management (마케팅)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">ROI 분석 (MK-008)</h1>
          <span className="text-[11px] text-sub">마케팅 캠페인별 투입 예산 · 리드 전환율 · ROI / CAC 실시간 성과</span>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 마케팅 집행 예산</div>
          <div className="text-xl font-bold mt-1 font-mono">{(totalSpent / 10000).toLocaleString()} <span className="text-xs font-normal">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">창출 신규 매출액</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{(totalRevenue / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 마케팅 ROI</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">+{avgRoi}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">평균 CAC (리드획득비용)</div>
          <div className="text-xl font-bold mt-1 font-mono">{avgCac.toLocaleString()} <span className="text-xs font-normal">원</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">채널 필터:</span>
          {["전체", "온라인/SNS", "전시회/박람회", "검색광고", "신문/방송"].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                channelFilter === ch
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 마케팅 ROI Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">캠페인 코드 / 명</th>
              <th className="px-3 py-2">채널</th>
              <th className="px-3 py-2 text-right">집행 예산</th>
              <th className="px-3 py-2 text-right">리드 수</th>
              <th className="px-3 py-2 text-right">전환 건수</th>
              <th className="px-3 py-2 text-right">창출 매출</th>
              <th className="px-3 py-2 text-right">마케팅 ROI</th>
              <th className="px-3 py-2 text-right">CAC (원/리드)</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const roi = c.spentBudget > 0 ? (((c.generatedRevenue - c.spentBudget) / c.spentBudget) * 100).toFixed(1) : "0.0";
              const cac = c.leadsCount > 0 ? Math.round(c.spentBudget / c.leadsCount) : 0;
              return (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-medium">{c.campaignCode} — {c.campaignName}</td>
                  <td className="px-3 py-2 text-sub">{c.channel}</td>
                  <td className="px-3 py-2 text-right font-mono">{c.spentBudget.toLocaleString()}원</td>
                  <td className="px-3 py-2 text-right font-mono font-medium">{c.leadsCount}건</td>
                  <td className="px-3 py-2 text-right font-mono text-sub">{c.convertedDeals}건</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">{c.generatedRevenue.toLocaleString()}원</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">+{roi}%</td>
                  <td className="px-3 py-2 text-right font-mono text-sub">{cac.toLocaleString()}원</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === "진행중" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
