import React from 'react';
import { AlertTriangle, Clock, MapPin, ShieldAlert, CloudRain, Wind, Activity, Newspaper, ChevronRight } from 'lucide-react';
import './AlertCard.css';

export interface AlertData {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  severity: string;
  state: string;
  district: string;
  village: string;
  created_at: string;
  expires_at: string;
  source: string;
  status: string;
  recommendations?: string[];
  doctor_actions?: string[];
  asha_actions?: string[];
  citizen_actions?: string[];
  hospital_actions?: string[];
  ai_summary?: string;
}

interface AlertCardProps {
  alert: AlertData;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const getIcon = () => {
    switch (alert.category.toLowerCase()) {
      case 'weather': return <CloudRain size={20} />;
      case 'heatwave': return <AlertTriangle size={20} />;
      case 'air quality': return <Wind size={20} />;
      case 'disease outbreak': return <Activity size={20} />;
      case 'vaccination campaign': return <ShieldAlert size={20} />;
      default: return <Newspaper size={20} />;
    }
  };

  const severityColor = {
    'Low': 'bg-green-100 text-green-800 border-green-200',
    'Informational': 'bg-blue-100 text-blue-800 border-blue-200',
    'Moderate': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'High': 'bg-orange-100 text-orange-800 border-orange-200',
    'Critical': 'bg-red-100 text-red-800 border-red-200'
  }[alert.severity] || 'bg-gray-100 text-gray-800';

  return (
    <div className={`alert-card border-l-4 ${
      alert.severity === 'Critical' ? 'border-red-500' : 
      alert.severity === 'High' ? 'border-orange-500' : 
      alert.severity === 'Moderate' ? 'border-yellow-500' : 'border-green-500'
    }`}>
      <div className="alert-header">
        <div className="alert-meta">
          <span className={`alert-badge ${severityColor}`}>
            {alert.severity}
          </span>
          <span className="alert-category flex items-center gap-1 text-slate-600 text-sm">
            {getIcon()} {alert.category}
          </span>
        </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Just now'}
          </span>
      </div>
      
      <h3 className="alert-title">{alert.title}</h3>
      
      <div className="alert-location text-slate-600 text-sm flex items-center gap-1 mb-2">
        <MapPin size={14} /> {alert.district}, {alert.state} • Source: {alert.source}
      </div>
      
      <p className="alert-summary text-slate-700 mb-3">{alert.summary}</p>
      
      {alert.recommendations && alert.recommendations.length > 0 && (
        <div className="alert-recommendations bg-blue-50 p-3 rounded-md">
          <div className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-1">
            {alert.ai_summary && <span className="ai-sparkle">✨ AI</span>} Recommendations:
          </div>
          <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
            {alert.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="alert-footer mt-3 pt-3 border-t border-slate-100 flex justify-end">
        <button className="text-primary text-sm font-medium flex items-center hover:underline">
          View Details <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
