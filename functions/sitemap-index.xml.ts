export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const origin = url.origin;
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${origin}/sitemap-0.xml</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${origin}/blog-sitemap.xml</loc><lastmod>${now}</lastmod></sitemap>
</sitemapindex>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
