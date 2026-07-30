// @ts-nocheck
import React, { useState, useEffect, useCallback, memo } from 'react';
import { VillageData, JurisdictionBounds } from '../../types/Jurisdiction';
import { Crosshair, RefreshCw, Syringe, Hospital, Navigation, Bug, Baby, Activity, MapPin, Home, ShieldAlert, X } from 'lucide-react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { GeoJsonLayer } from '../Map/GeoJsonLayer';
import { MapMarkers, MapMarkerData } from '../Map/MapMarkers';
import { ServiceAreaList } from './ServiceAreaList';
import { AnalyticsDashboard } from './AnalyticsDashboard';

import { config } from "../../config";

const API_KEY = config.googleMaps.apiKey;
const MAP_ID = config.googleMaps.mapId;

if (!API_KEY) {
  console.warn('[CommunityDigitalTwin] VITE_GOOGLE_MAPS_API_KEY is not set. Map will not load.');
}

interface CommunityDigitalTwinProps {
  villages: VillageData[];
  geoJson?: any;
  facilities?: MapMarkerData[];
  selectedVillageId: string | null;
  onSelectVillage: (id: string | null) => void;
  aiSummary: string;
  alerts?: any[]; // Array of AlertData
  jurisdictionBounds?: JurisdictionBounds;
}

type OverlayType = 'None' | 'Disease Spread' | 'Heat Risk' | 'Air Quality' | 'Vaccination' | 'Maternal Health' | 'Healthcare Access';

// Map Controller for auto-zooming
const MapCameraController = memo(function MapCameraController({ 
  userLocation, 
  nearestVillages,
  jurisdictionBounds
}: { 
  userLocation: google.maps.LatLngLiteral | null;
  nearestVillages: VillageData[];
  jurisdictionBounds?: JurisdictionBounds;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!map || nearestVillages.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    if (userLocation) {
      bounds.extend(userLocation);
    }
    
    if (jurisdictionBounds) {
      bounds.extend({ lat: jurisdictionBounds.north, lng: jurisdictionBounds.east });
      bounds.extend({ lat: jurisdictionBounds.south, lng: jurisdictionBounds.west });
    } else {
      nearestVillages.forEach(v => {
        bounds.extend({ lat: v.mapCoordinates[0], lng: v.mapCoordinates[1] });
      });
    }
    
    // Animate to bounds
    map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
  }, [map, userLocation, nearestVillages, jurisdictionBounds]);

  return null;
});

