interface Env {
  CLIENT_SCHEMAS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 1000) return new Response(null, { status: 413 });
    const parsed = await request.json().catch(() => null);
    const body =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as { name?: string; value?: number; rating?: string; path?: string })
        : null;
    if (!body || !body.name || typeof body.value !== 'number') return new Response(null, { status: 204 });
    const hostname = new URL(request.url).hostname.replace(/^www\./, '');
    const day = new Date().toISOString().slice(0, 10);
    const key = `vitals:${hostname}:${day}:${body.name}`;
    const existingRaw = await env.CLIENT_SCHEMAS.get(key);
    const existing = existingRaw
      ? JSON.parse(existingRaw)
      : { count: 0, sum: 0, good: 0, poor: 0, paths: {} };
    existing.count++;
    existing.sum += body.value;
    if (body.rating === 'good') existing.good++;
    if (body.rating === 'poor') existing.poor++;
    const path = (body.path || '/').slice(0, 100);
    existing.paths[path] = (existing.paths[path] || 0) + 1;
    await env.CLIENT_SCHEMAS.put(key, JSON.stringify(existing), { expirationTtl: 90 * 86400 });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
};
