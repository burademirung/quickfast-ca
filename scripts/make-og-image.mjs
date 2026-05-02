// scripts/make-og-image.mjs — generate 1200×630 OG image with brand colors + business name
import sharp from 'sharp';

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#112F5B"/>
      <stop offset="100%" stop-color="#0a1f40"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#116DFF"/>
      <stop offset="100%" stop-color="#DF3131"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect y="0" width="1200" height="6" fill="url(#accent)"/>
  <rect x="80" y="80" width="60" height="60" rx="14" fill="url(#accent)"/>
  <text x="92" y="124" font-family="Georgia,serif" font-size="34" font-weight="700" fill="white">Q</text>
  <text x="160" y="120" font-family="Georgia,serif" font-size="22" font-weight="700" fill="#F8FAFC">QuickFast Service Company</text>
  <text x="80" y="280" font-family="Georgia,serif" font-size="64" font-weight="700" fill="#F8FAFC">24/7 Property Services</text>
  <text x="80" y="360" font-family="Georgia,serif" font-size="64" font-weight="700" fill="#F8FAFC">You Can Trust</text>
  <text x="80" y="440" font-family="Inter,system-ui" font-size="28" fill="#94a3b8">HVAC · Plumbing · Electrical · Renovations</text>
  <text x="80" y="490" font-family="Inter,system-ui" font-size="22" fill="#cbd5e1">Mississauga &amp; the GTA · Serving since 2010</text>
  <rect y="620" width="1200" height="10" fill="url(#accent)"/>
</svg>`);

await sharp(svg).png().toFile('public/og-image.png');
console.log('Generated public/og-image.png (1200×630)');
