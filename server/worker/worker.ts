import express from 'express';
import crypto from 'node:crypto';
import { WorkerStateStore } from './stateStore.js';
import { researchWebsite } from './webResearch.js';
import { SmtpEmailProvider } from './smtpProvider.js';
import type { EmailJob, ResearchTarget, WorkerState } from './types.js';

const NYX_APP_URL = process.env.NYX_APP_URL || 'http://127.0.0.1:3000';
const WORKER_PORT = Number(process.env.NYX_WORKER_PORT || 3001);
const TICK_MS = Math.max(15_000, Number(process.env.NYX_WORKER_TICK_MS || 60_000));
const DEFAULT_INTERVAL = Math.max(15, Number(process.env.NYX_RESEARCH_INTERVAL_MINUTES || 60));
const MAX_CONCURRENT = Math.max(1, Math.min(5, Number(process.env.NYX_RESEARCH_CONCURRENCY || 2)));

const store = new WorkerStateStore();
const emailProvider = new SmtpEmailProvider();
let state: WorkerState;
let running = false;

function id(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function due(target: ResearchTarget): boolean {
  return target.enabled && new Date(target.nextRunAt).getTime() <= Date.now();
}

function nextRun(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

async function syncProspects(): Promise<void> {
  try {
    const response = await fetch(`${NYX_APP_URL}/api/prospects`, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) return;
    const body: any = await response.json();
    const prospects = Array.isArray(body?.prospects) ? body.prospects : [];
    let changed = false;
    for (const prospect of prospects) {
      if (!prospect?.website || !prospect?.companyName) continue;
      const existing = state.researchTargets.find(t => t.url.toLowerCase() === String(prospect.website).toLowerCase());
      if (!existing) {
        state.researchTargets.push({
          id: String(prospect.id || id('target')),
          companyName: String(prospect.companyName),
          url: String(prospect.website),
          intervalMinutes: DEFAULT_INTERVAL,
          enabled: true,
          nextRunAt: new Date().toISOString()
        });
        changed = true;
      }
    }
    if (changed) await store.save(state);
  } catch {
    // Nyx app may be offline while the worker remains alive. Retry next tick.
  }
}

async function runResearch(target: ResearchTarget): Promise<void> {
  target.lastStatus = 'running';
  target.lastError = undefined;
  target.lastRunAt = new Date().toISOString();
  await store.save(state);

  try {
    const snapshot = await researchWebsite(target.url, target.lastSnapshot?.contentHash);
    target.lastSnapshot = snapshot;
    target.lastStatus = 'success';
  } catch (error: any) {
    const code = String(error?.message || 'fetch_failed');
    target.lastStatus = ['blocked', 'timeout', 'invalid_domain', 'fetch_failed'].includes(code) ? code as any : 'fetch_failed';
    target.lastError = code;
  } finally {
    target.nextRunAt = nextRun(target.intervalMinutes);
    await store.save(state);
  }
}

async function processResearchQueue(): Promise<void> {
  const targets = state.researchTargets.filter(due);
  for (let i = 0; i < targets.length; i += MAX_CONCURRENT) {
    await Promise.all(targets.slice(i, i + MAX_CONCURRENT).map(runResearch));
  }
}

async function processApprovedEmails(): Promise<void> {
  if (!emailProvider.isConfigured()) return;
  for (const job of state.emailJobs.filter(j => j.status === 'approved')) {
    try {
      const result = await emailProvider.send(job);
      job.status = 'sent';
      job.sentAt = new Date().toISOString();
      job.updatedAt = job.sentAt;
      job.providerMessageId = result.id;
      job.error = undefined;
    } catch (error: any) {
      job.status = 'failed';
      job.updatedAt = new Date().toISOString();
      job.error = String(error?.message || 'email_send_failed').slice(0, 500);
    }
    await store.save(state);
  }
}

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    state.lastTickAt = new Date().toISOString();
    await syncProspects();
    await processResearchQueue();
    await processApprovedEmails();
    await store.save(state);
  } finally {
    running = false;
  }
}

