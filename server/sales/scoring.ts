import type { ProspectScore, ProspectScoreInput } from './types.js';

function includesAny(haystack: string, needles: string[]): string[] {
  const lower = haystack.toLowerCase();
  return needles.filter(n => n && lower.includes(n.toLowerCase()));
}

export function scoreProspect(input: ProspectScoreInput): ProspectScore {
  const reasons: string[] = [];
  const disqualifiers: string[] = [];
  const text = `${input.companyIndustry || ''} ${input.companyLocation || ''} ${input.websiteText || ''}`;

  if (['existing_customer', 'do_not_contact', 'active_opportunity', 'partner'].includes(input.crmStatus || 'unknown')) {
    disqualifiers.push(`CRM status ${input.crmStatus} blocks cold outreach.`);
  }

  const excluded = includesAny(text, input.excludedKeywords || []);
  if (excluded.length) disqualifiers.push(`Excluded signals: ${excluded.join(', ')}`);

  if (disqualifiers.length) {
    return { overallScore: 0, confidence: 100, qualification: 'disqualified', reasons, disqualifiers };
  }

  let score = 0;
  let evidence = 0;

  const industryMatches = includesAny(input.companyIndustry || input.websiteText || '', input.targetIndustries);
  if (industryMatches.length) {
    score += 30;
    evidence += 30;
    reasons.push(`Industry fit: ${industryMatches.join(', ')}`);
  }

  const locationMatches = includesAny(input.companyLocation || input.websiteText || '', input.targetLocations);
  if (locationMatches.length) {
    score += 20;
    evidence += 20;
    reasons.push(`Location fit: ${locationMatches.join(', ')}`);
  }

  const keywordMatches = includesAny(input.websiteText || '', input.requiredKeywords || []);
  if (keywordMatches.length) {
    const points = Math.min(30, keywordMatches.length * 10);
    score += points;
    evidence += points;
    reasons.push(`Relevant business signals: ${keywordMatches.join(', ')}`);
  }

  const contacts = (input.contacts || []).filter(c => c.verification !== 'not_found');
  if (contacts.length) {
    const contactPoints = contacts.some(c => c.email) ? 15 : 8;
    score += contactPoints;
    evidence += contactPoints;
    reasons.push('Public contact path found.');
  }

  if (input.crmStatus === 'new_prospect') {
    score += 5;
    evidence += 5;
    reasons.push('CRM indicates a clean new prospect.');
  } else if (input.crmStatus === 'previously_contacted' || input.crmStatus === 'lost_opportunity') {
    score = Math.max(0, score - 10);
    reasons.push('Prior CRM history reduces cold-outreach priority.');
  }

  score = Math.max(0, Math.min(100, score));
  const confidence = Math.max(20, Math.min(100, evidence));
  const qualification = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
  return { overallScore: score, confidence, qualification, reasons, disqualifiers };
}
