import { fetchPublicBusinessPage } from './safeFetch.js';

function cleanBusinessName(title: string, fallback: string): string {
  const name = (title || '')
    .replace(/\s*[-|–—]\s*Google Maps.*$/i, '')
    .replace(/\s*[-|–—]\s*Google.*$/i, '')
    .trim();
  return name || fallback;
}

function extractNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const value = Number(match[1].replace(/,/g, ''));
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function firstPhone(text: string): string | undefined {
  return text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim();
}

function externalWebsite(links: string[]): string | undefined {
  for (const value of links) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      if (/google\.|gstatic\.|googleusercontent\.|youtube\.|facebook\.|instagram\.|twitter\.|x\.com$/.test(host)) continue;
      if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin;
    } catch {
      // ignore malformed links
    }
  }
  return undefined;
}

export async function researchGoogleBusiness(input: string) {
  const sourceUrl = String(input || '').trim();
  if (!sourceUrl) throw new Error('google_business_url_required');

  const parsed = new URL(/^https?:\/\//i.test(sourceUrl) ? sourceUrl : `https://${sourceUrl}`);
  const host = parsed.hostname.toLowerCase();
  if (!host.includes('google.') && host !== 'maps.app.goo.gl' && host !== 'g.page') {
    throw new Error('unsupported_google_business_url');
  }

  const page = await fetchPublicBusinessPage(parsed.toString());
  const fallbackName = decodeURIComponent(parsed.pathname.split('/place/')[1]?.split('/')[0]?.replace(/\+/g, ' ') || 'Google Business Prospect');
  const text = `${page.title}\n${page.description || ''}\n${page.textSample}`;
  const businessName = cleanBusinessName(page.title, fallbackName);
  const rating = extractNumber(text, [/(?:rated\s*)?(\d(?:\.\d)?)\s*(?:stars?|★)/i, /rating[^0-9]*(\d(?:\.\d)?)/i]);
  const reviewCount = extractNumber(text, [/([\d,]+)\s+(?:google\s+)?reviews?/i, /reviews?[^0-9]*([\d,]+)/i]);
  const phone = firstPhone(page.textSample);
  const website = externalWebsite(page.links);
  const emails = page.emails || [];

  return {
    status: 'success',
    source: 'google_business_public_page',
    google_business_url: page.url,
    business_name: businessName,
    website,
    contact_email: emails[0],
    public_emails: emails,
    phone,
    rating,
    review_count: reviewCount,
    evidence: {
      title: page.title,
      description: page.description,
      fetched_at: page.fetchedAt,
      source_url: page.url
    },
    missing_fields: [
      !website && 'website',
      !emails.length && 'email',
      !phone && 'phone',
      rating === undefined && 'rating',
      reviewCount === undefined && 'review_count'
    ].filter(Boolean)
  };
}
