import { useEffect, useState } from "react";

const THEMES = [
  { id: "light", label: "라이트" },
  { id: "dark", label: "다크" },
  { id: "bluegrey", label: "블루그레이" },
] as const;

interface Props {
  onToggleCopilot: () => void;
}

export default function Header({ onToggleCopilot }: Props) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("erp-theme") ?? "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("erp-theme", theme);
  }, [theme]);

  return (
    <header className="h-12 shrink-0 flex items-center gap-3 px-4 border-b border-line bg-panel">
      <span className="font-bold text-accent whitespace-nowrap">표준 ERP 포탈</span>
      <span className="text-[11px] text-sub hidden md:block">
        소형가전·전자부품 제조 Standard ERP
      </span>

      <input
        placeholder="🔍 메뉴 · 문서 · 거래처 통합검색"
        className="flex-1 max-w-md ml-4 px-3 py-1.5 rounded border border-line bg-surface text-[12px] outline-none focus:border-accent"
      />

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
        <button title="즐겨찾기" className="px-2 py-1 rounded hover:bg-accent-soft">⭐</button>
        <button title="알림" className="px-2 py-1 rounded hover:bg-accent-soft relative">
          🔔
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <button
          onClick={onToggleCopilot}
          className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold"
        >
          🤖 AI Copilot
        </button>
        <span className="text-[12px] text-sub whitespace-nowrap">문규 (AX Lab)</span>
      </div>
    </header>
  );
}
