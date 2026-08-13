export interface NomadSignal {
  sourceUrl: string;
  text: string;
  publishedAt?: string;
}

export interface NomadIntentScore {
  score: number;
  reasons: string[];
}

const HIGH_INTENT = [
  'san vicente', 'palawan', 'port barton', 'el nido', 'philippines',
  'long stay', 'monthly stay', 'one month', 'two months', 'three months',
  'coworking', 'remote work', 'digital nomad', 'starlink', 'workation', 'relocate'
];

const STRONG_ACTION = [
  'looking for', 'recommend', 'where should i stay', 'moving to', 'planning to stay',
  'need accommodation', 'need wifi', 'monthly rental', 'long-term rental'
];

export function scoreNomadIntent(signals: NomadSignal[]): NomadIntentScore {
  const text = signals.map(s => s.text.toLowerCase()).join(' ');
  const reasons: string[] = [];
  let score = 0;

  const matchedIntent = HIGH_INTENT.filter(term => text.includes(term));
  const matchedAction = STRONG_ACTION.filter(term => text.includes(term));

  score += Math.min(55, matchedIntent.length * 8);
  score += Math.min(35, matchedAction.length * 14);

  if (matchedIntent.some(t => ['san vicente', 'palawan', 'port barton'].includes(t))) {
    score += 10;
    reasons.push('Palawan/San Vicente destination intent detected');
  }
  if (matchedAction.length) reasons.push(`Action intent: ${matchedAction.slice(0, 3).join(', ')}`);
  if (matchedIntent.length) reasons.push(`Remote-work/travel signals: ${matchedIntent.slice(0, 5).join(', ')}`);

  return { score: Math.min(100, score), reasons };
}
