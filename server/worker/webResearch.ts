/**
 * Sales Web Research Worker Module
 * Thin adapter over the registered runtime research tools.
 * Never fabricates a successful result when a research tool is unavailable.
 */
import { toolRegistry } from '../agent/toolRegistry.js';
import { registerSalesRuntimeTools } from '../sales/runtimeTools.js';

registerSalesRuntimeTools();

export interface WebResearchOptions {
  domain: string;
  depth?: 'basic' | 'deep';
  maxPages?: number;
}

export async function performWebResearch(options: WebResearchOptions) {
  if (!options.domain?.trim()) throw new Error('domain_required');

  const toolName = options.depth === 'deep' ? 'WEB_RESEARCH' : 'WEB_SCRAPE';
  const tool = toolRegistry.getTool(toolName);
  if (!tool) throw new Error(`${toolName.toLowerCase()}_tool_unavailable`);

  const args = toolName === 'WEB_RESEARCH'
    ? { url: options.domain, maxPages: options.maxPages }
    : { url: options.domain };

  const validation = tool.validateInput(args);
  if (!validation.valid) throw new Error(validation.error || 'invalid_research_input');

  return await tool.execute(args, {});
}
