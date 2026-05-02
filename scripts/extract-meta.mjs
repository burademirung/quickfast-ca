// scripts/extract-meta.mjs — extract JSON-LD, brand voice, testimonials, tracking
// from raw HTML. Outputs:
//   _migrate/extracted/schema/old-site-jsonld.json
//   _migrate/extracted/brand-voice.md
//   _migrate/extracted/testimonials.jsonl
//   _migrate/extracted/tracking-social-trust.json
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';

mkdirSync('_migrate/extracted/schema', { recursive: true });
const files = readdirSync('_migrate/extracted/raw').filter(f => f.endsWith('.html'));

// ---- 0.2b — JSON-LD extraction ----
const jsonld = { LocalBusiness: [], Organization: [], Person: [], Service: [], FAQPage: [], Product: [], Review: [], BreadcrumbList: [], WebSite: [] };
for (const f of files) {
  const html = readFileSync('_migrate/extracted/raw/' + f, 'utf8');
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const d = JSON.parse(m[1].trim());
      const nodes = Array.isArray(d) ? d : (d['@graph'] ? d['@graph'] : [d]);
      for (const n of nodes) {
        if (!n || typeof n !== 'object') continue;
        const t = Array.isArray(n['@type']) ? n['@type'][0] : n['@type'];
        if (t && t in jsonld) jsonld[t].push(n);
      }
    } catch {}
  }
}
writeFileSync('_migrate/extracted/schema/old-site-jsonld.json', JSON.stringify(jsonld, null, 2));
const ldSummary = Object.entries(jsonld).filter(([, v]) => v.length).map(([k, v]) => `${k}=${v.length}`).join(' ');

// ---- 0.2c — Brand voice ----
const allText = files.map(f => {
  const html = readFileSync('_migrate/extracted/raw/' + f, 'utf8');
  return html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ');
}).join('\n');

// Top capitalized 3-5 word phrases that appear ≥3 times
const phraseRe = /\b[A-Z][a-z]+(?:\s+[a-z]+){2,4}\b/g;
const phraseFreq = new Map();
for (const m of allText.matchAll(phraseRe)) phraseFreq.set(m[0], (phraseFreq.get(m[0]) || 0) + 1);
const topPhrases = [...phraseFreq.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([p]) => p);

const youCount = (allText.match(/\byou\b/gi) || []).length;
const weCount = (allText.match(/\bwe\b/gi) || []).length;
const homeowner = (allText.match(/\bhomeowner/gi) || []).length;
const client = (allText.match(/\bclient/gi) || []).length;
const customer = (allText.match(/\bcustomer/gi) || []).length;
const sents = allText.split(/[.!?]+/);
const avgLen = sents.reduce((a, s) => a + s.split(/\s+/).filter(Boolean).length, 0) / Math.max(1, sents.length);
const customerNoun = ['homeowners', 'clients', 'customers'][[homeowner, client, customer].indexOf(Math.max(homeowner, client, customer))];

const brandVoice = [
  '# Brand Voice — extracted from https://www.quickfast.ca',
  '',
  '## Preserve these phrases verbatim in new copy',
  ...topPhrases.map(p => `- "${p}"`),
  '',
  '## Tone markers',
  `- Customer noun preference: **${customerNoun}** (homeowners ${homeowner}, clients ${client}, customers ${customer})`,
  `- "You" usage: ${youCount}× | "We" usage: ${weCount}× — ratio ${(youCount / Math.max(1, weCount)).toFixed(1)}:1`,
  `- Average sentence length: ${avgLen.toFixed(0)} words (${avgLen < 15 ? 'casual' : avgLen > 22 ? 'formal' : 'conversational'})`,
  '',
  '## How to apply',
  '- When enhancing thin pages, use the phrases above where they fit naturally.',
  `- Match the customer noun: when addressing the audience, prefer "${customerNoun}".`,
  `- Match average sentence length within ±20% (target ${Math.round(avgLen * 0.8)}-${Math.round(avgLen * 1.2)} words).`,
  '- Permitted content sources for fillers: (a) other extracted pages, (b) KV schema fields, (c) this brand-voice.md.',
  '- Fabricating facts is forbidden.',
].join('\n');
writeFileSync('_migrate/extracted/brand-voice.md', brandVoice);

