import { initStore, saveObjective, getObjective, getObjectives, saveTask, getTask, getTasks, recoverInterruptedTasks, saveApprovalItem, getApprovalItems } from '../server/agent/store.js';
import { PolicyEngine } from '../server/agent/policies.js';
import { toolRegistry } from '../server/agent/toolRegistry.js';
import { AgentExecutor } from '../server/agent/executor.js';
import { nyxRuntime } from '../server/agent/runtime.js';
import assert from 'assert';

async function runTests() {
  console.log('=== NYX AGENT RUNTIME COMPREHENSIVE TEST SUITE ===');

  // 1. Initialize SQLite Database Store
  await initStore();
  console.log('[Test 1] SQLite store initialized.');

  // 2. Test Objective Persistence
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
  assert.strictEqual(fetchedObj?.title, testObj.title, 'Objective title should match');
  assert.strictEqual(fetchedObj?.status, 'active', 'Objective status should be active');
  console.log('[Test 2] Objective persistence passed.');

  // 3. Test Task Persistence & Queue
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
  assert.strictEqual(fetchedTask?.id, taskId, 'Task ID should match');
  assert.strictEqual(fetchedTask?.status, 'queued', 'Task status should be queued');
  console.log('[Test 3] Task persistence passed.');

  // 4. Test Policy Enforcement
  const autoPolicy = PolicyEngine.evaluateToolPolicy('AUTO_APPROVED', 'AUTO_APPROVED', 'CRM_LOOKUP');
  assert.strictEqual(autoPolicy.allowed, true, 'AUTO_APPROVED policy should allow execution');

  const reqApprovalPolicy = PolicyEngine.evaluateToolPolicy('REQUIRES_APPROVAL', 'AUTO_APPROVED', 'DRAFT_EMAIL');
  assert.strictEqual(reqApprovalPolicy.allowed, false, 'REQUIRES_APPROVAL policy should not allow auto execution');
  assert.strictEqual(reqApprovalPolicy.policy, 'REQUIRES_APPROVAL');

  const blockedPolicy = PolicyEngine.evaluateToolPolicy('BLOCKED', 'AUTO_APPROVED', 'DESTRUCTIVE_TOOL');
  assert.strictEqual(blockedPolicy.allowed, false, 'BLOCKED policy should reject execution');
  assert.strictEqual(blockedPolicy.policy, 'BLOCKED');
  console.log('[Test 4] Policy Engine enforcement passed.');

  // 5. Test Executor & Max Attempts Retry
  const executor = new AgentExecutor();
  const crmResultTask = await executor.executeTask(testTask, { crmRecords: [{ companyName: 'Veritas Analytics', domain: 'veritas.io', lifecycleStage: 'Customer', totalSpend: 18000 }] });
  assert.strictEqual(crmResultTask.status, 'completed', 'Executed task should be completed');
  assert.strictEqual(crmResultTask.result.found, true, 'CRM lookup should find record');
  console.log('[Test 5] Executor tool execution passed.');

  // 6. Test Worker/Task Recovery
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
  assert(recoveredCount >= 1, 'Should recover at least 1 interrupted task');
  const recoveredTask = await getTask(interruptedTaskId);
  assert.strictEqual(recoveredTask?.status, 'queued', 'Interrupted task status should reset to queued');
  assert.strictEqual(recoveredTask?.attempts, 1, 'Attempts count should be preserved');
  console.log('[Test 6] Worker/Task recovery passed.');

  // 7. Test Objective Pause / Resume
  const createdObj = await nyxRuntime.createObjective({
    title: 'Pause Test Objective',
    instruction: 'Demonstrate pause and resume functionality',
    priority: 'medium'
  });

  const pausedObj = await nyxRuntime.pauseObjective(createdObj.objective.id);
  assert.strictEqual(pausedObj?.status, 'paused', 'Objective should be paused');

  const resumedObj = await nyxRuntime.resumeObjective(createdObj.objective.id);
  assert.strictEqual(resumedObj?.status, 'active', 'Objective should be resumed');
  console.log('[Test 7] Objective pause/resume passed.');

  // 8. Test Status & Approval APIs
  const status = await nyxRuntime.getRuntimeStatus();
  assert.strictEqual(status.status, 'running', 'Runtime status should be running');
  assert(status.totalObjectivesCount >= 1, 'Total objectives count should be at least 1');

  const approvals = await nyxRuntime.getApprovals('pending');
  assert(Array.isArray(approvals), 'Approvals list should be an array');
  console.log('[Test 8] Status and Approval APIs passed.');

  // 9. Test Malformed Input Handling
  const badTask = {
    id: `bad-${Date.now()}`,
    objectiveId: objId,
    type: 'CRM_LOOKUP',
    status: 'queued' as const,
    priority: 'low' as const,
    attempts: 0,
    maxAttempts: 3,
    scheduledAt: new Date().toISOString(),
    arguments: {} // missing company_name
  };
  const badExec = await executor.executeTask(badTask);
  assert.strictEqual(badExec.status, 'failed', 'Task with malformed args should fail validation');
  console.log('[Test 9] Malformed model/input handling passed.');

  console.log('ALL NYX AGENT RUNTIME TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
