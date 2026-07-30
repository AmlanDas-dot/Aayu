export const isDemoSession = () =>
  typeof window !== "undefined" &&
  (import.meta.env.DEV || 
   import.meta.env.VITE_ENABLE_DEMO_LOGIN === "true" || 
   import.meta.env.VITE_ENABLE_DEMO_DATA === "true");
