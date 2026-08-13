import type { DiscoveryQuery, ProspectCandidate, ProspectDiscoveryProvider } from '../types.js';

export class NoopDiscoveryProvider implements ProspectDiscoveryProvider {
  readonly name = 'unconfigured';

  isConfigured(): boolean {
    return false;
  }

  async discover(_query: DiscoveryQuery): Promise<ProspectCandidate[]> {
    return [];
  }
}

export function normalizeDiscoveryCandidates(candidates: ProspectCandidate[]): ProspectCandidate[] {
  const seen = new Set<string>();
  const normalized: ProspectCandidate[] = [];

  for (const candidate of candidates) {
    const domain = candidate.domain.trim().toLowerCase().replace(/^www\./, '');
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    normalized.push({
      ...candidate,
      domain,
      website: candidate.website || `https://${domain}`
    });
  }

  return normalized;
}
