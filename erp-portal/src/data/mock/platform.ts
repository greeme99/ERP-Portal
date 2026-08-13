// 공통/플랫폼(COM) Mock (Sprint 10) — 사용자, 권한 매트릭스
import { createStore } from "../../services/store";
import { MODULES } from "../menu";

// 권한체계 (기능정의서 v2 §4)
export const ROLES = ["경영진", "영업", "구매", "생산", "품질", "물류", "회계", "연구소", "관리자"];
export const PERM_LEVELS = ["없음", "조회", "편집", "승인"];

// ── 사용자 ───────────────────────────────────────
export const userStore = createStore("platform.user", [
  { id: "U-1001", code: "10001", name: "문규", dept: "AX Lab", role: "관리자", email: "greeme99@gmail.com", status: "활성" },
  { id: "U-1002", code: "10002", name: "김영업", dept: "영업팀", role: "영업", email: "sales.kim@company.com", status: "활성" },
  { id: "U-1003", code: "10003", name: "박구매", dept: "구매팀", role: "구매", email: "buyer.park@company.com", status: "활성" },
  { id: "U-1004", code: "10004", name: "이생산", dept: "생산팀", role: "생산", email: "prod.lee@company.com", status: "활성" },
  { id: "U-1005", code: "10005", name: "최품질", dept: "품질팀", role: "품질", email: "qa.choi@company.com", status: "활성" },
  { id: "U-1006", code: "10006", name: "정회계", dept: "재무팀", role: "회계", email: "fi.jung@company.com", status: "활성" },
  { id: "U-1007", code: "10007", name: "한대표", dept: "경영지원", role: "경영진", email: "ceo.han@company.com", status: "활성" },
  { id: "U-1099", code: "19999", name: "퇴사자", dept: "-", role: "영업", email: "old@company.com", status: "비활성" },
]);

export const USER_STATUS_STYLE: Record<string, string> = {
  활성: "bg-emerald-100 text-emerald-700",
  비활성: "bg-slate-200 text-slate-500",
};

// ── 권한 매트릭스 (role별 모듈 접근권한) ──────────
// 기본 규칙: 관리자=승인 전체, 경영진=조회 전체, 기능역할=담당모듈 편집/승인+기타 조회
const roleModuleMap: Record<string, string[]> = {
  영업: ["sd"], 구매: ["mm"], 생산: ["pp", "scm"], 품질: ["qm"],
  물류: ["le"], 회계: ["fi", "co"], 연구소: ["plm"],
};

function defaultPerms(role: string): Record<string, string> {
  const perms: Record<string, string> = {};
  MODULES.forEach((m) => {
    if (role === "관리자") perms[m.id] = "승인";
    else if (role === "경영진") perms[m.id] = "조회";
    else if ((roleModuleMap[role] ?? []).includes(m.id)) perms[m.id] = "승인";
    else perms[m.id] = "조회";
  });
  return perms;
}

export const permStore = createStore(
  "platform.permission",
  ROLES.map((role) => ({ id: role, role, perms: defaultPerms(role) }))
);

export const PERM_STYLE: Record<string, string> = {
  없음: "text-slate-400",
  조회: "text-blue-500",
  편집: "text-amber-600",
  승인: "text-emerald-600 font-semibold",
};
