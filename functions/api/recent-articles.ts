interface Env {
  CLIENT_SCHEMAS: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const hostname = url.hostname.replace(/^www\./, '');
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '3', 10)));
  const raw = await context.env.CLIENT_SCHEMAS.get(`articles-index:${hostname}`);
  const now = Date.now();
  let articles: any[] = [];
  if (raw) {
    try {
      articles = (JSON.parse(raw) as any[]).filter(
        (a) =>
          a.status === 'published' ||
          (a.status === 'scheduled' && a.publishDate && new Date(a.publishDate).getTime() <= now)
      );
    } catch {}
  }
  articles.sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''));
  return new Response(JSON.stringify({ articles: articles.slice(0, limit) }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
