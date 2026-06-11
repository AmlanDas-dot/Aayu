const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

import type { SearchResponse, CollectionName } from "../types/search";

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

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

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

export { API_BASE };