async function start(): Promise<void> {
  state = await store.load();
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      worker: 'nyx-always-on',
      lastTickAt: state.lastTickAt,
      researchTargets: state.researchTargets.length,
      dueResearch: state.researchTargets.filter(due).length,
      pendingEmailApprovals: state.emailJobs.filter(j => j.status === 'pending').length,
      approvedEmails: state.emailJobs.filter(j => j.status === 'approved').length,
      smtpConfigured: emailProvider.isConfigured()
    });
  });

  app.get('/research', (_req, res) => res.json({ targets: state.researchTargets }));

  app.post('/research/targets', async (req, res) => {
    const { companyName, url, intervalMinutes } = req.body || {};
    if (!companyName || !url) return res.status(400).json({ error: 'companyName and url are required' });
    const target: ResearchTarget = {
      id: id('target'),
      companyName: String(companyName),
      url: String(url),
      intervalMinutes: Math.max(15, Number(intervalMinutes || DEFAULT_INTERVAL)),
      enabled: true,
      nextRunAt: new Date().toISOString()
    };
    state.researchTargets.push(target);
    await store.save(state);
    res.status(201).json({ target });
  });

  app.post('/research/:id/run', async (req, res) => {
    const target = state.researchTargets.find(t => t.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'target_not_found' });
    target.nextRunAt = new Date().toISOString();
    await store.save(state);
    void tick();
    res.json({ status: 'queued', targetId: target.id });
  });

  app.patch('/research/:id', async (req, res) => {
    const target = state.researchTargets.find(t => t.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'target_not_found' });
    if (typeof req.body?.enabled === 'boolean') target.enabled = req.body.enabled;
    if (req.body?.intervalMinutes) target.intervalMinutes = Math.max(15, Number(req.body.intervalMinutes));
    await store.save(state);
    res.json({ target });
  });

  app.get('/email/jobs', (_req, res) => res.json({ jobs: state.emailJobs }));

  app.post('/email/jobs', async (req, res) => {
    const { to, subject, text, html, from, replyTo } = req.body || {};
    if (!to || !subject || (!text && !html)) return res.status(400).json({ error: 'to, subject, and text or html are required' });
    const now = new Date().toISOString();
    const job: EmailJob = { id: id('email'), to: String(to), subject: String(subject), text: text ? String(text) : undefined, html: html ? String(html) : undefined, from: from ? String(from) : undefined, replyTo: replyTo ? String(replyTo) : undefined, status: 'pending', createdAt: now, updatedAt: now };
    state.emailJobs.unshift(job);
    await store.save(state);
    res.status(201).json({ job });
  });

  app.post('/email/jobs/:id/approve', async (req, res) => {
    const job = state.emailJobs.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'email_job_not_found' });
    if (job.status !== 'pending' && job.status !== 'failed') return res.status(409).json({ error: `cannot_approve_${job.status}` });
    job.status = 'approved';
    job.approvedAt = new Date().toISOString();
    job.updatedAt = job.approvedAt;
    job.error = undefined;
    await store.save(state);
    void tick();
    res.json({ job });
  });

  app.post('/email/jobs/:id/reject', async (req, res) => {
    const job = state.emailJobs.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'email_job_not_found' });
    if (job.status === 'sent') return res.status(409).json({ error: 'already_sent' });
    job.status = 'rejected';
    job.updatedAt = new Date().toISOString();
    await store.save(state);
    res.json({ job });
  });

  app.listen(WORKER_PORT, '127.0.0.1', () => {
    console.log(`Nyx always-on worker listening on http://127.0.0.1:${WORKER_PORT}`);
    console.log(`Research tick: ${TICK_MS}ms | Default revisit: ${DEFAULT_INTERVAL} minutes | SMTP: ${emailProvider.isConfigured() ? 'configured' : 'not configured'}`);
  });

  await tick();
  setInterval(() => void tick(), TICK_MS).unref();
}

start().catch(error => {
  console.error('Nyx worker failed to start:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
