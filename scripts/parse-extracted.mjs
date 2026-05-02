// scripts/parse-extracted.mjs — convert extracted/raw/*.html → extracted/*.md
// using pandoc for body conversion. Strips Wix nav/footer chrome aggressively.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';

mkdirSync('_migrate/extracted', { recursive: true });
const files = readdirSync('_migrate/extracted/raw').filter(f => f.endsWith('.html'));

function strip(html) {
  // Remove nav, header, footer, scripts, styles, noscript, iframes, svgs
  let h = html;
  h = h.replace(/<(nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  h = h.replace(/<(script|style|noscript|iframe|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  // Wix-specific chrome IDs/classes
  h = h.replace(/<div[^>]+id=["'](SITE_HEADER|SITE_FOOTER|FOOTER|HEADER|MENU|menu)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
  // Remove Wix's banner/breadcrumb wrappers
  h = h.replace(/<(div|section)[^>]+(class|id)=["'][^"']*(breadcrumb|cookie|lightbox|menu|nav|popup|widget-app)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, '');
  // Strip data-* attributes (Wix has hundreds)
  h = h.replace(/\sdata-[\w-]+="[^"]*"/g, '');
  return h;
}

function plainText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pandocToMd(html) {
  try {
    const r = spawnSync('pandoc', [
      '--from', 'html-native_divs-native_spans',
      '--to', 'gfm-raw_html',
      '--wrap=none',
    ], { input: html, encoding: 'utf8', timeout: 30000 });
    return r.stdout?.trim() || '';
  } catch { return ''; }
}

let ok = 0, hub = 0, thin = 0;
for (const f of files) {
  const slug = f.replace(/\.html$/, '');
  const html = readFileSync('_migrate/extracted/raw/' + f, 'utf8');

  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descM = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i);
  const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)/i);

  const stripped = strip(html);
  const text = plainText(stripped);
  const wc = text.split(/\s+/).filter(Boolean).length;

  // Anchor density
  const anchorTextLen = [...stripped.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => plainText(m[1]).length).reduce((a, b) => a + b, 0);
  const isHub = text.length > 0 && (anchorTextLen / Math.max(1, text.length)) > 0.5 && text.length < 1200;

  // Child URLs (same host)
  const host = 'www.quickfast.ca';
  const children = new Set();
  for (const m of stripped.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    let u = m[1];
    try {
      const abs = u.startsWith('http') ? u : (u.startsWith('/') ? `https://${host}${u}` : null);
      if (!abs) continue;
      const parsed = new URL(abs);
      if (parsed.host !== host) continue;
      children.add(parsed.origin + parsed.pathname.split('#')[0].split('?')[0]);
    } catch {}
  }

  let body = pandocToMd(stripped);
  if (!body || body.length < 200) body = text;

  const md = [
    'TITLE: ' + (titleM ? plainText(titleM[1]) : 'MISSING'),
    'DESC: ' + (descM ? descM[1] : 'MISSING'),
    'H1: ' + (h1M ? plainText(h1M[1]) : 'MISSING'),
    'IS_HUB: ' + (isHub ? 'yes' : 'no'),
    'WORDCOUNT: ' + wc,
    'EXTRACTOR: ' + (body === text ? 'regex' : 'pandoc'),
    'OG_IMAGE: ' + (og ? og[1] : ''),
    'CHILD_URLS: ' + [...children].slice(0, 30).join(','),
    'BODY:',
    body,
  ].join('\n');

  writeFileSync('_migrate/extracted/' + slug + '.md', md);
  if (isHub) hub++;
  else if (wc < 100) thin++;
  else ok++;
}

console.log(`Parsed ${files.length}: ${ok} substantive, ${hub} hub, ${thin} thin`);
