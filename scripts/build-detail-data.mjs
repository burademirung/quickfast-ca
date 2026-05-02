// scripts/build-detail-data.mjs — convert extracted markdown into per-page data files
// for the [slug].astro detail pages.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('src/data/details', { recursive: true });

// Map old slug → { category, route }
const ROUTING = {
  // Heating & HVAC
  'furnace-installation': { cat: 'heating', route: '/services/heating/furnace-installation/' },
  'boiler-installation': { cat: 'heating', route: '/services/heating/boiler-installation/' },
  'heat-pump-installation': { cat: 'heating', route: '/services/heating/heat-pump-installation/' },
  'heat-pump-installation-2': null, // duplicate of heat-pump-installation
  'heat-pump': { cat: 'heating', route: '/services/heating/heat-pump/' },
  'mini-splits-installation': { cat: 'heating', route: '/services/heating/mini-splits-installation/' },
  'thermostat': { cat: 'heating', route: '/services/heating/thermostat/' },
  'erv-hrv-systems': { cat: 'heating', route: '/services/heating/erv-hrv-systems/' },
  'humidifiers-dehumidification': { cat: 'heating', route: '/services/heating/humidifiers-dehumidification/' },

  // AC
  'air-conditioning-installation': { cat: 'air-conditioning', route: '/services/air-conditioning/installation/' },
  'ac-maintenance': { cat: 'air-conditioning', route: '/services/air-conditioning/maintenance/' },
  'ac-repair': { cat: 'air-conditioning', route: '/services/air-conditioning/repair/' },

  // Water heaters
  'water-heaters': { cat: 'water-heaters', route: '/services/water-heaters/overview/' },
  'hot-water-tank-installation': { cat: 'water-heaters', route: '/services/water-heaters/tank-installation/' },
  'hot-water-tank-repair': { cat: 'water-heaters', route: '/services/water-heaters/tank-repair/' },
  'water-softeners': { cat: 'water-heaters', route: '/services/water-heaters/water-softeners/' },

  // Plumbing
  'emergency-plumbing': { cat: 'plumbing', route: '/services/plumbing/emergency/' },
  'pipe-installation-or-repair': { cat: 'plumbing', route: '/services/plumbing/pipe-installation/' },
  'sewer-line-repair': { cat: 'plumbing', route: '/services/plumbing/sewer-line-repair/' },
  'sewer-camera-inspection': { cat: 'plumbing', route: '/services/plumbing/sewer-camera/' },
  'water-main-repair': { cat: 'plumbing', route: '/services/plumbing/water-main-repair/' },
  'sump-pumps': { cat: 'plumbing', route: '/services/plumbing/sump-pumps/' },
  'clogged-drains': { cat: 'plumbing', route: '/services/plumbing/clogged-drains/' },
  'root-intrusion': { cat: 'plumbing', route: '/services/plumbing/root-intrusion/' },
  'waterproofing-clean-up': { cat: 'plumbing', route: '/services/plumbing/waterproofing/' },

  // Electrical
  'electrical-panel-upgrades': { cat: 'electrical', route: '/services/electrical/panel-upgrades/' },
  'electrical-residential-inspection': { cat: 'electrical', route: '/services/electrical/inspection/' },
  'electrical-wiring-remodelling': { cat: 'electrical', route: '/services/electrical/wiring/' },
  'ev-car-charger-installation': { cat: 'electrical', route: '/services/electrical/ev-charger/' },
  'exterior-pot-lights': { cat: 'electrical', route: '/services/electrical/pot-lights/' },
  'lighting-installation': { cat: 'electrical', route: '/services/electrical/lighting/' },
  'generator-installation-and-repair': { cat: 'electrical', route: '/services/electrical/generator/' },
  'red-tag-removal': { cat: 'electrical', route: '/services/electrical/red-tag-removal/' },

  // Duct cleaning
  'medical-grade-duct-cleaning': { cat: 'duct-cleaning', route: '/services/duct-cleaning/medical-grade/' },

  // Renovations
  'home-renovations': { cat: 'renovations', route: '/services/renovations/home/' },
  'basement-renovations': { cat: 'renovations', route: '/services/renovations/basement/' },
  'bathroom-renovations': { cat: 'renovations', route: '/services/renovations/bathroom/' },
  'condo-renovations': { cat: 'renovations', route: '/services/renovations/condo/' },
  'laneway-suite-renovations': { cat: 'renovations', route: '/services/renovations/laneway-suite/' },

  // Commercial
  'commercial-inspec': { cat: 'commercial', route: '/services/commercial/inspection/' },

  // Standalone pages
  'maintenance': { cat: 'standalone', route: '/maintenance/' },
  'repair': { cat: 'standalone', route: '/repair/' },
  'promotions': { cat: 'standalone', route: '/promotions/' },
  'quickfast-service-academy': { cat: 'standalone', route: '/academy/' },
  'how-to-become-electrician': { cat: 'standalone', route: '/academy/become-an-hvac-tech/' },

  // Blog posts
  'post-why-you-should-schedule-your-ac-installation-today':
    { cat: 'blog', route: '/blog/why-schedule-your-ac-installation-today/' },
  'post-10-benefits-of-choosing-quickfast-for-your-ac-installation':
    { cat: 'blog', route: '/blog/10-benefits-of-choosing-quickfast/' },
  'post-essential-tips-for-ac-maintenance-before-summer-starts':
    { cat: 'blog', route: '/blog/essential-ac-maintenance-tips-before-summer/' },
};

