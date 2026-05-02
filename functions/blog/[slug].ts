interface Env {
  CLIENT_SCHEMAS: KVNamespace;
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slugifyHeading = (text: string): string =>
  text
    .toLowerCase()
    .replace(/&[a-z]+;/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);

function extractH2s(md: string): Array<{ text: string; id: string }> {
  const h2s: Array<{ text: string; id: string }> = [];
  const used = new Set<string>();
  for (const line of md.split('\n')) {
    const m = line.match(/^## (.+)$/);
    if (m) {
      const text = m[1].trim().replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      let id = slugifyHeading(text);
      if (used.has(id)) {
        let n = 2;
        while (used.has(`${id}-${n}`) && n < 50) n++;
        id = `${id}-${n}`;
      }
      used.add(id);
      h2s.push({ text, id });
    }
  }
  return h2s;
}

function mdToHtml(md: string, h2Ids?: Array<{ text: string; id: string }>): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  let i = 0;
  html = html
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, (_m, text) => {
      const e = h2Ids?.[i++];
      const id = e?.id || slugifyHeading(text);
      return `<h2 id="${id}">${text}</h2>`;
    })
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_m, text, url) => {
      if (!/^(https?:\/\/|\/|#)/i.test(url)) return text;
      return `<a href="${url}">${text}</a>`;
    });
  html = html
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[^<]*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  html = html
    .split(/\n\n+/)
    .map((p) => (p.trim().startsWith('<') ? p : p.trim() ? `<p>${p}</p>` : ''))
    .join('\n');
  return html;
}

