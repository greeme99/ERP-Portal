// COM-016 메뉴개인화즐겨찾기 (User Menu Preferences & Quick Shortcuts) — 사용자별 ERP 메인 메뉴 즐겨찾기 및 개인화 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface UserMenuPrefItem {
  id: string;
  userAccount: string;
  userName: string; // 사용자 성명
  favoriteMenuName: string; // 즐겨찾기 메뉴명 (예: MRP 자재소요 전개, 출고 처리, 예산통제)
  favoriteMenuUrl: string; // 메뉴 경로
  shortcutOrder: number; // 퀵 메뉴 배치 순서
  themePreference: "Dark (다크모드)" | "Light (라이트모드)";
  lastUpdatedDate: string;
}

export const menuPrefStore = createStore("com.menu_pref", [
  { id: "PREF-01", userAccount: "pp_planner_kim", userName: "김생산 과장", favoriteMenuName: "MRP 자재소요전개 (PP-003)", favoriteMenuUrl: "/m/pp/pp-03", shortcutOrder: 1, themePreference: "Dark (다크모드)", lastUpdatedDate: "2026-08-05" },
  { id: "PREF-02", userAccount: "sd_sales_lee", userName: "이영업 과장", favoriteMenuName: "영업 수주등록 (SD-004)", favoriteMenuUrl: "/m/sd/sd-04", shortcutOrder: 1, themePreference: "Dark (다크모드)", lastUpdatedDate: "2026-08-06" },
]);

export default function UserMenuPreference() {
  const items = useStore(menuPrefStore) as UserMenuPrefItem[];
  const [userFilter, setUserFilter] = useState("전체");

  const filtered = items.filter((i) => userFilter === "전체" || i.userName.includes(userFilter));

  const excel = () =>
    downloadCsv(
      "시스템_사용자_메뉴개인화_즐겨찾기_대장.csv",
      ["계정ID", "성명", "즐겨찾기메뉴명", "메뉴경로", "배치순서", "테마설정", "최근수정일"],
      filtered.map((i) => [
        i.userAccount,
        i.userName,
        i.favoriteMenuName,
        i.favoriteMenuUrl,
        i.shortcutOrder,
        i.themePreference,
        i.lastUpdatedDate,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">메뉴개인화즐겨찾기 (COM-016)</h1>
          <span className="text-[11px] text-sub">ERP 사용자 개인별 자주 사용하는 전사 업무 메뉴 즐겨찾기(Favorites) 및 UI 테마 설정</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">개인화 설정 활성 사용자</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">명</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">다크모드 UI 테마 채택률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">사용자 1인당 평균 즐겨찾기 메뉴</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">4.2 <span className="text-xs font-normal text-ink">개</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">사용자:</span>
          {["전체", "김생산", "이영업"].map((u) => (
            <button
              key={u}
              onClick={() => setUserFilter(u)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                userFilter === u
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 즐겨찾기 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">사용자 계정 ID / 성명</th>
              <th className="px-3 py-2">즐겨찾기 등록 메뉴명</th>
              <th className="px-3 py-2">메뉴 라우팅 경로</th>
              <th className="px-3 py-2 text-right">퀵 배치 순서</th>
              <th className="px-3 py-2">UI 테마 설정</th>
              <th className="px-3 py-2">최근 설정 변경일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">
                  <div className="font-mono text-blue-600 font-bold">{i.userAccount}</div>
                  <div className="text-[11px] text-ink font-semibold">{i.userName}</div>
                </td>
                <td className="px-3 py-2 font-bold text-emerald-600 text-[11px]">{i.favoriteMenuName}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.favoriteMenuUrl}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.shortcutOrder}위</td>
                <td className="px-3 py-2 text-sub font-medium">{i.themePreference}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.lastUpdatedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
