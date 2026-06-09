/**
 * Centralized API configuration.
 *
 * Override the backend URL at build time with the VITE_API_URL env variable:
 *   VITE_API_URL=https://my-backend.example.com npx vite build
 *
 * During local development this defaults to the FastAPI server started by
 *   uvicorn app.main:app --reload
 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";
