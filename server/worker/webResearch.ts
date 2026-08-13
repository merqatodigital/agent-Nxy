import dns from 'node:dns/promises';
import net from 'node:net';
import crypto from 'node:crypto';
import type { WebsiteSnapshot } from './types.js';

const MAX_BYTES = Number(process.env.NYX_SCRAPE_MAX_BYTES || 1_500_000);
const TIMEOUT_MS = Number(process.env.NYX_SCRAPE_TIMEOUT_MS || 12_000);
const USER_AGENT = process.env.NYX_SCRAPE_USER_AGENT || 'NyxSDRResearchBot/1.0';

function privateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb');
  }
  return true;
}

async function safeUrl(input: string): Promise<URL> {
  const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid_domain');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) throw new Error('invalid_domain');
  const records = await dns.lookup(host, { all: true });
  if (!records.length || records.some(r => privateIp(r.address))) throw new Error('invalid_domain');
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

function matches(html: string, regex: RegExp, limit = 20): string[] {
  const out: string[] = [];
  for (const match of html.matchAll(regex)) {
    const value = cleanText(match[1] || match[0]);
    if (value && !out.includes(value)) out.push(value);
    if (out.length >= limit) break;
  }
  return out;
}

export async function researchWebsite(input: string, previousHash?: string): Promise<WebsiteSnapshot> {
  let current = await safeUrl(input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let response: Response | undefined;
    for (let redirects = 0; redirects <= 4; redirects++) {
      response = await fetch(current, { redirect: 'manual', signal: controller.signal, headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' } });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get('location');
      if (!location) break;
      current = await safeUrl(new URL(location, current).toString());
    }
    if (!response) throw new Error('fetch_failed');
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) throw new Error('fetch_failed');
    if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? 'blocked' : 'fetch_failed');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('fetch_failed');
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        bytes += value.byteLength;
        if (bytes > MAX_BYTES) throw new Error('fetch_failed');
        chunks.push(value);
      }
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks.map(c => Buffer.from(c))));
    const title = matches(html, /<title[^>]*>([\s\S]*?)<\/title>/gi, 1)[0] || '';
    const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || '';
    const headings = matches(html, /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi, 20);
    const emails = Array.from(new Set((html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map(v => v.toLowerCase()))).slice(0, 20);
    const phones = Array.from(new Set((cleanText(html).match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []).map(v => v.trim()))).slice(0, 20);
    const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map(m => m[1]);
    const links = Array.from(new Set(hrefs.map(h => { try { return new URL(h, current).toString(); } catch { return ''; } }).filter(Boolean))).slice(0, 100);
    const socialLinks = links.filter(l => /linkedin\.com|facebook\.com|instagram\.com|x\.com|twitter\.com/i.test(l)).slice(0, 20);
    const textSample = cleanText(html).slice(0, 12000);
    const contentHash = crypto.createHash('sha256').update(`${title}\n${description}\n${headings.join('\n')}\n${textSample}`).digest('hex');
    return { url: current.toString(), fetchedAt: new Date().toISOString(), statusCode: response.status, title: cleanText(title), description: cleanText(description), headings, emails, phones, socialLinks, links, textSample, contentHash, changedSincePrevious: Boolean(previousHash && previousHash !== contentHash) };
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error('timeout');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
