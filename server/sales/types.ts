export type ProspectSourceType = 'search' | 'website' | 'manual' | 'provider';

export interface ProspectCandidate {
  companyName: string;
  domain: string;
  website: string;
  location?: string;
  industry?: string;
  sourceType: ProspectSourceType;
  sourceUrl?: string;
  sourceProvider?: string;
  discoveredAt: string;
}

export interface PublicContact {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  sourceUrl: string;
  confidence: number;
  verification: 'verified' | 'public_unverified' | 'not_found';
}

export interface ProspectScoreInput {
  targetIndustries: string[];
  targetLocations: string[];
  requiredKeywords?: string[];
  excludedKeywords?: string[];
  companyIndustry?: string;
  companyLocation?: string;
  websiteText?: string;
  contacts?: PublicContact[];
  crmStatus?: CrmSafetyStatus;
}

export interface ProspectScore {
  overallScore: number;
  confidence: number;
  qualification: 'high' | 'medium' | 'low' | 'disqualified';
  reasons: string[];
  disqualifiers: string[];
}

export type CrmSafetyStatus =
  | 'new_prospect'
  | 'previously_contacted'
  | 'active_opportunity'
  | 'existing_customer'
  | 'do_not_contact'
  | 'lost_opportunity'
  | 'partner'
  | 'unknown';

export interface CampaignRules {
  minimumScore: number;
  dailySendLimit: number;
  approvalRequired: boolean;
  firstFollowUpDelayDays: number;
  secondFollowUpDelayDays: number;
  maxFollowUps: number;
}

export interface DiscoveryQuery {
  industry?: string;
  location?: string;
  keywords?: string[];
  maximumResults: number;
  excludeDomains?: string[];
}

export interface ProspectDiscoveryProvider {
  name: string;
  isConfigured(): boolean;
  discover(query: DiscoveryQuery): Promise<ProspectCandidate[]>;
}
