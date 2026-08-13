// 인가 판정 — 역할×모듈 권한(permStore)을 실제 차단에 쓴다.
//
// 역할 체계는 기존 ROLES 9종을 유지하고 role === "관리자" 를 admin 으로 본다.
// admin 은 모든 모듈에 승인 권한을 갖는다.
//
// 중요: 클라이언트 판정은 UX 이며 보안 경계가 아니다. 서버가 같은 규칙으로
// 다시 검증한다(server/authz.mjs). 다만 이 프로토타입은 인증이 없어 사용자
// 신원을 위조할 수 있으므로, 서버 검증도 감사·오조작 방지 수준이다.
import { useLocation } from "react-router-dom";
import { MODULES } from "../data/menu";
import { Entity, useStore } from "./store";
import { permStore } from "../data/mock/platform";
import { useCurrentUser } from "./session";

export type PermLevel = "없음" | "조회" | "편집" | "승인";

// 낮은 권한 → 높은 권한 순서. 비교에 이 순서를 쓴다.
export const PERM_ORDER: PermLevel[] = ["없음", "조회", "편집", "승인"];

export const ADMIN_ROLE = "관리자";

export const isAdmin = (user?: Entity) => user?.role === ADMIN_ROLE;

/** 비활성 사용자는 어떤 모듈에도 접근하지 못한다. */
export const isActive = (user?: Entity) => user?.status === "활성";

const rank = (level: PermLevel) => Math.max(0, PERM_ORDER.indexOf(level));

/** 역할×모듈 권한을 읽는다. permStore 행이 없으면 "없음". */
export function resolvePermLevel(
  perms: Entity[],
  user: Entity | undefined,
  moduleId: string
): PermLevel {
  if (!user || !isActive(user)) return "없음";
  if (isAdmin(user)) return "승인";
  const row = perms.find((p) => p.role === user.role);
  const level = row?.perms?.[moduleId];
  return PERM_ORDER.includes(level as PermLevel) ? (level as PermLevel) : "없음";
}

export function meetsLevel(actual: PermLevel, need: PermLevel) {
  return rank(actual) >= rank(need);
}

export interface Authz {
  user: Entity | undefined;
  isAdmin: boolean;
  /** 해당 모듈의 권한 등급 */
  levelOf: (moduleId: string) => PermLevel;
  /** 해당 모듈에서 요구 등급을 충족하는가 */
  can: (moduleId: string, need: PermLevel) => boolean;
  /** 메뉴에 보여줄 모듈인가 (조회 이상) */
  canView: (moduleId: string) => boolean;
  /** 생성·수정·업로드가 가능한가 */
  canEdit: (moduleId: string) => boolean;
  /** 승인·삭제처럼 되돌리기 어려운 동작이 가능한가 */
  canApprove: (moduleId: string) => boolean;
}

/** 화면에서 쓰는 인가 훅. 사용자 전환·권한 변경에 즉시 반응한다. */
export function useAuthz(): Authz {
  const user = useCurrentUser();
  const perms = useStore(permStore);

  const levelOf = (moduleId: string) => resolvePermLevel(perms, user, moduleId);
  const can = (moduleId: string, need: PermLevel) => meetsLevel(levelOf(moduleId), need);

  return {
    user,
    isAdmin: isAdmin(user),
    levelOf,
    can,
    canView: (m) => can(m, "조회"),
    canEdit: (m) => can(m, "편집"),
    canApprove: (m) => can(m, "승인"),
  };
}

const MODULE_IDS = new Set(MODULES.map((m) => m.id));

/** /m/<moduleId>/... 에서 모듈 id 를 뽑는다. 모듈 화면이 아니면 null. */
export function moduleIdFromPath(pathname: string): string | null {
  const seg = pathname.replace(/^#?\/+/, "").split("/");
  if (seg[0] !== "m" || !seg[1]) return null;
  return MODULE_IDS.has(seg[1]) ? seg[1] : null;
}

export interface ModuleAuthz extends Authz {
  /** 현재 라우트의 모듈 id (모듈 화면이 아니면 null) */
  moduleId: string | null;
  /** 현재 화면에서 생성·수정·업로드가 가능한가 */
  canEditHere: boolean;
  /** 현재 화면에서 승인·삭제가 가능한가 */
  canApproveHere: boolean;
}

/**
 * 현재 라우트의 모듈을 기준으로 인가를 판정한다.
 * moduleLabel 은 표시용 문자열이라 쓸 수 없어 경로에서 모듈을 얻는다.
 * 모듈 화면이 아니면(대시보드 등) 제약하지 않는다.
 */
export function useModuleAuthz(): ModuleAuthz {
  const authz = useAuthz();
  const { pathname } = useLocation();
  const moduleId = moduleIdFromPath(pathname);
  return {
    ...authz,
    moduleId,
    canEditHere: moduleId ? authz.canEdit(moduleId) : true,
    canApproveHere: moduleId ? authz.canApprove(moduleId) : true,
  };
}
