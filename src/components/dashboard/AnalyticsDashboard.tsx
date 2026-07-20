import React from 'react';
import { VillageData } from '../../types/Jurisdiction';
import { Activity, Shield, Users, HeartPulse, Stethoscope, Droplets, Baby } from 'lucide-react';

interface AnalyticsDashboardProps {
  village: VillageData;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ village }) => {
  return (
    <div className="analytics-dashboard" style={{ padding: '24px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>{village.name} - Operations Center</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px' }}>
            <Users size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Population</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{village.population.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{village.families} families</div>
        </div>
        
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px' }}>
            <Activity size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Health Score</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: (village.healthScore || 0) > 80 ? '#10b981' : (village.healthScore || 0) > 50 ? '#facc15' : '#ef4444' }}>
            {village.healthScore || 0} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 400 }}>/ 100</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Trend: {village.trend}</div>
        </div>
        
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px' }}>
            <Shield size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Vaccination</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: village.vaccinationCoverage >= 85 ? '#10b981' : '#f97316' }}>{village.vaccinationCoverage}%</div>
          <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '3px', marginTop: '8px' }}>
            <div style={{ width: `${village.vaccinationCoverage}%`, background: village.vaccinationCoverage >= 85 ? '#10b981' : '#f97316', height: '100%', borderRadius: '3px' }}></div>
          </div>
        </div>
        
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px' }}>
            <HeartPulse size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Disease Risk</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{village.dominantDisease}</div>
          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: 500 }}>{village.recentCases} recent cases</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a' }}>AI Insights & Recommendations</h4>
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '16px', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0369a1', lineHeight: 1.5 }}>
              {village.aiInsight}
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#0284c7' }}>
              {village.recommendations?.map((r: string, i: number) => (
                <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a' }}>Healthcare Infrastructure</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Stethoscope size={14} /> ASHA Workers</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{village.assignedWorkers} active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Baby size={14} /> Maternal Health</span>
              <span style={{ fontWeight: 600, color: village.maternalHealth === 'Stable' ? '#10b981' : '#f97316' }}>{village.maternalHealth}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Droplets size={14} /> Water Safety</span>
              <span style={{ fontWeight: 600, color: village.waterSafety === 'Safe' ? '#10b981' : '#ef4444' }}>{village.waterSafety}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
