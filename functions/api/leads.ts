interface Env {
  CLIENT_SCHEMAS: KVNamespace;
  LEADS_ADMIN_TOKEN?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const expected = env.LEADS_ADMIN_TOKEN;
  if (!expected) return new Response('Not configured', { status: 503 });
  const provided =
    request.headers.get('x-admin-token') || new URL(request.url).searchParams.get('token');
  if (provided !== expected) return new Response('Unauthorized', { status: 401 });

  const list = await env.CLIENT_SCHEMAS.list({ prefix: 'lead:', limit: 100 });
  const leads = await Promise.all(
    list.keys.map(async (k) => {
      const raw = await env.CLIENT_SCHEMAS.get(k.name);
      try {
        return { key: k.name, ...JSON.parse(raw || '{}') };
      } catch {
        return { key: k.name, error: 'parse' };
      }
    })
  );
  return new Response(
    JSON.stringify({ count: leads.length, leads, truncated: list.list_complete === false }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  );
};
