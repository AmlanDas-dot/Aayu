import React, { useState } from 'react';
import type { DashboardData } from '../../types/dashboard';
import { ChevronDown, ChevronUp, UserCheck, MapPin, CheckCircle, Clock } from 'lucide-react';

interface WorkersTabProps {
  workers: DashboardData['workers'];
}

export const WorkersTab: React.FC<WorkersTabProps> = ({ workers }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className="workers-tab">
      <div className="dashboard-filters">
        <select className="filter-select"><option>Village: All</option></select>
        <select className="filter-select"><option>Status: All</option></select>
        <input type="text" className="filter-select" placeholder="Search ASHA Worker..." style={{ minWidth: '240px' }} />
      </div>

      <div className="workers-cards">
        {workers.map(worker => (
          <div key={worker.id} className="expandable-card">
            <div className="expandable-header" onClick={() => toggleCard(worker.id)}>
              <div className="expandable-title">
                <UserCheck size={20} className="text-teal" />
                {worker.name}
              </div>
              <div className="expandable-stats">
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{worker.familiesCovered} Families</div>
                {expandedCard === worker.id ? <ChevronUp size={20} className="text-gray" /> : <ChevronDown size={20} className="text-gray" />}
              </div>
            </div>
            
            {expandedCard === worker.id && (
              <div className="expandable-body" style={{ paddingTop: '20px' }}>
                <div className="dashboard-grid-2">
                  <div className="dashboard-section" style={{ padding: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <MapPin size={16} /> Assigned Villages
                    </h4>
                    <div className="pill-group">
                      {worker.assignedVillages.map((v, i) => <span key={i} className="pill">{v}</span>)}
                    </div>
                  </div>
                  
                  <div className="dashboard-section" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}><CheckCircle size={18} className="text-teal" /> Completed Visits</span>
                      <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>{worker.completedVisits}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}><Clock size={18} style={{ color: '#ea580c' }} /> Pending Visits</span>
                      <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#ea580c' }}>{worker.pendingVisits}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
