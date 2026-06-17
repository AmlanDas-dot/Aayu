import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  MessageSquare, 
  Search, 
  Apple, 
  FileText, 
  Settings,
  Activity,
  ChevronLeft,
  ServerCrash
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AayuSidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/chat", label: "Chat with AAYU", icon: MessageSquare },
    { path: "/search", label: "Search", icon: Search },
    { path: "/nutrition", label: "Nutrition", icon: Apple },
    { path: "/schemes", label: "Gov. Schemes", icon: FileText },
    { path: "/admin", label: "Admin Panel", icon: Activity },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen z-40 flex flex-col
        bg-white border-r border-slate-200
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-[260px]" : "w-[72px]"}
        max-lg:translate-x-0
      `}
      aria-label="Sidebar Navigation"
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
        <div className={`flex items-center gap-3 overflow-hidden ${!isOpen && "justify-center w-full"}`}>
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 tracking-tight leading-none">AAYU</span>
              <span className="text-[10px] text-slate-500 font-medium">AI Health Assistant</span>
            </div>
          )}
        </div>
        
        {isOpen && (
          <button 
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors hidden lg:block"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group
                ${isActive 
                  ? "bg-teal-50 text-teal-700 font-medium" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }
                ${!isOpen && "justify-center"}
              `}
              title={!isOpen ? item.label : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-full" />
              )}
              <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}`} />
              {isOpen && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area / Status */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <div className={`flex items-center gap-3 ${!isOpen && "justify-center"}`}>
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-teal-700">Offline Ready</span>
              <span className="text-[10px] text-slate-500">Works without internet</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
