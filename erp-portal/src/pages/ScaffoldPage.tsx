import { useParams } from "react-router-dom";
import { findMenu } from "../data/menu";

// 결정적 Mock 행 생성 (slug 기반 seed)
function mockRows(slug: string, count = 8) {
  const seed = Array.from(slug).reduce((a, c) => a + c.charCodeAt(0), 0);
  const statuses = ["진행중", "승인대기", "완료", "반려"];
  return Array.from({ length: count }, (_, i) => ({
    no: i + 1,
    code: `${slug.toUpperCase()}-${String(seed + i).padStart(5, "0")}`,
    name: `샘플 데이터 ${i + 1}`,
    qty: ((seed * (i + 3)) % 900) + 100,
    amount: (((seed * (i + 7)) % 9000) + 1000) * 1000,
    status: statuses[(seed + i) % statuses.length],
    date: `2026-0${((seed + i) % 6) + 1}-${String(((seed + i) % 27) + 1).padStart(2, "0")}`,
  }));
}

const STATUS_COLOR: Record<string, string> = {
  진행중: "text-blue-500",
  승인대기: "text-amber-500",
  완료: "text-emerald-500",
  반려: "text-red-500",
};

export default function ScaffoldPage() {
  const { moduleId, slug } = useParams();
  const { mod, item } = findMenu(moduleId, slug);

  if (!mod || !item) return <div className="text-sub">메뉴를 찾을 수 없습니다.</div>;

  const rows = mockRows(item.slug);

  return (
    <div className="space-y-3">
      {/* Breadcrumb + 타이틀 */}
      <div>
        <div className="text-[11px] text-sub">
          {mod.code}. {mod.name} ({mod.nameEn})
        </div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">{item.name}</h1>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent-soft text-accent">
            화면 스캐폴드 — 상세 구현 예정
          </span>
        </div>
      </div>

      {/* 검색 필터 */}
      <div className="bg-panel border border-line rounded-lg p-3 flex flex-wrap items-end gap-3">
        <label className="text-[11px] text-sub">
          기간
          <div className="flex gap-1 mt-1">
            <input type="date" defaultValue="2026-01-01" className="px-2 py-1 rounded border border-line bg-surface text-[12px]" />
            <input type="date" defaultValue="2026-07-03" className="px-2 py-1 rounded border border-line bg-surface text-[12px]" />
          </div>
        </label>
        <label className="text-[11px] text-sub">
          코드/명칭
          <input placeholder="검색어" className="block mt-1 px-2 py-1 rounded border border-line bg-surface text-[12px]" />
        </label>
        <label className="text-[11px] text-sub">
          상태
          <select className="block mt-1 px-2 py-1 rounded border border-line bg-surface text-[12px]">
            <option>전체</option>
            <option>진행중</option>
            <option>승인대기</option>
            <option>완료</option>
          </select>
        </label>
        <button className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">조회</button>
        <div className="ml-auto flex gap-1">
          <button className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">＋ 신규</button>
          <button className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">💾 저장</button>
          <button className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">🗑 삭제</button>
          <button className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      {/* 데이터 그리드 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2 w-10"><input type="checkbox" /></th>
              <th className="px-3 py-2">No</th>
              <th className="px-3 py-2">코드</th>
              <th className="px-3 py-2">명칭</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2 text-right">금액(원)</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">일자</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.no} className="border-b border-line last:border-0 hover:bg-accent-soft cursor-pointer">
                <td className="px-3 py-2"><input type="checkbox" /></td>
                <td className="px-3 py-2 text-sub">{r.no}</td>
                <td className="px-3 py-2 font-mono">{r.code}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-right">{r.qty.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.amount.toLocaleString()}</td>
                <td className={`px-3 py-2 font-semibold ${STATUS_COLOR[r.status]}`}>{r.status}</td>
                <td className="px-3 py-2 text-sub">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line">
          총 {rows.length}건 | 페이지 1/1
        </div>
      </div>
    </div>
  );
}
