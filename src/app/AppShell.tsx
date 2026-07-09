import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AayuSidebar } from "@/components/navigation/AayuSidebar";
import { AayuHeader } from "@/components/navigation/AayuHeader";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [language, setLanguage] = useState("en");
  const location = useLocation();

  if (location.pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="aayu-shell">
      <AayuSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <div className="aayu-main">
        <AayuHeader
          language={language}
          onLanguageChange={setLanguage}
        />
        <DisclaimerBanner />
        <main className="aayu-content">
          {children}
        </main>
      </div>
    </div>
  );
}
