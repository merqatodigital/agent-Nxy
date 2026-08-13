import fs from 'node:fs/promises';
import path from 'node:path';

const APP_URL = (process.env.NYX_APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const POLL_MS = Math.max(30_000, Number(process.env.NYX_AUTONOMY_POLL_MS || 60_000));
const COOLDOWN_MS = Math.max(15 * 60_000, Number(process.env.NYX_AUTONOMY_COOLDOWN_MS || 6 * 60 * 60_000));
const MAX_OBJECTIVES_PER_DAY = Math.max(1, Number(process.env.NYX_AUTONOMY_MAX_OBJECTIVES_PER_DAY || 4));
const STATE_FILE = process.env.NYX_AUTONOMY_STATE_FILE || '.nyx/autonomy-state.json';
const FOCUS = process.env.NYX_AUTONOMY_FOCUS || 'digital nomads and local hospitality businesses in Palawan, Philippines';
const LOCATION = process.env.NYX_AUTONOMY_LOCATION || 'Palawan, Philippines';
const INDUSTRIES = process.env.NYX_AUTONOMY_INDUSTRIES || 'resorts, boutique hotels, hostels, tour operators, restaurants, cafes, dive shops, coworking spaces, property managers, transport businesses';

type RuntimeStatus = {
  activeObjectivesCount: number;
  queuedTasksCount: number;
  runningTasksCount: number;
  pendingApprovalsCount: number;
};

type State = {
  lastObjectiveAt?: string;
  objectiveDates: string[];
};

async function readState(): Promise<State> {
  try {
    return JSON.parse(await fs.readFile(STATE_FILE, 'utf8')) as State;
  } catch {
    return { objectiveDates: [] };
  }
}

async function writeState(state: State): Promise<void> {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2));
  await fs.rename(tmp, STATE_FILE);
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`http_${response.status}`);
  return await response.json() as T;
}

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

async function createDiscoveryObjective(): Promise<void> {
  const instruction = [
    `Continuously discover and qualify real prospects for: ${FOCUS}.`,
    `Primary location: ${LOCATION}.`,
    `Priority business types: ${INDUSTRIES}.`,
    'Use sourced public-web evidence only. Never invent a company, website, rating, phone number, contact, or email address.',
    'Prefer public business contacts and CRM-safe outreach candidates. Stop at approval gates for outbound actions.'
  ].join(' ');

  await jsonRequest(`${APP_URL}/api/agent/objectives`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Autonomous prospecting — ${LOCATION}`,
      instruction,
      priority: 'medium',
      approvalPolicy: 'AUTO_APPROVED',
      constraints: {
        focus: FOCUS,
        location: LOCATION,
        industries: INDUSTRIES,
        sourcePolicy: 'public-evidence-only',
        emailPolicy: 'approval-required'
      },
      prospects: []
    })
  });
}

async function tick(): Promise<void> {
  const status = await jsonRequest<RuntimeStatus>(`${APP_URL}/api/agent/status`);

  const busy =
    status.activeObjectivesCount > 0 ||
    status.queuedTasksCount > 0 ||
    status.runningTasksCount > 0 ||
    status.pendingApprovalsCount > 0;
  if (busy) return;

  const state = await readState();
  const now = Date.now();
  const today = todayKey();
  state.objectiveDates = (state.objectiveDates || []).filter(value => value.startsWith(today));

  if (state.objectiveDates.length >= MAX_OBJECTIVES_PER_DAY) return;
  if (state.lastObjectiveAt && now - new Date(state.lastObjectiveAt).getTime() < COOLDOWN_MS) return;

  await createDiscoveryObjective();
  const createdAt = new Date().toISOString();
  state.lastObjectiveAt = createdAt;
  state.objectiveDates.push(createdAt);
  await writeState(state);
  console.log(`[Nyx Autonomy] Created fresh discovery objective at ${createdAt}`);
}

async function main(): Promise<void> {
  console.log(`[Nyx Autonomy] Watching ${APP_URL} every ${POLL_MS}ms`);
  console.log(`[Nyx Autonomy] Focus: ${FOCUS}`);

  while (true) {
    try {
      await tick();
    } catch (error: any) {
      console.error('[Nyx Autonomy] Tick failed:', error?.message || error);
    }
    await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }
}

main().catch(error => {
  console.error('[Nyx Autonomy] Fatal error:', error);
  process.exitCode = 1;
});
