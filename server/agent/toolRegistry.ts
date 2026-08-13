import { RegisteredTool, ToolContext, ToolValidationResult } from './types.js';
import { getEmailProviderStatus, sendOutboundEmail } from '../worker/smtpProvider.js';

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
      description: 'Query internal CRM database for account history and relationship status.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 10000,
      retryBehavior: { maxAttempts: 3, backoffMs: 1000 },
      validateInput: (args: any): ToolValidationResult => {
        if (!args || typeof args !== 'object') return { valid: false, error: 'Arguments object is required' };
        if (!args.company_name && !args.companyName && !args.domain) return { valid: false, error: 'company_name or domain is required' };
        return { valid: true };
      },
      execute: async (args: any, context: ToolContext) => {
        const companyQuery = String(args.company_name || args.companyName || '').toLowerCase().trim();
        const domainQuery = String(args.domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const records = context.crmRecords || [];
        const record = records.find((c: any) => {
          const company = String(c.companyName || '').toLowerCase();
          const domain = String(c.domain || '').toLowerCase().replace(/^www\./, '');
          return (companyQuery && company.includes(companyQuery)) || (domainQuery && domain === domainQuery);
        });

        if (!record) {
          return { found: false, company_name: args.company_name || args.companyName, domain: args.domain, relationship: 'new_prospect' };
        }

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
    });

    // These two defaults intentionally fail closed. server/sales/runtimeTools.ts
    // replaces them with real public-web implementations during runtime startup.
    this.registerTool({
      name: 'WEB_SCRAPE',
      description: 'Fetch real public website evidence through the registered sales research provider.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 15000,
      retryBehavior: { maxAttempts: 2, backoffMs: 1500 },
      validateInput: (args: any) => args?.url ? { valid: true } : { valid: false, error: 'url is required' },
      execute: async () => { throw new Error('sales_research_runtime_not_registered'); }
    });

    this.registerTool({
      name: 'DRAFT_EMAIL',
      description: 'Create a personalized email draft from supplied, sourced prospect data. Drafting does not send email.',
      approvalPolicy: 'AUTO_APPROVED',
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
        const recipientEmail = String(args.recipient_email || args.recipientEmail).trim().toLowerCase();
        const subject = String(args.email_subject || args.subject).trim();
        const body = String(args.email_body || args.body);
        const companyName = String(args.company_name || args.companyName || '').trim();
        const recipientName = String(args.recipient_name || args.recipientName || '').trim();
        const hookUsed = String(args.hook_used || args.hookUsed || 'Sourced public business evidence').trim();

        const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const draftObj = {
          id: draftId,
          prospectId: context.prospectId || args.prospect_id || '',
          companyName,
          recipientEmail,
          recipientName,
          subject,
          body,
          hookUsed,
          createdAt: new Date().toISOString(),
          status: 'Draft',
          tone: 'Value-First'
        };

        if (context.outboundDrafts) context.outboundDrafts.unshift(draftObj);
        return { status: 'draft_saved', draft_id: draftId, recipient_email: recipientEmail, email_subject: subject };
      }
    });

    this.registerTool({
      name: 'GOOGLE_BUSINESS_LOOKUP',
      description: 'Research a supplied Google Business/Maps URL using the registered sales research provider.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 20000,
      retryBehavior: { maxAttempts: 2, backoffMs: 1500 },
      validateInput: (args: any) => (args?.url || args?.google_business_url || args?.query)
        ? { valid: true }
        : { valid: false, error: 'url, google_business_url, or query is required' },
      execute: async () => { throw new Error('sales_google_business_runtime_not_registered'); }
    });

    this.registerTool({
      name: 'SEND_EMAIL',
      description: 'Deliver an approved outbound email through configured Resend or SMTP transport.',
      approvalPolicy: 'REQUIRES_APPROVAL',
      timeoutMs: 20000,
      retryBehavior: { maxAttempts: 2, backoffMs: 3000 },
      validateInput: (args: any): ToolValidationResult => {
        if (!args || typeof args !== 'object') return { valid: false, error: 'Arguments object is required' };
        if (!args.draft_id && !args.draftId && !args.recipient_email && !args.recipientEmail) {
          return { valid: false, error: 'draft_id or recipient_email is required' };
        }
        return { valid: true };
      },
      execute: async (args: any, context: ToolContext) => {
        const draftId = String(args.draft_id || args.draftId || '').trim();
        const draft = draftId && context.outboundDrafts
          ? context.outboundDrafts.find((d: any) => d.id === draftId)
          : undefined;

        const recipientEmail = String(args.recipient_email || args.recipientEmail || draft?.recipientEmail || '').trim();
        const subject = String(args.email_subject || args.subject || draft?.subject || '').trim();
        const body = String(args.email_body || args.body || draft?.body || '');
        if (!recipientEmail || !subject || !body) throw new Error('email_payload_incomplete');

        const providerStatus = getEmailProviderStatus();
        if (!providerStatus.configured) throw new Error('email_provider_not_configured');

        const delivery = await sendOutboundEmail({
          to: recipientEmail,
          subject,
          body,
          from: args.from,
          replyTo: args.reply_to || args.replyTo,
          draftId: draftId || undefined
        });

        // Mutate CRM/outbox only after the provider confirms delivery acceptance.
        if (draft) {
          draft.status = 'Sent';
          draft.sentAt = delivery.deliveredAt;
          draft.messageId = delivery.messageId;
        }

        if (context.prospectLeads) {
          const matchingLead = context.prospectLeads.find((l: any) =>
            String(l.contactEmail || '').toLowerCase() === recipientEmail.toLowerCase()
          );
          if (matchingLead) {
            matchingLead.status = 'Sent';
            matchingLead.lastContactDate = delivery.deliveredAt.split('T')[0];
          }
        }

        return {
          status: 'sent',
          provider: delivery.provider,
          message_id: delivery.messageId,
          recipient_email: delivery.recipient,
          sent_at: delivery.deliveredAt
        };
      }
    });

    this.registerTool({
      name: 'CONVERT_ORDER',
      description: 'Record an operator-approved closed-won order in CRM.',
      approvalPolicy: 'REQUIRES_APPROVAL',
      timeoutMs: 10000,
      retryBehavior: { maxAttempts: 1, backoffMs: 0 },
      validateInput: (args: any): ToolValidationResult => {
        const companyName = args?.company_name || args?.companyName;
        const amount = Number(args?.amount ?? args?.order_value);
        if (!companyName) return { valid: false, error: 'company_name is required' };
        if (!Number.isFinite(amount) || amount <= 0) return { valid: false, error: 'positive amount is required' };
        return { valid: true };
      },
      execute: async (args: any, context: ToolContext) => {
        const companyName = String(args.company_name || args.companyName).trim();
        const amount = Number(args.amount ?? args.order_value);
        const lineItem = String(args.line_item || args.description || 'Closed-won order').trim();
        const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const now = new Date().toISOString();

        const lead = context.prospectLeads?.find((l: any) => String(l.companyName || '').toLowerCase() === companyName.toLowerCase());
        if (lead) lead.status = 'Converted';

        if (context.crmRecords) {
          let crmRecord = context.crmRecords.find((c: any) => String(c.companyName || '').toLowerCase() === companyName.toLowerCase());
          if (crmRecord) {
            crmRecord.lifecycleStage = 'Customer';
            crmRecord.totalSpend = Number(crmRecord.totalSpend || 0) + amount;
            crmRecord.pastDeals = Number(crmRecord.pastDeals || 0) + 1;
            crmRecord.lastContactDate = now.split('T')[0];
            crmRecord.sentiment = 'Positive';
          } else {
            crmRecord = {
              id: `crm-${Date.now()}`,
              companyName,
              domain: String(args.domain || '').trim(),
              lifecycleStage: 'Customer',
              pastDeals: 1,
              totalSpend: amount,
              lastContactDate: now.split('T')[0],
              sentiment: 'Positive',
              keyNotes: `Converted order: ${lineItem}`,
              accountOwner: 'Nyx SDR Agent'
            };
            context.crmRecords.unshift(crmRecord);
          }
        }

        return { status: 'converted', order_id: orderId, company_name: companyName, order_value: amount, line_item: lineItem };
      }
    });
  }
}

export const toolRegistry = new ToolRegistry();
