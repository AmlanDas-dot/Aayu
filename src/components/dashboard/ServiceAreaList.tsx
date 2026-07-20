// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { VillageData } from '../../types/Jurisdiction';
import { Search, Shield, Activity, } from 'lucide-react';

interface ServiceAreaListProps {
  villages: VillageData[];
  selectedVillageId: string | null;
  onSelectVillage: (id: string | null) => void;
  activeOverlay: string;
  onHoverCard?: (id: string | null) => void;
}

export const ServiceAreaList: React.FC<ServiceAreaListProps> = ({ 
  villages, 
  selectedVillageId, 
  onSelectVillage, 
  activeOverlay,
  onHoverCard
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const sortedAndFilteredVillages = useMemo(() => {
    let result = [...villages];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(q) || v.type.toLowerCase().includes(q));
    }

    // Sort by active overlay
    result.sort((a, b) => {
      if (activeOverlay === 'Disease Spread') return b.recentCases - a.recentCases;
      if (activeOverlay === 'Vaccination') return a.vaccinationCoverage - b.vaccinationCoverage;
      if (activeOverlay === 'Population Density') return b.population - a.population;
      if (activeOverlay === 'Maternal Health') return b.pregnantWomen - a.pregnantWomen;
      // Default: sort by health score (lowest first)
      return a.healthScore - b.healthScore;
    });

    return result;
  }, [villages, searchQuery, activeOverlay]);

  return (
    <div className="service-area-list" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderRight: '1px solid #e2e8f0' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a' }}>Service Areas</h3>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search villages, wards..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {sortedAndFilteredVillages.map(v => {
          const isSelected = selectedVillageId === v.id;
          let badgeColor = '#10b981';
          if (v.healthScore < 50) badgeColor = '#ef4444';
          else if (v.healthScore < 70) badgeColor = '#f97316';
          else if (v.healthScore < 85) badgeColor = '#facc15';

          return (
            <div 
              key={v.id}
              onClick={() => onSelectVillage(v.id)}
              onMouseEnter={() => onHoverCard && onHoverCard(v.id)}
              onMouseLeave={() => onHoverCard && onHoverCard(null)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '8px',
                border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                background: isSelected ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 2px 4px rgba(59,130,246,0.1)' : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: badgeColor }} />
              
              <div style={{ marginLeft: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{v.name}</h4>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: badgeColor, background: `${badgeColor}15`, padding: '2px 6px', borderRadius: '12px' }}>
                    {v.healthScore} / 100
                  </span>
                </div>
                
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  {v.type} • Pop: {v.population.toLocaleString()}
                </div>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    <Shield size={12} /> Vac: {v.vaccinationCoverage}%
                  </span>
                  <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: v.recentCases > 5 ? '#ef4444' : '#475569', background: v.recentCases > 5 ? '#fef2f2' : '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    <Activity size={12} /> Cases: {v.recentCases}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {sortedAndFilteredVillages.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No service areas found.
          </div>
        )}
      </div>
    </div>
  );
};
