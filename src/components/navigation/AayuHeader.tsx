import { Menu, Search, Bell, User, ChevronDown } from "lucide-react";
import { LANGUAGES } from "../../constants/languages";
import { Link, useLocation } from "react-router-dom";

interface AayuHeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  onMenuToggle: () => void;
}

export function AayuHeader({ language, onLanguageChange, onMenuToggle }: AayuHeaderProps) {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/chat": return "Chat with AAYU";
      case "/nutrition": return "Nutrition Guide";
      case "/schemes": return "Government Schemes";
      case "/settings": return "Settings";
      case "/admin": return "Admin Dashboard";
      case "/search": return "Knowledge Search";
      default: return "Dashboard";
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-4 px-4 lg:px-6 bg-white border-b border-slate-200">
      {/* Left side: Mobile menu toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">
          {getPageTitle()}
        </h1>
      </div>

      {/* Middle: Global Search (Desktop only) */}
      <div className="flex-1 max-w-xl hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500" />
          <input
            type="text"
            placeholder="Search symptoms, diseases, schemes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
      </div>

      {/* Right side: Language, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Language Selector */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 text-sm font-medium text-slate-600 transition-colors">
            {LANGUAGES[language as keyof typeof LANGUAGES] || "English"}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          
          <div className="absolute right-0 top-full mt-1 w-40 py-2 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <button
                key={code}
                onClick={() => onLanguageChange(code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-teal-50 transition-colors ${
                  language === code ? "text-teal-600 font-medium bg-teal-50/50" : "text-slate-600"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors" aria-label="Profile">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
