import { ApprovalPolicy, PolicyDecision } from './types.js';

export class PolicyEngine {
  /**
   * Evaluates if a tool execution is permitted under current policy.
   * Model decisions or prompts can NEVER override server policy.
   */
  public static evaluateToolPolicy(
    toolPolicy: ApprovalPolicy,
    objectivePolicy: ApprovalPolicy,
    toolName: string
  ): PolicyDecision {
    // 1. System/Global BLOCKED overrides all
    if (toolPolicy === 'BLOCKED' || objectivePolicy === 'BLOCKED') {
      return {
        allowed: false,
        policy: 'BLOCKED',
        reason: `Execution of tool '${toolName}' is BLOCKED by server security policy.`
      };
    }

    // 2. High risk tools or explicit REQUIRES_APPROVAL
    if (toolPolicy === 'REQUIRES_APPROVAL' || objectivePolicy === 'REQUIRES_APPROVAL') {
      return {
        allowed: false,
        policy: 'REQUIRES_APPROVAL',
        reason: `Tool '${toolName}' requires human operator approval before execution.`
      };
    }

    // 3. AUTO_APPROVED
    return {
      allowed: true,
      policy: 'AUTO_APPROVED'
    };
  }
}
