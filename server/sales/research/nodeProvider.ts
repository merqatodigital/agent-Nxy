import { researchWebsite } from '../../worker/webResearch.js';
import type { ResearchProvider, ResearchRequest, ResearchResult } from './provider.js';

export class NodeResearchProvider implements ResearchProvider {
  readonly name = 'node-fetch';

  isConfigured(): boolean {
    return true;
  }

  async research(request: ResearchRequest): Promise<ResearchResult> {
    const snapshot = await researchWebsite(request.url);
    return {
      provider: this.name,
      rootUrl: snapshot.url,
      pages: [{
        url: snapshot.url,
        statusCode: snapshot.statusCode,
        title: snapshot.title,
        description: snapshot.description,
        text: snapshot.textSample,
        links: snapshot.links,
        fetchedAt: snapshot.fetchedAt
      }],
      errors: []
    };
  }
}
