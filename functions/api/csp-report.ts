interface Env {
  CLIENT_SCHEMAS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const buf = await request.arrayBuffer();
  if (buf.byteLength > 8_000) return new Response('', { status: 204 });
  try {
    const body = new TextDecoder().decode(buf);
    const id = crypto.randomUUID();
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    await env.CLIENT_SCHEMAS.put(`csp-report:${day}:${id}`, body, { expirationTtl: 7 * 86400 });
  } catch {}
  return new Response('', { status: 204 });
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method !== 'POST') return new Response('', { status: 405, headers: { Allow: 'POST' } });
  return new Response('', { status: 204 });
};
