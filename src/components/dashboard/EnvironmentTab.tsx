import React from 'react';
import { DashboardData } from '../../data/dashboardMock';
import { Cloud, Sun, Leaf, BellRing, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EnvironmentTabProps {
  environment: DashboardData['environment'];
}

export const EnvironmentTab: React.FC<EnvironmentTabProps> = ({ environment }) => {
  const navigate = useNavigate();

  return (
    <div className="environment-tab">
      <div className="dashboard-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 8px 0' }}>Environmental Health Overview</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>High-level environmental metrics impacting public health.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/environment')}>
          Open Environmental Health <ExternalLink size={16} />
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={16} className="text-teal" /> Air Quality Index
          </div>
          <div className="metric-value">{environment.aqi}</div>
          <div style={{ fontSize: '0.85rem', color: '#ca8a04', fontWeight: 600 }}>{environment.aqiStatus}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={16} style={{ color: '#ea580c' }} /> Heatwave Risk
          </div>
          <div className="metric-value" style={{ color: '#dc2626' }}>{environment.heatRisk}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Exposure</div>
        </div>

        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Leaf size={16} className="text-teal" /> Outdoor Score
          </div>
          <div className="metric-value">{environment.outdoorScore}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Based on combined metrics</div>
        </div>

        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BellRing size={16} style={{ color: '#dc2626' }} /> Active Env Alerts
          </div>
          <div className="metric-value">{environment.activeEnvAlerts}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Require immediate action</div>
        </div>
      </div>
    </div>
  );
};
