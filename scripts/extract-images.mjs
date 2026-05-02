// scripts/extract-images.mjs — pull every image URL from extracted/raw/*.html.
// Wix uses static.wixstatic.com with transformations like /v1/fill/w_1440,h_714,…/
// We collect both transformed and "original" forms (strip /v1/.../ to get the source).
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';

mkdirSync('downloaded-assets/images', { recursive: true });

const files = readdirSync('_migrate/extracted/raw').filter(f => f.endsWith('.html'));
const allUrls = new Set();
const perPage = {};

for (const f of files) {
  const slug = f.replace(/\.html$/, '');
  const html = readFileSync('_migrate/extracted/raw/' + f, 'utf8');
  const urls = new Set();

  // 1. <img src=...>
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) urls.add(m[1]);
  // 2. data-src / data-lazy-src / data-original / data-bg
  for (const attr of ['data-src', 'data-lazy-src', 'data-original', 'data-bg', 'data-image']) {
    for (const m of html.matchAll(new RegExp(`${attr}=["']([^"']+)["']`, 'gi'))) urls.add(m[1]);
  }
  // 3. srcset (responsive)
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u) urls.add(u);
    }
  }
  // 4. background-image style attrs
  for (const m of html.matchAll(/background(?:-image)?\s*:[^;]*url\(["']?([^"'\)]+)\)/gi)) urls.add(m[1]);
  // 5. og:image / twitter:image
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+\.(?:jpg|jpeg|png|gif|svg|webp|avif))/gi)) urls.add(m[1]);

  // Filter to image-likes only, strip data: URIs
  const filtered = [...urls].filter(u => {
    if (u.startsWith('data:')) return false;
    return /\.(jpe?g|png|gif|svg|webp|avif|ico|bmp|tiff)(\?|$)/i.test(u) || /wixstatic\.com\/(media|shapes)/.test(u);
  });
  perPage[slug] = filtered;
  filtered.forEach(u => allUrls.add(u));
}

// Normalize to absolute URLs
const HOST = 'https://www.quickfast.ca';
const normalized = new Set();
for (const u of allUrls) {
  if (u.startsWith('//')) normalized.add('https:' + u);
  else if (u.startsWith('/')) normalized.add(HOST + u);
  else if (u.startsWith('http')) normalized.add(u);
}

// For Wix media, also derive the "original" URL by stripping the /v1/.../ transform path.
const finalSet = new Set();
for (const u of normalized) {
  finalSet.add(u);
  // Wix pattern: ...wixstatic.com/media/<id>~mv2.png/v1/fill/w_1440,.../<filename>.png
  // Original: ...wixstatic.com/media/<id>~mv2.png
  const wixMatch = u.match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/]+\.(?:png|jpe?g|webp|avif|gif|svg))\/v1\//i);
  if (wixMatch) finalSet.add(wixMatch[1]);
}

writeFileSync('all-image-urls.txt', [...finalSet].sort().join('\n') + '\n');
writeFileSync('_migrate/images-per-page.json', JSON.stringify(perPage, null, 2));
console.log(`Found ${finalSet.size} unique image URLs across ${files.length} pages`);
