export interface ResearchPage {
  url: string;
  statusCode: number;
  title: string;
  description?: string;
  text: string;
  html?: string;
  links: string[];
  fetchedAt: string;
}

export interface ResearchResult {
  provider: string;
  rootUrl: string;
  pages: ResearchPage[];
  errors: { url: string; error: string }[];
}

export interface ResearchRequest {
  url: string;
  maxPages?: number;
  maxDepth?: number;
  preferredPaths?: string[];
}

export interface ResearchProvider {
  name: string;
  isConfigured(): boolean;
  research(request: ResearchRequest): Promise<ResearchResult>;
}

export const DEFAULT_RESEARCH_PATHS = [
  '/', '/about', '/about-us', '/services', '/products', '/solutions', '/team',
  '/leadership', '/contact', '/rooms', '/tours', '/blog', '/news'
];
