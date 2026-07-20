import React from 'react';
import { Brain, AlertTriangle, TrendingUp, TrendingDown, ThermometerSun, Info, ShieldAlert } from 'lucide-react';

interface AiObservationPanelProps {
  insights: string[];
}

export const AiObservationPanel: React.FC<AiObservationPanelProps> = ({ insights }) => {
  const getInsightIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('increase') || lower.includes('rise') || lower.includes('spike')) return <TrendingUp size={16} className="text-danger" />;
    if (lower.includes('drop') || lower.includes('decrease') || lower.includes('lower')) return <TrendingDown size={16} className="text-warning" />;
    if (lower.includes('heat') || lower.includes('temperature')) return <ThermometerSun size={16} className="text-warning" />;
    if (lower.includes('alert') || lower.includes('overdue') || lower.includes('critical')) return <AlertTriangle size={16} className="text-danger" />;
    if (lower.includes('recommend') || lower.includes('action')) return <ShieldAlert size={16} className="text-primary" />;
    return <Info size={16} className="text-info" />;
  };

  return (
    <div className="ai-observation-panel" style={{
      background: 'linear-gradient(to right, #f8fafc, #eff6ff)',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #dbeafe', paddingBottom: '8px' }}>
        <div style={{ background: '#3b82f6', padding: '6px', borderRadius: '6px', color: 'white', display: 'flex' }}>
          <Brain size={18} />
        </div>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#1e40af', fontWeight: 'bold' }}>AI Observations & Predictions</h3>
      </div>
      
      {insights.length === 0 ? (
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>No active observations for this region.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {insights.map((insight, idx) => (
            <li key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ marginTop: '2px' }}>
                {getInsightIcon(insight)}
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.4' }}>{insight}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
