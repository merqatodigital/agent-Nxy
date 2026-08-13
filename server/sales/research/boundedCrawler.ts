import { fetchPublicBusinessPage } from './safeFetch.js';
import { DEFAULT_RESEARCH_PATHS, type ResearchRequest, type ResearchResult } from './provider.js';

const DEFAULT_MAX_PAGES = Math.max(1, Math.min(20, Number(process.env.NYX_CRAWL_MAX_PAGES || 8)));
const DEFAULT_DELAY_MS = Math.max(250, Number(process.env.NYX_CRAWL_DELAY_MS || 1200));

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeUrl(value: string): string {
  const url = new URL(value);
  url.hash = '';
  return url.toString();
}

function sameHost(root: URL, value: string): boolean {
  try {
    const candidate = new URL(value, root);
    return candidate.hostname.toLowerCase() === root.hostname.toLowerCase();
  } catch {
    return false;
  }
}

function priority(url: string): number {
  const path = new URL(url).pathname.toLowerCase();
  const order = ['/contact', '/about', '/about-us', '/team', '/leadership', '/rooms', '/services', '/tours', '/blog', '/news'];
  const index = order.findIndex(prefix => path.startsWith(prefix));
  return index === -1 ? 100 : index;
}

export async function crawlPublicBusinessSite(request: ResearchRequest): Promise<ResearchResult> {
  const root = new URL(/^https?:\/\//i.test(request.url) ? request.url : `https://${request.url}`);
  const maxPages = Math.max(1, Math.min(20, Number(request.maxPages || DEFAULT_MAX_PAGES)));
  const preferredPaths = request.preferredPaths?.length ? request.preferredPaths : DEFAULT_RESEARCH_PATHS;
  const queued = new Set<string>();
  const visited = new Set<string>();
  const queue: string[] = [];
  const pages: ResearchResult['pages'] = [];
  const errors: ResearchResult['errors'] = [];

  const enqueue = (value: string) => {
    try {
      const absolute = normalizeUrl(new URL(value, root).toString());
      if (!sameHost(root, absolute) || queued.has(absolute) || visited.has(absolute)) return;
      queued.add(absolute);
      queue.push(absolute);
      queue.sort((a, b) => priority(a) - priority(b));
    } catch {
      // Ignore malformed links discovered in page markup.
    }
  };

  enqueue(root.toString());
  for (const path of preferredPaths) enqueue(new URL(path, root).toString());

  while (queue.length && pages.length < maxPages) {
    const url = queue.shift()!;
    queued.delete(url);
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const page = await fetchPublicBusinessPage(url);
      pages.push({
        url: page.url,
        statusCode: page.statusCode,
        title: page.title,
        description: page.description,
        text: page.textSample,
        html: page.html,
        links: page.links,
        fetchedAt: page.fetchedAt
      });

      for (const link of page.links) {
        if (sameHost(root, link) && priority(link) < 100) enqueue(link);
      }
    } catch (error: any) {
      errors.push({ url, error: String(error?.message || 'crawl_failed') });
    }

    if (queue.length && pages.length < maxPages) await sleep(DEFAULT_DELAY_MS);
  }

  return {
    provider: 'nyx-bounded-node-crawler',
    rootUrl: root.toString(),
    pages,
    errors
  };
}
