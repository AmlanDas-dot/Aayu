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
