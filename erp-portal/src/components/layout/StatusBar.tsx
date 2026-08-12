import { useSyncExternalStore } from "react";
import { getBackendStatus, isRestConfigured, subscribeBackendStatus } from "../../services/restBackend";

interface Props {
  demoPlaybookOpen: boolean;
  onToggleDemoPlaybook: () => void;
}

// 데이터가 서버에 저장되는지 브라우저에만 남는지는 사용자가 알아야 한다.
function StorageBadge() {
  const status = useSyncExternalStore(subscribeBackendStatus, getBackendStatus, getBackendStatus);
  if (status === "rest") {
    return (
      <span className="hidden sm:flex items-center gap-1.5 text-emerald-600 font-semibold" title="변경이 백엔드 서버에 저장됩니다.">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        REST 백엔드 연결
      </span>
    );
  }
  return (
    <span
      className={`hidden sm:flex items-center gap-1.5 font-semibold ${isRestConfigured() ? "text-amber-600" : "text-sub"}`}
      title={
        isRestConfigured()
          ? "백엔드 서버에 연결하지 못해 이 브라우저에만 저장됩니다."
          : "프로토타입 모드 — 변경은 이 브라우저에만 저장됩니다."
      }
    >
      <span className={`w-2 h-2 rounded-full ${isRestConfigured() ? "bg-amber-500" : "bg-slate-400"}`} />
      {isRestConfigured() ? "서버 미연결 (로컬 저장)" : "로컬 저장 (프로토타입)"}
    </span>
  );
}

export default function StatusBar({ demoPlaybookOpen, onToggleDemoPlaybook }: Props) {
  return (
    <footer className="h-8 shrink-0 flex items-center gap-4 px-4 border-t border-line bg-panel text-[11px] text-sub relative z-30">
      <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        시스템 정상
      </span>
      <StorageBadge />
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

