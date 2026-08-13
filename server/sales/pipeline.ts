import type { CrmSafetyStatus, ProspectCandidate, ProspectScore, PublicContact } from './types.js';
import { crawlPublicBusinessSite } from './research/boundedCrawler.js';
import { extractPublicContacts, rankContacts } from './enrichment/publicContacts.js';
import { scoreProspect } from './scoring.js';
import { evaluateOutreachPolicy } from './policy.js';

export interface BusinessResearchInput {
  prospect: ProspectCandidate;
  crmStatus: CrmSafetyStatus;
  targetIndustries: string[];
  targetLocations: string[];
  requiredKeywords?: string[];
  excludedKeywords?: string[];
  maxPages?: number;
}

export interface BusinessResearchOutput {
  prospect: ProspectCandidate;
  crmStatus: CrmSafetyStatus;
  pagesResearched: number;
  contacts: PublicContact[];
  score: ProspectScore;
  outreachPolicy: ReturnType<typeof evaluateOutreachPolicy>;
  evidence: {
    urls: string[];
    textSample: string;
    errors: { url: string; error: string }[];
  };
}

export async function researchAndQualifyBusiness(input: BusinessResearchInput): Promise<BusinessResearchOutput> {
  const research = await crawlPublicBusinessSite({
    url: input.prospect.website,
    maxPages: input.maxPages || 8
  });

  const contacts = rankContacts(
    research.pages.flatMap(page => extractPublicContacts({
      text: page.text,
      html: page.html,
      sourceUrl: page.url
    })).filter(contact => contact.verification !== 'not_found')
  );

  const combinedText = research.pages
    .map(page => `${page.title}\n${page.description || ''}\n${page.text}`)
    .join('\n')
    .slice(0, 50000);

  const score = scoreProspect({
    targetIndustries: input.targetIndustries,
    targetLocations: input.targetLocations,
    requiredKeywords: input.requiredKeywords,
    excludedKeywords: input.excludedKeywords,
    companyIndustry: input.prospect.industry,
    companyLocation: input.prospect.location,
    websiteText: combinedText,
    contacts,
    crmStatus: input.crmStatus
  });

  return {
    prospect: input.prospect,
    crmStatus: input.crmStatus,
    pagesResearched: research.pages.length,
    contacts,
    score,
    outreachPolicy: evaluateOutreachPolicy(input.crmStatus),
    evidence: {
      urls: research.pages.map(page => page.url),
      textSample: combinedText.slice(0, 12000),
      errors: research.errors
    }
  };
}