const STYLES = `*{box-sizing:border-box}html{scroll-behavior:smooth}body{font:17px/1.7 'Inter Variable',system-ui,sans-serif;margin:0;color:#334155;background:#FAF9F6}.site-header{position:sticky;top:0;z-index:50;background:rgba(250,249,246,.92);backdrop-filter:blur(8px);border-bottom:1px solid #e2e8f0;height:64px;display:flex;align-items:center}.site-header-inner{max-width:1200px;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between;width:100%;gap:1rem}.site-header a.brand{font-family:Georgia,serif;font-weight:700;color:#112F5B;text-decoration:none;font-size:1.15rem}.site-nav{display:flex;gap:1.25rem;align-items:center;font-size:.95rem}.site-nav a{color:#334155;text-decoration:none}.site-nav a:hover{color:#116DFF}.site-nav .btn-primary{background:#116DFF;color:#fff;padding:.5rem 1rem;border-radius:8px;font-weight:600}.site-nav .btn-primary:hover{background:#112F5B;color:#fff}@media(max-width:640px){.site-nav a:not(.btn-primary){display:none}}.article-container{max-width:760px;margin:0 auto;padding:2.5rem 1.5rem 4rem}.progress-container{position:fixed;top:64px;left:0;right:0;height:3px;background:transparent;z-index:49}.progress-bar{height:100%;background:#116DFF;width:0%;transition:width .1s}article h1{font-family:Georgia,serif;font-size:2.4rem;line-height:1.15;margin:0 0 1.25rem;color:#112F5B;font-weight:700}article h2{font-family:Georgia,serif;font-size:1.65rem;margin:3rem 0 1rem;color:#112F5B;font-weight:700;padding-bottom:.4rem;border-bottom:1px solid #e2e8f0;scroll-margin-top:5rem}article h3{font-size:1.25rem;margin:2.25rem 0 .75rem;color:#112F5B;font-weight:600}article p{margin:0 0 1.25rem}article ul,article ol{padding-left:1.5rem;margin:0 0 1.25rem}article a{color:#116DFF;text-decoration:underline}.article-meta{display:flex;gap:.6rem;flex-wrap:wrap;font-size:.9rem;color:#64748b;margin-bottom:1.75rem}.toc{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:1rem 1.75rem;margin:2rem 0}.toc-title{font-size:.78rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem}.toc ol{margin:0;padding-left:1rem}.toc a{color:#334155;text-decoration:none}.toc a:hover{color:#116DFF;text-decoration:underline}.faq-item{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:1.1rem 1.25rem;margin-bottom:.75rem}.faq-item h3{font-size:1rem;margin:0 0 .5rem;font-weight:600}.faq-item p{margin:0}.article-cta{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:2rem;margin:3rem 0 2rem;text-align:center}.article-cta h3{font-family:Georgia,serif;font-size:1.4rem;margin:0 0 .5rem;color:#112F5B}.article-cta p{color:#64748b;margin:0 0 1.25rem}.article-cta a.btn-primary{display:inline-block;background:#116DFF;color:#fff;padding:.75rem 1.5rem;border-radius:8px;font-weight:600;text-decoration:none}.article-cta a.btn-primary:hover{background:#112F5B}.site-footer{background:#112F5B;color:#cbd5e1;padding:2.5rem 1.5rem;margin-top:3rem}.site-footer-inner{max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;gap:2rem;justify-content:space-between;align-items:flex-start}.site-footer a{color:#cbd5e1;text-decoration:none}.site-footer a:hover{color:#fff;text-decoration:underline}.site-footer .footer-brand{font-family:Georgia,serif;font-weight:700;color:#fff;font-size:1.1rem;display:block;margin-bottom:.5rem}.site-footer .footer-meta{font-size:.85rem;color:#94a3b8}.site-footer nav{display:flex;gap:1.25rem;flex-wrap:wrap;font-size:.9rem}.site-footer .copyright{width:100%;padding-top:1.5rem;margin-top:1.5rem;border-top:1px solid #334155;font-size:.8rem;color:#94a3b8}@media print{.site-header,.site-footer,.progress-container,.article-cta,.toc{display:none!important}body{background:#fff;color:#000}article a{color:#000;text-decoration:underline}article a[href^="http"]::after{content:" ("attr(href)")";font-size:.85em}article h1,article h2,article h3{break-after:avoid}.faq-item{break-inside:avoid}}`;

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const hostname = url.hostname.replace(/^www\./, '');
  const slug = String(context.params.slug || '').toLowerCase();
  if (!slug) return context.next();

  const client: any = (context.data as any)?.client || {};
  let articleRaw: string | null = null;
  try {
    articleRaw = await context.env.CLIENT_SCHEMAS.get(`article:${hostname}:${slug}`);
  } catch {
    return new Response(
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Temporarily unavailable</title><meta name="robots" content="noindex"></head><body style="font:16px system-ui;max-width:40rem;margin:3rem auto;padding:0 1rem"><h1>We\'ll be right back</h1><p>This page is temporarily unavailable. Please try again in a moment.</p><p><a href="/">Return home</a></p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '60' } }
    );
  }
  if (!articleRaw) return context.next();

  let article: any;
  try {
    article = JSON.parse(articleRaw);
  } catch {
    return context.next();
  }

  const now = Date.now();
  const pubTime = article.publishDate ? new Date(article.publishDate).getTime() : 0;
  const isLive =
    article.status === 'published' || (article.status === 'scheduled' && pubTime > 0 && pubTime <= now);
  if (!isLive) return context.next();

  const businessName = client.schema?.name || 'QuickFast Service Company';
  const rawContent = article.content || article.body || '';
  const h2s = extractH2s(rawContent);
  const body = mdToHtml(rawContent, h2s);
  const showToc = h2s.length >= 3;
  const wordCount = rawContent.split(/\s+/).length;
  const readMins = Math.max(1, Math.round(wordCount / 225));

  const faqHtml = (article.faq || [])
    .map((f: any) => `<div class="faq-item"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`)
    .join('');

  const articleSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishDate || article.createdAt,
    dateModified: article.updatedAt || article.publishDate || article.createdAt,
    url: `${url.origin}/blog/${slug}/`,
    publisher: {
      '@type': 'Organization',
      name: businessName,
      logo: { '@type': 'ImageObject', url: url.origin + '/apple-touch-icon.png' },
    },
    image: url.origin + '/blog/og-image?slug=' + encodeURIComponent(slug),
    author: { '@type': 'Organization', name: businessName },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${url.origin}/blog/${slug}/` },
  };
  const faqSchema =
    article.faq?.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: article.faq.map((f: any) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: url.origin + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: url.origin + '/blog/' },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${url.origin}/blog/${slug}/` },
    ],
  };
  const esc = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c');

  const tocHtml = showToc
    ? `<nav class="toc"><div class="toc-title">Contents</div><ol>${h2s.map((h) => `<li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('')}</ol></nav>`
    : '';

  const headerHtml = `<header class="site-header"><div class="site-header-inner"><a class="brand" href="/">${escapeHtml(businessName)}</a><nav class="site-nav" aria-label="Primary"><a href="/services/">Services</a><a href="/about/">About</a><a href="/blog/" aria-current="page">Blog</a><a href="/faq/">FAQ</a><a href="/contact/">Contact</a><a href="tel:+14166293213" class="hidden sm:inline">+1-416-629-3213</a><a href="/contact/" class="btn-primary">Request Service</a></nav></div></header>`;
  const year = new Date().getFullYear();
  const footerHtml = `<footer class="site-footer"><div class="site-footer-inner"><div><span class="footer-brand">${escapeHtml(businessName)}</span><div class="footer-meta"><a href="tel:+14166293213">+1-416-629-3213</a> · <a href="mailto:info@quickfast.ca">info@quickfast.ca</a></div></div><nav aria-label="Footer"><a href="/services/">Services</a><a href="/about/">About</a><a href="/faq/">FAQ</a><a href="/blog/">Blog</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav><div class="copyright">© ${year} ${escapeHtml(businessName)}. All rights reserved.</div></div></footer>`;

  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(article.title)}</title>
<meta name="description" content="${escapeHtml(article.metaDescription || '')}">
<link rel="canonical" href="${url.origin}/blog/${slug}/">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#112F5B">
<meta name="robots" content="index, follow">
<meta property="og:title" content="${escapeHtml(article.title)}">
<meta property="og:description" content="${escapeHtml(article.metaDescription || '')}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url.origin}/blog/${slug}/">
<meta property="og:image" content="${url.origin}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="${escapeHtml(businessName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(article.title)}">
<meta name="twitter:description" content="${escapeHtml(article.metaDescription || '')}">
<meta name="twitter:image" content="${url.origin}/og-image.png">
<style>${STYLES}</style>
<script type="application/ld+json">${esc(articleSchema)}</script>
<script type="application/ld+json">${esc(breadcrumbSchema)}</script>
${faqSchema ? `<script type="application/ld+json">${esc(faqSchema)}</script>` : ''}
</head><body>
${headerHtml}
<div class="progress-container"><div class="progress-bar" id="pb"></div></div>
<main class="article-container" id="main-content">
<article>
<div class="article-meta">${article.publishDate ? `<span>${new Date(article.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>` : ''}<span>${readMins} min read</span></div>
<h1>${escapeHtml(article.title)}</h1>
${tocHtml}
${body}
${faqHtml ? `<section style="margin-top:3rem;padding-top:2rem;border-top:2px solid #e2e8f0"><h2>Frequently Asked Questions</h2>${faqHtml}</section>` : ''}
<aside class="article-cta"><h3>Ready to work together?</h3><p>Get a free quote — we respond within one business hour.</p><a href="/contact/" class="btn-primary">Request Service</a></aside>
</article>
</main>
${footerHtml}
<script>(function(){var pb=document.getElementById('pb');var h=document.documentElement;function u(){pb.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight||1)*100)+'%'}addEventListener('scroll',u,{passive:true});u();})();</script>
</body></html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
