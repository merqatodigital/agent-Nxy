import { AgentTask, ToolContext } from './types.js';
import { toolRegistry } from './toolRegistry.js';
import { PolicyEngine } from './policies.js';
import { saveTask, saveApprovalItem, logActivityEvent, getObjective } from './store.js';

export class AgentExecutor {
  public async executeTask(task: AgentTask, context: ToolContext = {}): Promise<AgentTask> {
    const objective = await getObjective(task.objectiveId);
    const objectivePolicy = objective?.approvalPolicy || 'AUTO_APPROVED';
    const tool = toolRegistry.getTool(task.type);

    if (!tool) {
      task.status = 'failed';
      task.lastError = `No registered tool found for type '${task.type}'`;
      task.completedAt = new Date().toISOString();
      await saveTask(task);
      await this.logFailure(task, task.lastError);
      return task;
    }

    const rawArgs = { ...(task.arguments || {}) } as Record<string, any>;
    const operatorApproved = rawArgs.__operatorApproved === true;
    delete rawArgs.__operatorApproved;
    delete rawArgs.__approvalId;

    const validation = tool.validateInput(rawArgs);
    if (!validation.valid) {
      task.status = 'failed';
      task.lastError = `Validation failed: ${validation.error}`;
      task.completedAt = new Date().toISOString();
      await saveTask(task);
      await this.logFailure(task, `Task input validation failed: ${validation.error}`);
      return task;
    }

    const decision = PolicyEngine.evaluateToolPolicy(tool.approvalPolicy, objectivePolicy, tool.name);

    if (decision.policy === 'BLOCKED') {
      task.status = 'failed';
      task.lastError = decision.reason || 'Task blocked by policy';
      task.completedAt = new Date().toISOString();
      await saveTask(task);
      await this.logFailure(task, task.lastError);
      return task;
    }

    if (decision.policy === 'REQUIRES_APPROVAL' && !operatorApproved) {
      task.status = 'approval_required';
      task.lastError = undefined;
      await saveTask(task);

      const approvalId = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await saveApprovalItem({
        id: approvalId,
        taskId: task.id,
        objectiveId: task.objectiveId,
        toolName: tool.name,
        arguments: rawArgs,
        status: 'pending',
        requestedAt: new Date().toISOString()
      });

      await logActivityEvent({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        objectiveId: task.objectiveId,
        taskId: task.id,
        type: 'APPROVAL_REQUESTED',
        message: `Task '${tool.name}' requires operator approval before execution. Approval ID: ${approvalId}`,
        metadata: { approvalId, toolName: tool.name },
        createdAt: new Date().toISOString()
      });
      return task;
    }

    // Only actual tool executions consume an attempt. Approval requests do not.
    task.attempts += 1;
    task.startedAt = new Date().toISOString();
    task.status = 'running';
    task.arguments = rawArgs;
    await saveTask(task);

    await logActivityEvent({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      objectiveId: task.objectiveId,
      taskId: task.id,
      type: 'TASK_STARTED',
      message: `Started task '${task.type}' (Attempt ${task.attempts}/${task.maxAttempts})`,
      createdAt: new Date().toISOString()
    });

    try {
      const result = await Promise.race([
        tool.execute(rawArgs, { ...context, taskId: task.id, objectiveId: task.objectiveId, prospectId: task.prospectId }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Tool execution timed out after ${tool.timeoutMs}ms`)), tool.timeoutMs)
        )
      ]);

      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date().toISOString();
      task.lastError = undefined;
      await saveTask(task);

      await logActivityEvent({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        objectiveId: task.objectiveId,
        taskId: task.id,
        type: 'TASK_COMPLETED',
        message: `Task '${tool.name}' completed successfully.`,
        metadata: { toolName: tool.name },
        createdAt: new Date().toISOString()
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown tool execution error';
      if (task.attempts < task.maxAttempts) {
        const backoff = Math.max(0, Number(tool.retryBehavior?.backoffMs || 0));
        task.status = 'queued';
        task.scheduledAt = new Date(Date.now() + backoff).toISOString();
        task.lastError = `Attempt ${task.attempts} failed: ${errorMsg}. Re-queued.`;
      } else {
        task.status = 'failed';
        task.lastError = `Max attempts (${task.maxAttempts}) reached. Final error: ${errorMsg}`;
        task.completedAt = new Date().toISOString();
      }
      await saveTask(task);
      await this.logFailure(task, task.lastError);
    }

    return task;
  }

  private async logFailure(task: AgentTask, message: string): Promise<void> {
    await logActivityEvent({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      objectiveId: task.objectiveId,
      taskId: task.id,
      type: 'TASK_FAILED',
      message,
      createdAt: new Date().toISOString()
    });
  }
}
