interface Env {
  CLIENT_SCHEMAS: KVNamespace;
}
interface ArticleMeta {
  slug: string;
  title: string;
  status: string;
  publishDate?: string | null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const hostname = url.hostname.replace(/^www\./, '');
  const client: any = (context.data as any)?.client || {};
  const indexRaw = await context.env.CLIENT_SCHEMAS.get(`articles-index:${hostname}`);
  const schema = client.schema || {};
  const businessName = schema.name || 'QuickFast Service Company';
  const description =
    schema.description ||
    'HVAC, plumbing, electrical, duct cleaning and renovations in Mississauga and the GTA.';
  const now = Date.now();
  let articles: ArticleMeta[] = [];
  if (indexRaw) {
    try {
      articles = (JSON.parse(indexRaw) as ArticleMeta[]).filter(
        (a) =>
          a.status === 'published' ||
          (a.status === 'scheduled' && a.publishDate && new Date(a.publishDate).getTime() <= now)
      );
    } catch {}
  }
  articles.sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''));
  const body = `# ${businessName}\n\n> ${description}\n\n## About\n\n- Website: ${url.origin}\n- Business: ${businessName}${schema['@type'] ? ` (${schema['@type']})` : ''}\n\n## Blog Articles\n${articles.length > 0 ? `\nAll articles at ${url.origin}/blog/\n\n${articles.map((a) => `- [${a.title}](${url.origin}/blog/${a.slug}/)`).join('\n')}\n` : '\nNo articles published yet.\n'}\n## Contact\n\n- Phone: ${schema.telephone || '+1-416-629-3213'}\n- Email: ${schema.email || 'info@quickfast.ca'}\n- Address: 2390 Cawthra Road Unit #2, Mississauga, ON, L5A 2X1\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
