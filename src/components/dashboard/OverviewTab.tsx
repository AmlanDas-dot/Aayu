import React from 'react';
import { DashboardData } from '../../data/dashboardMock';
import { Brain, MapPin, Activity } from 'lucide-react';

interface OverviewTabProps {
  overview: DashboardData['overview'];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ overview }) => {
  return (
    <div className="overview-tab">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Population Covered</div>
          <div className="metric-value">{overview.populationCovered.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Families Registered</div>
          <div className="metric-value">{overview.familiesRegistered.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">ASHA Workers</div>
          <div className="metric-value">{overview.ashaWorkers}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">High Risk Cases</div>
          <div className="metric-value metric-trend up">{overview.highRiskCases.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active Alerts</div>
          <div className="metric-value metric-trend up">{overview.activeAlerts}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Today's Visits</div>
          <div className="metric-value">{overview.todaysVisits}</div>
        </div>
      </div>

      <div className="ai-summary-card">
        <div className="ai-summary-header">
          <Brain size={24} />
          <span>AI Public Health Summary</span>
        </div>
        <div className="ai-summary-content">
          {overview.aiSummary}
        </div>
      </div>

      <div className="dashboard-grid-2">
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">
            <MapPin size={20} className="text-teal" />
            Priority Villages
          </h3>
          <div className="priority-village-list">
            {overview.priorityVillages.map(village => (
              <div key={village.id} className="priority-village-card">
                <div className="village-info">
                  <span className="village-name">{village.name}</span>
                  <span className="village-concern">{village.concern}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className={`priority-badge priority-${village.priority}`}>
                    {village.priority}
                  </span>
                  <button className="btn-outline">Take Action</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h3 className="dashboard-section-title">
            <Activity size={20} className="text-teal" />
            Recent Activity
          </h3>
          <div className="activity-timeline">
            {overview.recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-dot" />
                <div className="activity-content">
                  <span className="activity-time">{activity.time}</span>
                  <span className="activity-desc">{activity.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