export const CommunityDigitalTwin: React.FC<CommunityDigitalTwinProps> = memo(({ villages, geoJson, facilities, selectedVillageId, onSelectVillage, jurisdictionBounds }) => {
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>('None');

  // Compute map center from real data in priority order:
  // 1. Midpoint of jurisdiction bounds (most accurate — derived from workspace)
  // 2. First village coordinate
  // 3. India geographic center (neutral last resort — never a specific city)
  const center = (() => {
    if (jurisdictionBounds) {
      return {
        lat: (jurisdictionBounds.north + jurisdictionBounds.south) / 2,
        lng: (jurisdictionBounds.east + jurisdictionBounds.west) / 2,
      };
    }
    if (villages.length > 0) {
      return { lat: villages[0].mapCoordinates[0], lng: villages[0].mapCoordinates[1] };
    }
    return null; // Explicitly fail rather than falling back to India center
  })();

  const [hoveredVillageId, setHoveredVillageId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);

  const handleLocateMe = useCallback(() => {
    // Reset view to default district center
    onSelectVillage(null);
  }, [onSelectVillage]);

  const selectedVillage = villages.find(v => v.id === selectedVillageId);

  return (
    <div className="digital-twin-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '900px', background: '#f8fafc' }}>
      
      {/* Breadcrumb Header */}
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
        <Navigation size={16} />
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{facilities && facilities[0]?.name || 'Hospital'}</span>
        <span>/</span>
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedVillage?.phc || 'PHC'}</span>
        <span>/</span>
        <span style={{ color: selectedVillage ? '#3b82f6' : '#94a3b8' }}>{selectedVillage ? selectedVillage.name : 'Select Service Area'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', flex: 1, minHeight: 0 }}>
        {/* LEFT PANEL: Service Area List */}
        <div style={{ overflow: 'hidden' }}>
          <ServiceAreaList 
            villages={villages}
            selectedVillageId={selectedVillageId}
            onSelectVillage={onSelectVillage}
            activeOverlay={activeOverlay}
            onHoverCard={(id) => setHoveredVillageId(id)}
          />
        </div>

        {/* RIGHT PANEL: Interactive Map */}
        <div className="digital-twin-map" style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
          {!center ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#e2e8f0', color: '#64748b' }}>
              Waiting for jurisdiction coordinates...
            </div>
          ) : (
            <>
              <div className="floating-toolbar" style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10, display: 'flex', gap: '8px', padding: '8px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <button className="icon-btn" onClick={handleLocateMe} title="Reset View" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex' }}>
                  <Crosshair size={18} />
                </button>
                <button className="icon-btn" onClick={() => setActiveOverlay('None')} title="Clear Overlay" style={{ background: activeOverlay === 'None' ? '#3b82f6' : 'transparent', color: activeOverlay === 'None' ? 'white' : '#64748b', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                  <RefreshCw size={18} />
                </button>
                <div style={{ width: '1px', background: '#cbd5e1', margin: '0 4px' }}></div>
                
                <button className="icon-btn" onClick={() => setActiveOverlay('Disease Spread')} title="Disease Spread" style={{ background: activeOverlay === 'Disease Spread' ? '#3b82f6' : 'transparent', color: activeOverlay === 'Disease Spread' ? 'white' : '#64748b', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                  <Bug size={18} />
                </button>
                <button className="icon-btn" onClick={() => setActiveOverlay('Vaccination')} title="Vaccination" style={{ background: activeOverlay === 'Vaccination' ? '#3b82f6' : 'transparent', color: activeOverlay === 'Vaccination' ? 'white' : '#64748b', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                  <Syringe size={18} />
                </button>
                <button className="icon-btn" onClick={() => setActiveOverlay('Maternal Health')} title="Maternal Health" style={{ background: activeOverlay === 'Maternal Health' ? '#3b82f6' : 'transparent', color: activeOverlay === 'Maternal Health' ? 'white' : '#64748b', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                  <Baby size={18} />
                </button>
                <button className="icon-btn" onClick={() => setActiveOverlay('Healthcare Access')} title="Healthcare Access" style={{ background: activeOverlay === 'Healthcare Access' ? '#3b82f6' : 'transparent', color: activeOverlay === 'Healthcare Access' ? 'white' : '#64748b', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                  <Hospital size={18} />
                </button>
              </div>

              <APIProvider apiKey={API_KEY}>
                <Map
                  defaultCenter={center}
                  defaultZoom={11}
                  mapId={MAP_ID}
                  disableDefaultUI={true}
                  zoomControl={true}
                  gestureHandling="greedy"
                  colorScheme={'DARK'}
                  onClick={() => onSelectVillage(null)}
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Overlays and Data */}
                  <GeoJsonLayer 
                    data={geoJson || { type: 'FeatureCollection', features: [] }} 
                    villages={villages} 
                    selectedVillageId={selectedVillageId}
                    activeOverlay={activeOverlay}
                    onSelectVillage={onSelectVillage}
                    onHover={(id, pos) => {
                      setHoveredVillageId(id);
                      setHoverPos(pos);
                    }}
                  />
                  <MapMarkers facilities={facilities || []} />

                  {/* Controller for automatic camera bounding */}
                  <MapCameraController userLocation={center} nearestVillages={villages} jurisdictionBounds={jurisdictionBounds} />
                </Map>
              </APIProvider>
            </>
          )}

          {/* Hover Tooltip (Now only active if geoJson triggers it, or we rely on marker hover) */}
          {hoveredVillageId && hoverPos && (
            <div style={{
              position: 'fixed',
              left: hoverPos.x + 15,
              top: hoverPos.y + 15,
              pointerEvents: 'none',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              zIndex: 9999,
              minWidth: '200px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {(() => {
                const v = villages.find(v => v.id === hoveredVillageId);
                if (!v) return null;
                return (
                  <>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600 }}>{v.name}</h4>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{v.type} • {v.district}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: '#cbd5e1' }}>Pop:</span> <span style={{ fontWeight: 500 }}>{v.population.toLocaleString()}</span>
                      </div>
                      <div>
                        <span style={{ color: '#cbd5e1' }}>Score:</span> <span style={{ fontWeight: 500, color: v.healthScore > 80 ? '#10b981' : v.healthScore > 50 ? '#facc15' : '#ef4444' }}>{v.healthScore}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
      
      {/* BOTTOM PANEL: Analytics Dashboard */}
      {selectedVillage ? (
        <AnalyticsDashboard village={selectedVillage} />
      ) : (
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
          <Activity size={48} style={{ margin: '0 auto 16px auto', opacity: 0.2 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Select a Service Area</h3>
          <p style={{ margin: 0 }}>Click on any service area in the list or map to view hyper-local analytics, infrastructure details, and AI-driven health insights.</p>
        </div>
      )}
    </div>
  );
});
