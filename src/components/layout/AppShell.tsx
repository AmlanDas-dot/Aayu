import { useState, useEffect, type ReactNode } from "react";
import { AayuSidebar } from "../navigation/AayuSidebar";
import { AayuHeader } from "../navigation/AayuHeader";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [language, setLanguage] = useState("en");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const marginLeft = isMobile ? 0 : sidebarOpen ? 260 : 72;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AayuSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />

      <div
        style={{ marginLeft, width: isMobile ? "100%" : `calc(100% - ${marginLeft}px)` }}
        className="min-h-screen flex flex-col transition-all duration-300"
      >
        <AayuHeader
          language={language}
          onLanguageChange={setLanguage}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        {/* Disclaimer */}
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2">
          <p className="text-xs text-amber-800 text-center font-medium">
            ⚠️ AAYU provides health <strong>guidance</strong>, not diagnosis. Always consult a qualified healthcare professional.
          </p>
        </div>

        <main id="main-content" className="flex-1 p-4 lg:p-6" role="main">
          {children}
        </main>
      </div>

      {/* Mobile overlay when sidebar open */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
