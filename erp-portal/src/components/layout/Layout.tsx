import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Gnb from "./Gnb";
import CopilotPanel from "./CopilotPanel";
import StatusBar from "./StatusBar";

export default function Layout() {
  const [copilotOpen, setCopilotOpen] = useState(true);

  return (
    <div className="h-full flex flex-col">
      <Header onToggleCopilot={() => setCopilotOpen((v) => !v)} />
      <div className="flex-1 flex min-h-0">
        <Gnb />
        <main className="flex-1 min-w-0 overflow-y-auto p-4">
          <Outlet />
        </main>
        {copilotOpen && <CopilotPanel />}
      </div>
      <StatusBar />
    </div>
  );
}
