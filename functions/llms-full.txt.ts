interface Env {
  CLIENT_SCHEMAS: KVNamespace;
}

const SERVICES = [
  { cat: 'HVAC & Heating', items: ['Air conditioning installation', 'AC maintenance + repair', 'Furnace installation', 'Boiler installation', 'Heat pump installation', 'Mini-split installation', 'Thermostat installation', 'ERV / HRV systems', 'Humidifier + dehumidifier'] },
  { cat: 'Plumbing', items: ['Emergency plumbing', 'Hot water tank installation + repair', 'Water heaters + tankless', 'Water softeners', 'Pipe installation + repair', 'Sewer line repair', 'Sewer camera inspection', 'Water main repair', 'Sump pumps', 'Clogged drains', 'Root intrusion removal', 'Waterproofing'] },
  { cat: 'Electrical', items: ['Electrical panel upgrades', 'Wiring + remodelling', 'EV charger installation', 'Generator installation + repair', 'Lighting installation', 'Exterior pot lights', 'Residential electrical inspection', 'Red tag removal'] },
  { cat: 'Duct Cleaning', items: ['Medical-grade duct cleaning', 'Dryer vent cleaning'] },
  { cat: 'Renovations', items: ['Bathroom renovations', 'Basement renovations', 'Condo renovations', 'Laneway suite renovations', 'Home renovations', 'General construction'] },
  { cat: 'Commercial', items: ['Property management', 'Commercial inspections', 'Multi-unit residential service'] },
];

const FAQS = [
  { q: 'What areas does QuickFast Service Company serve?', a: 'We serve Mississauga, Toronto, and the entire Greater Toronto Area (GTA), including Etobicoke, Oakville, Brampton, Vaughan, Markham, and Richmond Hill. Our central office is at 2390 Cawthra Road in Mississauga.' },
  { q: 'Are you licensed and insured?', a: 'Yes. We are ESA-certified for electrical work, TSSA-licensed for gas/HVAC, and fully insured. Our technicians carry WSIB coverage. We also offer a workmanship guarantee on installations.' },
  { q: 'Do you offer 24/7 emergency service?', a: 'Yes. We have on-call technicians for emergency plumbing, HVAC, and electrical issues 24 hours a day, 7 days a week. Call +1-416-629-3213 for after-hours service.' },
  { q: 'How fast can you respond to a service call?', a: 'For most service calls in the Mississauga / Toronto area, we respond within 1-2 hours during business hours and within 2-4 hours for emergencies after-hours.' },
  { q: 'Do you provide free estimates?', a: 'Yes. We offer free no-obligation estimates for all installation and renovation work. For repair calls, a service-call fee applies which is waived if you proceed with the recommended work.' },
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const hostname = url.hostname.replace(/^www\./, '');
  const client: any = (context.data as any)?.client || {};
  const schema = client.schema || {};
  const businessName = schema.name || 'QuickFast Service Company';
  const description = schema.description || 'HVAC, plumbing, electrical, duct cleaning and renovations in Mississauga and the GTA.';
  const phone = schema.telephone || '+1-416-629-3213';
  const email = schema.email || 'info@quickfast.ca';
  const address = '2390 Cawthra Road Unit #2, Mississauga, ON, L5A 2X1';

  // Articles
  const indexRaw = await context.env.CLIENT_SCHEMAS.get(`articles-index:${hostname}`);
  let articles: any[] = [];
  if (indexRaw) {
    try {
      articles = JSON.parse(indexRaw);
    } catch {}
  }

  const servicesSection = SERVICES.map((s) => `### ${s.cat}\n\n${s.items.map((i) => `- ${i}`).join('\n')}`).join('\n\n');
  const faqSection = FAQS.map((f) => `**Q: ${f.q}**\n\nA: ${f.a}`).join('\n\n');
  const articlesSection = articles.length
    ? articles.map((a) => `- [${a.title}](${url.origin}/blog/${a.slug}/)`).join('\n')
    : 'No articles published yet.';

  const body = `# ${businessName} — Complete Business Overview

> ${description}

## About

${businessName} has provided HVAC, heating, air conditioning, plumbing, electrical, duct cleaning, construction, handyman, and property management services to homes, condos and businesses across Mississauga, Toronto and the GTA for over 15 years.

We deliver fast, reliable, professional service with a workmanship guarantee. Our technicians are ESA-certified for electrical, TSSA-licensed for gas/HVAC, and fully insured. We work on residential, commercial, and condo properties.

## Contact

- Website: ${url.origin}
- Phone: ${phone}
- Email: ${email}
- Address: ${address}
- Hours: Monday–Friday 8:00–18:00, Saturday 9:00–15:00, Sunday emergency only
- Service area: Mississauga · Toronto · Etobicoke · Oakville · Brampton · Vaughan · Markham · Richmond Hill

## Services

${servicesSection}

## Why Choose ${businessName}

- 15+ years serving Mississauga and the GTA
- ESA-certified, TSSA-licensed, fully insured
- 24/7 emergency response
- 1-hour response time during business hours
- Free written estimates on installations
- Workmanship guarantee on every job
- Same-day service available for most jobs
- Transparent up-front pricing

## Frequently Asked Questions

${faqSection}

## Blog & Resources

All articles: ${url.origin}/blog/

${articlesSection}

## Connect

Visit ${url.origin}/contact/ to request service. We respond within one business hour.
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
