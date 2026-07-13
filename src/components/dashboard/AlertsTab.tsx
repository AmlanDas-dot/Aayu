import React, { useState } from 'react';
import { DashboardData } from '../../data/dashboardMock';
import { ChevronDown, ChevronUp, AlertTriangle, MapPin } from 'lucide-react';

interface AlertsTabProps {
  alerts: DashboardData['alerts'];
}

export const AlertsTab: React.FC<AlertsTabProps> = ({ alerts }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const getAlertIconColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return '#dc2626';
      case 'High': return '#ea580c';
      case 'Warning': return '#ca8a04';
      default: return '#64748b';
    }
  };

  return (
    <div className="alerts-tab">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', color: 'var(--text)' }}>Active District Alerts</h2>

      <div className="alerts-list">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert-card ${alert.severity}`}>
            <div className="alert-header" style={{ cursor: 'pointer' }} onClick={() => toggleCard(alert.id)}>
              <div>
                <div className="alert-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} style={{ color: getAlertIconColor(alert.severity) }} />
                  {alert.title}
                </div>
                <div className="alert-location" style={{ marginTop: '8px' }}>
                  <MapPin size={16} /> {alert.location}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', background: '#f1f5f9', marginRight: '16px' }}>
                  {alert.severity}
                </span>
                {expandedCard === alert.id ? <ChevronUp size={20} className="text-gray" /> : <ChevronDown size={20} className="text-gray" />}
              </div>
            </div>
            
            {expandedCard === alert.id && (
              <div className="alert-action">
                <div className="alert-action-title">Recommended Action Protocol</div>
                <div style={{ color: 'var(--text)', lineHeight: 1.5 }}>{alert.recommendedAction}</div>
                <button className="btn-outline mt-4">Dispatch Broadcast Message</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
