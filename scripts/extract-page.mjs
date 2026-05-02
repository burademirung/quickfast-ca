// scripts/extract-page.mjs — Wix sites are JS-rendered; use Playwright.
// Usage: node scripts/extract-page.mjs <url> <output-html-path>
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const [, , url, out] = process.argv;
if (!url || !out) { console.error('usage: extract-page.mjs <url> <out.html>'); process.exit(2); }

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 DeGenito-Migrate',
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  // Lazy-loaded content trigger: scroll to bottom
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const t = setInterval(() => {
        window.scrollBy(0, 800);
        total += 800;
        if (total >= document.body.scrollHeight) { clearInterval(t); resolve(); }
      }, 200);
    });
  }).catch(() => {});
  await page.waitForTimeout(1500);
  const html = await page.content();
  writeFileSync(out, html);
  console.log(`OK ${url} → ${out} (${html.length} bytes)`);
} catch (e) {
  console.error(`FAIL ${url}: ${e.message}`);
  process.exit(1);
} finally {
  await browser.close();
}
