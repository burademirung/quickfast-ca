interface Env {
  RESEND_API_KEY?: string;
  CLIENT_SCHEMAS: KVNamespace;
  TURNSTILE_SECRET?: string;
}

const TO_EMAIL_RAW = 'info@quickfast.ca';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('application/json')) {
      return json({ error: 'Content-Type must be application/json' }, 415);
    }
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 10_000) return json({ error: 'Payload too large' }, 413);

    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown';

    // Rate limit: 5 / 10min per IP
    const rlKey = `rl:service-req:${ip}`;
    const current = parseInt((await env.CLIENT_SCHEMAS.get(rlKey)) || '0', 10) || 0;
    if (current >= 5) return json({ error: 'Too many requests — please try again in a few minutes' }, 429);
    await env.CLIENT_SCHEMAS.put(rlKey, String(current + 1), { expirationTtl: 600 });

    const parsed = await request.json().catch(() => null);
    const body: any =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as any) : {};

    if (body.hp) return json({ ok: true }); // honeypot
    const formAgeMs = Number(body.formAgeMs) || 0;
    if (formAgeMs > 0 && formAgeMs < 2000) return json({ ok: true }); // bot timing

    const name = (body.name || '').trim().slice(0, 100);
    const phone = (body.phone || '').trim().slice(0, 30);
    const email = (body.email || '').trim().slice(0, 200);
    if (!name || !phone || !email) return json({ error: 'Name, phone, and email are required' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Invalid email format' }, 400);
    if (!/^[+\d][\d\s\-().]{6,}$/.test(phone))
      return json({ error: 'Invalid phone format' }, 400);

    const service = (body.service || 'General inquiry').slice(0, 100);
    const message = (body.message || '').slice(0, 2000);

    // Optional Turnstile verification (when sitekey/secret configured)
    if (env.TURNSTILE_SECRET) {
      const token = body['cf-turnstile-response'];
      if (token) {
        const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
        }).then((r) => r.json() as Promise<{ success: boolean }>);
        if (!verify.success) return json({ error: 'Captcha failed — please retry' }, 403);
      }
    }

    const TO_EMAIL: string | string[] = TO_EMAIL_RAW.includes(',')
      ? TO_EMAIL_RAW.split(',').map((e) => e.trim()).filter(Boolean)
      : TO_EMAIL_RAW;

    // Inverse-timestamp prefix so newer leads sort first lexicographically
    const leadKey = `lead:${(9_999_999_999_999 - Date.now()).toString().padStart(13, '0')}:${crypto.randomUUID()}`;
    const leadJson = JSON.stringify({
      name,
      phone,
      email,
      service,
      message,
      ip,
      at: new Date().toISOString(),
    });

    if (env.RESEND_API_KEY) {
      const htmlBody =
        '<h2>New service request</h2>' +
        '<p><strong>Name:</strong> ' + escapeHtml(name) + '</p>' +
        '<p><strong>Phone:</strong> ' + escapeHtml(phone) + '</p>' +
        '<p><strong>Email:</strong> ' + escapeHtml(email) + '</p>' +
        '<p><strong>Service:</strong> ' + escapeHtml(service) + '</p>' +
        '<p><strong>Message:</strong></p><p>' + escapeHtml(message).replace(/\n/g, '<br>') + '</p>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.RESEND_API_KEY },
        body: JSON.stringify({
          from: 'QuickFast Service Company <noreply@quickfast.ca>',
          to: TO_EMAIL,
          reply_to: email,
          subject: 'New service request from ' + name,
          html: htmlBody,
        }),
      });
      if (!res.ok) {
        await env.CLIENT_SCHEMAS.put(leadKey, leadJson, { expirationTtl: 90 * 86400 });
      }
    } else {
      await env.CLIENT_SCHEMAS.put(leadKey, leadJson, { expirationTtl: 90 * 86400 });
    }
    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e.message || 'Request failed' }, 500);
  }
};
