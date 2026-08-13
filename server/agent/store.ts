import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import {
  AgentObjective,
  AgentTask,
  AgentRun,
  AgentStep,
  ActivityEvent,
  ApprovalItem,
  ObjectiveStatus,
  TaskStatus,
  ApprovalStatus
} from './types.js';

const DB_FILE_PATH = path.join(process.cwd(), 'nyx_agent.sqlite');

let db: Database | null = null;

export async function initStore(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE_PATH)) {
    const fileBuffer = fs.readFileSync(DB_FILE_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize schema
  db.run(`
    CREATE TABLE IF NOT EXISTS objectives (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      instruction TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      lastRunAt TEXT,
      nextRunAt TEXT,
      constraints TEXT,
      approvalPolicy TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      objectiveId TEXT NOT NULL,
      status TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      completedAt TEXT,
      error TEXT,
      FOREIGN KEY (objectiveId) REFERENCES objectives(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      objectiveId TEXT NOT NULL,
      prospectId TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      maxAttempts INTEGER NOT NULL DEFAULT 3,
      scheduledAt TEXT NOT NULL,
      startedAt TEXT,
      completedAt TEXT,
      lastError TEXT,
      result TEXT,
      arguments TEXT,
      FOREIGN KEY (objectiveId) REFERENCES objectives(id)
    );

    CREATE TABLE IF NOT EXISTS agent_steps (
      id TEXT PRIMARY KEY,
      runId TEXT NOT NULL,
      taskId TEXT,
      stepIndex INTEGER NOT NULL,
      thought TEXT NOT NULL,
      action TEXT,
      observation TEXT,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      objectiveId TEXT,
      taskId TEXT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approval_items (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      objectiveId TEXT NOT NULL,
      toolName TEXT NOT NULL,
      arguments TEXT NOT NULL,
      status TEXT NOT NULL,
      requestedAt TEXT NOT NULL,
      decidedAt TEXT,
      decidedBy TEXT,
      note TEXT
    );
  `);

  saveDbToDisk();
  return db;
}

function saveDbToDisk(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

// --- OBJECTIVES ---

export async function saveObjective(objective: AgentObjective): Promise<AgentObjective> {
  const database = await initStore();
  const stmt = database.prepare(`
    INSERT INTO objectives (id, title, instruction, status, priority, createdAt, updatedAt, lastRunAt, nextRunAt, constraints, approvalPolicy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      instruction = excluded.instruction,
      status = excluded.status,
      priority = excluded.priority,
      updatedAt = excluded.updatedAt,
      lastRunAt = excluded.lastRunAt,
      nextRunAt = excluded.nextRunAt,
      constraints = excluded.constraints,
      approvalPolicy = excluded.approvalPolicy;
  `);

  stmt.run([
    objective.id,
    objective.title,
    objective.instruction,
    objective.status,
    objective.priority,
    objective.createdAt,
    objective.updatedAt,
    objective.lastRunAt || null,
    objective.nextRunAt || null,
    objective.constraints ? (typeof objective.constraints === 'string' ? objective.constraints : JSON.stringify(objective.constraints)) : null,
    objective.approvalPolicy
  ]);
  stmt.free();
  saveDbToDisk();
  return objective;
}

export async function getObjective(id: string): Promise<AgentObjective | null> {
  const database = await initStore();
  const stmt = database.prepare(`SELECT * FROM objectives WHERE id = ?`);
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return mapRowToObjective(row);
  }
  stmt.free();
  return null;
}

export async function getObjectives(statusFilter?: ObjectiveStatus): Promise<AgentObjective[]> {
  const database = await initStore();
  let query = `SELECT * FROM objectives`;
  const params: any[] = [];
  if (statusFilter) {
    query += ` WHERE status = ?`;
    params.push(statusFilter);
  }
  query += ` ORDER BY createdAt DESC`;

  const stmt = database.prepare(query);
  stmt.bind(params);
  const results: AgentObjective[] = [];
  while (stmt.step()) {
    results.push(mapRowToObjective(stmt.getAsObject()));
  }
  stmt.free();
  return results;
}

function mapRowToObjective(row: any): AgentObjective {
  let parsedConstraints: any = undefined;
  if (row.constraints) {
    try {
      parsedConstraints = JSON.parse(row.constraints);
    } catch {
      parsedConstraints = row.constraints;
    }
  }
  return {
    id: row.id,
    title: row.title,
    instruction: row.instruction,
    status: row.status as ObjectiveStatus,
    priority: row.priority as any,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastRunAt: row.lastRunAt || undefined,
    nextRunAt: row.nextRunAt || undefined,
    constraints: parsedConstraints,
    approvalPolicy: row.approvalPolicy as any
  };
}

// --- TASKS ---

export async function saveTask(task: AgentTask): Promise<AgentTask> {
  const database = await initStore();
  const stmt = database.prepare(`
    INSERT INTO tasks (id, objectiveId, prospectId, type, status, priority, attempts, maxAttempts, scheduledAt, startedAt, completedAt, lastError, result, arguments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      priority = excluded.priority,
      attempts = excluded.attempts,
      maxAttempts = excluded.maxAttempts,
      scheduledAt = excluded.scheduledAt,
      startedAt = excluded.startedAt,
      completedAt = excluded.completedAt,
      lastError = excluded.lastError,
      result = excluded.result,
      arguments = excluded.arguments;
  `);

  stmt.run([
    task.id,
    task.objectiveId,
    task.prospectId || null,
    task.type,
    task.status,
    task.priority,
    task.attempts,
    task.maxAttempts,
    task.scheduledAt,
    task.startedAt || null,
    task.completedAt || null,
    task.lastError || null,
    task.result ? (typeof task.result === 'string' ? task.result : JSON.stringify(task.result)) : null,
    task.arguments ? (typeof task.arguments === 'string' ? task.arguments : JSON.stringify(task.arguments)) : null
  ]);
  stmt.free();
  saveDbToDisk();
  return task;
}

export async function getTask(id: string): Promise<AgentTask | null> {
  const database = await initStore();
  const stmt = database.prepare(`SELECT * FROM tasks WHERE id = ?`);
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return mapRowToTask(row);
  }
  stmt.free();
  return null;
}

