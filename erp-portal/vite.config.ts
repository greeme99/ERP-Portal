import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // 상대 경로 — dist/index.html 파일 직접 열기 지원 (HashRouter)
  server: { port: 5173, open: true },
});
