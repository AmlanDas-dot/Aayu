const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

import type {
  SearchResponse,
  CollectionName,
  ChatRequest,
  ChatApiResponse,
} from "../types/search";
import type { NutritionProfile } from "@/features/nutrition/types";

// ── Search ──────────────────────────────────────────────────────────────────

export async function searchKnowledgeBase(
  query: string,
  collection: CollectionName = "all",
  topK: number = 5
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, collection, top_k: String(topK) });
  const res = await fetch(`${API_BASE}/search?${params}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

// ── Health check ─────────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Chat pipeline (Sprint 2) ─────────────────────────────────────────────────
// Calls POST /chat — full pipeline: translate → search → triage → response

export async function sendChatMessage(
  req: ChatRequest & { session_id?: string; history?: any[] },
  onEvent?: (event: "HEADERS_RECEIVED" | "JSON_PARSED") => void
): Promise<ChatApiResponse> {
  const payload = {
      message: req.message,
      language: req.language || "en",
      top_k: req.top_k || 5,
      collection: req.collection || "all",
      session_id: req.session_id ?? "",
      history: req.history ?? [],
      patient_records: req.patient_records ?? ""
  };
  console.log("========== SENDING CHAT REQUEST ==========");
  console.log("Request Payload:", payload);

  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  onEvent?.("HEADERS_RECEIVED");
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Chat request failed");
  }
  const rawText = await res.text();
  console.log("Raw Response Body:", rawText);

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (err) {
    console.error("Failed to parse response as JSON:", err);
    throw new Error("Invalid JSON response from server");
  }

  console.log("Parsed Response:", data);
  onEvent?.("JSON_PARSED");
  return data;
}

// ── Image Chat integration (Sprint 3) ─────────────────────────────────────────

export interface ImageChatApiResponse {
  success: boolean;
  image_description: string;
  answer: string;
  triage: string;
  warnings: string[];
  confidence: string;
}

export async function sendImageChatMessage(
  imageFile: File,
  question: string,
  language: string = "en",
  sessionId: string = "",
  history: any[] = [],
  onUploadProgress?: (progress: number) => void
): Promise<ImageChatApiResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("question", question);
  formData.append("language", language);
  formData.append("session_id", sessionId);
  formData.append("history", JSON.stringify(history));

  console.log("========== SENDING IMAGE CHAT REQUEST ==========");

  if (onUploadProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/image-chat`, true);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (err) {
            reject(new Error("Invalid JSON response from server"));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.detail ?? "Image chat request failed"));
          } catch {
            reject(new Error(`Server error: ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error occurred during image upload."));
      };

      xhr.send(formData);
    });
  }

  const res = await fetch(`${API_BASE}/image-chat`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Image chat request failed");
  }

  return res.json();
}


// ── Fallback mock (kept for offline/dev use) ──────────────────────────────────

export async function getMockChatResponse(
  userMessage: string,
  searchResults: SearchResponse["results"]
): Promise<string> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
  if (searchResults.length > 0) {
    const top = searchResults[0];
    return (
      `Based on your query, here's what I found:\n\n**${top.title}**\n\n` +
      `${top.content}\n\n*Relevance: ${(top.score * 100).toFixed(0)}%*\n\n` +
      `⚠️ This is general health information only. Please consult a healthcare professional.`
    );
  }
  return (
    `I couldn't find a specific match for "${userMessage.slice(0, 60)}" in the knowledge base.\n\n` +
    `Please consult a healthcare professional at your nearest health centre.\n\n` +
    `⚠️ AAYU provides general information only — not medical diagnoses.`
  );
}

// ── Nutrition types & calls ──────────────────────────────────────────────────

export interface FoodNutrition {
  id: string;
  display_name: string;       // unified name field — works for all 3 schemas
  type: string;               // "disease_diet" | "pregnancy" | "food_item"
  recommended_foods: string[];
  avoid_foods: string[];
  guidance: string;
  urgency: string;
  source: string;
}

export async function getAllFoods(): Promise<FoodNutrition[]> {
  const res = await fetch(`${API_BASE}/nutrition`);
  if (!res.ok) throw new Error("Failed to load foods. Is the backend running?");
  const data = await res.json();
  return data.items;
}

