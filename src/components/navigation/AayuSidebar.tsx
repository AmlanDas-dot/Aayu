import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/chat", label: "Chat with AAYU", icon: "💬" },
  { path: "/search", label: "Search", icon: "🔍" },
  { path: "/nutrition", label: "Nutrition", icon: "🥗" },
  { path: "/schemes", label: "Gov. Schemes", icon: "🏛️" },
  { path: "/settings", label: "Settings", icon: "⚙️" },
];

interface AayuSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AayuSidebar({ isOpen, onToggle }: AayuSidebarProps) {
  return (
    <aside className={`aayu-sidebar ${isOpen ? "open" : "collapsed"}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-icon">🌿</span>
          {isOpen && (
            <div className="brand-text">
              <span className="brand-name">AAYU</span>
              <span className="brand-tagline">AI Health Assistant</span>
            </div>
          )}
        </div>
        <button className="sidebar-toggle-btn" onClick={onToggle} aria-label="Toggle sidebar">
          {isOpen ? "◀" : "▶"}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {isOpen && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {isOpen && (
        <div className="sidebar-footer">
          <div className="offline-badge">
            <span className="offline-dot" />
            <span>Offline Mode</span>
          </div>
          <p className="sidebar-privacy">Works without internet connection</p>
        </div>
      )}
    </aside>
  );
}
