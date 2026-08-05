export default function StatusBar() {
  return (
    <footer className="h-7 shrink-0 flex items-center gap-4 px-4 border-t border-line bg-panel text-[11px] text-sub">
      <span>🟢 시스템 정상</span>
      <span>서버: PROD-KR01 (Prototype)</span>
      <span>회계기간: 2026-07</span>
      <span className="ml-auto">사용자: harry.kim@ax.samsung.com | 권한: 관리자</span>
      <span>v0.1.0</span>
    </footer>
  );
}
