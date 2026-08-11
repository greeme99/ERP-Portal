import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Gnb from "./Gnb";
import CopilotPanel from "./CopilotPanel";
import StatusBar from "./StatusBar";
import E2eDemoGuideWidget from "./E2eDemoGuideWidget";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [demoPlaybookOpen, setDemoPlaybookOpen] = useState(false);

  return (
    <div className="h-full flex flex-col relative">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        copilotOpen={copilotOpen}
        onToggleCopilot={() => setCopilotOpen((v) => !v)}
      />
      <div className="flex-1 flex min-h-0">
        {sidebarOpen && <Gnb />}
        <main className="flex-1 min-w-0 overflow-y-auto p-4">
          <Outlet />
        </main>
        {copilotOpen && <CopilotPanel />}
      </div>
      <StatusBar
        demoPlaybookOpen={demoPlaybookOpen}
        onToggleDemoPlaybook={() => setDemoPlaybookOpen((v) => !v)}
      />
      {demoPlaybookOpen && (
        <E2eDemoGuideWidget onClose={() => setDemoPlaybookOpen(false)} />
      )}
    </div>
  );
}


