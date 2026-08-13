// 현재 로그인 사용자 세션.
//
// EntityStore 를 쓰지 않는다 — REST 모드에서는 store 가 서버에 저장되므로
// 세션을 store 에 두면 "현재 사용자"가 모든 클라이언트에 공유돼 버린다.
// 세션은 브라우저별 상태이므로 localStorage 에만 둔다.
//
// 비밀번호를 다루지 않는다(프로젝트 보안 규칙). 사용자 전환은 데모용이며
// 실제 인증은 운영 전환 시 서버에서 구현해야 한다.
import { useSyncExternalStore } from "react";
import { Entity, useStore } from "./store";
import { userStore } from "../data/mock/platform";

const SESSION_KEY = "erp-portal:prototype:v1:session-user";
const DEFAULT_USER_ID = "U-1001";

const listeners = new Set<() => void>();
let currentUserId = readStored() ?? DEFAULT_USER_ID;

function readStored(): string | null {
  try {
    const raw = globalThis.localStorage?.getItem(SESSION_KEY);
    return raw && raw.length <= 64 ? raw : null;
  } catch {
    return null;
  }
}

export const getCurrentUserId = () => currentUserId;

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 사용자를 전환한다. 알 수 없는 id 는 무시한다. */
export function setCurrentUserId(userId: string) {
  if (userId === currentUserId) return;
  if (!userStore.getAll().some((u) => u.id === userId)) return;
  currentUserId = userId;
  try {
    globalThis.localStorage?.setItem(SESSION_KEY, userId);
  } catch {
    // 저장에 실패해도 이번 세션에서는 전환된 상태로 동작한다
  }
  listeners.forEach((l) => l());
}

/** 현재 사용자. 세션 id 가 유효하지 않으면 첫 활성 사용자로 대체한다. */
export function useCurrentUser(): Entity | undefined {
  const users = useStore(userStore);
  const id = useSyncExternalStore(subscribeSession, getCurrentUserId, getCurrentUserId);
  return users.find((u) => u.id === id) ?? users.find((u) => u.status === "활성");
}

/** 화면 밖(서버 요청 헤더 등)에서 쓰기 위한 동기 조회. */
export function getCurrentUser(): Entity | undefined {
  const users = userStore.getAll();
  return users.find((u) => u.id === currentUserId) ?? users.find((u) => u.status === "활성");
}