export async function getTasks(objectiveId?: string, statusFilter?: TaskStatus): Promise<AgentTask[]> {
  const database = await initStore();
  let query = `SELECT * FROM tasks`;
  const conditions: string[] = [];
  const params: any[] = [];

  if (objectiveId) {
    conditions.push(`objectiveId = ?`);
    params.push(objectiveId);
  }
  if (statusFilter) {
    conditions.push(`status = ?`);
    params.push(statusFilter);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }
  query += ` ORDER BY scheduledAt ASC`;

  const stmt = database.prepare(query);
  stmt.bind(params);
  const results: AgentTask[] = [];
  while (stmt.step()) {
    results.push(mapRowToTask(stmt.getAsObject()));
  }
  stmt.free();
  return results;
}

export async function recoverInterruptedTasks(): Promise<number> {
  const database = await initStore();
  const stmt = database.prepare(`SELECT * FROM tasks WHERE status = 'running'`);
  let count = 0;
  const runningTasks: AgentTask[] = [];
  while (stmt.step()) {
    runningTasks.push(mapRowToTask(stmt.getAsObject()));
  }
  stmt.free();

  for (const task of runningTasks) {
    task.status = 'queued';
    task.lastError = 'Interrupted by server restart - recovered and returned to queue';
    await saveTask(task);
    count++;
  }
  return count;
}

function mapRowToTask(row: any): AgentTask {
  let resultObj: any = undefined;
  if (row.result) {
    try {
      resultObj = JSON.parse(row.result);
    } catch {
      resultObj = row.result;
    }
  }
  let argsObj: any = undefined;
  if (row.arguments) {
    try {
      argsObj = JSON.parse(row.arguments);
    } catch {
      argsObj = row.arguments;
    }
  }

  return {
    id: row.id,
    objectiveId: row.objectiveId,
    prospectId: row.prospectId || undefined,
    type: row.type,
    status: row.status as TaskStatus,
    priority: row.priority as any,
    attempts: Number(row.attempts || 0),
    maxAttempts: Number(row.maxAttempts || 3),
    scheduledAt: row.scheduledAt,
    startedAt: row.startedAt || undefined,
    completedAt: row.completedAt || undefined,
    lastError: row.lastError || undefined,
    result: resultObj,
    arguments: argsObj
  };
}

// --- RUNS & STEPS ---

export async function saveAgentRun(run: AgentRun): Promise<AgentRun> {
  const database = await initStore();
  const stmt = database.prepare(`
    INSERT INTO agent_runs (id, objectiveId, status, startedAt, completedAt, error)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      completedAt = excluded.completedAt,
      error = excluded.error;
  `);
  stmt.run([run.id, run.objectiveId, run.status, run.startedAt, run.completedAt || null, run.error || null]);
  stmt.free();
  saveDbToDisk();
  return run;
}

export async function saveAgentStep(step: AgentStep): Promise<AgentStep> {
  const database = await initStore();
  const stmt = database.prepare(`
    INSERT INTO agent_steps (id, runId, taskId, stepIndex, thought, action, observation, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      observation = excluded.observation,
      status = excluded.status;
  `);
  stmt.run([
    step.id,
    step.runId,
    step.taskId || null,
    step.stepIndex,
    step.thought,
    step.action ? JSON.stringify(step.action) : null,
    step.observation ? (typeof step.observation === 'string' ? step.observation : JSON.stringify(step.observation)) : null,
    step.status,
    step.createdAt
  ]);
  stmt.free();
  saveDbToDisk();
  return step;
}

