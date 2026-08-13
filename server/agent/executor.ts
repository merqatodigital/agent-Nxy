import { AgentTask, ToolContext } from './types.js';
import { toolRegistry } from './toolRegistry.js';
import { PolicyEngine } from './policies.js';
import { saveTask, saveApprovalItem, logActivityEvent, getObjective } from './store.js';

export class AgentExecutor {
  /**
   * Executes a queued or ready task safely.
   */
  public async executeTask(task: AgentTask, context: ToolContext = {}): Promise<AgentTask> {
    const objective = await getObjective(task.objectiveId);
    const objectivePolicy = objective?.approvalPolicy || 'AUTO_APPROVED';

    // Increment attempts
    task.attempts += 1;
    task.startedAt = new Date().toISOString();
    task.status = 'running';
    await saveTask(task);

    await logActivityEvent({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      objectiveId: task.objectiveId,
      taskId: task.id,
      type: 'TASK_STARTED',
      message: `Started task '${task.type}' (Attempt ${task.attempts}/${task.maxAttempts})`,
      createdAt: new Date().toISOString()
    });

    const tool = toolRegistry.getTool(task.type);

    if (!tool) {
      task.status = 'failed';
      task.lastError = `No registered tool found for type '${task.type}'`;
      task.completedAt = new Date().toISOString();
      await saveTask(task);

      await logActivityEvent({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        objectiveId: task.objectiveId,
        taskId: task.id,
        type: 'TASK_FAILED',
        message: `Task failed: ${task.lastError}`,
        createdAt: new Date().toISOString()
      });
      return task;
    }

    // 1. Validate Input
    const validation = tool.validateInput(task.arguments || {});
    if (!validation.valid) {
      task.status = 'failed';
      task.lastError = `Validation failed: ${validation.error}`;
      task.completedAt = new Date().toISOString();
      await saveTask(task);

      await logActivityEvent({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        objectiveId: task.objectiveId,
        taskId: task.id,
        type: 'TASK_FAILED',
        message: `Task input validation failed: ${validation.error}`,
        createdAt: new Date().toISOString()
      });
      return task;
    }

    // 2. Policy Check
    const decision = PolicyEngine.evaluateToolPolicy(
      tool.approvalPolicy,
      objectivePolicy,
      tool.name
    );

    if (decision.policy === 'BLOCKED') {
      task.status = 'failed';
      task.lastError = decision.reason;
      task.completedAt = new Date().toISOString();
      await saveTask(task);

      await logActivityEvent({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        objectiveId: task.objectiveId,
        taskId: task.id,
        type: 'TASK_FAILED',
        message: decision.reason || 'Task blocked by policy',
        createdAt: new Date().toISOString()
      });
      return task;
    }

    if (decision.policy === 'REQUIRES_APPROVAL') {
      task.status = 'approval_required';
      task.lastError = undefined;
      await saveTask(task);

      const approvalId = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await saveApprovalItem({
        id: approvalId,
        taskId: task.id,
        objectiveId: task.objectiveId,
        toolName: tool.name,
        arguments: task.arguments || {},
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

    // 3. Execute Tool Handler
    try {
      const result = await Promise.race([
        tool.execute(task.arguments || {}, { ...context, taskId: task.id, objectiveId: task.objectiveId }),
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
        task.status = 'queued'; // return to queue for retry
        task.lastError = `Attempt ${task.attempts} failed: ${errorMsg}. Re-queued.`;
      } else {
        task.status = 'failed';
        task.lastError = `Max attempts (${task.maxAttempts}) reached. Final error: ${errorMsg}`;
        task.completedAt = new Date().toISOString();
      }
      await saveTask(task);

      await logActivityEvent({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        objectiveId: task.objectiveId,
        taskId: task.id,
        type: 'TASK_FAILED',
        message: task.lastError,
        createdAt: new Date().toISOString()
      });
    }

    return task;
  }
}
