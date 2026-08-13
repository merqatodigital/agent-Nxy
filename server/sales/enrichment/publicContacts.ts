import type { PublicContact } from '../types.js';

const ROLE_HINTS = [
  'owner', 'founder', 'manager', 'general manager', 'sales', 'marketing', 'operations',
  'reservations', 'front office', 'director', 'partnerships', 'business development'
];

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function extractPublicContacts(input: {
  html?: string;
  text?: string;
  sourceUrl: string;
}): PublicContact[] {
  const html = input.html || '';
  const text = input.text || html.replace(/<[^>]+>/g, ' ');
  const emails = unique((`${html}\n${text}`.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])
    .map(email => email.toLowerCase())
    .filter(email => !/example\.(com|org|net)$/.test(email)));
  const phones = unique((text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []).map(v => v.trim()));
  const contacts: PublicContact[] = [];

  for (const email of emails.slice(0, 20)) {
    const local = email.split('@')[0].replace(/[._-]+/g, ' ');
    const role = ROLE_HINTS.find(hint => local.includes(hint.replace(/\s+/g, ' ')));
    contacts.push({
      email,
      role,
      sourceUrl: input.sourceUrl,
      confidence: role ? 80 : 65,
      verification: 'public_unverified'
    });
  }

  for (const phone of phones.slice(0, 10)) {
    contacts.push({
      phone,
      sourceUrl: input.sourceUrl,
      confidence: 55,
      verification: 'public_unverified'
    });
  }

  if (!contacts.length) {
    contacts.push({ sourceUrl: input.sourceUrl, confidence: 0, verification: 'not_found' });
  }

  return contacts;
}

export function rankContacts(contacts: PublicContact[]): PublicContact[] {
  return [...contacts].sort((a, b) => b.confidence - a.confidence);
}
