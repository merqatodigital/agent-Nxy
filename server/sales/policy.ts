import type { CrmSafetyStatus } from './types.js';

export type OutreachDecision = 'ALLOW_DRAFT' | 'REQUIRES_APPROVAL' | 'BLOCKED';

export interface OutreachPolicyResult {
  decision: OutreachDecision;
  reason: string;
}

export function evaluateOutreachPolicy(status: CrmSafetyStatus): OutreachPolicyResult {
  switch (status) {
    case 'do_not_contact':
      return { decision: 'BLOCKED', reason: 'Prospect is marked do-not-contact.' };
    case 'existing_customer':
      return { decision: 'BLOCKED', reason: 'Existing customers must not receive cold outreach.' };
    case 'active_opportunity':
      return { decision: 'BLOCKED', reason: 'Active opportunities must stay in the existing sales motion.' };
    case 'partner':
      return { decision: 'BLOCKED', reason: 'Partners are excluded from cold outreach.' };
    case 'previously_contacted':
    case 'lost_opportunity':
      return { decision: 'REQUIRES_APPROVAL', reason: 'Prior relationship exists; human review required.' };
    case 'new_prospect':
      return { decision: 'ALLOW_DRAFT', reason: 'No CRM conflict found; draft creation is allowed.' };
    default:
      return { decision: 'REQUIRES_APPROVAL', reason: 'CRM relationship is unknown; review before outreach.' };
  }
}
