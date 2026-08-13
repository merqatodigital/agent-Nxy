import { initStore, saveObjective, getObjective, saveTask, getTask, recoverInterruptedTasks } from '../server/agent/store.js';
import { PolicyEngine } from '../server/agent/policies.js';
import { toolRegistry } from '../server/agent/toolRegistry.js';
import { AgentExecutor } from '../server/agent/executor.js';
import { nyxRuntime } from '../server/agent/runtime.js';
import { sendOutboundEmail } from '../server/worker/smtpProvider.js';
import assert from 'assert';

async function runTests() {
  console.log('=== NYX AGENT RUNTIME COMPREHENSIVE TEST SUITE ===');

  await initStore();
  console.log('[Test 1] SQLite store initialized.');

  const objId = `test-obj-${Date.now()}`;
  const testObj = {
    id: objId,
    title: 'Test Objective Title',
    instruction: 'Scrape and qualify test lead',
    status: 'active' as const,
    priority: 'high' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvalPolicy: 'AUTO_APPROVED' as const
  };
  await saveObjective(testObj);
  const fetchedObj = await getObjective(objId);
  assert.strictEqual(fetchedObj?.title, testObj.title);
  assert.strictEqual(fetchedObj?.status, 'active');
  console.log('[Test 2] Objective persistence passed.');

  const taskId = `test-task-${Date.now()}`;
  const testTask = {
    id: taskId,
    objectiveId: objId,
    type: 'CRM_LOOKUP',
    status: 'queued' as const,
    priority: 'high' as const,
    attempts: 0,
    maxAttempts: 3,
    scheduledAt: new Date().toISOString(),
    arguments: { company_name: 'Veritas Analytics' }
  };
  await saveTask(testTask);
  const fetchedTask = await getTask(taskId);
  assert.strictEqual(fetchedTask?.id, taskId);
  assert.strictEqual(fetchedTask?.status, 'queued');
  console.log('[Test 3] Task persistence passed.');

  const autoPolicy = PolicyEngine.evaluateToolPolicy('AUTO_APPROVED', 'AUTO_APPROVED', 'CRM_LOOKUP');
  assert.strictEqual(autoPolicy.allowed, true);
  const reqApprovalPolicy = PolicyEngine.evaluateToolPolicy('REQUIRES_APPROVAL', 'AUTO_APPROVED', 'SEND_EMAIL');
  assert.strictEqual(reqApprovalPolicy.allowed, false);
  assert.strictEqual(reqApprovalPolicy.policy, 'REQUIRES_APPROVAL');
  const blockedPolicy = PolicyEngine.evaluateToolPolicy('BLOCKED', 'AUTO_APPROVED', 'DESTRUCTIVE_TOOL');
  assert.strictEqual(blockedPolicy.allowed, false);
  assert.strictEqual(blockedPolicy.policy, 'BLOCKED');
  console.log('[Test 4] Policy Engine enforcement passed.');

  const executor = new AgentExecutor();
  const crmResultTask = await executor.executeTask(testTask, {
    crmRecords: [{ companyName: 'Veritas Analytics', domain: 'veritas.io', lifecycleStage: 'Customer', totalSpend: 18000 }]
  });
  assert.strictEqual(crmResultTask.status, 'completed');
  assert.strictEqual(crmResultTask.result.found, true);
  console.log('[Test 5] Executor tool execution passed.');

  const interruptedTaskId = `interrupted-${Date.now()}`;
  await saveTask({
    id: interruptedTaskId,
    objectiveId: objId,
    type: 'WEB_SCRAPE',
    status: 'running' as const,
    priority: 'medium' as const,
    attempts: 1,
    maxAttempts: 3,
    scheduledAt: new Date().toISOString()
  });
  const recoveredCount = await recoverInterruptedTasks();
  assert(recoveredCount >= 1);
  const recoveredTask = await getTask(interruptedTaskId);
  assert.strictEqual(recoveredTask?.status, 'queued');
  assert.strictEqual(recoveredTask?.attempts, 1);
  console.log('[Test 6] Worker/task recovery passed.');

  const createdObj = await nyxRuntime.createObjective({
    title: 'Pause Test Objective',
    instruction: 'Demonstrate pause and resume functionality',
    priority: 'medium',
    prospects: []
  });
  assert.strictEqual(createdObj.tasks[0]?.type, 'DISCOVER_PROSPECTS', 'Empty objective must discover real prospects instead of fabricating a lead');
  const pausedObj = await nyxRuntime.pauseObjective(createdObj.objective.id);
  assert.strictEqual(pausedObj?.status, 'paused');
  const resumedObj = await nyxRuntime.resumeObjective(createdObj.objective.id);
  assert.strictEqual(resumedObj?.status, 'active');
  console.log('[Test 7] Non-fabricating planner and pause/resume passed.');

  const status = await nyxRuntime.getRuntimeStatus();
  assert.strictEqual(status.status, 'running');
  assert(status.totalObjectivesCount >= 1);
  const approvals = await nyxRuntime.getApprovals('pending');
  assert(Array.isArray(approvals));
  console.log('[Test 8] Status and approval APIs passed.');

  const badTask = {
    id: `bad-${Date.now()}`,
    objectiveId: objId,
    type: 'CRM_LOOKUP',
    status: 'queued' as const,
    priority: 'low' as const,
    attempts: 0,
    maxAttempts: 3,
    scheduledAt: new Date().toISOString(),
    arguments: {}
  };
  const badExec = await executor.executeTask(badTask);
  assert.strictEqual(badExec.status, 'failed');
  console.log('[Test 9] Malformed input handling passed.');

  let approvedExecutions = 0;
  const approvalToolName = `TEST_APPROVAL_${Date.now()}`;
  toolRegistry.registerTool({
    name: approvalToolName,
    description: 'Regression test for one-time approval execution',
    approvalPolicy: 'REQUIRES_APPROVAL',
    timeoutMs: 1000,
    retryBehavior: { maxAttempts: 1, backoffMs: 0 },
    validateInput: () => ({ valid: true }),
    execute: async () => {
      approvedExecutions += 1;
      return { ok: true };
    }
  });

  const approvalTaskId = `approval-task-${Date.now()}`;
  const approvalTask = {
    id: approvalTaskId,
    objectiveId: objId,
    type: approvalToolName,
    status: 'queued' as const,
    priority: 'medium' as const,
    attempts: 0,
    maxAttempts: 1,
    scheduledAt: new Date().toISOString(),
    arguments: { payload: 'test' }
  };
  await saveTask(approvalTask);
  const waiting = await executor.executeTask(approvalTask);
  assert.strictEqual(waiting.status, 'approval_required');
  assert.strictEqual(waiting.attempts, 0, 'Approval request must not consume an execution attempt');
  assert.strictEqual(approvedExecutions, 0);
  const pending = (await nyxRuntime.getApprovals('pending')).find(item => item.taskId === approvalTaskId);
  assert(pending, 'Approval item should exist');
  await nyxRuntime.decideApproval(pending!.id, 'approved', 'Test Operator');
  const approvedTask = await getTask(approvalTaskId);
  assert.strictEqual(approvedTask?.status, 'completed');
  assert.strictEqual(approvedTask?.attempts, 1);
  assert.strictEqual(approvedExecutions, 1, 'Approved tool must execute exactly once');
  console.log('[Test 10] Approval executes once without reapproval loop.');

  const savedResend = process.env.RESEND_API_KEY;
  const savedSmtp = process.env.SMTP_HOST;
  delete process.env.RESEND_API_KEY;
  delete process.env.SMTP_HOST;
  await assert.rejects(
    () => sendOutboundEmail({ to: 'prospect@example.com', subject: 'Test', body: 'Test body' }),
    /email_provider_not_configured/
  );
  if (savedResend) process.env.RESEND_API_KEY = savedResend;
  if (savedSmtp) process.env.SMTP_HOST = savedSmtp;
  console.log('[Test 11] Email transport fails closed when no provider is configured.');

  await nyxRuntime.shutdown();
  console.log('ALL NYX AGENT RUNTIME TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(async (err) => {
  console.error('Test Suite Failed:', err);
  await nyxRuntime.shutdown().catch(() => undefined);
  process.exit(1);
});
