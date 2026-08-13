export type ResearchStatus = 'pending' | 'running' | 'success' | 'blocked' | 'timeout' | 'invalid_domain' | 'fetch_failed';

export interface ResearchTarget {
  id: string;
  companyName: string;
  url: string;
  intervalMinutes: number;
  enabled: boolean;
  nextRunAt: string;
  lastRunAt?: string;
  lastStatus?: ResearchStatus;
  lastError?: string;
  lastSnapshot?: WebsiteSnapshot;
}

export interface WebsiteSnapshot {
  url: string;
  fetchedAt: string;
  statusCode: number;
  title: string;
  description: string;
  headings: string[];
  emails: string[];
  phones: string[];
  socialLinks: string[];
  links: string[];
  textSample: string;
  contentHash: string;
  changedSincePrevious: boolean;
}

export type EmailApprovalStatus = 'pending' | 'approved' | 'rejected' | 'sent' | 'failed';

export interface EmailJob {
  id: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  status: EmailApprovalStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  sentAt?: string;
  providerMessageId?: string;
  error?: string;
}

export interface WorkerState {
  version: 1;
  researchTargets: ResearchTarget[];
  emailJobs: EmailJob[];
  lastTickAt?: string;
}

export interface EmailProviderResult {
  id: string;
}

export interface EmailProvider {
  name: string;
  isConfigured(): boolean;
  send(job: EmailJob): Promise<EmailProviderResult>;
}
