export interface SearchResult {
  id: string;
  content: string;
  title: string;
  category: string;
  source: string;
  tags: string | string[];
  score: number;
  distance: number;
  collection: string;
  urgency?: string;
}

export interface SearchResponse {
  query: string;
  collection: string;
  total_results: number;
  results: SearchResult[];
  message: string;
}

// Collections are now dynamic (16+ health-knowledge files, auto-discovered by
// the backend) -- widened to string so the type doesn't go stale every time
// a JSON file is added or removed from backend/app/data/healthknowledge/.
export type CollectionName = string;

// ── Sprint 2 types ──────────────────────────────────────────────────────────

export type RiskLevel = "emergency" | "urgent" | "routine";

export interface RetrievedDocument {
  title: string;
  content: string;
  score: number;
  collection: string;
  category: string;
  source: string;
}

export interface ChatRequest {
  message: string;
  language?: string;
  top_k?: number;
  collection?: CollectionName;
  session_id?: string;
  history?: any[];
  patient_records?: string;
}

export interface ChatApiResponse {
  risk_level: RiskLevel;
  response: string;
  retrieved_documents: RetrievedDocument[];
  confidence: number;
  matched_rules: string[];
  original_message: string;
  english_message: string;
  processing_time_ms: number;
  disclaimer: string;
  mode?: "online" | "offline";
  llm_provider?: "openai" | "gemini" | "ollama" | "template" | "none";
  emergency?: {
    is_emergency: boolean;
    risk_level: "critical" | "high" | "medium" | "low";
    detected_conditions: string[];
    call_108: boolean;
    summary: string;
    timestamp: string;
  } | null;

  // Screening fields
  screening_mode?: boolean;
  screening_complete?: boolean;
  question_index?: number | null;
  total_questions?: number | null;
  question?: {
    id: string;
    text: string;
    hint?: string;
    options: string[];
  } | null;
  reported_symptoms?: string[] | null;
  possible_conditions?: Array<{
    id: string;
    name: string;
    score: number;
    icon?: string;
  }> | null;
  primary_condition?: {
    id: string;
    name: string;
    score: number;
    icon?: string;
  } | null;
  running_scores?: Array<{
    id: string;
    name: string;
    score: number;
    icon?: string;
  }> | null;
  confidence_label?: string | null;
  referral_facilities?: Array<{
    name: string;
    type: string;
    address?: string;
    distance_km?: number;
  }> | null;
}
