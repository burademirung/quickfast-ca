// scripts/resize-migrated.mjs — downsize migrated images to max 1600px wide / 80% q.
// Preserves filenames so the image-parity gate still matches.
import sharp from 'sharp';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src/assets/migrated';
const MAX_W = 1600;
const Q = 80;

const files = readdirSync(SRC);
let processed = 0, skipped = 0;
for (const f of files) {
  const p = join(SRC, f);
  const ext = (f.split('.').pop() || '').toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) { skipped++; continue; }
  try {
    const s = statSync(p);
    if (s.size < 100_000) { skipped++; continue; }
    const buf = readFileSync(p);
    const meta = await sharp(buf).metadata();
    if ((meta.width || 0) <= MAX_W && s.size < 500_000) { skipped++; continue; }
    let img = sharp(buf).resize({ width: Math.min(MAX_W, meta.width || MAX_W), withoutEnlargement: true });
    if (ext === 'png') img = img.png({ quality: Q, compressionLevel: 9 });
    else if (ext === 'webp') img = img.webp({ quality: Q });
    else img = img.jpeg({ quality: Q, mozjpeg: true });
    const out = await img.toBuffer();
    if (out.length < buf.length) {
      writeFileSync(p, out);
      processed++;
    } else {
      skipped++;
    }
  } catch (e) {
    console.warn(`skip ${f}: ${e.message.slice(0, 60)}`);
    skipped++;
  }
}
console.log(`Resized: ${processed}, skipped: ${skipped} of ${files.length}`);
