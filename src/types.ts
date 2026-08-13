/**
 * Types for Autonomous B2B SDR Agent Application
 */

export type ToolType = 'CRM_LOOKUP' | 'WEB_SCRAPE' | 'DRAFT_EMAIL';

export interface AgentThoughtAction {
  thought: string;
  tool: ToolType;
  arguments: Record<string, any>;
}

export interface AgentFinalOutput {
  status: 'completed' | 'failed';
  company_processed: string;
  hook_used: string;
  generated_draft: string;
}

export interface AgentStepResponse {
  thought: string;
  tool?: ToolType;
  arguments?: Record<string, any>;
  final_output?: AgentFinalOutput;
}

export interface ExecutionStep {
  id: string;
  stepNumber: number;
  timestamp: string;
  thought: string;
  tool?: ToolType;
  arguments?: Record<string, any>;
  observation?: any;
  isFinal?: boolean;
  finalOutput?: AgentFinalOutput;
  rawResponseJson?: string;
}

export type LeadStatus = 'New' | 'Enriching' | 'Enriched' | 'Draft Ready' | 'Sent' | 'Replied' | 'Converted';

export interface ProspectLead {
  id: string;
  companyName: string;
  website: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  industry: string;
  employeeCount?: string;
  location?: string;
  status: LeadStatus;
  createdAt: string;
  notes?: string;
  scrapedData?: ScrapedWebsiteData;
  crmHistory?: CRMRecord;
  draftedEmail?: OutboundDraft;
}

export interface CRMRecord {
  id: string;
  companyName: string;
  domain: string;
  lifecycleStage: 'Lead' | 'Prospect' | 'Opportunity' | 'Customer' | 'Churned';
  pastDeals: {
    id: string;
    title: string;
    amount: number;
    status: 'Won' | 'Lost' | 'In Progress';
    date: string;
  }[];
  totalSpend: number;
  lastContactDate?: string;
  sentiment: 'Positive' | 'Neutral' | 'Hesitant' | 'Negative' | 'New Account';
  keyNotes: string;
  accountOwner: string;
}

export interface ScrapedWebsiteData {
  url: string;
  title: string;
  description: string;
  coreBusinessVectors: string[];
  techStack: string[];
  valueProps: string[];
  recentHighlights: string[];
  targetAudience: string;
  detectedPainPoints: string[];
}

export interface OutboundDraft {
  id: string;
  prospectId: string;
  companyName: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  hookUsed: string;
  createdAt: string;
  status: 'Draft' | 'Approved' | 'Sent';
  tone: 'Value-First' | 'Direct Problem Solving' | 'Casual Founder-to-Founder' | 'Soft Inquiry';
}

export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  isFree?: boolean;
  description: string;
  recommendedFor: string;
}

export interface ICPConfig {
  companyBio: string;
  targetIndustry: string;
  valueProposition: string;
  offeringDescription: string;
  primaryPainPoints: string[];
  callToAction: string;
  senderName: string;
  senderRole: string;
  senderCompany: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'nyx';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; action: string }[];
}
