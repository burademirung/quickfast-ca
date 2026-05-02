interface Env {
  CLIENT_SCHEMAS: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const hostname = new URL(context.request.url).hostname.replace(/^www\./, '');
  let clientRecord: any = null;
  try {
    const raw = await context.env.CLIENT_SCHEMAS.get(`client:${hostname}`);
    if (raw) clientRecord = JSON.parse(raw);
  } catch {}
  (context.data as any).client = clientRecord;
  (context.data as any).hostname = hostname;

  const response = await context.next();

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  if (!clientRecord?.schema) return response;

  const schema = { '@context': 'https://schema.org', ...clientRecord.schema };
  const safeJson = JSON.stringify(schema).replace(/</g, '\\u003c');
  const scriptTag = `<script type="application/ld+json">${safeJson}</script>`;
  return new HTMLRewriter()
    .on('head', {
      element(el) {
        el.append(scriptTag, { html: true });
      },
    })
    .transform(response);
};
