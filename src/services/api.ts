const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

import type {
  SearchResponse,
  CollectionName,
  ChatRequest,
  ChatApiResponse,
} from "../types/search";

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
  req: ChatRequest
): Promise<ChatApiResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: req.message,
      language: req.language ?? "en",
      top_k: req.top_k ?? 5,
      collection: req.collection ?? "all",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Chat request failed");
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

export { API_BASE };
