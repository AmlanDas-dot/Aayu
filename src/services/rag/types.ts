export interface KnowledgeEntry {
  id: string;
  category: string;
  symptoms: string[];
  guidance: string;
  precautions: string[];
  urgency: "low" | "medium" | "high" | "emergency";
}
