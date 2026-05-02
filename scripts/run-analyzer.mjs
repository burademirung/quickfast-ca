// scripts/run-analyzer.mjs — opens the DeGenito analyzer for our URL and captures scanner scores
import { chromium } from 'playwright';

const TARGET = process.argv[2] || 'https://quickfast-ca.pages.dev';
const ANALYZER = `https://degenito.ai/website-analyzer/?url=${encodeURIComponent(TARGET)}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const page = await ctx.newPage();

// Log network for clues to API
const apiCalls = [];
page.on('response', (r) => {
  const url = r.url();
  if (url.includes('degenito.ai/api') || url.includes('analyzer') || url.includes('scanner')) {
    apiCalls.push({ status: r.status(), url });
  }
});

console.log('Loading analyzer:', ANALYZER);
try {
  await page.goto(ANALYZER, { waitUntil: 'load', timeout: 30000 });
} catch (e) { console.warn('Goto warning:', e.message); }

// Wait up to 5 minutes for the analyzer to finish (it runs many scans)
console.log('Waiting for scans...');
await page.waitForTimeout(60000);

// Capture page text + try to extract scores
const text = await page.evaluate(() => document.body.innerText);
console.log('=== ANALYZER PAGE TEXT (first 4000 chars) ===');
console.log(text.slice(0, 4000));
console.log('...');

console.log('\n=== API CALLS OBSERVED ===');
for (const c of apiCalls.slice(0, 50)) console.log(`  ${c.status}  ${c.url}`);

await page.screenshot({ path: 'analyzer-screenshot.png', fullPage: true });
console.log('\nScreenshot saved to analyzer-screenshot.png');

await browser.close();