export async function getAgentSteps(runId: string): Promise<AgentStep[]> {
  const database = await initStore();
  const stmt = database.prepare(`SELECT * FROM agent_steps WHERE runId = ? ORDER BY stepIndex ASC`);
  stmt.bind([runId]);
  const steps: AgentStep[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    let actionObj: any = undefined;
    if (row.action) {
      try { actionObj = JSON.parse(String(row.action)); } catch { actionObj = row.action; }
    }
    let obsObj: any = undefined;
    if (row.observation) {
      try { obsObj = JSON.parse(String(row.observation)); } catch { obsObj = row.observation; }
    }
    steps.push({
      id: String(row.id),
      runId: String(row.runId),
      taskId: row.taskId ? String(row.taskId) : undefined,
      stepIndex: Number(row.stepIndex),
      thought: String(row.thought || ''),
      action: actionObj,
      observation: obsObj,
      status: row.status as any,
      createdAt: String(row.createdAt || '')
    });
  }
  stmt.free();
  return steps;
}

// --- ACTIVITY EVENTS ---

export async function logActivityEvent(event: ActivityEvent): Promise<ActivityEvent> {
  const database = await initStore();
  const stmt = database.prepare(`
    INSERT INTO activity_events (id, objectiveId, taskId, type, message, metadata, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    event.id,
    event.objectiveId || null,
    event.taskId || null,
    event.type,
    event.message,
    event.metadata ? JSON.stringify(event.metadata) : null,
    event.createdAt
  ]);
  stmt.free();
  saveDbToDisk();
  return event;
}

export async function getActivityEvents(limit = 50, objectiveId?: string): Promise<ActivityEvent[]> {
  const database = await initStore();
  let query = `SELECT * FROM activity_events`;
  const params: any[] = [];
  if (objectiveId) {
    query += ` WHERE objectiveId = ?`;
    params.push(objectiveId);
  }
  query += ` ORDER BY createdAt DESC LIMIT ?`;
  params.push(limit);

  const stmt = database.prepare(query);
  stmt.bind(params);
  const events: ActivityEvent[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    let meta: any = undefined;
    if (row.metadata) {
      try { meta = JSON.parse(String(row.metadata)); } catch { meta = row.metadata; }
    }
    events.push({
      id: String(row.id),
      objectiveId: row.objectiveId ? String(row.objectiveId) : undefined,
      taskId: row.taskId ? String(row.taskId) : undefined,
      type: row.type as any,
      message: String(row.message || ''),
      metadata: meta,
      createdAt: String(row.createdAt || '')
    });
  }
  stmt.free();
  return events;
}

// --- APPROVALS ---

export async function saveApprovalItem(item: ApprovalItem): Promise<ApprovalItem> {
  const database = await initStore();
  const stmt = database.prepare(`
    INSERT INTO approval_items (id, taskId, objectiveId, toolName, arguments, status, requestedAt, decidedAt, decidedBy, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      decidedAt = excluded.decidedAt,
      decidedBy = excluded.decidedBy,
      note = excluded.note;
  `);
  stmt.run([
    item.id,
    item.taskId,
    item.objectiveId,
    item.toolName,
    typeof item.arguments === 'string' ? item.arguments : JSON.stringify(item.arguments),
    item.status,
    item.requestedAt,
    item.decidedAt || null,
    item.decidedBy || null,
    item.note || null
  ]);
  stmt.free();
  saveDbToDisk();
  return item;
}

export async function getApprovalItem(id: string): Promise<ApprovalItem | null> {
  const database = await initStore();
  const stmt = database.prepare(`SELECT * FROM approval_items WHERE id = ?`);
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return mapRowToApproval(row);
  }
  stmt.free();
  return null;
}

export async function getApprovalItems(statusFilter?: ApprovalStatus): Promise<ApprovalItem[]> {
  const database = await initStore();
  let query = `SELECT * FROM approval_items`;
  const params: any[] = [];
  if (statusFilter) {
    query += ` WHERE status = ?`;
    params.push(statusFilter);
  }
  query += ` ORDER BY requestedAt DESC`;

  const stmt = database.prepare(query);
  stmt.bind(params);
  const items: ApprovalItem[] = [];
  while (stmt.step()) {
    items.push(mapRowToApproval(stmt.getAsObject()));
  }
  stmt.free();
  return items;
}

function mapRowToApproval(row: any): ApprovalItem {
  let argsObj: any = {};
  if (row.arguments) {
    try { argsObj = JSON.parse(row.arguments); } catch { argsObj = row.arguments; }
  }
  return {
    id: row.id as string,
    taskId: row.taskId as string,
    objectiveId: row.objectiveId as string,
    toolName: row.toolName as string,
    arguments: argsObj,
    status: row.status as ApprovalStatus,
    requestedAt: row.requestedAt as string,
    decidedAt: row.decidedAt || undefined,
    decidedBy: row.decidedBy || undefined,
    note: row.note || undefined
  };
}
