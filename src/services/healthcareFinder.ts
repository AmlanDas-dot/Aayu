/**
 * services/healthcareFinder.ts
 *
 * Part 5: Local healthcare center lookup service.
 * Searches healthcareCenters.json by city, district, state, and type.
 * No external APIs — purely local data.
 * Architecture is compatible with future remote enrichment.
 */

import rawCenters from "../data/healthcareCenters.json";

export interface HealthcareCenter {
  name: string;
  city?: string;
  district?: string;
  state?: string;
  location?: string; // fallback legacy field
  type: string;
  contact: string;
  hours: string;
  emergency: boolean;
}

// Normalize the raw JSON — support both legacy (location string) and new schema
const centers: HealthcareCenter[] = (rawCenters as any[]).map((c) => ({
  name: c.name ?? "",
  city: c.city ?? c.location ?? "",
  district: c.district ?? "",
  state: c.state ?? "",
  location: c.location ?? "",
  type: c.type ?? "",
  contact: c.contact ?? "",
  hours: c.hours ?? "",
  emergency: c.emergency ?? false,
}));

/**
 * Normalize text for comparison: lowercase, remove punctuation, trim.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

/**
 * Score a center against a query.
 * Returns a positive number if relevant, 0 if no match.
 */
function scoreCenter(center: HealthcareCenter, queryTokens: string[], typeFilter?: string): number {
  let score = 0;

  // Location matching — city, district, state, legacy location field
  const locationText = normalize(
    `${center.city} ${center.district} ${center.state} ${center.location}`
  );
  const typeText = normalize(center.type);
  const nameText = normalize(center.name);

  for (const token of queryTokens) {
    if (token.length < 2) continue;

    // Exact city / district match gets high weight
    if (locationText.includes(token)) score += 10;

    // Name match
    if (nameText.includes(token)) score += 4;

    // Type keyword match (hospital, clinic, pharmacy, etc.)
    if (typeText.includes(token)) score += 6;
  }

  // Apply type filter if specified
  if (typeFilter) {
    const tf = normalize(typeFilter);
    if (!typeText.includes(tf) && !nameText.includes(tf)) {
      score = 0; // Discard non-matching type
    }
  }

  return score;
}

/**
 * Main lookup function.
 * @param query   Free-text query: city name, district, or center type.
 * @param limit   Maximum results to return (default: 5).
 * @returns Sorted list of matching HealthcareCenter objects.
 */
export function findHealthcareCenters(
  query: string,
  limit = 5
): HealthcareCenter[] {
  if (!query || query.trim().length === 0) return [];

  const queryTokens = normalize(query).split(/\s+/).filter((t) => t.length >= 2);
  if (queryTokens.length === 0) return [];

  // Detect if query contains a type keyword
  const typeKeywords = ["hospital", "clinic", "pharmacy", "emergency", "dispensary", "health center", "maternity", "diagnostic"];
  let typeFilter: string | undefined;
  for (const kw of typeKeywords) {
    if (normalize(query).includes(kw)) {
      typeFilter = kw;
      break;
    }
  }

  const scored = centers
    .map((center) => ({ center, score: scoreCenter(center, queryTokens, typeFilter) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.center);

  return scored;
}

/**
 * Get only emergency centers — for urgent queries.
 */
export function findEmergencyCenters(limit = 3): HealthcareCenter[] {
  return centers
    .filter((c) => c.emergency)
    .slice(0, limit);
}

/**
 * Get all centers, optionally filtered by type.
 */
export function getAllCenters(typeFilter?: string): HealthcareCenter[] {
  if (!typeFilter) return centers;
  const tf = normalize(typeFilter);
  return centers.filter((c) => normalize(c.type).includes(tf) || normalize(c.name).includes(tf));
}
