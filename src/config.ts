/**
 * Centralized configuration for the frontend application.
 * All environment variables should be accessed through this file.
 */

const requireEnv = (name: string): string => {
  const value = import.meta.env[name];
  if (!value) {
    // In development we might tolerate some missing vars if mocks are used,
    // but in production we must fail fast if configuration is incomplete.
    if (!import.meta.env.DEV) {
      throw new Error(`Configuration Error: Missing required environment variable: ${name}`);
    } else {
      console.warn(`[DEV WARNING] Missing environment variable: ${name}`);
    }
  }
  return value || "";
};

export const config = {
  // API Backend URL (defaults to relative /api which works correctly in production when served together)
  apiBaseUrl: import.meta.env.VITE_API_URL || "/api",
  
  // Firebase Configuration
  firebase: {
    apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
    authDomain: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: requireEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: requireEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requireEnv("VITE_FIREBASE_APP_ID"),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  },

  // Google Maps & Places
  googleMaps: {
    apiKey: requireEnv("VITE_GOOGLE_MAPS_API_KEY"),
    mapId: requireEnv("VITE_GOOGLE_MAP_ID"),
    // Fall back to Maps API key if a specific Places key is not provided
    placesApiKey: import.meta.env.VITE_GOOGLE_PLACES_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  },

  // External APIs
  weatherApiKey: requireEnv("VITE_WEATHERAPI_API_KEY"),
};
