import type { DiscoveryQuery, ProspectCandidate, ProspectDiscoveryProvider } from '../types.js';
import { normalizeDiscoveryCandidates } from './provider.js';

export class SearxngDiscoveryProvider implements ProspectDiscoveryProvider {
  readonly name = 'searxng';

  constructor(private readonly baseUrl = process.env.NYX_SEARXNG_URL || '') {}

  isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  async discover(query: DiscoveryQuery): Promise<ProspectCandidate[]> {
    if (!this.isConfigured()) return [];

    const terms = [query.industry, query.location, ...(query.keywords || [])].filter(Boolean).join(' ');
    if (!terms.trim()) return [];

    const endpoint = new URL('/search', this.baseUrl);
    endpoint.searchParams.set('q', terms);
    endpoint.searchParams.set('format', 'json');
    endpoint.searchParams.set('language', 'en');

    const response = await fetch(endpoint, {
      headers: { accept: 'application/json', 'user-agent': 'NyxDiscovery/1.0' },
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error(`discovery_http_${response.status}`);

    const payload: any = await response.json();
    const excluded = new Set((query.excludeDomains || []).map(v => v.toLowerCase().replace(/^www\./, '')));
    const candidates: ProspectCandidate[] = [];

    for (const result of Array.isArray(payload?.results) ? payload.results : []) {
      if (candidates.length >= Math.max(1, query.maximumResults)) break;
      try {
        const url = new URL(result.url);
        const domain = url.hostname.toLowerCase().replace(/^www\./, '');
        if (!domain || excluded.has(domain)) continue;
        candidates.push({
          companyName: String(result.title || domain).replace(/\s+[|\-–—].*$/, '').trim(),
          domain,
          website: url.origin,
          location: query.location,
          industry: query.industry,
          sourceType: 'search',
          sourceUrl: result.url,
          sourceProvider: this.name,
          discoveredAt: new Date().toISOString()
        });
      } catch {
        // Skip malformed search results.
      }
    }

    return normalizeDiscoveryCandidates(candidates);
  }
}
