import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { bootstrapBackend, isRestConfigured, setIdentityProvider } from "./services/restBackend";
import { getCurrentUser } from "./services/session";
import { registerDefaultUserExits } from "./services/userExitDefaults";
import { hydrateFromBackend, primeIdBlock, setWriteFailureHandler } from "./services/store";

const render = () =>
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );

// 서버 인가 재검증용 신원 제공자 주입 (순환 import 회피)
setIdentityProvider(getCurrentUser);

// 기본 User Exit 등록 — 권한에 따라 활성/바이패스된다
registerDefaultUserExits();

setWriteFailureHandler((message) => {
  console.error(`[ERP store] ${message}`);
  alert(`⚠️ ${message}`);
});

// REST 백엔드가 설정된 경우에만 스냅샷을 먼저 받아 seed 가 잠깐 보이는 것을 막는다.
// 서버에 닿지 못하면 localStorage 모드로 그대로 렌더한다.
// 부트스트랩 동안 화면이 비지 않도록 index.html 의 스플래시가 남아 있다가 렌더 시 교체된다.
if (isRestConfigured()) {
  bootstrapBackend()
    .then(async () => {
      hydrateFromBackend();
      // 렌더 전에 ID 구간을 확보해 첫 신규 등록부터 서버 순번을 쓰게 한다.
      await primeIdBlock();
    })
    .finally(render);
} else {
  render();
}
