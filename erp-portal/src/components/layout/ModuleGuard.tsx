// 라우트 차단 — 메뉴를 감추는 것만으로는 주소창 직접 진입을 막지 못한다.
//
// 끄고 싶으면 ROUTE_GUARD_ENABLED 를 false 로 두면 된다(메뉴 숨김·액션 차단은 유지).
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MODULES } from "../../data/menu";
import { moduleIdFromPath, useAuthz } from "../../services/authz";

export const ROUTE_GUARD_ENABLED = true;

export default function ModuleGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const authz = useAuthz();
  const moduleId = moduleIdFromPath(pathname);

  if (!ROUTE_GUARD_ENABLED || !moduleId || authz.canView(moduleId)) return <>{children}</>;

  const moduleName = MODULES.find((m) => m.id === moduleId)?.name ?? moduleId;

  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-md text-center bg-panel border border-line rounded-lg p-8 space-y-3">
        <div className="text-4xl">🔒</div>
        <h1 className="text-lg font-bold text-main">접근 권한이 없습니다</h1>
        <p className="text-[12px] text-sub leading-relaxed">
          <b className="text-main">{moduleName}</b> 모듈에 대한 권한이 없습니다.
          <br />
          현재 사용자 <b className="text-main">{String(authz.user?.name ?? "-")}</b>
          {" "}({String(authz.user?.role ?? "-")}) 의 이 모듈 권한은{" "}
          <b className="text-red-500">{authz.levelOf(moduleId)}</b> 입니다.
        </p>
        <p className="text-[11px] text-sub">
          권한 변경은 <b>13. 공통/플랫폼 → 권한 매트릭스(COM-02)</b> 에서 관리자가 처리합니다.
        </p>
      </div>
    </div>
  );
}