// Aggressive cleanup of extracted markdown — strip Wix chrome, repeat boilerplate
const STRIP_PATTERNS = [
  /top of page/gi,
  /skip to main content/gi,
  /✓\s*HVAC Repair & Installation\s*✓\s*Plumbing Services[\s\S]{0,600}/i,
  /Available 24\/7 — Including Weekends & Holidays/gi,
  /Whether it[''']s a home, condo unit, or commercial property[\s\S]{0,600}/i,
  /\[BOOK A SERVICE\][^\n]*/gi,
  /\[\+1 416-629-3213\]\([^)]+\)/gi,
  /Need a service\?[\s\S]{0,800}/gi,
  /We are available by phone and email[\s\S]{0,400}/gi,
  /WhatsApp 416\.629\.3213/gi,
  /\bGroup\b[\s\S]{0,30}\bThis is a Paragraph[\s\S]{0,500}/gi,
  /Bottom of page/gi,
  /\bShop\b\s*\bSearch\b/gi,
  /Choose a Plan That[''']s Right for You[\s\S]{0,1500}/gi,
];

for (const slug of Object.keys(ROUTING)) {
  const route = ROUTING[slug];
  if (!route) continue;
  const f = `_migrate/extracted/${slug}.md`;
  if (!existsSync(f)) continue;
  const txt = readFileSync(f, 'utf8');

  const meta = {};
  const lines = txt.split('\n');
  let body = '';
  let inBody = false;
  for (const line of lines) {
    if (inBody) { body += line + '\n'; continue; }
    if (line === 'BODY:') { inBody = true; continue; }
    const m = line.match(/^([A-Z_]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2];
  }

  // Clean body
  let clean = body;
  for (const re of STRIP_PATTERNS) clean = clean.replace(re, '');
  // Collapse runs of blank lines, drop any leftover all-link bullet noise
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();

  // Strip leading repetition of the H1 (already present in pandoc output as ===== underline)
  clean = clean.replace(/^[\s\S]*?(====+|---+)\s*\n/, '');
  clean = clean.replace(/^\s*\n+/, '');

  const data = {
    slug,
    route: route.route,
    cat: route.cat,
    title: (meta.TITLE || '').replace(/\s*\|\s*QuickFast.*$/i, '').trim(),
    desc: meta.DESC || '',
    h1: meta.H1 || '',
    wordcount: parseInt(meta.WORDCOUNT || '0', 10),
    body: clean,
  };
  writeFileSync(`src/data/details/${slug}.json`, JSON.stringify(data, null, 2));
}

console.log(`Built ${Object.values(ROUTING).filter(Boolean).length} detail-page data files`);
