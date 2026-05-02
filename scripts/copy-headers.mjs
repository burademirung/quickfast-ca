// scripts/copy-headers.mjs — Astro's static build copies public/_headers to dist/_headers
// automatically, but if compress mangles it or it gets overwritten, force-copy here.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const PAIRS = [
  ['public/_headers', 'dist/_headers'],
  ['public/_redirects', 'dist/_redirects'],
];
for (const [src, dst] of PAIRS) {
  if (!existsSync(src)) continue;
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  console.log(`copied ${src} → ${dst}`);
}
