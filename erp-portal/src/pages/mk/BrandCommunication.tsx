// MK-009 브랜드커뮤니케이션 (Brand Communication & Media Analytics) — 소셜 미디어 브랜드 평판 및 디지털 마케팅 감성 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface BrandCommItem {
  id: string;
  campaignCode: string;
  mediaChannel: string; // 미디어 채널 (예: YouTube 테크 리뷰, Instagram 숏폼, Naver 블로그)
  brandTopic: string; // 캠페인 주제 (예: AI 로봇청소기 V12 성능 비교 리뷰)
  totalViewsCount: number; // 총 조회수 / 노출 수
  positiveSentimentPct: number; // 긍정 반응 비율 (%)
  negativeSentimentPct: number; // 부정 반응 비율 (%)
  engagementScore: number; // 바이럴 참여 지수 (좋아요/댓글 수)
  status: "집행중 (Active)" | "캠페인 종료";
}

export const brandCommStore = createStore("mk.brand_comm", [
  { id: "BRD-01", campaignCode: "CAM-2026-YT01", mediaChannel: "YouTube IT테크 채널", brandTopic: "차세대 로봇청소기 AI-V12 흡입력 & 장애물 회피 테스트", totalViewsCount: 450000, positiveSentimentPct: 91.5, negativeSentimentPct: 8.5, engagementScore: 18500, status: "집행중 (Active)" },
  { id: "BRD-02", campaignCode: "CAM-2026-IG02", mediaChannel: "Instagram 인플루언서 릴스", brandTopic: "UV 살균 공기청정기 인테리어 매칭 체험단", totalViewsCount: 280000, positiveSentimentPct: 94.0, negativeSentimentPct: 6.0, engagementScore: 12400, status: "집행중 (Active)" },
]);

export default function BrandCommunication() {
  const items = useStore(brandCommStore) as BrandCommItem[];
  const [channelFilter, setChannelFilter] = useState("전체");

  const filtered = items.filter((i) => channelFilter === "전체" || i.mediaChannel.includes(channelFilter));

  const totalViews = filtered.reduce((acc, i) => acc + i.totalViewsCount, 0);

  const excel = () =>
    downloadCsv(
      "마케팅_브랜드커뮤니케이션_미디어분석_대장.csv",
      ["캠페인코드", "미디어채널", "브랜드주제", "총조회수", "긍정반응(%)", "부정반응(%)", "참여지수", "상태"],
      filtered.map((i) => [
        i.campaignCode,
        i.mediaChannel,
        i.brandTopic,
        i.totalViewsCount,
        `${i.positiveSentimentPct}%`,
        `${i.negativeSentimentPct}%`,
        i.engagementScore,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">12. Marketing Management (마케팅)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">브랜드커뮤니케이션 (MK-009)</h1>
          <span className="text-[11px] text-sub">소셜 미디어 디지털 캠페인 노출 수 · 브랜드 긍정/부정 감성 반응 및 바이럴 지수</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 디지털 캠페인 노출 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalViews / 10000).toFixed(0)} <span className="text-xs font-normal text-ink">만회</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 긍정 반응 비율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.positiveSentimentPct, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">누적 소셜 바이럴 참여 수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {filtered.reduce((acc, i) => acc + i.engagementScore, 0).toLocaleString()} <span className="text-xs font-normal text-ink">건</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">채널:</span>
          {["전체", "YouTube", "Instagram"].map((ch) => (
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
          📥 브랜드커뮤니케이션 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">캠페인 코드</th>
              <th className="px-3 py-2">미디어 채널</th>
              <th className="px-3 py-2">브랜드 캠페인 주제</th>
              <th className="px-3 py-2 text-right">총 노출/조회수</th>
              <th className="px-3 py-2 text-right">긍정 감성 비율</th>
              <th className="px-3 py-2 text-right">부정 비율</th>
              <th className="px-3 py-2 text-right">바이럴 참여 지수</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.campaignCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.mediaChannel}</td>
                <td className="px-3 py-2 text-ink font-semibold text-[11px]">{i.brandTopic}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.totalViewsCount.toLocaleString()}회</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.positiveSentimentPct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-red-500 font-bold">{i.negativeSentimentPct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-purple-600 font-bold">{i.engagementScore.toLocaleString()}</td>
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
