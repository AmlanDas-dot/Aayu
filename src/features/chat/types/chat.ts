import type { RiskLevel, RetrievedDocument } from "@/types/search";

export interface HealthcareRecommendation {
  enabled: boolean;
  urgency: string;
  facility_types: string[];
  radius: number;
  title: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  risk_level?: RiskLevel;
  retrieved_documents?: RetrievedDocument[];
  matched_rules?: string[];
  disclaimer?: string;
  processing_time_ms?: number;
  mode?: "online" | "offline";
  llm_provider?: "openai" | "gemini" | "ollama" | "template" | "none";
  image?: string;
  imageDescription?: string;
  warnings?: string[];
  confidence?: string;
  healthcare_recommendation?: HealthcareRecommendation;
  screening_mode?: boolean;
  screening_complete?: boolean;
  show_risk_level?: boolean;
}

export interface Conversation {
  sessionId: string;
  title: string;
  timestamp: string;
  lastMessageSnippet: string;
  messages: ChatMessage[];
  icon?: string;
}
