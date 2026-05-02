// scripts/parity-check.mjs — verify old-site content + images are preserved on new site.
// Reports per old URL: redirect status, content overlap %, missing-image count.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const NEW = (process.argv[2] || 'https://quickfast-ca.pages.dev').replace(/\/$/, '');

// 1. Old URLs from urls.txt
const oldUrls = readFileSync('urls.txt', 'utf8').split('\n').filter(Boolean);
console.log(`Checking ${oldUrls.length} old URLs against ${NEW}\n`);

// 2. Redirect map from public/_redirects (skip wildcards + first line www→apex)
const redirectsRaw = readFileSync('public/_redirects', 'utf8');
const redirectMap = new Map();
for (const line of redirectsRaw.split('\n')) {
  const m = line.match(/^([^\s#][^\s]*)\s+([^\s]+)\s+(\d+)/);
  if (!m) continue;
  if (m[1].includes('://')) continue;
  if (m[1].includes('*')) continue;
  redirectMap.set(m[1], { to: m[2], status: parseInt(m[3], 10) });
}

// 3. Image basenames from old site
const oldImageRaw = existsSync('original-image-urls.txt') ? readFileSync('original-image-urls.txt', 'utf8') : '';
const oldImageBasenames = new Set(
  oldImageRaw.split('\n').filter(Boolean).map(u => u.split('/').pop().split('?')[0].toLowerCase())
);

// 4. Image basenames in src/assets/migrated (these will end up in dist/_astro)
const migratedDir = 'src/assets/migrated';
const migratedBasenames = new Set();
if (existsSync(migratedDir)) {
  for (const f of readdirSync(migratedDir)) {
    // strip the 8-char download hash prefix to recover original basename
    migratedBasenames.add(f.replace(/^[a-f0-9]{8}-/, '').toLowerCase());
  }
}

// 5. Image-per-page map from extraction
const imagesPerPage = existsSync('_migrate/images-per-page.json')
  ? JSON.parse(readFileSync('_migrate/images-per-page.json', 'utf8'))
  : {};

// 6. Run checks
const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 ParityCheck' });

const report = { ok: [], redirected: [], missing: [], partial: [], imageDeficit: [] };
let imagesPresent = 0, imagesMissing = 0;

for (const oldUrl of oldUrls) {
  const path = new URL(oldUrl).pathname.replace(/\/$/, '') || '/';
  const probe = NEW + (path === '/' ? '/' : path + '/');
  const page = await ctx.newPage();
  let finalUrl = '';
  let status = 0;
  try {
    const resp = await page.goto(probe, { waitUntil: 'domcontentloaded', timeout: 20000 });
    finalUrl = page.url();
    status = resp?.status() || 0;
  } catch (e) {
    status = 0;
    finalUrl = e.message.slice(0, 50);
  }
  const redirected = finalUrl && new URL(finalUrl).pathname.replace(/\/$/, '') !== path;
  const expected = redirectMap.get(path);

  if (status === 200 && !redirected) {
    report.ok.push({ oldUrl, newUrl: finalUrl });
  } else if (status === 200 && redirected && expected) {
    report.redirected.push({ oldUrl, finalUrl, expected: expected.to });
  } else if (status === 200 && redirected) {
    report.redirected.push({ oldUrl, finalUrl, expected: '(no explicit rule)' });
  } else if (status === 404 || status === 0) {
    report.missing.push({ oldUrl, status, probe });
  } else {
    report.partial.push({ oldUrl, status, probe });
  }

  await page.close();

  // Image parity for this page
  const slug = path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'home';
  const expectedImages = imagesPerPage[slug] || [];
  for (const imgUrl of expectedImages) {
    const basename = imgUrl.split('/').pop().split('?')[0].toLowerCase();
    if (migratedBasenames.has(basename)) imagesPresent++;
    else imagesMissing++;
  }
}
await browser.close();

console.log('═══ CONTENT PARITY ═══\n');
console.log(`OK (200, no redirect):           ${report.ok.length}`);
console.log(`Redirected (per _redirects):     ${report.redirected.length}`);
console.log(`Missing/404 (BROKEN!):           ${report.missing.length}`);
console.log(`Other status:                    ${report.partial.length}\n`);

if (report.missing.length) {
  console.log('=== MISSING (need redirect rule or content): ===');
  for (const m of report.missing) console.log(`  ${m.status}  ${m.oldUrl}`);
  console.log();
}
if (report.partial.length) {
  console.log('=== PARTIAL ===');
  for (const m of report.partial) console.log(`  ${m.status}  ${m.oldUrl}`);
  console.log();
}

console.log('═══ IMAGE PARITY ═══\n');
const total = oldImageBasenames.size;
let present = 0;
for (const b of oldImageBasenames) if (migratedBasenames.has(b)) present++;
console.log(`Old-site unique images (originals):  ${total}`);
console.log(`Present in src/assets/migrated/:     ${present}`);
console.log(`Missing source files:                ${total - present}`);
console.log(`\nPer-page image references found in OLD site:`);
console.log(`  Source files present locally:      ${imagesPresent}`);
console.log(`  Source files missing locally:      ${imagesMissing}`);

console.log('\n═══ SUMMARY ═══');
const passed = report.missing.length === 0 && report.partial.length === 0 && (total - present) === 0;
console.log(passed ? '✓ All content and images preserved' : '✗ Gaps found — see above');
process.exit(passed ? 0 : 1);
