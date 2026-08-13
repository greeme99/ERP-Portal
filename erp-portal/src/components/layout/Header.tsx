import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ALL_TCODES, TCodeItem, searchTCodes } from "../../data/tcode";

const THEMES = [
  { id: "light", label: "라이트" },
  { id: "dark", label: "다크" },
  { id: "bluegrey", label: "블루그레이" },
] as const;

interface Props {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  copilotOpen: boolean;
  onToggleCopilot: () => void;
}

export default function Header({
  sidebarOpen,
  onToggleSidebar,
  copilotOpen,
  onToggleCopilot,
}: Props) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("erp-theme") ?? "light"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showTCodeModal, setShowTCodeModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResultToast, setNoResultToast] = useState<string | null>(null);

  // 2개 이상 검색 결과 선택 모달 상태
  const [searchResultModal, setSearchResultModal] = useState<{
    isOpen: boolean;
    results: TCodeItem[];
    query: string;
  }>({
    isOpen: false,
    results: [],
    query: "",
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("erp-theme", theme);
  }, [theme]);

  // 실시간 입력 연동 결과 (드롭다운용)
  const filteredTCodes = useMemo(() => {
    return searchTCodes(searchQuery);
  }, [searchQuery]);

  const handleSelectRoute = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setShowDropdown(false);
    setSearchResultModal({ isOpen: false, results: [], query: "" });
  };

  // 핵심 검색/조회 실행 함수
  const handleExecuteSearch = (customQuery?: string) => {
    const query = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (!query) return;

    const results = searchTCodes(query);

    if (results.length === 1) {
      // 1개인 경우 바로 이동
      handleSelectRoute(results[0].path);
    } else if (results.length > 1) {
      // 2개 이상인 경우 선택 리스트 모달 오픈
      setSearchResultModal({
        isOpen: true,
        results,
        query,
      });
      setShowDropdown(false);
    } else {
      // 0개인 경우 경고 메시지 토스트
      setNoResultToast(`'${query}'에 해당하는 T-code 또는 메뉴가 없습니다.`);
      setTimeout(() => setNoResultToast(null), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleExecuteSearch();
    }
  };

  return (
    <header className="h-12 shrink-0 flex items-center gap-3 px-4 border-b border-line bg-panel relative z-40">
      {/* 4. 좌측 모듈 선택 패널 숨기기/보이기 버튼 */}
      <button
        onClick={onToggleSidebar}
        title={sidebarOpen ? "좌측 모듈 선택 패널 숨기기" : "좌측 모듈 선택 패널 보이기"}
        className="px-2 py-1 rounded border border-line bg-surface text-main text-[11px] font-semibold hover:bg-accent-soft flex items-center gap-1.5 transition-colors shadow-sm"
      >
        <span>{sidebarOpen ? "◀" : "▶"}</span>
        <span>{sidebarOpen ? "모듈 패널 숨기기" : "모듈 패널 보이기"}</span>
      </button>

      <span
        className="font-bold text-accent whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ml-1"
        onClick={() => navigate("/")}
      >
        AX-ERP Portal
      </span>
      <span className="text-[11px] text-sub hidden md:block">
        소형가전·전자부품 제조 Standard ERP
      </span>

      {/* T-Code 검색바 및 조회 버튼 (조회 옆 체계도 버튼 제거함) */}
      <div className="relative flex-1 max-w-lg ml-2">
        <div className="flex items-center gap-1 border border-line rounded bg-surface px-2 py-0.5 focus-within:border-accent shadow-sm">
          <span className="text-[11px] font-bold text-accent px-1.5 py-0.5 rounded bg-accent-soft whitespace-nowrap">
            T-Code
          </span>
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="T-Code (예: SD-04, VA01, PP-03) 또는 메뉴명 입력..."
            className="w-full bg-transparent text-[12px] outline-none text-main placeholder:text-sub px-1"
          />
          {/* 조회 버튼 (단 1개만 배치, 체계도 버튼은 중복 제거) */}
          <button
            onClick={() => handleExecuteSearch()}
            className="px-2.5 py-1 rounded bg-accent text-white text-[11px] font-bold hover:bg-accent/80 transition-colors whitespace-nowrap flex items-center gap-1"
            title="T-code 또는 메뉴명으로 조회"
          >
            <span>🔍</span>
            <span>조회</span>
          </button>
        </div>

        {/* 결과 없음 경고 알림 Toast */}
        {noResultToast && (
          <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-red-500 text-white text-xs rounded shadow-lg z-50 flex items-center justify-between animate-fadeIn">
            <span>⚠️ {noResultToast}</span>
            <button onClick={() => setNoResultToast(null)} className="font-bold px-1">✕</button>
          </div>
        )}

        {/* 자동완성 드롭다운 */}
        {showDropdown && searchQuery.trim() && filteredTCodes.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-panel border border-line rounded-lg shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-line/40">
            <div className="px-3 py-1.5 bg-surface text-[10px] text-sub font-semibold flex justify-between items-center">
              <span>연관 검색 결과 ({filteredTCodes.length}건) — 엔터/조회 시 이동</span>
              <button
                onClick={() => setShowDropdown(false)}
                className="hover:text-main"
              >
                닫기 ✕
              </button>
            </div>
            {filteredTCodes.slice(0, 10).map((item) => (
              <div
                key={item.tcode}
                onClick={() => handleSelectRoute(item.path)}
                className="px-3 py-2 hover:bg-accent-soft cursor-pointer flex items-center justify-between text-[12px] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-accent">{item.tcode}</span>
                  {item.sapTcode && (
                    <span className="font-mono text-[10px] text-sub bg-surface px-1.5 py-0.5 rounded border border-line/50">
                      {item.sapTcode}
                    </span>
                  )}
                  <span className="font-medium text-main">{item.name}</span>
                </div>
                <span className="text-[10px] text-sub bg-panel px-1.5 py-0.5 rounded border border-line">
                  {item.module}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="px-2 py-1 rounded border border-line bg-surface text-[12px]"
          title="테마"
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        {/* 2. T-Code 체계도 보기 버튼 (우측 상단 1개 유지) */}
        <button
          onClick={() => setShowTCodeModal(true)}
          title="전체 T-Code 체계도 보기"
          className="px-2.5 py-1 rounded hover:bg-accent-soft text-[12px] border border-line bg-surface font-medium flex items-center gap-1"
        >
          🔑 T-Code 체계도
        </button>
        <button title="알림" className="px-2 py-1 rounded hover:bg-accent-soft relative text-sm">
          🔔
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
        {/* 3. 우측 AI Copilot 패널 숨기기/보이기 버튼 */}
        <button
          onClick={onToggleCopilot}
          title={copilotOpen ? "우측 AI Copilot 패널 숨기기" : "우측 AI Copilot 패널 보이기"}
          className={`px-3 py-1 rounded text-[12px] font-semibold transition-colors flex items-center gap-1 ${
            copilotOpen
              ? "bg-accent text-white hover:bg-accent/80"
              : "bg-surface text-sub border border-line hover:text-main"
          }`}
        >
          <span>🤖 AI Copilot</span>
          <span className="text-[10px] font-normal opacity-90">
            ({copilotOpen ? "숨기기" : "보이기"})
          </span>
        </button>
        <span className="text-[12px] text-sub whitespace-nowrap font-medium">문규 (AX Lab)</span>
      </div>


      {/* 2개 이상 검색 결과 선택 모달 */}
      {searchResultModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-panel border border-line rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-line flex justify-between items-center bg-surface">
              <div>
                <h3 className="font-bold text-base text-main flex items-center gap-2">
                  🔍 T-Code / 메뉴 검색 결과 ({searchResultModal.results.length}건)
                </h3>
                <p className="text-xs text-sub mt-0.5">
                  입력하신 검색어 <span className="font-bold text-accent">"{searchResultModal.query}"</span>에 대치되는 화면 목록입니다. 이동할 화면을 선택해 주세요.
                </p>
              </div>
              <button
                onClick={() => setSearchResultModal({ isOpen: false, results: [], query: "" })}
                className="text-sub hover:text-main text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2">
              {searchResultModal.results.map((item) => (
                <div
                  key={item.tcode}
                  onClick={() => handleSelectRoute(item.path)}
                  className="p-3 border border-line rounded-lg bg-surface hover:bg-accent-soft/70 cursor-pointer flex items-center justify-between transition-all hover:scale-[1.005] group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-accent bg-accent-soft px-2 py-1 rounded">
                      {item.tcode}
                    </span>
                    {item.sapTcode && (
                      <span className="font-mono text-xs text-sub bg-panel px-1.5 py-0.5 rounded border border-line">
                        SAP: {item.sapTcode}
                      </span>
                    )}
                    <div>
                      <div className="font-semibold text-main text-sm group-hover:text-accent transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-sub">{item.module} 모듈</div>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors">
                    이동 →
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-line bg-surface flex justify-end">
              <button
                onClick={() => setSearchResultModal({ isOpen: false, results: [], query: "" })}
                className="px-4 py-1.5 rounded bg-panel border border-line text-xs font-semibold text-main hover:bg-accent-soft"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전체 T-Code 체계도 모달 */}
      {showTCodeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-panel border border-line rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-line flex justify-between items-center bg-surface">
              <div>
                <h3 className="font-bold text-lg text-main flex items-center gap-2">
                  🔑 ERP T-Code (트랜잭션 코드) 전체 체계도
                </h3>
                <p className="text-xs text-sub mt-0.5">
                  총 {ALL_TCODES.length}개 ERP 표준 메뉴 T-Code 목록입니다. T-Code나 메뉴명을 상단 검색창에 입력하고 '조회' 버튼을 클릭하면 즉시 이동합니다.
                </p>
              </div>
              <button
                onClick={() => setShowTCodeModal(false)}
                className="text-sub hover:text-main text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface text-sub sticky top-0 z-10">
                    <th className="p-2.5 font-semibold">T-Code (ERP ID)</th>
                    <th className="p-2.5 font-semibold">SAP 맵핑</th>
                    <th className="p-2.5 font-semibold">모듈</th>
                    <th className="p-2.5 font-semibold">화면/기능명</th>
                    <th className="p-2.5 font-semibold text-right">바로가기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {ALL_TCODES.map((t) => (
                    <tr key={t.tcode} className="hover:bg-accent-soft/50 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-accent">{t.tcode}</td>
                      <td className="p-2.5 font-mono text-sub">{t.sapTcode || "-"}</td>
                      <td className="p-2.5 text-sub">{t.module}</td>
                      <td className="p-2.5 font-medium text-main">{t.name}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => {
                            setShowTCodeModal(false);
                            handleSelectRoute(t.path);
                          }}
                          className="px-3 py-1 rounded bg-accent text-white font-semibold hover:bg-accent/80 transition-colors text-[11px]"
                        >
                          이동
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-line bg-surface flex justify-between items-center text-xs">
              <span className="text-sub font-mono">Total {ALL_TCODES.length} T-Codes mapped</span>
              <button
                onClick={() => setShowTCodeModal(false)}
                className="px-4 py-1.5 rounded bg-panel border border-line text-xs font-semibold text-main hover:bg-accent-soft"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
