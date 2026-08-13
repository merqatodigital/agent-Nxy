import { AgentExecutor } from './executor.js';
import {
  getObjectives,
  getTasks,
  saveObjective,
  recoverInterruptedTasks,
  logActivityEvent,
  getTask
} from './store.js';
import { ToolContext } from './types.js';

export class AgentScheduler {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private executor = new AgentExecutor();
  private activeLocks: Set<string> = new Set();
  private lastTickTime?: string;
  private contextProvider: () => ToolContext = () => ({});

  public setContextProvider(provider: () => ToolContext) {
    this.contextProvider = provider;
  }

  public async start(tickIntervalMs = 3000): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // 1. Startup Recovery: Recover interrupted running tasks
    try {
      const recoveredCount = await recoverInterruptedTasks();
      if (recoveredCount > 0) {
        console.log(`[Nyx Scheduler] Recovered ${recoveredCount} interrupted tasks back to queue.`);
        await logActivityEvent({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'TASK_RECOVERED',
          message: `Startup recovery: Reset ${recoveredCount} interrupted tasks back to queued state.`,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('[Nyx Scheduler] Error during task recovery:', err);
    }

    // 2. Start background ticker loop
    this.timer = setInterval(() => this.tick(), tickIntervalMs);
    console.log(`[Nyx Scheduler] Started agent background scheduler (Interval: ${tickIntervalMs}ms)`);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[Nyx Scheduler] Stopped agent background scheduler');
  }

  public getLastTickTime(): string | undefined {
    return this.lastTickTime;
  }

  public async tick(): Promise<void> {
    this.lastTickTime = new Date().toISOString();

    try {
      // Find active objectives
      const activeObjectives = await getObjectives('active');
      if (activeObjectives.length === 0) return;

      const now = new Date().toISOString();

      for (const objective of activeObjectives) {
        // Fetch queued tasks for this objective
        const queuedTasks = await getTasks(objective.id, 'queued');
        const nowMs = Date.now();

        // Filter due tasks
        const dueTasks = queuedTasks.filter((t) => {
          if (this.activeLocks.has(t.id)) return false; // Prevent duplicate execution locking
          const scheduledMs = new Date(t.scheduledAt).getTime();
          return scheduledMs <= nowMs;
        });

        if (dueTasks.length > 0) {
          // Pick highest priority / earliest task
          const taskToRun = dueTasks[0];

          // Acquire lock
          this.activeLocks.add(taskToRun.id);

          try {
            const context = this.contextProvider();
            await this.executor.executeTask(taskToRun, context);
            objective.lastRunAt = new Date().toISOString();
            await saveObjective(objective);
          } finally {
            // Release lock
            this.activeLocks.delete(taskToRun.id);
          }
        }

        // Check if objective is completed (all tasks completed or failed, and none pending/approval_required)
        const allTasks = await getTasks(objective.id);
        if (
          allTasks.length > 0 &&
          allTasks.every((t) => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled')
        ) {
          objective.status = 'completed';
          objective.updatedAt = new Date().toISOString();
          await saveObjective(objective);

          await logActivityEvent({
            id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            objectiveId: objective.id,
            type: 'OBJECTIVE_COMPLETED',
            message: `Objective '${objective.title}' completed. All ${allTasks.length} tasks finished.`,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('[Nyx Scheduler] Tick error:', err);
    }
  }

  /**
   * Immediately triggers execution of a specific task without waiting for tick loop.
   */
  public async executeTaskNow(taskId: string): Promise<boolean> {
    if (this.activeLocks.has(taskId)) return false;

    const task = await getTask(taskId);
    if (!task) return false;

    this.activeLocks.add(taskId);
    try {
      const context = this.contextProvider();
      await this.executor.executeTask(task, context);
      return true;
    } finally {
      this.activeLocks.delete(taskId);
    }
  }
}
