import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HospitalMap.css';
import { type HospitalFacility } from '../../services/api';

const createIcon = (color: 'blue' | 'red', isHighlighted: boolean = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin ${color} ${isHighlighted ? 'highlighted' : ''}">${color === 'blue' ? '📍' : '🏥'}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const userIcon = createIcon('blue');
const facilityIcon = createIcon('red');
const highlightedIcon = createIcon('red', true);

function MapUpdater({ selectedFacility, userLocation }: { selectedFacility: HospitalFacility | null, userLocation: { lat: number, lon: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedFacility) {
      map.setView([selectedFacility.lat, selectedFacility.lon], 16, { animate: true });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lon], 13, { animate: true });
    }
  }, [selectedFacility, userLocation, map]);
  return null;
}

interface HospitalMapProps {
  userLocation: { lat: number; lon: number } | null;
  facilities: HospitalFacility[];
  selectedFacility: HospitalFacility | null;
  onSelectFacility?: (facility: HospitalFacility) => void;
}

export function HospitalMap({ userLocation, facilities, selectedFacility, onSelectFacility }: HospitalMapProps) {
  if (!userLocation) return null;

  return (
    <div className="hospital-map-container">
      <MapContainer
        center={[userLocation.lat, userLocation.lon]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater selectedFacility={selectedFacility} userLocation={userLocation} />

        <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon} zIndexOffset={1000}>
          <Popup>You are here</Popup>
        </Marker>

        {facilities.map((facility, index) => (
          <Marker
            key={`${facility.name}-${index}`}
            position={[facility.lat, facility.lon]}
            icon={selectedFacility?.name === facility.name ? highlightedIcon : facilityIcon}
            zIndexOffset={selectedFacility?.name === facility.name ? 500 : 0}
            eventHandlers={{
              click: () => onSelectFacility && onSelectFacility(facility),
            }}
          >
            <Popup>
              <div style={{ marginBottom: '4px' }}>
                <strong>{facility.name}</strong>
              </div>
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                {facility.type} · {facility.distance_km} km away
                {facility.open_now !== undefined && facility.open_now !== null && (
                  <span style={{ marginLeft: '6px', color: facility.open_now ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                    {facility.open_now ? "🟢 Open" : "🔴 Closed"}
                  </span>
                )}
              </div>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lon}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  background: 'var(--primary-color)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '12px'
                }}
              >
                🗺️ Directions
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
