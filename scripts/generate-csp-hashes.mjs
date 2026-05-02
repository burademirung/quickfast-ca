// scripts/generate-csp-hashes.mjs — replace 'unsafe-inline' in CSP with SHA-256 hashes
// of each unique inline <script> and <style> emitted into dist/.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ROOT = 'dist';
const HEADERS = join(ROOT, '_headers');
if (!existsSync(HEADERS)) {
  console.warn('No dist/_headers — skipping CSP hash generation');
  process.exit(0);
}

const scripts = new Set();
const styles = new Set();

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) {
      const html = readFileSync(p, 'utf8');
      for (const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
        if (!m[1].trim()) continue;
        if (/<script[^>]*\bsrc=/i.test(m[0])) continue;
        scripts.add(m[1]);
      }
      for (const m of html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)) {
        if (!m[1].trim()) continue;
        styles.add(m[1]);
      }
    }
  }
}
walk(ROOT);

const hash = (s) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`;
const scriptHashes = [...scripts].map(hash).join(' ');
const styleHashes = [...styles].map(hash).join(' ');

let headers = readFileSync(HEADERS, 'utf8');
headers = headers
  .replace(/script-src [^;]+/, `script-src 'self' ${scriptHashes} challenges.cloudflare.com static.cloudflareinsights.com`)
  .replace(/style-src [^;]+/, `style-src 'self' ${styleHashes}`);

writeFileSync(HEADERS, headers);
console.log(`CSP: ${scripts.size} script hashes, ${styles.size} style hashes`);
