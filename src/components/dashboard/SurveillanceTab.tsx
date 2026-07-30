import React, { useState } from 'react';
import type { DashboardData } from '../../types/dashboard';
import { ChevronDown, ChevronUp, Bug, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SurveillanceTabProps {
  diseases: DashboardData['diseases'];
}

export const SurveillanceTab: React.FC<SurveillanceTabProps> = ({ diseases }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const renderTrend = (trend: string) => {
    switch (trend) {
      case 'up': return <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={16} /> Rising</span>;
      case 'down': return <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingDown size={16} /> Falling</span>;
      default: return <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Minus size={16} /> Stable</span>;
    }
  };

  return (
    <div className="surveillance-tab">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', color: 'var(--text)' }}>Top Diseases Under Surveillance</h2>
      
      <div className="surveillance-cards">
        {diseases.map(disease => (
          <div key={disease.id} className="expandable-card">
            <div className="expandable-header" onClick={() => toggleCard(disease.id)}>
              <div className="expandable-title">
                <Bug size={20} className="text-teal" />
                {disease.name}
              </div>
              <div className="expandable-stats">
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{disease.cases} Cases</div>
                {renderTrend(disease.trend)}
                {expandedCard === disease.id ? <ChevronUp size={20} className="text-gray" /> : <ChevronDown size={20} className="text-gray" />}
              </div>
            </div>
            
            {expandedCard === disease.id && (
              <div className="expandable-body" style={{ paddingTop: '20px' }}>
                <div className="dashboard-grid-2" style={{ gap: '16px' }}>
                  <div>
                    <div className="dashboard-section" style={{ padding: '16px' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-muted)' }}>Affected Villages</h4>
                      <div className="pill-group">
                        {disease.affectedVillages.map((v, i) => <span key={i} className="pill">{v}</span>)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="dashboard-section" style={{ padding: '16px' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-muted)' }}>Age Groups at Risk</h4>
                      <div style={{ fontWeight: 600 }}>{disease.ageGroups}</div>
                    </div>
                  </div>
                </div>
                
                <div className="dashboard-section mt-4" style={{ padding: '16px', background: '#f0fdfa', borderColor: '#ccfbf1' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#0f766e' }}>Recommendations</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#0f766e' }}>
                    {disease.recommendations.map((rec, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
