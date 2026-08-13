import { toolRegistry } from '../../agent/toolRegistry.js';
import type { ResearchProvider, ResearchRequest, ResearchResult } from './provider.js';

/**
 * Uses the core agent runtime's WEB_SCRAPE tool as the default research engine.
 * Advanced crawler providers can be inserted ahead of this provider later without
 * changing the agent/tool contract.
 */
export class RuntimeResearchProvider implements ResearchProvider {
  readonly name = 'nyx-runtime-web-scrape';

  isConfigured(): boolean {
    return Boolean(toolRegistry.getTool('WEB_SCRAPE'));
  }

  async research(request: ResearchRequest): Promise<ResearchResult> {
    const tool = toolRegistry.getTool('WEB_SCRAPE');
    if (!tool) {
      return {
        provider: this.name,
        rootUrl: request.url,
        pages: [],
        errors: [{ url: request.url, error: 'web_scrape_tool_not_registered' }]
      };
    }

    const result: any = await tool.execute({ url: request.url }, {} as any);
    const data = result?.data || result || {};
    const url = data.url || request.url;
    const text = data.textSample || data.text || data.description || '';

    return {
      provider: this.name,
      rootUrl: url,
      pages: [{
        url,
        statusCode: Number(data.statusCode || 200),
        title: String(data.title || ''),
        description: String(data.description || ''),
        text: String(text),
        html: typeof data.html === 'string' ? data.html : undefined,
        links: Array.isArray(data.links) ? data.links.map(String) : [],
        fetchedAt: String(data.fetchedAt || new Date().toISOString())
      }],
      errors: []
    };
  }
}
