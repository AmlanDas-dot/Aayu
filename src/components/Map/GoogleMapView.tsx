import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import type { MapMarker } from "@/types/MapMarker";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GoogleMapViewProps {
  center: { lat: number; lng: number };
  markers?: MapMarker[];
  zoom?: number;
  height?: string | number;
  selectedMarkerId?: string | null;
  onMarkerClick?: (marker: MapMarker) => void;
}

// ── Marker pin ────────────────────────────────────────────────────────────────

export interface GoogleMapViewProps {
  center: { lat: number; lng: number };
  markers?: MapMarker[];
  zoom?: number;
  height?: string | number;
  onMarkerClick?: (marker: MapMarker) => void;
}

// ── Marker pin ────────────────────────────────────────────────────────────────

function MarkerPin({ marker, onClick }: { marker: MapMarker; onClick?: () => void }) {
  const { isUser, size, bg, border, emoji } = marker;

  return (
    <div
      onClick={onClick}
      title={marker.label}
      style={{
        width: size,
        height: size,
        background: bg,
        border: `2.5px solid ${border}`,
        borderRadius: isUser ? "50%" : "50% 50% 50% 0",
        transform: isUser ? "none" : "rotate(-45deg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
        transition: "transform 0.2s, box-shadow 0.2s",
        animation: isUser ? "gm-pulse 2s infinite" : undefined,
        zIndex: isUser ? 10 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 18px rgba(0,0,0,0.5)";
        (e.currentTarget as HTMLDivElement).style.transform = isUser ? "scale(1.15)" : "rotate(-45deg) scale(1.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 3px 10px rgba(0,0,0,0.35)";
        (e.currentTarget as HTMLDivElement).style.transform = isUser ? "none" : "rotate(-45deg)";
      }}
    >
      <span
        style={{
          fontSize: size * 0.45,
          transform: isUser ? "none" : "rotate(45deg)",
          lineHeight: 1,
        }}
      >
        {emoji}
      </span>
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function MarkerTooltip({ marker }: { marker: MapMarker }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(15,23,42,0.92)",
        color: "#f1f5f9",
        padding: "5px 10px",
        borderRadius: 8,
        fontSize: 12,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      {marker.label}
    </div>
  );
}

// ── Wrapper with tooltip on hover ─────────────────────────────────────────────

function InteractiveMarker({
  marker,
  isSelected,
  onMarkerClick,
}: {
  marker: MapMarker;
  isSelected?: boolean;
  onMarkerClick?: (m: MapMarker) => void;
}) {
  return (
    <AdvancedMarker position={{ lat: marker.lat, lng: marker.lng }} zIndex={marker.isUser ? 10 : isSelected ? 8 : 1}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <style>{`
          @keyframes gm-pulse {
            0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.6); }
            70%  { box-shadow: 0 0 0 12px rgba(37,99,235,0); }
            100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
          }
          .gm-marker-wrap:hover .gm-tooltip { display: block !important; }
        `}</style>
        <div className="gm-marker-wrap" style={{ position: "relative" }}>
          <div className="gm-tooltip" style={{ display: isSelected ? "block" : "none" }}>
            <MarkerTooltip marker={marker} />
          </div>
          <MarkerPin marker={marker} onClick={() => onMarkerClick?.(marker)} />
        </div>
      </div>
    </AdvancedMarker>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GoogleMapView({
  center,
  markers = [],
  zoom = 14,
  height = 500,
  selectedMarkerId,
  onMarkerClick,
}: GoogleMapViewProps) {
  
  // Track camera state locally to prevent locking, but sync with props when they change
  const [camera, setCamera] = useState({ center, zoom });
  
  useEffect(() => {
    setCamera({ center, zoom });
  }, [center, zoom]);

  if (!API_KEY || API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return (
      <div
        style={{
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#f0f9ff,#e0f2fe)",
          borderRadius: 16,
          border: "2px dashed #38bdf8",
          gap: 12,
          color: "#0369a1",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 40 }}>🗺️</span>
        <strong style={{ fontSize: 16 }}>Google Maps API key not configured</strong>
        <p style={{ fontSize: 13, color: "#0284c7", margin: 0 }}>
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file and restart Vite.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        height,
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(15,118,110,0.15)",
        border: "1px solid #e2e8f0",
      }}
    >
      <APIProvider apiKey={API_KEY}>
        <Map
          {...camera}
          onCameraChanged={(ev) => setCamera(ev.detail)}
          mapId="aayu-healthcare-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={true}
          streetViewControl={true}
          fullscreenControl={true}
          style={{ width: "100%", height: "100%" }}
        >
          {markers.map((marker) => (
            <InteractiveMarker
              key={marker.id}
              marker={marker}
              isSelected={selectedMarkerId === marker.id}
              onMarkerClick={onMarkerClick}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
