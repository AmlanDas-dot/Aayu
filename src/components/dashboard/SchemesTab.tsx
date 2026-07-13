import React, { useState } from 'react';
import { DashboardData } from '../../data/dashboardMock';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface SchemesTabProps {
  schemes: DashboardData['schemes'];
}

export const SchemesTab: React.FC<SchemesTabProps> = ({ schemes }) => {
  const [showList, setShowList] = useState(false);

  return (
    <div className="schemes-tab">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Eligible Households</div>
          <div className="metric-value">{schemes.eligible.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Applications Submitted</div>
          <div className="metric-value">{schemes.applied.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label" style={{ color: '#16a34a' }}>Approved</div>
          <div className="metric-value">{schemes.approved.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label" style={{ color: '#ea580c' }}>Pending Approval</div>
          <div className="metric-value">{schemes.pending.toLocaleString()}</div>
        </div>
      </div>

      <div className="dashboard-section mt-6" style={{ cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setShowList(!showList)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="dashboard-section-title" style={{ margin: 0 }}>
            <ShieldCheck size={20} className="text-teal" />
            View Household Scheme Roster
          </h3>
          <ArrowRight size={20} className="text-gray" style={{ transform: showList ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>

        {showList && (
          <div style={{ marginTop: '24px' }}>
            <div className="dashboard-filters">
              <select className="filter-select"><option>Status: Pending</option><option>Status: Approved</option></select>
              <select className="filter-select"><option>Scheme: Ayushman Bharat</option></select>
            </div>
            
            <div className="activity-timeline" style={{ marginTop: '16px' }}>
              <div className="activity-item">
                <div className="activity-dot" style={{ background: '#ea580c', borderColor: '#ffedd5' }} />
                <div className="activity-content">
                  <span className="activity-time">Kumar Household (AAYU-HH-847291)</span>
                  <span className="activity-desc">Pending Verification - PM-JAY</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-dot" style={{ background: '#16a34a', borderColor: '#dcfce7' }} />
                <div className="activity-content">
                  <span className="activity-time">Singh Household (AAYU-HH-847292)</span>
                  <span className="activity-desc">Approved - PM-JAY</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
