import type { ResearchProvider, ResearchRequest, ResearchResult } from './provider.js';

export class ResearchRouter {
  constructor(private readonly providers: ResearchProvider[]) {}

  async research(request: ResearchRequest): Promise<ResearchResult> {
    const errors: { url: string; error: string }[] = [];

    for (const provider of this.providers) {
      if (!provider.isConfigured()) continue;
      try {
        return await provider.research(request);
      } catch (error: any) {
        errors.push({ url: request.url, error: `${provider.name}:${String(error?.message || 'research_failed')}` });
      }
    }

    return {
      provider: 'none',
      rootUrl: request.url,
      pages: [],
      errors: errors.length ? errors : [{ url: request.url, error: 'no_research_provider_configured' }]
    };
  }
}
