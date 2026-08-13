import { RegisteredTool, ToolContext, ToolValidationResult } from './types.js';

class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  public registerTool(tool: RegisteredTool): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  public listTools(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  private registerDefaultTools() {
    this.registerTool({
      name: 'CRM_LOOKUP',
      description: 'Query internal CRM database for account deal history, LTV, and sentiment.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 10000,
      retryBehavior: { maxAttempts: 3, backoffMs: 1000 },
      validateInput: (args: any): ToolValidationResult => {
        if (!args || typeof args !== 'object') return { valid: false, error: 'Arguments object is required' };
        if (!args.company_name && !args.companyName && !args.domain) return { valid: false, error: 'company_name or domain argument is required' };
        return { valid: true };
      },
      execute: async (args: any, context: ToolContext) => {
        const query = String(args.company_name || args.companyName || args.domain || '').toLowerCase().trim();
        const records = context.crmRecords || [];
        const record = records.find((c: any) =>
          c.companyName?.toLowerCase().includes(query) || c.domain?.toLowerCase().includes(query)
        );

        if (record) {
          return {
            found: true,
            company_name: record.companyName,
            domain: record.domain,
            lifecycle_stage: record.lifecycleStage,
            past_deals: record.pastDeals,
            total_spend: record.totalSpend,
            last_contact: record.lastContactDate || 'Never',
            sentiment: record.sentiment,
            notes: record.keyNotes,
            account_owner: record.accountOwner
          };
        }
        return { found: false, company_name: query, message: 'No prior CRM relationship found.' };
      }
    });

    // Safe placeholders are intentionally non-fabricating. server/sales/runtimeTools.ts
    // replaces these with real public-web implementations when the agent runtime loads.
    this.registerTool({
      name: 'WEB_SCRAPE',
      description: 'Public web research tool. Real implementation is registered by the sales runtime.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 15000,
      retryBehavior: { maxAttempts: 1, backoffMs: 0 },
      validateInput: (args: any) => args?.url ? { valid: true } : { valid: false, error: 'url argument is required' },
      execute: async () => ({ status: 'configuration_required', message: 'Sales research runtime is not registered.' })
    });

    this.registerTool({
      name: 'DRAFT_EMAIL',
      description: 'Synthesize personalized cold outreach copy and queue into outbox.',
      approvalPolicy: 'REQUIRES_APPROVAL',
      timeoutMs: 10000,
      retryBehavior: { maxAttempts: 2, backoffMs: 1000 },
      validateInput: (args: any): ToolValidationResult => {
        if (!args || typeof args !== 'object') return { valid: false, error: 'Arguments object is required' };
        if (!args.recipient_email && !args.recipientEmail) return { valid: false, error: 'recipient_email is required' };
        if (!args.email_subject && !args.subject) return { valid: false, error: 'email_subject is required' };
        if (!args.email_body && !args.body) return { valid: false, error: 'email_body is required' };
        return { valid: true };
      },
      execute: async (args: any, context: ToolContext) => {
        const recipientEmail = args.recipient_email || args.recipientEmail;
        const subject = args.email_subject || args.subject;
        const body = args.email_body || args.body;
        const companyName = args.company_name || args.companyName || recipientEmail.split('@')[1] || 'Target Company';
        const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const draftObj = {
          id: draftId,
          prospectId: context.prospectId || `lead-${Date.now()}`,
          companyName,
          recipientEmail,
          recipientName: args.recipient_name || recipientEmail.split('@')[0].replace(/[._-]+/g, ' '),
          subject,
          body,
          hookUsed: args.hook_used || args.hookUsed || 'Evidence-based personalized outreach',
          createdAt: new Date().toISOString(),
          status: 'Draft',
          tone: 'Value-First'
        };
        if (context.outboundDrafts) context.outboundDrafts.unshift(draftObj);
        return {
          status: 'draft_saved',
          draft_id: draftId,
          recipient_email: recipientEmail,
          email_subject: subject,
          message: `Outreach draft for ${companyName} queued into outbox.`
        };
      }
    });

    this.registerTool({
      name: 'GOOGLE_BUSINESS_LOOKUP',
      description: 'Google Business research tool. Real implementation is registered by the sales runtime.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 20000,
      retryBehavior: { maxAttempts: 1, backoffMs: 0 },
      validateInput: (args: any) => (args?.url || args?.google_business_url || args?.query)
        ? { valid: true }
        : { valid: false, error: 'url, google_business_url, or query is required' },
      execute: async () => ({ status: 'configuration_required', message: 'Sales research runtime is not registered.' })
    });
  }
}

export const toolRegistry = new ToolRegistry();
