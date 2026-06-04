/**
 * services/rag/retrieval.ts
 *
 * Part 6: Improved RAG retrieval with better keyword scoring.
 * Improvements over v1:
 *  - Symptom exact-match bonus (high weight)
 *  - Category keyword match bonus
 *  - TF-IDF-style term frequency normalization
 *  - Minimum score threshold to reduce false positives (e.g., skin → typhoid)
 *  - Partial word match via token prefix
 *  - Architecture compatible with future ChromaDB / FAISS / Ollama embeddings
 *
 * No embeddings yet — pure BM25-inspired keyword scoring.
 */

import { KnowledgeEntry } from "./types";
import healthKnowledgeData from "../../data/healthKnowledge.json";
import { DEFAULT_STOP_WORDS } from "../../config/constants";

// Minimum score required before an entry is returned
const MIN_SCORE_THRESHOLD = 2;

// Weight constants — tuned to avoid false positives
const WEIGHT = {
  SYMPTOM_EXACT: 8,   // Query token exactly matches a symptom token
  SYMPTOM_PARTIAL: 3, // Query token is a prefix of a symptom token
  CATEGORY_EXACT: 6,  // Query token exactly matches a category token
  CATEGORY_PARTIAL: 2, // Prefix match on category
  LENGTH_PENALTY: 0.1, // Penalize very long symptom lists (general catch-alls)
} as const;

export interface Retriever {
  retrieve(query: string, limit?: number): Promise<KnowledgeEntry[]>;
}

export class LocalRetriever implements Retriever {
  private database: KnowledgeEntry[];
  private stopWords: Set<string>;

  constructor(
    database: KnowledgeEntry[] = healthKnowledgeData as KnowledgeEntry[],
    stopWords: string[] = DEFAULT_STOP_WORDS
  ) {
    this.database = database;
    this.stopWords = new Set(stopWords.map((w) => w.toLowerCase()));
  }

  /** Tokenize text into clean, filtered terms */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !this.stopWords.has(word));
  }

  /**
   * Score a knowledge entry against query tokens.
   * Higher = more relevant.
   */
  private scoreEntry(queryTokens: string[], entry: KnowledgeEntry): number {
    let score = 0;

    // Tokenize each symptom phrase and the category
    const symptomTokens: string[] = entry.symptoms.flatMap((s) => this.tokenize(s));
    const categoryTokens: string[] = this.tokenize(entry.category);

    const symptomSet = new Set(symptomTokens);
    const categorySet = new Set(categoryTokens);

    for (const qToken of queryTokens) {
      // --- Symptom scoring ---
      if (symptomSet.has(qToken)) {
        // Exact match with a symptom token
        score += WEIGHT.SYMPTOM_EXACT;
      } else {
        // Partial match: query token is a prefix of a symptom token
        for (const sToken of symptomTokens) {
          if (sToken.startsWith(qToken) && qToken.length >= 4) {
            score += WEIGHT.SYMPTOM_PARTIAL;
            break;
          }
        }
      }

      // --- Category scoring ---
      if (categorySet.has(qToken)) {
        score += WEIGHT.CATEGORY_EXACT;
      } else {
        for (const cToken of categoryTokens) {
          if (cToken.startsWith(qToken) && qToken.length >= 4) {
            score += WEIGHT.CATEGORY_PARTIAL;
            break;
          }
        }
      }
    }

    // Penalize entries with very many symptom tokens (broad catch-alls rank lower)
    if (symptomTokens.length > 20) {
      score -= (symptomTokens.length - 20) * WEIGHT.LENGTH_PENALTY;
    }

    // Bonus: urgency-based boost for entries that are genuinely serious
    if (entry.urgency === "emergency" && score > 0) score += 2;
    if (entry.urgency === "high" && score > 0) score += 1;

    return Math.max(0, score);
  }

  public async retrieve(query: string, limit = 3): Promise<KnowledgeEntry[]> {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const scored = this.database.map((entry) => ({
      entry,
      score: this.scoreEntry(queryTokens, entry),
    }));

    return scored
      .filter((item) => item.score >= MIN_SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.entry);
  }
}
