// User Exit — 표준 로직 사이에 고객 정의 확장 코드를 끼우는 훅 (SAP User Exit 개념).
//
// 핵심 규칙: 각 Exit 은 필요한 역할×모듈 권한을 선언한다.
// 현재 사용자가 그 권한을 충족하면 Exit 이 실행되고(활성), 충족하지 못하면
// 실행을 건너뛴다(바이패스). 즉 "User별 권한 설정에 따라 User Exit 이 가동"된다.
//
// 표준 로직은 Exit 의 존재를 몰라도 동작한다. Exit 이 하나도 없거나 전부
// 바이패스되면 기존과 같은 결과가 나온다(하위 호환).
import { Entity } from "./store";
import { PermLevel } from "./authz";

/** Exit 이 걸리는 지점. 새 지점은 문자열만 추가하면 된다. */
export type UserExitPoint =
  | "sd.order.beforeSave"
  | "mm.po.beforeSave"
  | "fi.journal.beforeSave";

export interface UserExitContext {
  /** 실행 시점의 사용자 */
  user: Entity | undefined;
  /** 저장하려는 문서 (지점마다 형태가 다르다) */
  document: Record<string, unknown>;
  /** 부가 정보 — 지점별로 필요한 참조 데이터 */
  extra?: Record<string, unknown>;
}

export interface UserExitOutcome {
  /** false 면 표준 로직이 저장을 중단한다 */
  ok: boolean;
  /** 사용자에게 보여줄 메시지 */
  message?: string;
  /** 경고만 하고 진행할지 (ok=true 와 함께 쓴다) */
  warn?: boolean;
}

export interface UserExit {
  id: string;
  label: string;
  point: UserExitPoint;
  /** 이 Exit 이 활성화되기 위해 필요한 권한. 없으면 항상 활성. */
  requires?: { moduleId: string; level: PermLevel };
  run: (ctx: UserExitContext) => UserExitOutcome;
}

export interface UserExitRunResult {
  /** 전체 통과 여부 — 하나라도 ok=false 면 false */
  ok: boolean;
  /** 실행된 Exit 의 메시지 */
  messages: string[];
  /** 권한 미충족으로 건너뛴 Exit */
  bypassed: { id: string; label: string; reason: string }[];
  /** 실행된 Exit id */
  executed: string[];
}

const registry: UserExit[] = [];

/** Exit 을 등록한다. 같은 id 는 덮어쓴다(HMR 중복 등록 방지). */
export function registerUserExit(exit: UserExit) {
  const idx = registry.findIndex((e) => e.id === exit.id);
  if (idx >= 0) registry[idx] = exit;
  else registry.push(exit);
}

export const listUserExits = (point?: UserExitPoint) =>
  point ? registry.filter((e) => e.point === point) : [...registry];

/** 테스트에서 레지스트리를 비운다. */
export function clearUserExits() {
  registry.length = 0;
}

/**
 * 지점의 Exit 들을 순서대로 실행한다.
 * @param hasPermission 권한 판정 함수 — 화면에서 useAuthz().can 을 넘긴다.
 */
export function runUserExits(
  point: UserExitPoint,
  ctx: UserExitContext,
  hasPermission: (moduleId: string, level: PermLevel) => boolean
): UserExitRunResult {
  const result: UserExitRunResult = { ok: true, messages: [], bypassed: [], executed: [] };

  for (const exit of registry.filter((e) => e.point === point)) {
    if (exit.requires && !hasPermission(exit.requires.moduleId, exit.requires.level)) {
      result.bypassed.push({
        id: exit.id,
        label: exit.label,
        reason: `${exit.requires.moduleId} ${exit.requires.level} 권한 없음`,
      });
      continue;
    }
    let outcome: UserExitOutcome;
    try {
      outcome = exit.run(ctx);
    } catch (error) {
      // Exit 의 오류가 표준 로직을 깨뜨리지 않게 한다.
      // 다만 조용히 넘기지 않고 차단해 잘못된 저장을 막는다.
      outcome = { ok: false, message: `${exit.label} 실행 중 오류: ${error instanceof Error ? error.message : String(error)}` };
    }
    result.executed.push(exit.id);
    if (outcome.message) {
      const mark = outcome.ok ? (outcome.warn ? "⚠️" : "✅") : "⛔";
      result.messages.push(`${mark} ${exit.label}: ${outcome.message}`);
    }
    if (!outcome.ok) result.ok = false;
  }
  return result;
}