export async function searchNutrition(query: string): Promise<FoodNutrition[]> {
  const res = await fetch(`${API_BASE}/nutrition/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Nutrition search failed.");
  const data = await res.json();
  return data.items ?? [];
}

export async function getNutritionProfile(profileType: string): Promise<NutritionProfile> {
  const res = await fetch(`${API_BASE}/nutrition/profile/${encodeURIComponent(profileType)}`);
  if (!res.ok) throw new Error("Failed to load nutrition profile.");
  return res.json();
}

export async function getDietPlan(goal: string): Promise<FoodNutrition[]> {
  const res = await fetch(`${API_BASE}/nutrition/diet-plan/${encodeURIComponent(goal)}`);
  if (!res.ok) throw new Error("Failed to load diet plan.");
  const data = await res.json();
  return data.items ?? [];
}

// ── Schemes types & calls ─────────────────────────────────────────────────────

export interface GovernmentScheme {
  name: string;
  state: string;
  description: string;
  eligibility: string;
  benefits: string;
  documents_required: string[];
  official_link: string;
}

export async function getAllSchemes(age?: string, gender?: string): Promise<GovernmentScheme[]> {
  const params = new URLSearchParams();
  if (age) params.append("age", age);
  if (gender) params.append("gender", gender);
  const q = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE}/schemes${q}`);
  if (!res.ok) throw new Error("Failed to load schemes. Is the backend running?");
  const data = await res.json();
  return data.items;
}

export async function getStateSchemes(state: string, age?: string, gender?: string): Promise<GovernmentScheme[]> {
  const params = new URLSearchParams({ state });
  if (age) params.append("age", age);
  if (gender) params.append("gender", gender);
  const res = await fetch(`${API_BASE}/schemes?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load schemes for that state.");
  const data = await res.json();
  return data.items;
}

export async function searchScheme(query: string): Promise<GovernmentScheme[]> {
  const res = await fetch(`${API_BASE}/schemes/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Scheme search failed.");
  const data = await res.json();
  return data.items;
}

// ── Collections (for Search page dropdown) ────────────────────────────────────

export interface CollectionInfo {
  description: string;
  document_count: number;
}

export async function getCollections(): Promise<Record<string, CollectionInfo>> {
  const res = await fetch(`${API_BASE}/search/collections`);
  if (!res.ok) throw new Error("Failed to load collections.");
  return res.json();
}

// ── System Status ──────────────────────────────────────────────────────────────

export interface SystemStatus {
  status: string;
  connectivity: "online" | "offline";
  llm: {
    preferred: "openai" | "gemini" | "ollama";
    ollama: "running" | "unavailable" | "error";
    openai: "configured" | "no_key";
  };
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error("Backend unreachable");
  return res.json();
}

// ── Emergency types ───────────────────────────────────────────────────────────

export interface EmergencyInfo {
  is_emergency: boolean;
  risk_level: "critical" | "high" | "medium" | "low";
  detected_conditions: string[];
  call_108: boolean;
  summary: string;
  timestamp: string;
}

// ── Hospital / PHC Finder ─────────────────────────────────────────────────────

export interface HospitalFacility {
  name: string;
  type: string;
  lat: number;
  lon: number;
  address: string;
  phone: string;
  distance_km: number;
  open_now?: boolean | null;
}

export interface HospitalResponse {
  count: number;
  facilities: HospitalFacility[];
  query_lat: number;
  query_lon: number;
}

export async function findNearbyHospitals(
  lat: number,
  lon: number,
  radius: number = 5000,
  facilityType: string = "all"
): Promise<HospitalResponse> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radius: String(radius),
    facility_type: facilityType,
  });
  const res = await fetch(`${API_BASE}/hospitals/nearby?${params}`);
  if (!res.ok) throw new Error("Hospital search failed. Are you online?");
  return res.json();
}

export function getUserLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(`Location error: ${err.message}`)),
      { timeout: 20000, maximumAge: 60000 }
    );
  });
}

export interface TranscribeResponse {
  transcript: string;
}

export async function transcribeAudio(
  audioBlob: Blob,
  language: string = "en"
): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");
  formData.append("language", language);

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Transcription failed.");
  return res.json();
}

export async function submitScreeningAnswer(
  sessionId: string,
  questionId: string,
  answer: string,
  onEvent?: (event: "HEADERS_RECEIVED" | "JSON_PARSED") => void
): Promise<ChatApiResponse> {
  const res = await fetch(`${API_BASE}/chat/screening/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      question_id: questionId,
      answer: answer,
    }),
  });
  onEvent?.("HEADERS_RECEIVED");
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to submit screening answer");
  }
  const data = await res.json();
  onEvent?.("JSON_PARSED");
  return data;
}

export async function clearChatSession(
  sessionId: string
): Promise<{ cleared: boolean; session_id: string }> {
  const res = await fetch(`${API_BASE}/chat/session/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to clear chat session on server");
  }
  return res.json();
}

export async function generateChatTitle(message: string): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/title`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) return "Health Chat";
  const data = await res.json();
  return data.title;
}

export { API_BASE };
