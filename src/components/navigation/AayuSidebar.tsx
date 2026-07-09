import { NavLink } from "react-router-dom";
import logoHeart from "../../assets/logo-heart.png";
import Whatsapp from "../../assets/whatsapp.png";

interface AayuSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: "fa-solid fa-house" },
  { path: "/chat", label: "Chat with Aayu", icon: "fa-regular fa-clipboard" },
  { path: "/nutrition", label: "Nutrition", icon: "fa-solid fa-seedling" },
  { path: "/schemes", label: "Schemes", icon: "fa-solid fa-file-medical" },
  { path: "/hospitals", label: "Nearby care", icon: "fa-solid fa-location-dot" },
  { path: "/records", label: "Records", icon: "fa-regular fa-file-lines" },
  { path: "/resources", label: "Resources", icon: "fa-solid fa-book-open" },
  { path: "/environment", label: "Environmental Health", icon: "fa-solid fa-leaf" },
  { path: "/alerts", label: "Alerts & Updates", icon: "fa-regular fa-bell" },
  { path: "/family", label: "Family and sharing", icon: "fa-solid fa-users" },
  { path: "/disaster", label: "Disaster aid", icon: "fa-solid fa-person-drowning" },
  { path: "/admin", label: "Admin Dashboard", icon: "fa-solid fa-user-shield" },
];

export function AayuSidebar({ isOpen, onToggle }: AayuSidebarProps) {
  return (
    <aside className={`sidebar flex-shrink-0 ${isOpen ? "" : "collapsed"}`}>
      <div className="logo" onClick={onToggle} style={{ cursor: "pointer" }} title={isOpen ? "Collapse" : "Expand"}>
        <div className="logo-image">
          <img src={logoHeart} alt="AAYU Logo" />
        </div>
        <div className="logo-text">
          <p>AI Powered Public Health Assistant</p>
        </div>
      </div>

      <div className="menu">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{ textDecoration: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
            title={!isOpen ? item.label : undefined}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="whatsapp">
        <div className="whatsapp-header">
          <img src={Whatsapp} alt="WhatsApp icon" />
          <h4>Chat on WhatsApp</h4>
        </div>
        <p style={{ marginTop: '10px', color: '#64748b' }}>
          Ask questions, upload reports and receive guidance.
        </p>
      </div>

      <div style={{ marginTop: 'auto', padding: '16px', fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
        Powered by OpenAI, Sarvam AI, Google Places, Verified Medical Knowledge
      </div>

      <div className="offline">
        {isOpen ? "" : ""}
      </div>
    </aside>
  );
}
