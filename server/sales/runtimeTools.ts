import { toolRegistry } from '../agent/toolRegistry.js';
import { evaluateCrmOutreachPolicy } from './policy.js';
import { scoreProspect } from './scoring.js';
import { extractPublicContacts } from './enrichment/publicContacts.js';

/**
 * Registers deterministic sales helpers with the core Nyx tool registry when the
 * runtime exposes registerTool(). Kept isolated so Gemini-owned runtime files do
 * not need to import sales internals directly.
 */
export function registerSalesRuntimeTools(): void {
  const registry: any = toolRegistry as any;
  if (typeof registry.registerTool !== 'function') return;

  const existing = (name: string) => Boolean(registry.getTool?.(name));

  if (!existing('CRM_OUTREACH_POLICY')) {
    registry.registerTool({
      name: 'CRM_OUTREACH_POLICY',
      description: 'Determine whether cold outreach is allowed for a CRM status.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 2000,
      maxRetries: 0,
      validate: (input: any) => Boolean(input?.crmStatus),
      execute: async (input: any) => evaluateCrmOutreachPolicy(input.crmStatus)
    });
  }

  if (!existing('SCORE_PROSPECT')) {
    registry.registerTool({
      name: 'SCORE_PROSPECT',
      description: 'Score a prospect against explicit ICP evidence.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 2000,
      maxRetries: 0,
      validate: (input: any) => Boolean(input && Array.isArray(input.targetIndustries) && Array.isArray(input.targetLocations)),
      execute: async (input: any) => scoreProspect(input)
    });
  }

  if (!existing('EXTRACT_PUBLIC_CONTACTS')) {
    registry.registerTool({
      name: 'EXTRACT_PUBLIC_CONTACTS',
      description: 'Extract public business contact details from fetched page content without guessing addresses.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 2000,
      maxRetries: 0,
      validate: (input: any) => Boolean(input?.sourceUrl),
      execute: async (input: any) => extractPublicContacts(input)
    });
  }
}
