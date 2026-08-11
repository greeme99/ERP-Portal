// COM-012 사내공지게시판 (System Notice Board & Internal Bulletins) — 전사 사내 공지·시스템 점검 및 업무 가이드 게시판 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface NoticeBoardItem {
  id: string;
  noticeNo: string;
  category: "긴급 점검" | "전사 공지" | "업무 가이드" | "ERP 시스템";
  title: string;
  authorName: string; // 작성자 성명 및 직급
  postedDate: string; // 작성 일자
  viewsCount: number; // 조회수
  isPinnedYn: "Y" | "N"; // 상단 고정 여부
  status: "게시중" | "만료";
}

export const noticeBoardStore = createStore("com.notice_board", [
  { id: "NOT-01", noticeNo: "NT-2026-0801", category: "ERP 시스템", title: "[안내] 2026년 3분기 결산 대비 원가배부 및 자재 실사 정산 지침", authorName: "이경영 이사", postedDate: "2026-08-01", viewsCount: 142, isPinnedYn: "Y", status: "게시중" },
  { id: "NOT-02", noticeNo: "NT-2026-0802", category: "긴급 점검", title: "[긴급] 서버 정기 백업 작업에 따른 ERP 데이터베이스 일시 점검 (08/07 02:00~04:00)", authorName: "박시스템 팀장", postedDate: "2026-08-05", viewsCount: 98, isPinnedYn: "Y", status: "게시중" },
  { id: "NOT-03", noticeNo: "NT-2026-0703", category: "전사 공지", title: "[공지] 2026년 하반기 품질 개선 8D 리포트 서식 업데이트 및 작성 표준 가이드", authorName: "김품질 수석", postedDate: "2026-07-28", viewsCount: 215, isPinnedYn: "N", status: "게시중" },
]);

export default function NoticeBoardManagement() {
  const items = useStore(noticeBoardStore) as NoticeBoardItem[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = items.filter((i) => catFilter === "전체" || i.category === catFilter);

  const totalViews = filtered.reduce((acc, i) => acc + i.viewsCount, 0);

  const excel = () =>
    downloadCsv(
      "시스템_사내_공지사항_게시판_대장.csv",
      ["공지번호", "카테고리", "제목", "작성자", "작성일자", "조회수", "상단고정", "상태"],
      filtered.map((i) => [
        i.noticeNo,
        i.category,
        i.title,
        i.authorName,
        i.postedDate,
        i.viewsCount,
        i.isPinnedYn,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공지게시판 (COM-012)</h1>
          <span className="text-[11px] text-sub">전사 사내 공지사항 · 시스템 점검 및 부서별 업무 표준 가이드 게시판</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">게시 중 공지사항 총 건수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">누적 공지 조회수 (Total Views)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{totalViews.toLocaleString()} <span className="text-xs font-normal text-ink">회</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">상단 중요 고정 공지 건수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {items.filter((i) => i.isPinnedYn === "Y").length} <span className="text-xs font-normal text-ink">건</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">카테고리:</span>
          {["전체", "ERP 시스템", "긴급 점검", "전사 공지"].map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                catFilter === c
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 공지사항 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">공지 번호</th>
              <th className="px-3 py-2">카테고리</th>
              <th className="px-3 py-2">공지 제목</th>
              <th className="px-3 py-2">작성자</th>
              <th className="px-3 py-2">작성 일자</th>
              <th className="px-3 py-2 text-right">조회수</th>
              <th className="px-3 py-2">상단 고정</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">{i.noticeNo}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.category === "긴급 점검" ? "bg-red-100 text-red-700 border border-red-200" :
                    i.category === "ERP 시스템" ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}>
                    {i.category}
                  </span>
                </td>
                <td className="px-3 py-2 font-semibold text-ink">
                  {i.isPinnedYn === "Y" && <span className="mr-1 text-red-500 font-bold">📌</span>}
                  {i.title}
                </td>
                <td className="px-3 py-2 text-sub font-medium">{i.authorName}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.postedDate}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.viewsCount}회</td>
                <td className="px-3 py-2 font-bold font-mono text-sub">{i.isPinnedYn}</td>
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
