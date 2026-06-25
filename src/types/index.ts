export interface Attachment {
  id: string;
  name: string;
  type: "image" | "pdf" | "document" | "raw";
  url: string; // Object URL or base64 representation for local-first storage
  ocrText?: string; // Captured OCR output for text index querying in Phase 3
  uploadedAt: number;
}

// ---- Part 4: Expanded risk factors block ----
export interface RiskFactors {
  smoking?: boolean;
  alcohol?: boolean;
  tobacco?: boolean;
  pregnancy?: boolean;
  immunocompromised?: boolean;
  hiv?: boolean;
}

export interface HealthRecord {
  id: string;
  summary: string; // AI generated 30-word summary sentence

  // Core symptom fields
  symptoms: string;
  duration: string;
  severity: "low" | "medium" | "high" | "";

  // Demographics
  age: string;
  gender: string;
  location: string; // Vital for resource maps and region scheme recommendation
  preExistingConditions: string;
  triggers: string;

  // Part 3: Inferred fields from LLM extraction
  urgency?: "routine" | "soon" | "urgent" | "emergency" | "";
  possibleConditions?: string[];

  // Part 4: Expanded health profile (all optional)
  riskFactors?: RiskFactors;
  personalHistory?: string;
  familyHistory?: string;
  occupation?: string;
  incomeRange?: string;
  nutrition?: string;
  governmentSchemeUsage?: string;
  pets?: string;
  housingConditions?: string;

  attachments: Attachment[]; // Handles medical images, reports, and PDFs
  createdAt: number;
}

export interface Message {
  role: "user" | "ai";
  text: string;
}

export type HealthFieldKey =
  | "symptoms"
  | "duration"
  | "severity"
  | "age"
  | "gender"
  | "location"
  | "preExistingConditions"
  | "triggers"
  // Part 3: inferred extraction keys
  | "urgency"
  // Part 4: extended profile keys
  | "personalHistory"
  | "familyHistory"
  | "occupation"
  | "incomeRange"
  | "nutrition"
  | "governmentSchemeUsage"
  | "pets"
  | "housingConditions";

export interface MemoryVector {
  id: string;
  vector: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Speech / Transcription
// ---------------------------------------------------------------------------

/**
 * Response shape from the FastAPI /transcribe endpoint.
 * Must stay in sync with backend/app/routers/transcribe.py.
 */
export interface TranscriptionResponse {
  /** Language code that was requested by the frontend (e.g. "hi") */
  selected_language: string;
  /** Language code inferred from the audio content */
  detected_language: string;
  /** The transcribed text */
  text: string;
  /** Wall-clock time taken by the STT model, in milliseconds */
  processing_time_ms: number;
}
