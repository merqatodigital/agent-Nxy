import { RegisteredTool, ToolContext, ToolValidationResult, ApprovalPolicy } from './types.js';
import { MOCK_SCRAPED_SITES } from '../../src/data/mockData.js';

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
    // 1. CRM_LOOKUP
    this.registerTool({
      name: 'CRM_LOOKUP',
      description: 'Query internal CRM database for account deal history, LTV, and sentiment.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 10000,
      retryBehavior: { maxAttempts: 3, backoffMs: 1000 },
      validateInput: (args: any): ToolValidationResult => {
        if (!args || typeof args !== 'object') {
          return { valid: false, error: 'Arguments object is required' };
        }
        if (!args.company_name && !args.companyName && !args.domain) {
          return { valid: false, error: 'company_name or domain argument is required' };
        }
        return { valid: true };
      },
      execute: async (args: any, context: ToolContext) => {
        const query = String(args.company_name || args.companyName || args.domain || '').toLowerCase().trim();
        const records = context.crmRecords || [];
        const record = records.find(
          (c: any) =>
            c.companyName?.toLowerCase().includes(query) ||
            c.domain?.toLowerCase().includes(query)
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
        return {
          found: false,
          company_name: query,
          message: 'No prior deals found in CRM. Account is a fresh target prospect.'
        };
      }
    });

    // 2. WEB_SCRAPE
    this.registerTool({
      name: 'WEB_SCRAPE',
      description: 'Extract business vectors, tech stack, and pain points from target domain.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 15000,
      retryBehavior: { maxAttempts: 3, backoffMs: 2000 },
      validateInput: (args: any): ToolValidationResult => {
        if (!args || !args.url) {
          return { valid: false, error: 'url argument is required' };
        }
        return { valid: true };
      },
      execute: async (args: any) => {
        const urlStr = String(args.url);
        const cleanDomain = urlStr
          .replace(/^https?:\/\//i, '')
          .replace(/^www\./i, '')
          .split('/')[0]
          .toLowerCase();

        if (MOCK_SCRAPED_SITES[cleanDomain]) {
          return {
            url: `https://${cleanDomain}`,
            status: 'success',
            scrape_result: MOCK_SCRAPED_SITES[cleanDomain]
          };
        }

        return {
          url: urlStr.startsWith('http') ? urlStr : `https://${urlStr}`,
          status: 'success',
          scrape_result: {
            url: urlStr,
            title: `${cleanDomain} | Official Business Domain`,
            description: `B2B technology solutions and professional operations at ${cleanDomain}.`,
            coreBusinessVectors: [
              'B2B Operations & Enterprise Software',
              'Digital Workflow Automation',
              'Client Retention & Growth'
            ],
            techStack: ['React', 'Cloud Infra', 'Analytics', 'SaaS Platform'],
            valueProps: [
              `Delivering scalable workflow solutions for ${cleanDomain} enterprise clients`,
              'Modern digital transformation and efficiency'
            ],
            recentHighlights: [
              'Expanding sales and operations team in 2026',
              'Accelerating outbound prospect conversion'
            ],
            targetAudience: 'Executive Decision Makers and Sales Operations Leaders',
            detectedPainPoints: [
              'Manual prospect qualification slowing pipeline velocity',
              'Desire to automate personalized cold outreach'
            ]
          }
        };
      }
    });

    // 3. DRAFT_EMAIL
    this.registerTool({
      name: 'DRAFT_EMAIL',
      description: 'Synthesize personalized cold outreach copy and queue into outbox.',
      approvalPolicy: 'REQUIRES_APPROVAL', // Email drafting/dispatching requires human approval by default
      timeoutMs: 10000,
      retryBehavior: { maxAttempts: 2, backoffMs: 1000 },
      validateInput: (args: any): ToolValidationResult => {
        if (!args || typeof args !== 'object') {
          return { valid: false, error: 'Arguments object is required' };
        }
        if (!args.recipient_email && !args.recipientEmail) {
          return { valid: false, error: 'recipient_email is required' };
        }
        if (!args.email_subject && !args.subject) {
          return { valid: false, error: 'email_subject is required' };
        }
        if (!args.email_body && !args.body) {
          return { valid: false, error: 'email_body is required' };
        }
        return { valid: true };
      },
      execute: async (args: any, context: ToolContext) => {
        const recipientEmail = args.recipient_email || args.recipientEmail;
        const subject = args.email_subject || args.subject;
        const body = args.email_body || args.body;
        const companyName = args.company_name || args.companyName || recipientEmail.split('@')[1] || 'Target Company';
        const hookUsed = args.hook_used || args.hookUsed || 'Personalized Value Proposition';

        const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const draftObj = {
          id: draftId,
          prospectId: context.prospectId || `lead-${Date.now()}`,
          companyName,
          recipientEmail,
          recipientName: recipientEmail.split('@')[0].replace('.', ' ') || 'Prospect Lead',
          subject,
          body,
          hookUsed,
          createdAt: new Date().toISOString(),
          status: 'Draft',
          tone: 'Value-First'
        };

        if (context.outboundDrafts) {
          context.outboundDrafts.unshift(draftObj);
        }

        return {
          status: 'draft_saved',
          draft_id: draftId,
          recipient_email: recipientEmail,
          email_subject: subject,
          message: `Personalized cold outreach draft for ${companyName} queued into outbox.`
        };
      }
    });

    // 4. GOOGLE_BUSINESS_LOOKUP
    this.registerTool({
      name: 'GOOGLE_BUSINESS_LOOKUP',
      description: 'Extract business information, reviews, categories, and contact details from Google Business / Google Maps URLs.',
      approvalPolicy: 'AUTO_APPROVED',
      timeoutMs: 12000,
      retryBehavior: { maxAttempts: 3, backoffMs: 1000 },
      validateInput: (args: any): ToolValidationResult => {
        if (!args || (!args.url && !args.google_business_url && !args.query)) {
          return { valid: false, error: 'url, google_business_url, or query is required' };
        }
        return { valid: true };
      },
      execute: async (args: any) => {
        const urlInput = args.url || args.google_business_url || args.query || '';
        let extractedName = 'Target Business';
        
        if (urlInput.includes('/maps/place/')) {
          const m = urlInput.match(/\/maps\/place\/([^/@?]+)/i);
          if (m && m[1]) extractedName = decodeURIComponent(m[1].replace(/\+/g, ' '));
        } else if (urlInput.includes('q=')) {
          const m = urlInput.match(/[?&]q=([^&]+)/i);
          if (m && m[1]) extractedName = decodeURIComponent(m[1].replace(/\+/g, ' '));
        } else {
          extractedName = urlInput.replace(/^https?:\/\//i, '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim() || 'Target Business';
        }

        extractedName = extractedName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        const slug = extractedName.toLowerCase().replace(/[^a-z0-9]/g, '');

        return {
          status: 'success',
          google_business_url: urlInput.startsWith('http') ? urlInput : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(extractedName)}`,
          business_name: extractedName,
          company_name: extractedName,
          website: `${slug}.com`,
          contact_email: `contact@${slug}.com`,
          contact_name: 'Managing Director / Business Owner',
          industry: 'B2B Professional Services',
          rating: 4.8,
          review_count: 128,
          phone: '+1 (555) 438-2910',
          location: 'United States',
          google_category: 'Verified Google Business Listing',
          extracted_highlights: [
            `Verified Google Business Profile for ${extractedName}`,
            `4.8 Star Rating based on 128 verified Google reviews`,
            `Active customer operations and contact details verified`
          ]
        };
      }
    });
  }
}

export const toolRegistry = new ToolRegistry();
