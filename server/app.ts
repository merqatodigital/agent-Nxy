import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { INITIAL_CRM_RECORDS, INITIAL_PROSPECTS, DEFAULT_ICP_CONFIG, DEFAULT_OPENROUTER_MODELS } from '../src/data/mockData.js';
import type { ProspectLead, CRMRecord, OutboundDraft, ICPConfig, AgentStepResponse } from '../src/types.js';
import { nyxRuntime } from './agent/runtime.js';
import { toolRegistry } from './agent/toolRegistry.js';
import { registerSalesRuntimeTools } from './sales/runtimeTools.js';
import { researchGoogleBusiness } from './sales/research/googleBusiness.js';
import { getEmailProviderStatus, sendOutboundEmail } from './worker/smtpProvider.js';

dotenv.config();
registerSalesRuntimeTools();

const PORT = Number(process.env.PORT || 3000);

export interface InboundEmailMessage {
  id: string;
  fromEmail: string;
  fromName: string;
  companyName: string;
  subject: string;
  body: string;
  receivedAt: string;
  sentiment: 'Interested' | 'Order Request' | 'Objection' | 'Question';
  status: 'Unread' | 'Replied' | 'Order Converted';
  suggestedReply?: string;
}

let crmRecords: CRMRecord[] = [...INITIAL_CRM_RECORDS];
let prospectLeads: ProspectLead[] = [...INITIAL_PROSPECTS];
let outboundDrafts: OutboundDraft[] = [];
let icpConfig: ICPConfig = { ...DEFAULT_ICP_CONFIG };
let inboundMessages: InboundEmailMessage[] = [];

nyxRuntime.setContextProvider(() => ({ crmRecords, prospectLeads, icpConfig, outboundDrafts }));

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function classifyInbound(text: string): InboundEmailMessage['sentiment'] {
  const value = text.toLowerCase();
  if (/unsubscribe|remove me|do not contact|not interested|stop emailing/.test(value)) return 'Objection';
  if (/invoice|purchase|buy|order|contract|send.*link|payment/.test(value)) return 'Order Request';
  if (/interested|book|meeting|call|demo|sounds good|yes[,!. ]/.test(value)) return 'Interested';
  return 'Question';
}

function safeCompanyFromEmail(email: string): string {
  const domain = email.split('@')[1] || '';
  const first = domain.split('.')[0] || '';
  return first ? first.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown Company';
}

function requireInboundSecret(req: express.Request): boolean {
  const expected = process.env.NYX_INBOUND_WEBHOOK_SECRET;
  if (!expected) return true;
  return req.get('x-nyx-webhook-secret') === expected;
}

async function executeRegisteredTool(name: string, args: Record<string, any>, prospectId?: string) {
  const tool = toolRegistry.getTool(name);
  if (!tool) throw new Error(`tool_not_registered:${name}`);
  const validation = tool.validateInput(args);
  if (!validation.valid) throw new Error(validation.error || 'tool_validation_failed');
  return tool.execute(args, { crmRecords, prospectLeads, icpConfig, outboundDrafts, prospectId });
}

function buildDraftForProspect(prospect: ProspectLead): OutboundDraft | null {
  const recipientEmail = normalizeEmail(prospect.contactEmail);
  if (!recipientEmail) return null;
  const contact = prospect.contactName || 'there';
  const company = prospect.companyName;
  const hook = prospect.notes || `your work in ${prospect.industry || 'the local market'}`;
  const subject = `${company}: quick question`;
  const body = `Hi ${contact},\n\nI came across ${company} while researching ${hook}. At ${icpConfig.senderCompany}, we ${icpConfig.valueProposition.toLowerCase()}.\n\nWould you be open to ${icpConfig.callToAction}?\n\nBest,\n${icpConfig.senderName}\n${icpConfig.senderRole}, ${icpConfig.senderCompany}`;
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prospectId: prospect.id,
    companyName: company,
    recipientEmail,
    recipientName: prospect.contactName || '',
    subject,
    body,
    hookUsed: hook,
    createdAt: new Date().toISOString(),
    status: 'Draft',
    tone: 'Value-First'
  };
}

