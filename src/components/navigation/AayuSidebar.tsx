import { NavLink } from "react-router-dom";
import logoHeart from "@/assets/logo-heart.png";
import Whatsapp from "@/assets/whatsapp.png";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission, PERMISSION } from "@/rbac/permissions";
import { Menu, X } from "lucide-react";

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

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: "AI Assistant",
    items: [
      { path: "/", label: "Home", icon: "fa-solid fa-house", requiredPermission: PERMISSION.DASHBOARD_PERSONAL_VIEW },
      { path: "/chat", label: "Talk to AAYU", icon: "fa-solid fa-comment-medical", requiredPermission: PERMISSION.ASSISTANT_USE },
    ]
  },
  {
    groupLabel: "My Care",
    items: [
      { path: "/records", label: "Medical Records", icon: "fa-solid fa-file-medical", requiredPermission: PERMISSION.RECORDS_READ },
      { path: "/medications", label: "Medications", icon: "fa-solid fa-pills", requiredPermission: PERMISSION.MEDICATIONS_MANAGE },
    ]
  },
  {
    groupLabel: "Community",
    items: [
      { path: "/hospitals", label: "Nearby Care", icon: "fa-solid fa-hospital", requiredPermission: PERMISSION.HOSPITALS_NEARBY },
      { path: "/environment", label: "Environment", icon: "fa-solid fa-leaf", requiredPermission: PERMISSION.ENVIRONMENT_VIEW },
      { path: "/alerts", label: "Local Alerts", icon: "fa-solid fa-bell", requiredPermission: PERMISSION.EMERGENCY_USE },
    ]
  },
  {
    groupLabel: "Portals",
    items: [
      { path: "/asha", label: "ASHA Dashboard", icon: "fa-solid fa-user-nurse", requiredPermission: PERMISSION.DASHBOARD_ASHA_VIEW },
      { path: "/doctor", label: "Doctor Dashboard", icon: "fa-solid fa-user-doctor", requiredPermission: PERMISSION.DASHBOARD_DOCTOR_VIEW },
      { path: "/admin", label: "Admin Dashboard", icon: "fa-solid fa-user-shield", requiredPermission: PERMISSION.DASHBOARD_ADMIN_VIEW },
    ]
  }
];

export function AayuSidebar({ isOpen, onToggle }: AayuSidebarProps) {
  const { hasPermission } = usePermissions();

  return (
    <aside className={`sidebar flex-shrink-0 ${isOpen ? "" : "collapsed"}`}>
      <div className="sidebar-header" style={{ padding: "16px 20px" }}>
        <button className="sidebar-brand" style={{ cursor: "pointer", background: 'transparent', border: 'none', padding: 0, textAlign: 'left', font: 'inherit', color: 'inherit' }} onClick={() => { if(!isOpen) onToggle(); }} aria-label="Expand sidebar">
          <img src={logoHeart} alt="AAYU Logo" className="brand-logo-img" fetchPriority="high" />
          {isOpen && (
            <div className="brand-text">
              <span className="brand-name">AAYU</span>
              <span className="brand-subtitle">AI Health Assistant</span>
            </div>
          )}
        </button>
        <button 
          className="sidebar-toggle-btn" 
          onClick={onToggle}
          aria-label={isOpen ? "Collapse menu" : "Expand menu"}
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="sidebar-nav" style={{ padding: "0 12px", overflowY: "auto", overflowX: "hidden" }}>
        {NAV_GROUPS.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) => !item.requiredPermission || hasPermission(item.requiredPermission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} style={{ marginBottom: "20px" }}>
              {isOpen && (
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", padding: "0 14px", marginBottom: "8px", letterSpacing: "0.5px" }}>
                  {group.groupLabel}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}
                    title={!isOpen ? item.label : undefined}
                    style={{ padding: "12px 14px", fontSize: "15px", borderRadius: "10px" }}
                  >
                    <i className={`${item.icon} nav-icon-lucide`} style={{ fontSize: "18px", width: "24px", textAlign: "center" }} aria-hidden="true"></i>
                    {isOpen && <span className="nav-label" style={{ fontWeight: 600 }}>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer-extra">
        {isOpen && (
          <div className="whatsapp-card-sidebar">
            <div className="wa-card-top">
              <div className="wa-card-icon-wrap">
                <img src={Whatsapp} alt="WhatsApp" style={{ width: 28, height: 28 }} loading="lazy" decoding="async" />
              </div>
              <div className="wa-card-text">
                <span className="wa-title-need-help">Need Help?</span>
                <span className="wa-title-chat">Chat on WhatsApp</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
