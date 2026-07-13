import { useState, useEffect } from 'react';
import { DashboardTabs, TabName } from '../components/dashboard/DashboardTabs';
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { PopulationTab } from '../components/dashboard/PopulationTab';
import { SurveillanceTab } from '../components/dashboard/SurveillanceTab';
import { EnvironmentTab } from '../components/dashboard/EnvironmentTab';
import { WorkersTab } from '../components/dashboard/WorkersTab';
import { SchemesTab } from '../components/dashboard/SchemesTab';
import { AlertsTab } from '../components/dashboard/AlertsTab';
import { getDashboardData } from '../services/dashboardService';
import { DashboardData } from '../data/dashboardMock';
import './AdminDashboardPage.css';

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabName>('Overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getDashboardData();
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, []);

  const renderTabContent = () => {
    if (!data) return null;

    switch (activeTab) {
      case 'Overview':
        return <OverviewTab overview={data.overview} />;
      case 'Population':
        return <PopulationTab population={data.population} />;
      case 'Surveillance':
        return <SurveillanceTab diseases={data.diseases} />;
      case 'Environment':
        return <EnvironmentTab environment={data.environment} />;
      case 'Workers':
        return <WorkersTab workers={data.workers} />;
      case 'Schemes':
        return <SchemesTab schemes={data.schemes} />;
      case 'Alerts':
        return <AlertsTab alerts={data.alerts} />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <main className="admin-main-content">
          <header className="admin-topbar">
            <div className="admin-topbar-left">
              <h1 className="admin-page-title">📊 Public Health Intelligence</h1>
              <p className="admin-page-sub">Real-time overview of district health activities and insights</p>
            </div>
            <div className="admin-topbar-right">
              <div className="admin-date-filter">📅 Today ▾</div>
              <div className="admin-role-badge">Role: DHO ▾</div>
              <div className="admin-notif-btn">🔔 <span className="admin-notif-count">3</span></div>
              <div className="admin-avatar">A <span>Admin ▾</span></div>
            </div>
          </header>

          <div className="admin-content-scroll" style={{ padding: '0 24px 24px 24px' }}>
            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading dashboard data...
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
