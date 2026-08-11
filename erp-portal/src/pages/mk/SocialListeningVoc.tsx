// MK-010 소셜리스닝VOC (Social Listening & VOC Sentiment Mining) — 소셜 빅데이터 버즈 수집 및 감성 마이닝 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SocialVocItem {
  id: string;
  buzzId: string;
  sourceMedia: string; // 수집 채널 (예: 네이버 맘카페, 다나와 상품평, 디시인사이드)
  keywordTopic: string; // 버즈 키워드/주제 (예: 무선청소기 흡입력 및 배터리 수명)
  sentimentType: "긍정 (Positive)" | "부정 (Negative)" | "중립 (Neutral)";
  postSnippetText: string; // 게시글/댓글 요약 텍스트
  feedbackTargetModule: string; // 자동으로 피드백 연동할 ERP 모듈 (예: QM 품질 / PLM R&D 개발)
  collectedDate: string;
}

export const socialVocStore = createStore("mk.social_voc", [
  { id: "VOC-01", buzzId: "BUZZ-2026-001", sourceMedia: "네이버 가전/육아 맘카페", keywordTopic: "로봇청소기 AI-V12 물걸레 건조 소음 및 문턱 넘어감", sentimentType: "긍정 (Positive)", postSnippetText: "문턱 2cm 높이도 안걸리고 잘 넘어가네요! 건조 소음도 거의 무소음 수준입니다.", feedbackTargetModule: "PLM 연구개발 (R&D)", collectedDate: "2026-08-06 11:20" },
  { id: "VOC-02", buzzId: "BUZZ-2026-002", sourceMedia: "다나와 상품 사용기", keywordTopic: "무선청소기 V11 터보모드 배터리 지속시간", sentimentType: "부정 (Negative)", postSnippetText: "터보 모드로 청소하면 12분만에 꺼집니다. 추가 배터리 고속충전 거치대 구성 개선 필요합니다.", feedbackTargetModule: "QM 품질관리 / SD 영업", collectedDate: "2026-08-06 13:40" },
]);

export default function SocialListeningVoc() {
  const items = useStore(socialVocStore) as SocialVocItem[];
  const [sentimentFilter, setSentimentFilter] = useState("전체");

  const filtered = items.filter((i) => sentimentFilter === "전체" || i.sentimentType.includes(sentimentFilter));

  const positiveCount = items.filter((i) => i.sentimentType.includes("긍정")).length;

  const excel = () =>
    downloadCsv(
      "마케팅_소셜리스닝_VOC_감성분석_대장.csv",
      ["버즈ID", "수집채널", "키워드주제", "감성분류", "게시글요약", "연동모듈", "수집일시"],
      filtered.map((i) => [
        i.buzzId,
        i.sourceMedia,
        i.keywordTopic,
        i.sentimentType,
        i.postSnippetText,
        i.feedbackTargetModule,
        i.collectedDate,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">12. Marketing Management (마케팅)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">소셜리스닝VOC (MK-010)</h1>
          <span className="text-[11px] text-sub">온라인 소셜 미디어·포털 빅데이터 버즈(Buzz) 실시간 수집 및 긍/부정 감성 마이닝 분석</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">일일 수집 소셜 버즈 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">1,420 <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">소셜 감성 긍정 비율 (Positive Ratio)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {((positiveCount / (items.length || 1)) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">R&D·품질 자동 피드백 연동 건수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">감성:</span>
          {["전체", "긍정", "부정"].map((s) => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                sentimentFilter === s
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 소셜VOC Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">버즈 ID</th>
              <th className="px-3 py-2">수집 채널</th>
              <th className="px-3 py-2">키워드 / 주제</th>
              <th className="px-3 py-2">감성 분류</th>
              <th className="px-3 py-2">소셜 게시글 / 댓글 요약</th>
              <th className="px-3 py-2">자동 연동 ERP 모듈</th>
              <th className="px-3 py-2">수집 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.buzzId}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.sourceMedia}</td>
                <td className="px-3 py-2 text-ink font-semibold text-[11px]">{i.keywordTopic}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.sentimentType.includes("긍정") ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {i.sentimentType}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub text-[11px]">{i.postSnippetText}</td>
                <td className="px-3 py-2 font-mono text-purple-600 font-bold text-[11px]">{i.feedbackTargetModule}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.collectedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
