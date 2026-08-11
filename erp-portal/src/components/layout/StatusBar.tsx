interface Props {
  demoPlaybookOpen: boolean;
  onToggleDemoPlaybook: () => void;
}

export default function StatusBar({ demoPlaybookOpen, onToggleDemoPlaybook }: Props) {
  return (
    <footer className="h-8 shrink-0 flex items-center gap-4 px-4 border-t border-line bg-panel text-[11px] text-sub relative z-30">
      <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        시스템 정상
      </span>
      <span className="hidden sm:inline">서버: PROD-KR01 (Prototype)</span>
      <span className="hidden md:inline">회계기간: 2026-07</span>

      {/* 1. Demo Playbook 실행 여부 선택 토글 키 스위치 */}
      <div className="flex items-center gap-2 px-2.5 py-0.5 rounded border border-line bg-surface ml-2">
        <span className="font-bold text-[11px] text-main flex items-center gap-1">
          <span>🎯</span>
          <span>Demo Playbook</span>
        </span>
        <button
          onClick={onToggleDemoPlaybook}
          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
            demoPlaybookOpen ? "bg-accent" : "bg-line"
          }`}
          title="Demo Playbook 실행 여부 선택 토글"
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              demoPlaybookOpen ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </button>
        <span
          className={`text-[10px] font-bold font-mono px-1 rounded ${
            demoPlaybookOpen ? "text-accent bg-accent-soft" : "text-sub"
          }`}
        >
          {demoPlaybookOpen ? "ON" : "OFF"}
        </span>
      </div>

      <span className="ml-auto text-sub hidden sm:inline">
        사용자: harry.kim@ax.samsung.com | 권한: 관리자
      </span>
      <span className="font-mono text-[10px]">v0.1.0</span>
    </footer>
  );
}

