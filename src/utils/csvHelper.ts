import { ProspectLead } from '../types';
import { parseGoogleBusinessUrl } from './googleBusiness';

export const CSV_TEMPLATE_HEADERS = [
  'Company Name',
  'Website',
  'Google Business URL',
  'Contact Name',
  'Contact Email',
  'Industry',
  'Location',
  'Notes'
];

export const SAMPLE_TEMPLATE_ROWS = [
  [
    'Apex Logistics Group',
    'apexlogistics.com',
    'https://www.google.com/maps/place/Apex+Logistics+Group',
    'David Miller',
    'david@apexlogistics.com',
    'Logistics & Freight',
    'Chicago, IL',
    'High value freight client prospect'
  ],
  [
    'Sinnott Legal PC',
    'sinnottlegal.com',
    'https://www.google.com/maps/place/Sinnott+Legal',
    'Patricia Sinnott',
    'patricia@sinnottlegal.com',
    'Legal Services',
    'New York, NY',
    'Corporate litigation firm'
  ]
];

/**
 * Trigger download of formatted CSV template file
 */
export function downloadProspectCsvTemplate() {
  const csvRows = [
    CSV_TEMPLATE_HEADERS.join(','),
    ...SAMPLE_TEMPLATE_ROWS.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'merqato_target_prospects_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV text into array of Partial<ProspectLead>
 */
export function parseProspectsFromCsv(csvText: string): Partial<ProspectLead>[] {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Helper to split CSV line respecting quotes
  const parseLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase());

  const getCol = (row: string[], keywords: string[]): string => {
    const idx = headers.findIndex(h => keywords.some(k => h.includes(k)));
    if (idx !== -1 && row[idx]) {
      return row[idx].trim();
    }
    return '';
  };

  const results: Partial<ProspectLead>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (!row || row.length === 0) continue;

    const companyName = getCol(row, ['company', 'business', 'organization', 'name']) || `Prospect ${i}`;
    const website = getCol(row, ['website', 'domain', 'url']) || `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const gmbUrl = getCol(row, ['google', 'gmb', 'maps', 'profile']);
    const contactName = getCol(row, ['contact name', 'person', 'contact', 'owner']) || 'Business Owner';
    const contactEmail = getCol(row, ['email', 'mail']) || `contact@${website.replace(/^https?:\/\//i, '').replace(/^www\./i, '')}`;
    const industry = getCol(row, ['industry', 'category', 'vertical']) || 'B2B Professional Services';
    const location = getCol(row, ['location', 'address', 'city', 'state']) || 'United States';
    const notes = getCol(row, ['notes', 'description', 'comments']) || 'Bulk imported contact record';

    let gmbData = undefined;
    if (gmbUrl) {
      const parsed = parseGoogleBusinessUrl(gmbUrl);
      gmbData = {
        placeName: parsed.placeName,
        rating: parsed.rating,
        reviewCount: parsed.reviewCount,
        phone: parsed.phone,
        address: parsed.location,
        googleCategory: parsed.googleCategory,
        businessHours: parsed.businessHours,
        googleBusinessUrl: parsed.googleBusinessUrl,
        googleMapsUrl: parsed.googleMapsUrl
      };
    }

    results.push({
      companyName,
      website: website.replace(/^https?:\/\//i, ''),
      contactName,
      contactRole: 'Decision Maker',
      contactEmail,
      industry,
      employeeCount: '10-50',
      location,
      notes,
      status: 'New',
      googleBusinessUrl: gmbUrl || undefined,
      googleBusinessData: gmbData
    });
  }

  return results;
}
