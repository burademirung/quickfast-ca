// scripts/make-icons.mjs — generate favicon-32, apple-touch-icon, favicon.ico, favicon.svg
// from the client's actual logo. Outputs to public/.
import sharp from 'sharp';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sources = [
  'src/assets/logo-badge.webp',
  'src/assets/logo-badge.png',
  'src/assets/logo.svg',
  'src/assets/logo.png',
  'src/assets/logo.webp',
];
const source = sources.find((f) => existsSync(resolve(f)));
if (!source) {
  console.error('No logo found in src/assets/. Cannot generate favicons.');
  process.exit(1);
}
console.log(`Using logo: ${source}`);

const buf = readFileSync(resolve(source));
const meta = await sharp(buf).metadata();
console.log(`Source: ${meta.format} ${meta.width}x${meta.height}`);

// Crop to a centered square — use the smaller dimension
const size = Math.min(meta.width || 512, meta.height || 512);
const square = sharp(buf).resize(size, size, { fit: 'cover', position: 'center' });

// favicon-32.png
await square.clone().resize(32, 32).png().toFile('public/favicon-32.png');
// apple-touch-icon.png (180×180)
await square.clone().resize(180, 180).png().toFile('public/apple-touch-icon.png');
// favicon.ico (Windows + legacy bots) — 32×32 PNG-in-ICO works everywhere
await square.clone().resize(32, 32).png().toFile('public/favicon.ico');
// SVG wrapper around the raster (browsers will render the PNG inside)
const svgWrap = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><image href="/favicon-32.png" width="32" height="32"/></svg>`;
writeFileSync('public/favicon.svg', svgWrap);

console.log('Generated: favicon-32.png, apple-touch-icon.png, favicon.ico, favicon.svg');