export async function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  await nyxRuntime.init();

  app.get('/api/health', async (_req, res) => {
    const runtime = await nyxRuntime.getRuntimeStatus();
    const email = getEmailProviderStatus();
    res.json({
      status: 'ok',
      runtime,
      openRouterConnected: Boolean(process.env.OPENROUTER_API_KEY),
      emailProvider: email,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/openrouter/models', (_req, res) => {
    res.json({ models: DEFAULT_OPENROUTER_MODELS, hasServerKey: Boolean(process.env.OPENROUTER_API_KEY) });
  });

  app.post('/api/chat/nyx', async (req, res) => {
    const { messages, openRouterApiKey, selectedModel } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages array is required' });

    const userMessage = messages[messages.length - 1]?.content || messages[messages.length - 1]?.text || '';
    const q = String(userMessage).toLowerCase();

    if (/google\.com\/maps|maps\.app\.goo\.gl|g\.page/.test(q)) {
      const url = String(userMessage).match(/https?:\/\/[^\s]+/i)?.[0];
      if (!url) return res.status(400).json({ error: 'Google Business URL is required' });
      try {
        const data = await researchGoogleBusiness(url);
        return res.json({
          reply: `Executive Summary\nResearched the supplied Google Business URL using public evidence. Business: ${data.business_name}. ${data.website ? `Website: ${data.website}.` : 'Website not observed.'} ${data.contact_email ? `Public email: ${data.contact_email}.` : 'Public email not observed.'}`,
          provider: 'Nyx Agent Runtime',
          status: 'success',
          googleBusiness: data
        });
      } catch (error: any) {
        return res.status(422).json({ error: error?.message || 'google_business_lookup_failed' });
      }
    }

    if (q.includes('what are you doing') || q.includes('runtime status') || q === 'status') {
      const status = await nyxRuntime.getRuntimeStatus();
      const events = await nyxRuntime.getActivityEvents(5);
      return res.json({
        reply: `Executive Summary\nNyx runtime is ${status.status}. Active objectives: ${status.activeObjectivesCount}. Queued tasks: ${status.queuedTasksCount}. Pending approvals: ${status.pendingApprovalsCount}.\n\nStrategic Action Plan\n${events[0]?.message || 'Waiting for the next objective.'}`,
        provider: 'Nyx Agent Runtime',
        status: 'success'
      });
    }

    if (q.includes('pending approval') || q.includes('approvals')) {
      const approvals = await nyxRuntime.getApprovals('pending');
      return res.json({
        reply: `Executive Summary\n${approvals.length} action${approvals.length === 1 ? '' : 's'} currently require operator approval.`,
        provider: 'Nyx Agent Runtime',
        status: 'success',
        approvals
      });
    }

    const key = openRouterApiKey || process.env.OPENROUTER_API_KEY;
    if (key) {
      try {
        const model = selectedModel || 'meta-llama/llama-3.3-70b-instruct:free';
        const system = `You are Nyx, a sales operations agent for merqato.digital. Use only the provided pipeline facts. Never invent prospects, emails, ratings, phone numbers, deals, or tool results. Keep answers concise. Current leads: ${prospectLeads.map(p => `${p.companyName}:${p.status}`).join(', ')}. Current drafts: ${outboundDrafts.length}.`;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${key}`,
            'content-type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || `http://localhost:${PORT}`,
            'X-Title': 'Nyx SDR Agent'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: system },
              ...messages.map((m: any) => ({ role: m.sender === 'nyx' || m.role === 'assistant' ? 'assistant' : 'user', content: m.text || m.content || '' }))
            ],
            temperature: 0.3
          }),
          signal: AbortSignal.timeout(30000)
        });
        if (response.ok) {
          const data: any = await response.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return res.json({ reply: text, provider: `OpenRouter (${model})`, status: 'success' });
        }
      } catch (error) {
        console.warn('[Nyx Chat] OpenRouter unavailable:', error);
      }
    }

    return res.json({
      reply: 'Executive Summary\nNyx is online. I can research prospects, inspect the pipeline, create objectives, and surface approvals. Configure an OpenRouter key for free-model conversational responses.',
      provider: 'Nyx Agent Runtime',
      status: 'success'
    });
  });

  app.get('/api/leads', (_req, res) => res.json({ leads: prospectLeads }));
  app.get('/api/prospects', (_req, res) => res.json({ prospects: prospectLeads }));
  app.post('/api/leads', (req, res) => {
    const input = req.body || {};
    if (!String(input.companyName || '').trim()) return res.status(400).json({ error: 'companyName is required' });
    const lead: ProspectLead = {
      id: input.id || `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      companyName: String(input.companyName).trim(),
      website: String(input.website || '').trim(),
      contactName: String(input.contactName || '').trim(),
      contactRole: String(input.contactRole || '').trim(),
      contactEmail: normalizeEmail(input.contactEmail),
      industry: String(input.industry || '').trim(),
      employeeCount: input.employeeCount ? String(input.employeeCount) : undefined,
      location: input.location ? String(input.location) : undefined,
      status: input.status || 'New',
      createdAt: input.createdAt || new Date().toISOString().slice(0, 10),
      notes: input.notes ? String(input.notes) : undefined,
      googleBusinessUrl: input.googleBusinessUrl ? String(input.googleBusinessUrl) : undefined,
      googleBusinessData: input.googleBusinessData
    };
    prospectLeads.unshift(lead);
    res.status(201).json({ lead });
  });

  app.get('/api/crm/records', (_req, res) => res.json({ records: crmRecords }));
  app.get('/api/crm', (_req, res) => res.json({ crmRecords }));
  app.post('/api/crm/records', (req, res) => {
    const input = req.body || {};
    if (!String(input.companyName || '').trim()) return res.status(400).json({ error: 'companyName is required' });
    const record: CRMRecord = {
      id: input.id || `crm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      companyName: String(input.companyName).trim(),
      domain: String(input.domain || '').trim(),
      lifecycleStage: input.lifecycleStage || 'Lead',
      pastDeals: Array.isArray(input.pastDeals) ? input.pastDeals : [],
      totalSpend: Number.isFinite(Number(input.totalSpend)) ? Number(input.totalSpend) : 0,
      lastContactDate: input.lastContactDate ? String(input.lastContactDate) : undefined,
      sentiment: input.sentiment || 'New Account',
      keyNotes: String(input.keyNotes || ''),
      accountOwner: String(input.accountOwner || 'Nyx SDR Agent')
    };
    crmRecords.unshift(record);
    res.status(201).json({ record });
  });

  app.get('/api/drafts', (_req, res) => res.json({ drafts: outboundDrafts }));
  app.patch('/api/drafts/:id', (req, res) => {
    const draft = outboundDrafts.find(d => d.id === req.params.id);
    if (!draft) return res.status(404).json({ error: 'draft_not_found' });
    const allowed = ['subject', 'body', 'status', 'tone'] as const;
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) (draft as any)[key] = req.body[key];
    }
    res.json({ draft });
  });

  app.get('/api/icp', (_req, res) => res.json({ icp: icpConfig, icpConfig }));
  app.post('/api/icp', (req, res) => {
    const incoming = req.body?.icpConfig || req.body;
    icpConfig = { ...icpConfig, ...incoming };
    res.json({ status: 'success', icp: icpConfig, icpConfig });
  });

  app.post('/api/tools/crm-lookup', async (req, res) => {
    try {
      res.json(await executeRegisteredTool('CRM_LOOKUP', req.body || {}));
    } catch (error: any) {
      res.status(400).json({ error: error?.message || 'crm_lookup_failed' });
    }
  });

  app.post('/api/tools/web-scrape', async (req, res) => {
    try {
      res.json(await executeRegisteredTool('WEB_SCRAPE', req.body || {}));
    } catch (error: any) {
      res.status(422).json({ error: error?.message || 'web_scrape_failed' });
    }
  });

  app.post('/api/tools/draft-email', async (req, res) => {
    try {
      const result = await executeRegisteredTool('DRAFT_EMAIL', req.body || {}, req.body?.prospect_id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || 'draft_email_failed' });
    }
  });

  app.post('/api/google-business/extract', async (req, res) => {
    const input = String(req.body?.url || req.body?.query || '').trim();
    if (!input) return res.status(400).json({ error: 'Google Business URL is required' });
    try {
      const data = await researchGoogleBusiness(input);
      res.json({ status: 'success', data });
    } catch (error: any) {
      res.status(422).json({ error: error?.message || 'google_business_lookup_failed' });
    }
  });

  app.get('/api/email/status', (_req, res) => res.json(getEmailProviderStatus()));
  app.post('/api/email/send', async (req, res) => {
    try {
      const draftId = String(req.body?.draftId || req.body?.draft_id || '').trim();
      const draft = draftId ? outboundDrafts.find(d => d.id === draftId) : undefined;
      if (draftId && !draft) return res.status(404).json({ error: 'draft_not_found' });
      if (draft && draft.status !== 'Approved') return res.status(409).json({ error: 'draft_must_be_approved_before_send' });

      const to = normalizeEmail(req.body?.recipientEmail || req.body?.recipient_email || draft?.recipientEmail);
      const subject = String(req.body?.subject || req.body?.email_subject || draft?.subject || '').trim();
      const body = String(req.body?.body || req.body?.email_body || draft?.body || '');
      if (!to || !subject || !body) return res.status(400).json({ error: 'recipientEmail, subject, and body are required' });

      // Direct API sends require explicit UI approval via an Approved draft.
      if (!draft) return res.status(409).json({ error: 'send_requires_approved_draft' });

      const delivery = await sendOutboundEmail({ to, subject, body, draftId: draft.id });
      draft.status = 'Sent';
      (draft as any).sentAt = delivery.deliveredAt;
      (draft as any).messageId = delivery.messageId;
      const lead = prospectLeads.find(l => normalizeEmail(l.contactEmail) === to);
      if (lead) lead.status = 'Sent';
      res.json({ status: 'sent', ...delivery, draft });
    } catch (error: any) {
      res.status(502).json({ error: error?.message || 'email_send_failed' });
    }
  });

  app.get('/api/inbound-emails', (_req, res) => res.json({ inboundMessages }));
  app.post('/api/inbound-emails/webhook', (req, res) => {
    if (!requireInboundSecret(req)) return res.status(401).json({ error: 'invalid_webhook_secret' });
    const fromEmail = normalizeEmail(req.body?.fromEmail || req.body?.from || req.body?.email);
    const body = String(req.body?.body || req.body?.text || '').trim();
    if (!fromEmail || !body) return res.status(400).json({ error: 'fromEmail and body are required' });
    const sentiment = classifyInbound(body);
    const message: InboundEmailMessage = {
      id: `inbound-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromEmail,
      fromName: String(req.body?.fromName || '').trim(),
      companyName: String(req.body?.companyName || safeCompanyFromEmail(fromEmail)).trim(),
      subject: String(req.body?.subject || 'Reply').trim(),
      body,
      receivedAt: new Date().toISOString(),
      sentiment,
      status: 'Unread',
      suggestedReply: sentiment === 'Objection'
        ? undefined
        : `Thanks for the reply. I have your message and will follow up with the appropriate next step.`
    };
    inboundMessages.unshift(message);
    const lead = prospectLeads.find(l => normalizeEmail(l.contactEmail) === fromEmail);
    if (lead) {
      lead.status = 'Replied';
      lead.notes = [lead.notes, `Inbound reply (${sentiment}) received ${message.receivedAt}.`].filter(Boolean).join(' ');
    }
    res.status(202).json({ status: 'accepted', inboundMessage: message });
  });

  app.post('/api/agent/step', async (req, res) => {
    const prospect = req.body?.prospect as ProspectLead | undefined;
    const history = Array.isArray(req.body?.stepHistory) ? req.body.stepHistory : [];
    if (!prospect?.companyName) return res.status(400).json({ error: 'Prospect data is required' });

    const hasCrm = history.some((h: any) => h.tool === 'CRM_LOOKUP');
    const hasResearch = history.some((h: any) => h.tool === 'WEB_SCRAPE');
    const hasDraft = history.some((h: any) => h.tool === 'DRAFT_EMAIL');
    let payload: AgentStepResponse;

    if (!hasCrm) {
      payload = { thought: 'Checking CRM relationship before outreach.', tool: 'CRM_LOOKUP', arguments: { company_name: prospect.companyName, domain: prospect.website } };
    } else if (!hasResearch && prospect.website) {
      payload = { thought: 'Researching the public business website for sourced context.', tool: 'WEB_SCRAPE', arguments: { url: prospect.website } };
    } else if (!hasDraft && normalizeEmail(prospect.contactEmail)) {
      const draft = buildDraftForProspect(prospect);
      payload = draft
        ? { thought: 'Creating a draft for the supplied public contact. Sending remains approval-gated.', tool: 'DRAFT_EMAIL', arguments: { recipient_email: draft.recipientEmail, recipient_name: draft.recipientName, company_name: draft.companyName, email_subject: draft.subject, email_body: draft.body, hook_used: draft.hookUsed, prospect_id: prospect.id } }
        : { thought: 'No sourced email is available, so no outreach draft will be created.', final_output: { status: 'completed', company_processed: prospect.companyName, hook_used: 'No verified contact path', generated_draft: '' } };
    } else {
      payload = { thought: 'Research cycle complete. No unsourced contact data was invented.', final_output: { status: 'completed', company_processed: prospect.companyName, hook_used: 'Public evidence and CRM review', generated_draft: hasDraft ? 'Draft saved to outbox.' : 'No draft created because no contact email was supplied.' } };
    }

    res.json({ rawResponse: JSON.stringify(payload), parsedResponse: payload, modelUsed: req.body?.selectedModel || 'deterministic-runtime', source: 'Nyx Agent Runtime' });
  });

  app.get('/api/agent/status', async (_req, res) => res.json(await nyxRuntime.getRuntimeStatus()));
  app.get('/api/agent/objectives', async (req, res) => res.json({ objectives: await nyxRuntime.getObjectives(req.query.status as any) }));
  app.post('/api/agent/objectives', async (req, res) => {
    const { title, instruction, priority, approvalPolicy, constraints, prospects } = req.body || {};
    if (!title || !instruction) return res.status(400).json({ error: 'title and instruction are required' });
    res.json(await nyxRuntime.createObjective({ title, instruction, priority, approvalPolicy, constraints, prospects }));
  });
  app.patch('/api/agent/objectives/:id', async (req, res) => {
    if (req.body?.action === 'pause') return res.json({ status: 'paused', objective: await nyxRuntime.pauseObjective(req.params.id) });
    if (req.body?.action === 'resume') return res.json({ status: 'resumed', objective: await nyxRuntime.resumeObjective(req.params.id) });
    res.status(400).json({ error: "action must be 'pause' or 'resume'" });
  });
  app.get('/api/agent/tasks', async (req, res) => res.json({ tasks: await nyxRuntime.getTasks(req.query.objectiveId as string, req.query.status as any) }));
  app.get('/api/agent/activity', async (req, res) => res.json({ events: await nyxRuntime.getActivityEvents(Number(req.query.limit) || 50, req.query.objectiveId as string) }));
  app.get('/api/agent/approvals', async (req, res) => res.json({ approvals: await nyxRuntime.getApprovals((req.query.status as any) || 'pending') }));
  app.post('/api/agent/approvals/:id/decide', async (req, res) => {
    const decision = req.body?.decision;
    if (decision !== 'approved' && decision !== 'rejected') return res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
    const item = await nyxRuntime.decideApproval(req.params.id, decision, req.body?.decidedBy, req.body?.note);
    if (!item) return res.status(404).json({ error: 'approval_not_found' });
    res.json({ status: 'success', approvalItem: item });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  return app;
}

export async function startServer() {
  const app = await createApp();
  const server = app.listen(PORT, '0.0.0.0', () => console.log(`Nyx server running on http://localhost:${PORT}`));

  const shutdown = async (signal: string) => {
    console.log(`[Nyx Server] ${signal} received, shutting down.`);
    server.close(async () => {
      await nyxRuntime.shutdown();
      process.exit(0);
    });
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  return server;
}
