import { AdminAlertCards } from "@/features/admin/components/AdminAlertCards";
import { PatientSearchAndStats } from "@/features/admin/components/PatientSearchAndStats";
import { AnalyticsAndMaps } from "@/features/admin/components/AnalyticsAndMaps";
import { ResourceAllocation } from "@/features/admin/components/ResourceAllocation";
import { NgoSection } from "@/features/admin/components/NgoSection";
import { ReferralMap } from "@/features/admin/components/ReferralMap";

export function AdminDashboardPage() {
  return (
    <div className="admin-page">
      <div className="admin-layout">
        <main className="admin-main-content">
          <header className="admin-topbar">
            <div className="admin-topbar-left">
              <h1 className="admin-page-title">📊 Admin Dashboard</h1>
              <p className="admin-page-sub">Real-time overview of public health activities and insights</p>
            </div>
            <div className="admin-topbar-right">
              <div className="admin-date-filter">📅 01 May 2024 – 31 May 2024 ▾</div>
              <div className="admin-role-badge">Role: Administrator ▾</div>
              <div className="admin-notif-btn">🔔 <span className="admin-notif-count">2</span></div>
              <div className="admin-avatar">A <span>Admin ▾</span></div>
            </div>
          </header>

          <div className="admin-content-scroll">
            <AdminAlertCards />
            <PatientSearchAndStats />
            <div className="admin-middle-grid">
              <AnalyticsAndMaps />
              <ResourceAllocation />
            </div>
            <div className="admin-bottom-grid">
              <NgoSection />
              <ReferralMap />
            </div>

            <div className="admin-footer">
              <span>© 2025 AAYU.</span>
              <span>All rights reserved.</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
