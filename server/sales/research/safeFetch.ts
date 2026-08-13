import dns from 'node:dns/promises';
import net from 'node:net';

const DEFAULT_TIMEOUT_MS = Number(process.env.NYX_SCRAPE_TIMEOUT_MS || 12000);
const DEFAULT_MAX_BYTES = Number(process.env.NYX_SCRAPE_MAX_BYTES || 1500000);
const USER_AGENT = process.env.NYX_SCRAPE_USER_AGENT || 'NyxResearchBot/1.0 (+public-business-research)';

function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') ||
      v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb');
  }
  return true;
}

async function validatePublicUrl(input: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    throw new Error('invalid_url');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid_url');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) throw new Error('blocked_private_target');
  const records = await dns.lookup(host, { all: true });
  if (!records.length || records.some(r => isPrivateAddress(r.address))) throw new Error('blocked_private_target');
  return url;
}

function cleanText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function firstMatch(html: string, regex: RegExp): string {
  const value = html.match(regex)?.[1] || '';
  return cleanText(value);
}

export async function fetchPublicBusinessPage(input: string) {
  let current = await validatePublicUrl(input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    let response: Response | undefined;
    for (let redirectCount = 0; redirectCount <= 4; redirectCount++) {
      response = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': USER_AGENT,
          accept: 'text/html,application/xhtml+xml'
        }
      });

      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get('location');
      if (!location) break;
      current = await validatePublicUrl(new URL(location, current).toString());
    }

    if (!response) throw new Error('fetch_failed');
    if (response.status === 403 || response.status === 429) throw new Error('blocked');
    if (!response.ok) throw new Error(`http_${response.status}`);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new Error('unsupported_content_type');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('empty_body');

    const chunks: Buffer[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > DEFAULT_MAX_BYTES) throw new Error('response_too_large');
      chunks.push(Buffer.from(value));
    }

    const html = Buffer.concat(chunks).toString('utf8');
    const text = cleanText(html).slice(0, 16000);
    const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    const headings = Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi))
      .map(m => cleanText(m[1]))
      .filter(Boolean)
      .slice(0, 25);
    const emails = Array.from(new Set((html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])
      .map(v => v.toLowerCase())))
      .slice(0, 20);
    const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map(m => m[1]);
    const links = Array.from(new Set(hrefs.map(h => {
      try { return new URL(h, current).toString(); } catch { return ''; }
    }).filter(Boolean))).slice(0, 150);

    return {
      url: current.toString(),
      status: 'success',
      fetchedAt: new Date().toISOString(),
      statusCode: response.status,
      title,
      description,
      headings,
      emails,
      links,
      socialLinks: links.filter(l => /linkedin\.com|facebook\.com|instagram\.com|x\.com|twitter\.com/i.test(l)).slice(0, 20),
      textSample: text,
      html
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error('timeout');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
