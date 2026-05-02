interface Env {
  CLIENT_SCHEMAS: KVNamespace;
}
interface ArticleMeta {
  slug: string;
  status: string;
  publishDate?: string | null;
  updatedAt?: string;
}
const escXml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const hostname = url.hostname.replace(/^www\./, '');
  const raw = await context.env.CLIENT_SCHEMAS.get(`articles-index:${hostname}`);
  const now = Date.now();
  let articles: ArticleMeta[] = [];
  if (raw) {
    try {
      articles = (JSON.parse(raw) as ArticleMeta[]).filter(
        (a) =>
          a.status === 'published' ||
          (a.status === 'scheduled' && a.publishDate && new Date(a.publishDate).getTime() <= now)
      );
    } catch {}
  }
  articles.sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''));
  const todayIso = new Date().toISOString().slice(0, 10);
  const entries = [
    `<url><loc>${escXml(url.origin + '/blog/')}</loc><lastmod>${todayIso}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    ...articles.map((a) => {
      const lastmod = (a.updatedAt || a.publishDate || '').slice(0, 10);
      return `<url><loc>${escXml(url.origin + '/blog/' + a.slug + '/')}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    }),
  ].join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
