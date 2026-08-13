export type ObjectiveStatus = 'active' | 'paused' | 'completed' | 'failed' | 'archived';
export type ObjectivePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AgentObjective {
  id: string;
  title: string;
  instruction: string;
  status: ObjectiveStatus;
  priority: ObjectivePriority;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  constraints?: Record<string, any> | string;
  approvalPolicy: ApprovalPolicy;
}

export type TaskStatus = 'queued' | 'running' | 'waiting' | 'approval_required' | 'completed' | 'failed' | 'cancelled';
export type TaskType = 'CRM_LOOKUP' | 'WEB_SCRAPE' | 'DRAFT_EMAIL' | 'DISCOVERY' | 'ENRICHMENT' | 'SCORING' | 'CUSTOM';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AgentTask {
  id: string;
  objectiveId: string;
  prospectId?: string;
  type: TaskType | string;
  status: TaskStatus;
  priority: TaskPriority;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
  result?: any;
  arguments?: Record<string, any>;
}

export type RunStatus = 'pending' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled';

export interface AgentRun {
  id: string;
  objectiveId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface AgentStep {
  id: string;
  runId: string;
  taskId?: string;
  stepIndex: number;
  thought: string;
  action?: {
    tool: string;
    arguments: Record<string, any>;
  };
  observation?: any;
  status: 'executing' | 'completed' | 'failed' | 'waiting_approval';
  createdAt: string;
}

export type ApprovalPolicy = 'AUTO_APPROVED' | 'REQUIRES_APPROVAL' | 'BLOCKED';

export type PolicyDecision = {
  allowed: boolean;
  policy: ApprovalPolicy;
  reason?: string;
};

export type ActivityEventType =
  | 'OBJECTIVE_CREATED'
  | 'OBJECTIVE_STARTED'
  | 'OBJECTIVE_PAUSED'
  | 'OBJECTIVE_RESUMED'
  | 'OBJECTIVE_COMPLETED'
  | 'OBJECTIVE_FAILED'
  | 'TASK_QUEUED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'TASK_RECOVERED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_REJECTED'
  | 'TOOL_EXECUTED';

export interface ActivityEvent {
  id: string;
  objectiveId?: string;
  taskId?: string;
  type: ActivityEventType;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalItem {
  id: string;
  taskId: string;
  objectiveId: string;
  toolName: string;
  arguments: Record<string, any>;
  status: ApprovalStatus;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
}

export interface ToolValidationResult {
  valid: boolean;
  error?: string;
}

export interface ToolContext {
  objectiveId?: string;
  taskId?: string;
  prospectId?: string;
  crmRecords?: any[];
  prospectLeads?: any[];
  icpConfig?: any;
  outboundDrafts?: any[];
}

export interface RegisteredTool {
  name: string;
  description: string;
  approvalPolicy: ApprovalPolicy;
  timeoutMs: number;
  retryBehavior: {
    maxAttempts: number;
    backoffMs: number;
  };
  validateInput(args: any): ToolValidationResult;
  execute(args: any, context: ToolContext): Promise<any>;
}

export interface RuntimeStatus {
  status: 'running' | 'idle' | 'error';
  activeObjectivesCount: number;
  totalObjectivesCount: number;
  queuedTasksCount: number;
  runningTasksCount: number;
  pendingApprovalsCount: number;
  uptimeSeconds: number;
  lastTickTime?: string;
}
