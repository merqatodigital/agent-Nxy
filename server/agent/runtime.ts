import {
  AgentObjective,
  AgentTask,
  ApprovalItem,
  ActivityEvent,
  RuntimeStatus,
  ObjectiveStatus,
  TaskStatus,
  ApprovalStatus,
  ToolContext,
  ApprovalPolicy
} from './types.js';
import {
  initStore,
  saveObjective,
  getObjective,
  getObjectives,
  getTasks,
  getTask,
  saveTask,
  getActivityEvents,
  logActivityEvent,
  getApprovalItems,
  getApprovalItem,
  saveApprovalItem
} from './store.js';
import { AgentPlanner } from './planner.js';
import { AgentScheduler } from './scheduler.js';

class NyxAgentRuntime {
  private planner = new AgentPlanner();
  private scheduler = new AgentScheduler();
  private startTime = Date.now();
  private isInitialized = false;
  private contextProvider: () => ToolContext = () => ({});

  public setContextProvider(provider: () => ToolContext) {
    this.contextProvider = provider;
    this.scheduler.setContextProvider(provider);
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    await initStore();
    await this.scheduler.start(2000);
    this.isInitialized = true;
    console.log('[Nyx Runtime] Core Agent Runtime Initialized Successfully');
  }

  // --- OBJECTIVES ---

  public async createObjective(params: {
    title: string;
    instruction: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    approvalPolicy?: ApprovalPolicy;
    constraints?: any;
    prospects?: any[];
  }): Promise<{ objective: AgentObjective; tasks: AgentTask[] }> {
    await this.init();

    const timestamp = new Date().toISOString();
    const id = `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const objective: AgentObjective = {
      id,
      title: params.title,
      instruction: params.instruction,
      status: 'active',
      priority: params.priority || 'medium',
      createdAt: timestamp,
      updatedAt: timestamp,
      constraints: params.constraints,
      approvalPolicy: params.approvalPolicy || 'AUTO_APPROVED'
    };

    await saveObjective(objective);

    await logActivityEvent({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      objectiveId: id,
      type: 'OBJECTIVE_CREATED',
      message: `Created objective '${params.title}' with priority ${objective.priority}`,
      createdAt: timestamp
    });

    // Plan & queue tasks
    const context = this.contextProvider();
    const prospectsToUse = params.prospects || context.prospectLeads || [];
    const tasks = await this.planner.planObjectiveTasks(objective, prospectsToUse);

    for (const task of tasks) {
      await logActivityEvent({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        objectiveId: id,
        taskId: task.id,
        type: 'TASK_QUEUED',
        message: `Queued task '${task.type}' for objective '${objective.title}'`,
        createdAt: new Date().toISOString()
      });
    }

    return { objective, tasks };
  }

  public async pauseObjective(id: string): Promise<AgentObjective | null> {
    await this.init();
    const objective = await getObjective(id);
    if (!objective) return null;

    objective.status = 'paused';
    objective.updatedAt = new Date().toISOString();
    await saveObjective(objective);

    await logActivityEvent({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      objectiveId: id,
      type: 'OBJECTIVE_PAUSED',
      message: `Objective '${objective.title}' paused by operator.`,
      createdAt: new Date().toISOString()
    });

    return objective;
  }

  public async resumeObjective(id: string): Promise<AgentObjective | null> {
    await this.init();
    const objective = await getObjective(id);
    if (!objective) return null;

    objective.status = 'active';
    objective.updatedAt = new Date().toISOString();
    await saveObjective(objective);

    await logActivityEvent({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      objectiveId: id,
      type: 'OBJECTIVE_RESUMED',
      message: `Objective '${objective.title}' resumed.`,
      createdAt: new Date().toISOString()
    });

    return objective;
  }

  public async getObjective(id: string): Promise<AgentObjective | null> {
    await this.init();
    return getObjective(id);
  }

  public async getObjectives(statusFilter?: ObjectiveStatus): Promise<AgentObjective[]> {
    await this.init();
    return getObjectives(statusFilter);
  }

  // --- TASKS ---

  public async getTasks(objectiveId?: string, statusFilter?: TaskStatus): Promise<AgentTask[]> {
    await this.init();
    return getTasks(objectiveId, statusFilter);
  }

  // --- APPROVALS ---

  public async getApprovals(statusFilter?: ApprovalStatus): Promise<ApprovalItem[]> {
    await this.init();
    return getApprovalItems(statusFilter);
  }

  public async decideApproval(
    approvalId: string,
    decision: 'approved' | 'rejected',
    decidedBy = 'Operator',
    note?: string
  ): Promise<ApprovalItem | null> {
    await this.init();
    const approval = await getApprovalItem(approvalId);
    if (!approval) return null;

    const timestamp = new Date().toISOString();
    approval.status = decision;
    approval.decidedAt = timestamp;
    approval.decidedBy = decidedBy;
    approval.note = note;

    await saveApprovalItem(approval);

    const task = await getTask(approval.taskId);
    if (task) {
      if (decision === 'approved') {
        task.status = 'queued'; // return to queue to run tool
        await saveTask(task);

        await logActivityEvent({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          objectiveId: approval.objectiveId,
          taskId: task.id,
          type: 'APPROVAL_GRANTED',
          message: `Approval GRANTED for task '${approval.toolName}'. Re-queued for execution.`,
          createdAt: timestamp
        });

        // Immediately attempt run
        await this.scheduler.executeTaskNow(task.id);
      } else {
        task.status = 'cancelled';
        task.lastError = `Rejected by ${decidedBy}: ${note || 'Operator declined execution'}`;
        task.completedAt = timestamp;
        await saveTask(task);

        await logActivityEvent({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          objectiveId: approval.objectiveId,
          taskId: task.id,
          type: 'APPROVAL_REJECTED',
          message: `Approval REJECTED for task '${approval.toolName}'. Task cancelled.`,
          createdAt: timestamp
        });
      }
    }

    return approval;
  }

  // --- ACTIVITY EVENTS ---

  public async getActivityEvents(limit = 50, objectiveId?: string): Promise<ActivityEvent[]> {
    await this.init();
    return getActivityEvents(limit, objectiveId);
  }

  // --- STATUS ---

  public async getRuntimeStatus(): Promise<RuntimeStatus> {
    await this.init();
    const allObj = await getObjectives();
    const activeObj = allObj.filter((o) => o.status === 'active');
    const queuedTasks = await getTasks(undefined, 'queued');
    const runningTasks = await getTasks(undefined, 'running');
    const pendingApprovals = await getApprovalItems('pending');

    return {
      status: 'running',
      activeObjectivesCount: activeObj.length,
      totalObjectivesCount: allObj.length,
      queuedTasksCount: queuedTasks.length,
      runningTasksCount: runningTasks.length,
      pendingApprovalsCount: pendingApprovals.length,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      lastTickTime: this.scheduler.getLastTickTime()
    };
  }
}

export const nyxRuntime = new NyxAgentRuntime();
