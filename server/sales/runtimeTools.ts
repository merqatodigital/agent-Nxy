import { toolRegistry } from '../agent/toolRegistry.js';
import { evaluateOutreachPolicy } from './policy.js';
import { scoreProspect } from './scoring.js';
import { extractPublicContacts } from './enrichment/publicContacts.js';
import { fetchPublicBusinessPage } from './research/safeFetch.js';
import { crawlPublicBusinessSite } from './research/boundedCrawler.js';
import { SearxngDiscoveryProvider } from './discovery/searxngProvider.js';
import { researchAndQualifyBusiness } from './pipeline.js';

export function registerSalesRuntimeTools(): void {
  toolRegistry.registerTool({
    name: 'WEB_SCRAPE',
    description: 'Fetch and extract real public business website content. Never fabricates unknown-site data.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 15000,
    retryBehavior: { maxAttempts: 2, backoffMs: 1500 },
    validateInput: (args: any) => {
      if (!args || typeof args !== 'object' || !args.url) return { valid: false, error: 'url argument is required' };
      return { valid: true };
    },
    execute: async (args: any) => fetchPublicBusinessPage(String(args.url))
  });

  toolRegistry.registerTool({
    name: 'WEB_RESEARCH',
    description: 'Crawl a bounded set of high-value pages on a public business website with same-domain throttling.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 120000,
    retryBehavior: { maxAttempts: 1, backoffMs: 0 },
    validateInput: (args: any) => args?.url ? { valid: true } : { valid: false, error: 'url is required' },
    execute: async (args: any) => crawlPublicBusinessSite({ url: String(args.url), maxPages: args.maxPages ? Number(args.maxPages) : undefined })
  });

  toolRegistry.registerTool({
    name: 'DISCOVER_PROSPECTS',
    description: 'Discover real organization websites through a configured self-hosted SearXNG search provider.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 20000,
    retryBehavior: { maxAttempts: 2, backoffMs: 1000 },
    validateInput: (args: any) => !args || !Number.isFinite(Number(args.maximumResults || 10)) ? { valid: false, error: 'valid discovery arguments are required' } : { valid: true },
    execute: async (args: any) => {
      const provider = new SearxngDiscoveryProvider();
      if (!provider.isConfigured()) return { status: 'configuration_required', provider: provider.name, prospects: [] };
      const prospects = await provider.discover({
        industry: args.industry,
        location: args.location,
        keywords: Array.isArray(args.keywords) ? args.keywords : [],
        maximumResults: Math.max(1, Math.min(50, Number(args.maximumResults || 10))),
        excludeDomains: Array.isArray(args.excludeDomains) ? args.excludeDomains : []
      });
      return { status: 'success', provider: provider.name, prospects };
    }
  });

  toolRegistry.registerTool({
    name: 'CRM_OUTREACH_POLICY',
    description: 'Determine whether cold outreach is allowed for a CRM relationship status.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 2000,
    retryBehavior: { maxAttempts: 1, backoffMs: 0 },
    validateInput: (args: any) => args?.crmStatus ? { valid: true } : { valid: false, error: 'crmStatus is required' },
    execute: async (args: any) => evaluateOutreachPolicy(args.crmStatus)
  });

  toolRegistry.registerTool({
    name: 'SCORE_PROSPECT',
    description: 'Score a prospect against explicit ICP and collected evidence.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 2000,
    retryBehavior: { maxAttempts: 1, backoffMs: 0 },
    validateInput: (args: any) => !args || !Array.isArray(args.targetIndustries) || !Array.isArray(args.targetLocations) ? { valid: false, error: 'targetIndustries and targetLocations arrays are required' } : { valid: true },
    execute: async (args: any) => scoreProspect(args)
  });

  toolRegistry.registerTool({
    name: 'EXTRACT_PUBLIC_CONTACTS',
    description: 'Extract public business contact details from fetched content without guessing email addresses.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 2000,
    retryBehavior: { maxAttempts: 1, backoffMs: 0 },
    validateInput: (args: any) => args?.sourceUrl ? { valid: true } : { valid: false, error: 'sourceUrl is required' },
    execute: async (args: any) => extractPublicContacts(args)
  });

  toolRegistry.registerTool({
    name: 'RESEARCH_QUALIFY_BUSINESS',
    description: 'Research a business across multiple pages, extract public contacts, apply CRM safety, and score against ICP evidence.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 120000,
    retryBehavior: { maxAttempts: 1, backoffMs: 0 },
    validateInput: (args: any) => {
      if (!args?.prospect?.website || !args?.prospect?.domain) return { valid: false, error: 'prospect website and domain are required' };
      if (!Array.isArray(args.targetIndustries) || !Array.isArray(args.targetLocations)) return { valid: false, error: 'targetIndustries and targetLocations are required' };
      return { valid: true };
    },
    execute: async (args: any) => researchAndQualifyBusiness(args)
  });
}
