export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  
  // Generic visual config
  emoji: string;
  bg: string;
  border: string;
  size: number;
  
  // Behaviors
  isUser?: boolean;
}
