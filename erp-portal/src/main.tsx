import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { bootstrapBackend, isRestConfigured } from "./services/restBackend";
import { hydrateFromBackend, setWriteFailureHandler } from "./services/store";

const render = () =>
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );

setWriteFailureHandler((message) => {
  console.error(`[ERP store] ${message}`);
  alert(`⚠️ ${message}`);
});

// REST 백엔드가 설정된 경우에만 스냅샷을 먼저 받아 seed 가 잠깐 보이는 것을 막는다.
// 서버에 닿지 못하면 localStorage 모드로 그대로 렌더한다.
if (isRestConfigured()) {
  bootstrapBackend()
    .then(() => hydrateFromBackend())
    .finally(render);
} else {
  render();
}
