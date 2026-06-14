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
}

export interface SearchResponse {
  query: string;
  collection: string;
  total_results: number;
  results: SearchResult[];
  message: string;
}

export type CollectionName = "all" | "first_aid" | "medical_guidance" | "emergency_guidance";

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
  collection?: string;
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
}
