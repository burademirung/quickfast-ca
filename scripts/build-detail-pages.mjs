// scripts/build-detail-pages.mjs — generates an .astro file per detail JSON
// in src/pages/services/<cat>/<slug>.astro etc.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const CAT_LABEL = {
  heating: 'Heating',
  'air-conditioning': 'Air Conditioning',
  'water-heaters': 'Water Heaters',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  'duct-cleaning': 'Medical-Grade Duct Cleaning',
  renovations: 'Renovations',
  commercial: 'Commercial',
};

let count = 0;
for (const f of readdirSync('src/data/details')) {
  if (!f.endsWith('.json')) continue;
  const data = JSON.parse(readFileSync(join('src/data/details', f), 'utf8'));
  const route = data.route;
  if (!route) continue;
  // Map route /services/<cat>/<slug>/ to src/pages/services/<cat>/<slug>.astro
  const path = 'src/pages' + route.replace(/\/$/, '') + '.astro';
  mkdirSync(dirname(path), { recursive: true });

  const parentLabel = CAT_LABEL[data.cat] || 'Services';
  const parentRoute = data.cat in CAT_LABEL ? `/services/${data.cat}/` : '/services/';
  const slug = f.replace('.json', '');

  // Skip if route is a top-level standalone (e.g. /promotions/) — we'll generate those separately
  if (data.cat === 'standalone' || data.cat === 'blog') continue;

  const astro = `---
import DetailPage from '~/components/DetailPage.astro';
import data from '~/data/details/${slug}.json';
---
<DetailPage data={data} parentLabel="${parentLabel}" parentRoute="${parentRoute}" />
`;
  writeFileSync(path, astro);
  count++;
}
console.log(`Generated ${count} detail .astro pages`);
