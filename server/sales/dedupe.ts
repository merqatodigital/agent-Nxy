import type { ProspectCandidate } from './types.js';

export function normalizeDomain(input: string): string {
  const value = input.trim();
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return value.toLowerCase().replace(/^www\./, '').split('/')[0];
  }
}

export function dedupeProspects(candidates: ProspectCandidate[], existingDomains: string[] = []): ProspectCandidate[] {
  const seen = new Set(existingDomains.map(normalizeDomain));
  const output: ProspectCandidate[] = [];

  for (const candidate of candidates) {
    const domain = normalizeDomain(candidate.domain || candidate.website);
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    output.push({ ...candidate, domain });
  }

  return output;
}
