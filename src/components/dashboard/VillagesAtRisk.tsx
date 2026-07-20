import React from 'react';
import { VillageData } from '../../types/Jurisdiction';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VillagesAtRiskProps {
  villages: VillageData[];
  selectedVillageId: string | null;
  onSelectVillage: (id: string | null) => void;
}

export const VillagesAtRisk: React.FC<VillagesAtRiskProps> = ({ villages, selectedVillageId, onSelectVillage }) => {
  // Sort villages by risk score (descending)
  const sortedVillages = [...villages].sort((a, b) => b.riskScore - a.riskScore);

  const getRiskLabel = (color: string) => {
    switch(color) {
      case 'Red': return 'Critical';
      case 'Orange': return 'High';
      case 'Yellow': return 'Moderate';
      case 'Green': return 'Low';
      default: return 'Unknown';
    }
  };

  return (
    <div className="villages-at-risk-container">
      <div className="var-header">
        <h3 className="var-title">Villages At Risk</h3>
        <p className="var-subtitle">Ranked by composite health and environmental risk score</p>
      </div>
      
      <div className="var-table-wrapper">
        <table className="var-table">
          <thead>
            <tr>
              <th>Village</th>
              <th>Population</th>
              <th>Risk Level</th>
              <th>Health Score</th>
              <th>Major Concern</th>
              <th>Trend</th>
              <th>Assigned Workers</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedVillages.map(village => {
              const isSelected = village.id === selectedVillageId;
              
              return (
                <tr 
                  key={village.id} 
                  className={isSelected ? 'selected-row' : ''}
                  onClick={() => onSelectVillage(isSelected ? null : village.id)}
                >
                  <td className="fw-bold">{village.name}</td>
                  <td>{village.population.toLocaleString()}</td>
                  <td>
                    <span className={`risk-badge badge-${village.colorStatus.toLowerCase()}`}>
                      {getRiskLabel(village.colorStatus)}
                    </span>
                  </td>
                  <td>
                    <div className="score-bar-wrapper">
                      <div className="score-text">{village.riskScore}/100</div>
                      <div className="score-bar-bg">
                        <div 
                          className={`score-bar-fill bg-${village.colorStatus.toLowerCase()}`}
                          style={{ width: `${village.riskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className={village.dominantDisease ? 'text-danger' : ''}>
                    {village.dominantDisease || village.environmentalRisk}
                  </td>
                  <td>
                    <span className={`trend-icon trend-${village.trend.toLowerCase()}`}>
                      {village.trend === 'Declining' && <TrendingDown size={16} />}
                      {village.trend === 'Improving' && <TrendingUp size={16} />}
                      {village.trend === 'Stable' && <Minus size={16} />}
                      <span className="ms-1">{village.trend}</span>
                    </span>
                  </td>
                  <td>{village.assignedWorkers} ASHA</td>
                  <td className="text-right">
                    <ChevronRight size={18} className="row-action-icon" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
