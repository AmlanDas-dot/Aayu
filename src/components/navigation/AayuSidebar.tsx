import { NavLink } from "react-router-dom";
import logoHeart from "@/assets/logo-heart.png";
import Whatsapp from "@/assets/whatsapp.png";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission, PERMISSION } from "@/rbac/permissions";

interface AayuSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  requiredPermission?: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Home", icon: "fa-solid fa-house", requiredPermission: PERMISSION.DASHBOARD_PERSONAL_VIEW },
  { path: "/chat", label: "Chat with Aayu", icon: "fa-regular fa-clipboard", requiredPermission: PERMISSION.ASSISTANT_USE },
  { path: "/nutrition", label: "Nutrition", icon: "fa-solid fa-seedling", requiredPermission: PERMISSION.ASSISTANT_USE },
  { path: "/schemes", label: "Schemes", icon: "fa-solid fa-file-medical", requiredPermission: PERMISSION.ASSISTANT_USE },
  { path: "/hospitals", label: "Nearby care", icon: "fa-solid fa-location-dot", requiredPermission: PERMISSION.HOSPITALS_NEARBY },
  { path: "/records", label: "Records", icon: "fa-regular fa-file-lines", requiredPermission: PERMISSION.RECORDS_READ },
  { path: "/medications", label: "Medications", icon: "fa-solid fa-pills", requiredPermission: PERMISSION.MEDICATIONS_MANAGE },
  { path: "/recovery", label: "Behavioral Health", icon: "fa-solid fa-heart-pulse", requiredPermission: PERMISSION.ASSISTANT_USE },
  { path: "/environment", label: "Environmental Health", icon: "fa-solid fa-leaf", requiredPermission: PERMISSION.ENVIRONMENT_VIEW },
  { path: "/alerts", label: "Alerts & Updates", icon: "fa-regular fa-bell", requiredPermission: PERMISSION.EMERGENCY_USE },
  { path: "/family", label: "Family and sharing", icon: "fa-solid fa-users", requiredPermission: PERMISSION.FAMILY_MANAGE },
  { path: "/disaster", label: "Disaster aid", icon: "fa-solid fa-person-drowning", requiredPermission: PERMISSION.EMERGENCY_USE },
  { path: "/asha", label: "ASHA Dashboard", icon: "fa-solid fa-user-nurse", requiredPermission: PERMISSION.DASHBOARD_ASHA_VIEW },
  { path: "/doctor", label: "Doctor Dashboard", icon: "fa-solid fa-user-doctor", requiredPermission: PERMISSION.DASHBOARD_DOCTOR_VIEW },
  { path: "/admin", label: "Admin Dashboard", icon: "fa-solid fa-user-shield", requiredPermission: PERMISSION.DASHBOARD_ADMIN_VIEW },
];

export function AayuSidebar({ isOpen, onToggle }: AayuSidebarProps) {
  const { hasPermission } = usePermissions();
  const visibleNavItems = NAV_ITEMS.filter((item) => (
    !item.requiredPermission || hasPermission(item.requiredPermission)
  ));

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
        {visibleNavItems.map((item) => (
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
