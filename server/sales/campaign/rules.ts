import type { CampaignRules, CrmSafetyStatus } from '../types.js';

export interface FollowUpState {
  sentCount: number;
  lastSentAt?: string;
  replied?: boolean;
  unsubscribed?: boolean;
  campaignActive?: boolean;
  crmStatus?: CrmSafetyStatus;
}

export function canSendInitialEmail(input: {
  score: number;
  crmStatus: CrmSafetyStatus;
  sendsToday: number;
  rules: CampaignRules;
}): { allowed: boolean; reason: string } {
  if (input.crmStatus === 'do_not_contact') return { allowed: false, reason: 'do_not_contact' };
  if (input.crmStatus === 'existing_customer') return { allowed: false, reason: 'existing_customer' };
  if (input.crmStatus === 'partner') return { allowed: false, reason: 'partner' };
  if (input.crmStatus === 'active_opportunity') return { allowed: false, reason: 'active_opportunity' };
  if (input.score < input.rules.minimumScore) return { allowed: false, reason: 'below_minimum_score' };
  if (input.sendsToday >= input.rules.dailySendLimit) return { allowed: false, reason: 'daily_send_limit' };
  if (input.rules.approvalRequired) return { allowed: false, reason: 'approval_required' };
  return { allowed: true, reason: 'allowed' };
}

export function nextFollowUpAt(state: FollowUpState, rules: CampaignRules): string | null {
  if (!state.campaignActive || state.replied || state.unsubscribed) return null;
  if (state.crmStatus === 'do_not_contact' || state.crmStatus === 'existing_customer') return null;
  if (state.sentCount >= 1 + rules.maxFollowUps) return null;
  if (!state.lastSentAt) return null;

  const delayDays = state.sentCount <= 1
    ? rules.firstFollowUpDelayDays
    : rules.secondFollowUpDelayDays;
  const next = new Date(state.lastSentAt);
  next.setUTCDate(next.getUTCDate() + delayDays);
  return next.toISOString();
}
