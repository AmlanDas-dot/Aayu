import { useState, type ReactNode } from "react";
import { AayuSidebar } from "../navigation/AayuSidebar";
import { AayuHeader } from "../navigation/AayuHeader";
import { DisclaimerBanner } from "../ui/DisclaimerBanner";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [language, setLanguage] = useState("en");

  return (
    <div className="aayu-shell">
      <AayuSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <div className={`aayu-main ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <AayuHeader
          language={language}
          onLanguageChange={setLanguage}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
        <DisclaimerBanner />
        <main className="aayu-content">{children}</main>
      </div>
    </div>
  );
}
