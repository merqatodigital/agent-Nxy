import { toolRegistry } from '../agent/toolRegistry.js';
import { evaluateOutreachPolicy } from './policy.js';
import { scoreProspect } from './scoring.js';
import { extractPublicContacts } from './enrichment/publicContacts.js';
import { fetchPublicBusinessPage } from './research/safeFetch.js';

export function registerSalesRuntimeTools(): void {
  // Replace Gemini's mock/fabricated WEB_SCRAPE implementation with a real public-web fetcher.
  toolRegistry.registerTool({
    name: 'WEB_SCRAPE',
    description: 'Fetch and extract real public business website content. Never fabricates unknown-site data.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 15000,
    retryBehavior: { maxAttempts: 2, backoffMs: 1500 },
    validateInput: (args: any) => {
      if (!args || typeof args !== 'object' || !args.url) {
        return { valid: false, error: 'url argument is required' };
      }
      return { valid: true };
    },
    execute: async (args: any) => fetchPublicBusinessPage(String(args.url))
  });

  toolRegistry.registerTool({
    name: 'CRM_OUTREACH_POLICY',
    description: 'Determine whether cold outreach is allowed for a CRM relationship status.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 2000,
    retryBehavior: { maxAttempts: 1, backoffMs: 0 },
    validateInput: (args: any) => {
      if (!args?.crmStatus) return { valid: false, error: 'crmStatus is required' };
      return { valid: true };
    },
    execute: async (args: any) => evaluateOutreachPolicy(args.crmStatus)
  });

  toolRegistry.registerTool({
    name: 'SCORE_PROSPECT',
    description: 'Score a prospect against explicit ICP and collected evidence.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 2000,
    retryBehavior: { maxAttempts: 1, backoffMs: 0 },
    validateInput: (args: any) => {
      if (!args || !Array.isArray(args.targetIndustries) || !Array.isArray(args.targetLocations)) {
        return { valid: false, error: 'targetIndustries and targetLocations arrays are required' };
      }
      return { valid: true };
    },
    execute: async (args: any) => scoreProspect(args)
  });

  toolRegistry.registerTool({
    name: 'EXTRACT_PUBLIC_CONTACTS',
    description: 'Extract public business contact details from fetched content without guessing email addresses.',
    approvalPolicy: 'AUTO_APPROVED',
    timeoutMs: 2000,
    retryBehavior: { maxAttempts: 1, backoffMs: 0 },
    validateInput: (args: any) => {
      if (!args?.sourceUrl) return { valid: false, error: 'sourceUrl is required' };
      return { valid: true };
    },
    execute: async (args: any) => extractPublicContacts(args)
  });
}
