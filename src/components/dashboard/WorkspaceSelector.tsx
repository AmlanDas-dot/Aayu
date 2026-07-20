import React, { useState, useMemo } from 'react';
import { WorkspaceFacility, workspaceRegistry } from '../../data/workspaceRegistry';
import { LocationInfo } from '../../services/jurisdictionService';
import { MapPin, Search, Hospital, Building2, Building, Cross, X } from 'lucide-react';
import './WorkspaceSelector.css';

interface WorkspaceSelectorProps {
  detectedLocation: LocationInfo | null;
  onSelectWorkspace: (workspace: WorkspaceFacility) => void;
  onCancel?: () => void;
  isInitialLoad?: boolean;
}

// Distance utility
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ 
  detectedLocation, 
  onSelectWorkspace, 
  onCancel,
  isInitialLoad = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const sortedFacilities = useMemo(() => {
    let list = [...workspaceRegistry];
    
    // Sort by distance if location is available
    if (detectedLocation) {
      list.sort((a, b) => {
        const distA = getDistance(detectedLocation.lat, detectedLocation.lng, a.latitude, a.longitude);
        const distB = getDistance(detectedLocation.lat, detectedLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f => 
        f.name.toLowerCase().includes(q) || 
        f.district.toLowerCase().includes(q) || 
        f.state.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q)
      );
    }

    return list;
  }, [detectedLocation, searchQuery]);

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'Medical College': return <Building2 size={24} />;
      case 'District Hospital': return <Hospital size={24} />;
      case 'Community Health Centre': return <Building size={24} />;
      case 'Primary Health Centre': return <Cross size={24} />;
      default: return <Hospital size={24} />;
    }
  };

  return (
    <div className="workspace-selector-overlay">
      <div className="workspace-selector-modal">
        
        <div className="workspace-selector-header">
          {!isInitialLoad && onCancel && (
            <button className="workspace-selector-close" onClick={onCancel}>
              <X size={20} />
            </button>
          )}
          <h2 className="workspace-selector-title">Select Your Workspace</h2>
          
          {detectedLocation ? (
            <div className="workspace-location-banner">
              <MapPin size={16} />
              You appear to be near {detectedLocation.district}, {detectedLocation.state}
            </div>
          ) : (
            <div className="workspace-location-banner" style={{ background: '#fef3c7', color: '#d97706' }}>
              <MapPin size={16} />
              Location detection failed or denied. Showing all facilities.
            </div>
          )}
        </div>

        <div className="workspace-selector-body">
          <div className="workspace-search-bar">
            <Search size={20} color="#94a3b8" />
            <input 
              type="text" 
              className="workspace-search-input"
              placeholder="Search by hospital name, district or state..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="workspace-list">
            {sortedFacilities.length > 0 ? (
              sortedFacilities.map(facility => {
                let distStr = '';
                if (detectedLocation) {
                  const dist = getDistance(detectedLocation.lat, detectedLocation.lng, facility.latitude, facility.longitude);
                  distStr = dist < 1 ? 'Less than 1 km away' : `${dist.toFixed(1)} km away`;
                }

                return (
                  <div 
                    key={facility.id} 
                    className="workspace-item"
                    onClick={() => onSelectWorkspace(facility)}
                  >
                    <div className="workspace-item-icon">
                      {getFacilityIcon(facility.type)}
                    </div>
                    <div className="workspace-item-content">
                      <h3 className="workspace-item-title">{facility.name}</h3>
                      <p className="workspace-item-subtitle">
                        <MapPin size={14} /> {facility.district}, {facility.state}
                      </p>
                      <div className="workspace-item-badges">
                        <span className="workspace-badge type">{facility.type}</span>
                        {distStr && <span className="workspace-badge distance">{distStr}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="workspace-empty-state">
                <p>No facilities found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
