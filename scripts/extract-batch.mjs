// scripts/extract-batch.mjs — fast Playwright extraction for Wix.
// Wix never settles on 'networkidle' (continuous analytics) → use 'load' + fixed wait.
// Parallel pool: 4 concurrent pages.
import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';

const urls = readFileSync('urls.txt', 'utf8').split('\n').filter(Boolean);
mkdirSync('extracted/raw', { recursive: true });

const POOL = 4;
const TIMEOUT = 25000;
const SETTLE = 1500;

function slugFor(url) {
  const path = new URL(url).pathname.replace(/\/$/, '');
  return path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'home';
}

async function extractOne(ctx, url) {
  const slug = slugFor(url);
  const out = `extracted/raw/${slug}.html`;
  if (existsSync(out) && readFileSync(out, 'utf8').length > 5000) return { slug, status: 'CACHE' };
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: TIMEOUT });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await page.waitForTimeout(SETTLE);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await page.waitForTimeout(500);
    const html = await page.content();
    writeFileSync(out, html);
    return { slug, status: 'OK', size: html.length };
  } catch (e) {
    // Best-effort: even if timeout, save what's loaded
    try {
      const html = await page.content();
      if (html && html.length > 3000) {
        writeFileSync(out, html);
        return { slug, status: 'PARTIAL', size: html.length };
      }
    } catch {}
    return { slug, status: 'FAIL', err: e.message.slice(0, 60) };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 DeGenito-Migrate',
  viewport: { width: 1440, height: 900 },
});

let i = 0, ok = 0, fail = 0, cache = 0, partial = 0;
const total = urls.length;

async function worker() {
  while (i < urls.length) {
    const idx = i++;
    const url = urls[idx];
    const r = await extractOne(ctx, url);
    if (r.status === 'OK') ok++;
    else if (r.status === 'CACHE') cache++;
    else if (r.status === 'PARTIAL') partial++;
    else fail++;
    process.stdout.write(`[${idx + 1}/${total}] ${r.status.padEnd(8)} ${r.slug}${r.size ? ' (' + (r.size / 1024).toFixed(0) + 'KB)' : ''}${r.err ? ' — ' + r.err : ''}\n`);
  }
}

await Promise.all(Array.from({ length: POOL }, worker));
await browser.close();
process.stdout.write(`\nDone: ${ok} OK, ${cache} cached, ${partial} partial, ${fail} fail of ${total}\n`);
