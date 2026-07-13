import React from 'react';
import { AlertTriangle, Droplets } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  return (
    <div className="premium-insight-card">
      <div className="insight-header">
        <AlertTriangle size={20} className="text-orange" />
        <span>Personalized Health Alert</span>
      </div>
      <div className="insight-body">
        <p>{recommendation}</p>
      </div>
      <div className="insight-footer">
        <Droplets size={16} />
        <span>Hydration Goal: 3.5L today</span>
      </div>
    </div>
  );
};
