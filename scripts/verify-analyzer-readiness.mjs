// scripts/verify-analyzer-readiness.mjs — mirrors the DeGenito.Ai 18-scanner checks
// against dist/ + dist/_headers + live curl of the deployed URL.
import { readFileSync, existsSync } from 'node:fs';

const liveUrl = process.argv[2]?.replace(/\/$/, '');
if (!liveUrl) { console.error('Usage: node verify-analyzer-readiness.mjs <live-url>'); process.exit(2); }

const home = existsSync('dist/index.html') ? readFileSync('dist/index.html', 'utf8') : '';
const headers = existsSync('dist/_headers') ? readFileSync('dist/_headers', 'utf8') : '';
if (!home || !headers) { console.error('Build dist/ first.'); process.exit(2); }

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

// ─── HEAD / META ────────────────────────────────────────────────────────────
check('robots meta present',       /<meta[^>]+name=["']robots["']/i.test(home));
check('canonical present',         /<link[^>]+rel=["']canonical["']/i.test(home));
check('og:image present',          /<meta[^>]+property=["']og:image["']/i.test(home));
check('twitter:card present',      /<meta[^>]+name=["']twitter:card["']/i.test(home));
const desc = home.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] || '';
check('meta description 140-160',  desc.length >= 140 && desc.length <= 160, `got ${desc.length}`);

// ─── Favicons (4 rel types) ────────────────────────────────────────────────
const favRels = [
  /<link[^>]+rel=["']icon["'][^>]+type=["']image\/svg/i,
  /<link[^>]+rel=["']icon["'][^>]+type=["']image\/png/i,
  /<link[^>]+rel=["']shortcut icon["']/i,
  /<link[^>]+rel=["']apple-touch-icon["']/i,
];
const favLabels = ['svg favicon', 'png favicon', 'shortcut icon (.ico)', 'apple-touch-icon'];
favRels.forEach((re, i) => check(`favicon rel ${favLabels[i]}`, re.test(home)));

// ─── Schema (≥4 distinct @type on home) ────────────────────────────────────
const schemaBlocks = [...home.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m => { try { return JSON.parse(m[1]); } catch { return null; } })
  .filter(Boolean);
const typesFound = new Set();
for (const b of schemaBlocks) {
  const nodes = Array.isArray(b) ? b : [b];
  for (const n of nodes) if (n?.['@type']) typesFound.add(Array.isArray(n['@type']) ? n['@type'][0] : n['@type']);
}
check('home JSON-LD ≥4 types', typesFound.size >= 4, [...typesFound].join(','));
for (const required of ['LocalBusiness', 'Organization', 'Person', 'WebSite', 'BreadcrumbList']) {
  const hit = [...typesFound].some(t => t === required || (required === 'LocalBusiness' && /Business|Service|Organization/.test(t)));
  check(`schema ${required} present`, hit);
}
const lbFlat = JSON.stringify(schemaBlocks);
for (const field of ['telephone', 'address', 'openingHoursSpecification']) {
  check(`LocalBusiness has ${field}`, lbFlat.includes('"' + field + '"'));
}

// ─── Content volume + structure (home) ─────────────────────────────────────
const text = home.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
const wc = text.split(/\s+/).filter(w => /[a-z]/i.test(w)).length;
check('home word count ≥800', wc >= 800, `got ${wc}`);
const qHead = (home.match(/<h[23][^>]*>\s*[^<]*?(?:\?|\b(?:how|what|why|when|where|which|can|do|is|are|should|will|does)\b)[^<]*<\/h[23]>/gi) || []).length;
check('question headings ≥3', qHead >= 3, `got ${qHead}`);
const uls = (home.match(/<ul\b/gi) || []).length;
const ols = (home.match(/<ol\b/gi) || []).length;
check('lists ≥3 on home', uls + ols >= 3, `${uls} ul + ${ols} ol`);
const tables = (home.match(/<table\b/gi) || []).length;
check('table ≥1 on home', tables >= 1, `got ${tables}`);
const facts = (text.match(/\b(?:\d+[+%]?|\$\d+|\d+[-\s]?(?:year|day|hour|month|week|minute)s?|since\s+(?:19|20)\d\d)\b/gi) || []).length;
check('fact density ≥5/1000w', wc > 0 && (facts * 1000 / wc) >= 5, `${facts} facts, ${(facts*1000/wc).toFixed(1)}/1k`);

// ─── _headers (security) ───────────────────────────────────────────────────
for (const h of [
  'X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection', 'Referrer-Policy',
  'Permissions-Policy', 'Strict-Transport-Security',
  'Cross-Origin-Opener-Policy', 'Cross-Origin-Embedder-Policy', 'Cross-Origin-Resource-Policy',
  'Content-Security-Policy',
]) check(`header ${h} present`, new RegExp(`^\\s*${h}:`, 'mi').test(headers));
check('no wildcard CORS', !/Access-Control-Allow-Origin:\s*\*/i.test(headers));
check('CSP has report-uri/to', /Content-Security-Policy:[^\n]*(report-uri|report-to)/i.test(headers));
check('CSP no unsafe-eval', !/script-src[^\n]*'unsafe-eval'/i.test(headers));

// ─── Cookie consent banner ─────────────────────────────────────────────────
check('cookie banner present', /id=["']cookie-consent["']/.test(home) || /class=["'][^"']*cookie-consent-banner/.test(home));

// ─── Email exposure (≤1 site-wide) ─────────────────────────────────────────
const distFiles = ['index.html', 'about/index.html', 'contact/index.html', 'services/index.html', 'pricing/index.html', 'faq/index.html', 'privacy/index.html', 'terms/index.html'];
const allMailtos = new Set();
for (const f of distFiles) {
  if (!existsSync('dist/' + f)) continue;
  const h = readFileSync('dist/' + f, 'utf8');
  for (const m of h.matchAll(/mailto:([^"'<?&\s]+)/gi)) allMailtos.add(m[1].toLowerCase());
}
check('≤1 unique mailto site-wide', allMailtos.size <= 1, allMailtos.size + ' (' + [...allMailtos].join(',') + ')');

// ─── Live checks ───────────────────────────────────────────────────────────
const fetchText = async (url) => {
  try { const r = await fetch(url); return { status: r.status, body: await r.text() }; }
  catch (e) { return { status: 0, body: '', error: e.message }; }
};
const llms = await fetchText(liveUrl + '/llms.txt');
const llmsFull = await fetchText(liveUrl + '/llms-full.txt');
check('/llms.txt live', llms.status === 200 && llms.body.length >= 100, `status ${llms.status}, ${llms.body.length}c`);
check('/llms-full.txt live', llmsFull.status === 200 && llmsFull.body.length >= 2000, `status ${llmsFull.status}, ${llmsFull.body.length}c`);
const robots = await fetchText(liveUrl + '/robots.txt');
for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot']) {
  check(`robots.txt allows ${bot}`, robots.body.includes(bot) && !new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/`, 'i').test(robots.body));
}
const secTxt = await fetchText(liveUrl + '/.well-known/security.txt');
check('security.txt live', secTxt.status === 200 && secTxt.body.includes('Contact:'));

// Live security headers
const headRes = await fetch(liveUrl + '/').catch(() => null);
if (headRes) {
  const liveHeaders = headRes.headers;
  check('live HSTS header', !!liveHeaders.get('strict-transport-security'));
  check('live X-Frame-Options', liveHeaders.get('x-frame-options') === 'DENY');
  check('live CSP header', !!liveHeaders.get('content-security-policy'));
  check('live HTTPS only', headRes.url.startsWith('https://'));
}

// ─── Report ───────────────────────────────────────────────────────────────
const fails = results.filter(r => !r.ok);
console.log('═══ ANALYZER-READINESS SCAN ═══\n');
for (const r of results) {
  const status = r.ok ? '\x1b[32m✓\x1b[0m PASS' : '\x1b[31m✗\x1b[0m FAIL';
  console.log(`${status}  ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
}
console.log(`\n${results.length - fails.length}/${results.length} checks passed`);
process.exit(fails.length ? 1 : 0);
