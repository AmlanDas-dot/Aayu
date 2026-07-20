import { useEffect, useRef, memo } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { VillageData } from '../../types/Jurisdiction';
import { FeatureCollection } from 'geojson';

type OverlayType = 'None' | 'Disease Spread' | 'Heat Risk' | 'Air Quality' | 'Vaccination' | 'Maternal Health' | 'Population Density' | 'Water Quality' | 'Healthcare Access';

interface GeoJsonLayerProps {
  data: FeatureCollection;
  villages: VillageData[];
  selectedVillageId: string | null;
  activeOverlay: OverlayType;
  onSelectVillage: (id: string | null) => void;
  onHover?: (id: string | null, position: { x: number, y: number } | null) => void;
}

export const GeoJsonLayer = memo(function GeoJsonLayer({ data, villages, selectedVillageId, activeOverlay, onSelectVillage, onHover }: GeoJsonLayerProps) {
  const map = useMap();
  const loaded = useRef(false);
  const selectedRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRef.current = selectedVillageId;
  }, [selectedVillageId]);

  // Helper to get color based on overlay
  const getNodeColor = (village: VillageData) => {
    if (activeOverlay === 'None') {
      switch (village.colorStatus) {
        case 'Green': return '#10b981'; // Low Risk
        case 'Yellow': return '#facc15'; // Moderate
        case 'Orange': return '#f97316'; // High
        case 'Red': return '#ef4444'; // Critical
        default: return '#94a3b8';
      }
    }
    
    // Logic for overlays
    if (activeOverlay === 'Disease Spread') return village.recentCases > 10 ? '#ef4444' : village.recentCases > 0 ? '#f97316' : '#10b981';
    if (activeOverlay === 'Heat Risk') return village.heatRisk === 'Severe' ? '#ef4444' : village.heatRisk === 'Moderate' ? '#f97316' : '#10b981';
    if (activeOverlay === 'Air Quality') return village.airQuality === 'Very Poor' || village.airQuality === 'Poor' ? '#ef4444' : village.airQuality === 'Moderate' ? '#facc15' : '#10b981';
    if (activeOverlay === 'Vaccination') return village.vaccinationCoverage < 70 ? '#ef4444' : village.vaccinationCoverage < 85 ? '#facc15' : '#10b981';
    if (activeOverlay === 'Maternal Health') return village.maternalHealth.includes('Overdue') ? '#ef4444' : '#10b981';
    
    if (activeOverlay === 'Population Density') return village.population > 20000 ? '#ef4444' : village.population > 15000 ? '#facc15' : '#10b981';
    if (activeOverlay === 'Water Quality') return village.waterSafety === 'Poor' ? '#ef4444' : village.waterSafety === 'Fair' ? '#facc15' : '#10b981';
    if (activeOverlay === 'Healthcare Access') return village.assignedWorkers < 10 ? '#ef4444' : '#10b981';
    
    return '#cbd5e1'; // Fallback
  };

  useEffect(() => {
    if (!map) return;

    if (!loaded.current) {
      loaded.current = true;

      // Add click listener
      map.data.addListener('click', (event: google.maps.Data.MouseEvent) => {
        const id = event.feature.getProperty('id') as string | null;
        onSelectVillage(id);
      });
      
      // Hover effects

      map.data.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
        const id = event.feature.getProperty('id') as string | null;
        if (id !== selectedRef.current) {
          map.data.overrideStyle(event.feature, { 
            fillOpacity: 0.65, 
            strokeWeight: 3, 
            strokeColor: '#ffffff',
            zIndex: 50
          });
        }
        if (onHover && event.domEvent) {
          const domEvent = event.domEvent as MouseEvent;
          onHover(id, { x: domEvent.clientX, y: domEvent.clientY });
        }
      });
      map.data.addListener('mouseout', (event: google.maps.Data.MouseEvent) => {
        map.data.revertStyle(event.feature);
        if (onHover) {
          onHover(null, null);
        }
      });
      map.data.addListener('mousemove', (event: google.maps.Data.MouseEvent) => {
        if (onHover && event.domEvent) {
          const id = event.feature.getProperty('id') as string | null;
          const domEvent = event.domEvent as MouseEvent;
          onHover(id, { x: domEvent.clientX, y: domEvent.clientY });
        }
      });
    }
  }, [map, onSelectVillage, onHover]);

  // Load geojson data whenever it changes
  useEffect(() => {
    if (!map || !data || !data.features) return;
    
    // Clear existing features
    map.data.forEach((feature) => {
      map.data.remove(feature);
    });

    if (data.features.length > 0) {
      map.data.addGeoJson(data);
    }
  }, [map, data]);

  // Update styles when state changes
  useEffect(() => {
    if (!map) return;

    map.data.setStyle((feature) => {
      const id = feature.getProperty('id');
      const village = villages.find(v => v.id === id);
      const isSelected = selectedVillageId === id;
      
      const color = village ? getNodeColor(village) : '#cccccc';

      return {
        fillColor: color,
        fillOpacity: isSelected ? 0.8 : 0.4,
        strokeColor: isSelected ? '#ffffff' : color,
        strokeOpacity: isSelected ? 1 : 0.7,
        strokeWeight: isSelected ? 4 : 2,
        zIndex: isSelected ? 100 : 1,
        clickable: true,
      };
    });
  }, [map, villages, selectedVillageId, activeOverlay]);

  return null;
});
