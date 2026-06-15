import schemesData from "../data/governmentSchemes.json";

export interface GovernmentScheme {
  name: string;
  state: string;
  description: string;
  eligibility: string;
  benefits: string;
  documents_required: string[];
  official_link: string;
}

const schemes: GovernmentScheme[] = schemesData as GovernmentScheme[];

/** Return all government schemes. */
export function getAllSchemes(): GovernmentScheme[] {
  return schemes;
}

/** Find a scheme by name — exact then substring match. */
export function getSchemeByName(name: string): GovernmentScheme | undefined {
  if (!name) return undefined;
  const target = name.toLowerCase().trim();
  let match = schemes.find((s) => s.name.toLowerCase() === target);
  if (match) return match;
  return schemes.find(
    (s) =>
      s.name.toLowerCase().includes(target) ||
      target.includes(s.name.toLowerCase())
  );
}

/** Filter schemes by state, e.g. "National" or "Odisha". */
export function getStateSchemes(state: string): GovernmentScheme[] {
  if (!state) return [];
  const target = state.toLowerCase().trim();
  return schemes.filter((s) => s.state.toLowerCase() === target);
}

/** Full-text search across name, description, benefits, eligibility, state. */
export function searchScheme(keyword: string): GovernmentScheme[] {
  if (!keyword) return [];
  const target = keyword.toLowerCase().trim();
  return schemes.filter(
    (s) =>
      s.name.toLowerCase().includes(target) ||
      s.description.toLowerCase().includes(target) ||
      s.benefits.toLowerCase().includes(target) ||
      s.eligibility.toLowerCase().includes(target) ||
      s.state.toLowerCase().includes(target)
  );
}