// ---- 0.6 — Testimonials ----
const testimonials = [];
const seen = new Set();
for (const f of files) {
  const html = readFileSync('_migrate/extracted/raw/' + f, 'utf8');
  const sourceUrl = 'https://www.quickfast.ca/' + f.replace(/\.html$/, '').replace(/^home$/, '');

  // JSON-LD Review nodes already captured above; pull text into testimonials format
  for (const r of jsonld.Review) {
    if (!r.reviewBody) continue;
    const author = typeof r.author === 'object' ? r.author.name : r.author || '';
    const rating = typeof r.reviewRating === 'object' ? r.reviewRating.ratingValue : r.reviewRating || '';
    const key = String(r.reviewBody).slice(0, 80).toLowerCase();
    if (seen.has(key)) continue; seen.add(key);
    testimonials.push({ text: r.reviewBody, author: String(author).slice(0, 80), rating: String(rating), date: r.datePublished || '', source: sourceUrl });
  }

  // Heuristic: blockquote with adjacent attribution
  for (const m of html.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>([\s\S]{0,300})/gi)) {
    const text = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text.length < 40 || text.length > 600) continue;
    const tail = m[2];
    const cite = tail.match(/<cite[^>]*>([\s\S]*?)<\/cite>/i) || tail.match(/class="[^"]*(?:author|cite|name)[^"]*"[^>]*>([^<]+)/i);
    const key = text.slice(0, 80).toLowerCase();
    if (seen.has(key)) continue; seen.add(key);
    testimonials.push({ text, author: cite ? cite[1].replace(/<[^>]+>/g, '').trim().slice(0, 80) : '', rating: '', date: '', source: sourceUrl });
  }
}
writeFileSync('_migrate/extracted/testimonials.jsonl', testimonials.map(t => JSON.stringify(t)).join('\n'));

// ---- 0.2d — Tracking + social + trust ----
const tracking = [];
const social = new Set();
const trust = new Set();
const allHtml = files.map(f => readFileSync('_migrate/extracted/raw/' + f, 'utf8')).join('\n');
for (const [pat, name] of [
  [/https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-[A-Z0-9]+/g, 'GTM'],
  [/G-[A-Z0-9]{8,}/g, 'GA4'],
  [/static\.hotjar\.com/g, 'Hotjar'],
  [/cdn\.segment\.com/g, 'Segment'],
  [/js\.hs-scripts\.com/g, 'HubSpot'],
]) {
  for (const m of allHtml.matchAll(pat)) tracking.push({ type: name, id: m[0].slice(0, 80) });
}
for (const m of allHtml.matchAll(/href="(https?:\/\/(?:www\.)?(?:facebook|instagram|x|twitter|linkedin|youtube|yelp|tiktok|pinterest|threads)\.com\/[^"]+)"/gi)) {
  social.add(m[1]);
}
for (const pat of [/License #?\s*[A-Z0-9-]{5,}/gi, /BBB\s+A\+?\s+Rated/gi, /Accredited/gi, /Certified\s+[A-Z][a-z]+/g, /\bInsured\b/gi, /\bBonded\b/gi, /TSSA/gi, /ESA/gi, /WSIB/gi]) {
  for (const m of allHtml.matchAll(pat)) trust.add(m[0]);
}
const tst = { tracking: [...new Set(tracking.map(t => JSON.stringify(t)))].map(s => JSON.parse(s)), social: [...social], trust: [...trust] };
writeFileSync('_migrate/extracted/tracking-social-trust.json', JSON.stringify(tst, null, 2));

console.log(`JSON-LD: ${ldSummary || '(none)'}`);
console.log(`Brand phrases: ${topPhrases.length}`);
console.log(`Testimonials: ${testimonials.length}`);
console.log(`Tracking: ${tst.tracking.length}, Social: ${tst.social.length}, Trust: ${tst.trust.length}`);
