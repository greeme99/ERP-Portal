/// <reference types="vite/client" />

// VITE_API_URL 이 있으면 REST 백엔드 모드, 없으면 localStorage 프로토타입 모드로 동작한다.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// restBackend 는 Node(E2E·CI)에서도 동작하며 ERP_API_URL 을 읽는다.
// 이 한 곳 때문에 @types/node 를 의존성으로 추가하지 않고 필요한 만큼만 선언한다.
declare const process: { env?: Record<string, string | undefined> } | undefined;
