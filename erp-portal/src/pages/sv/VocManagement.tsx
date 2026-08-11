// SV-004 VOC관리 (Voice of Customer & Feedback) — 고객의 소리(칭찬·불만·개선제안) 접수·부서별 조치 및 만족도 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface VocItem {
  id: string;
  vocNo: string;
  customerName: string;
  vocType: "칭찬" | "불만/클레임" | "개선제안";
  category: "제품품질" | "배송서비스" | "AS기사친절" | "앱기능";
  contentTitle: string;
  assignedDept: string;
  actionStatus: "접수대기" | "조치중" | "답변완료";
  satisfactionScore: number; // 고객 만족도 점수 (5점 만점)
  receivedAt: string;
}

export const vocStore = createStore("sv.voc_mgmt", [
  { id: "VOC-01", vocNo: "VOC-2026-0701", customerName: "김고객", vocType: "불만/클레임", category: "제품품질", contentTitle: "소형청소기 사용 중 소음이 점점 커집니다.", assignedDept: "품질보증팀", actionStatus: "답변완료", satisfactionScore: 4.8, receivedAt: "2026-07-28" },
  { id: "VOC-02", vocNo: "VOC-2026-0702", customerName: "박고객", vocType: "칭찬", category: "AS기사친절", contentTitle: "강남센터 엔지니어분이 너무 친절하게 수리해주셨습니다.", assignedDept: "CS운영팀", actionStatus: "답변완료", satisfactionScore: 5.0, receivedAt: "2026-08-01" },
  { id: "VOC-03", vocNo: "VOC-2026-0703", customerName: "이고객", vocType: "개선제안", category: "앱기능", contentTitle: "스마트 로봇청소기 앱 청소 예약 기능 추가 요청", assignedDept: "SW개발팀", actionStatus: "조치중", satisfactionScore: 4.0, receivedAt: "2026-08-04" },
]);

export default function VocManagement() {
  const items = useStore(vocStore) as VocItem[];
  const [typeFilter, setTypeFilter] = useState("전체");

  const filtered = items.filter((i) => typeFilter === "전체" || i.vocType.includes(typeFilter));

  const avgScore = (items.reduce((acc, i) => acc + i.satisfactionScore, 0) / (items.length || 1)).toFixed(1);

  const excel = () =>
    downloadCsv(
      "서비스_VOC_고객의소리_처리대장.csv",
      ["VOC번호", "고객명", "유형", "카테고리", "제목", "담당부서", "조치상태", "만족도(5점)", "접수일시"],
      filtered.map((i) => [
        i.vocNo,
        i.customerName,
        i.vocType,
        i.category,
        i.contentTitle,
        i.assignedDept,
        i.actionStatus,
        i.satisfactionScore,
        i.receivedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. Customer Service (고객서비스)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">VOC관리 (SV-004)</h1>
          <span className="text-[11px] text-sub">고객의 소리 (불만 · 칭찬 · 개선제안) 접수 · 부서별 조치 완료 및 조치 만족도 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">평균 VOC 조치 만족도 점수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{avgScore} <span className="text-xs font-normal text-ink">/ 5.0 점</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">고객 칭찬 VOC 비율</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {((items.filter((i) => i.vocType === "칭찬").length / (items.length || 1)) * 100).toFixed(0)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">VOC 답변 처리 완료율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {((items.filter((i) => i.actionStatus === "답변완료").length / (items.length || 1)) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">유형:</span>
          {["전체", "칭찬", "불만", "개선제안"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                typeFilter === t
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 VOC대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">VOC 번호</th>
              <th className="px-3 py-2">고객명</th>
              <th className="px-3 py-2">VOC 유형</th>
              <th className="px-3 py-2">카테고리</th>
              <th className="px-3 py-2">VOC 제목 / 내용</th>
              <th className="px-3 py-2">담당 부서</th>
              <th className="px-3 py-2">조치 상태</th>
              <th className="px-3 py-2 text-right">만족도 점수</th>
              <th className="px-3 py-2">접수 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">{i.vocNo}</td>
                <td className="px-3 py-2 font-medium">{i.customerName}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.vocType === "칭찬" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    i.vocType.includes("불만") ? "bg-red-100 text-red-700 border border-red-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}>
                    {i.vocType}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub font-medium">{i.category}</td>
                <td className="px-3 py-2 font-semibold text-ink">{i.contentTitle}</td>
                <td className="px-3 py-2 text-sub">{i.assignedDept}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.actionStatus === "답변완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.actionStatus}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-amber-500">★ {i.satisfactionScore.toFixed(1)}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.receivedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
