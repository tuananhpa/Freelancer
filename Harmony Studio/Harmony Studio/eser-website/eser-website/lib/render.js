'use strict';
/* Server-side render trang chủ ESER từ content.json.
 * Mọi chuỗi đều được escape; *chữ* trong tiêu đề → in nghiêng serif, xuống dòng → <br>. */

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rich = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em class="it">$1</em>').replace(/\r?\n/g, '<br>');
const plain = (s) => String(s == null ? '' : s).replace(/\*/g, '');
const href = (u) => { u = String(u || '').trim(); return /^(https?:\/\/|tel:|mailto:|#|\/)/i.test(u) ? esc(u) : '#'; };
const img = (u) => { u = String(u || '').trim(); return /^(https?:\/\/|\/)/i.test(u) ? esc(u) : ''; };
const pad = (n) => String(n).padStart(2, '0');
const money = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const digits = (s) => String(s || '').replace(/[^\d+]/g, '');
const fmtPhone = (s) => { const d = String(s || '').replace(/\D/g, ''); return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : String(s || ''); };
const arr = (a) => (Array.isArray(a) ? a : []);
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/* ---------- Mặt tiền phố Pháp (SVG thủ tục) cho lớp nền hero ---------- */
function facadeSVG() {
  const W = 1600, H = 900, bays = 9, bw = W / bays;
  let s = '';
  // cornice + floor lines
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#fg-sky)"/>`;
  s += `<g fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55">`;
  s += `<line x1="0" y1="118" x2="${W}" y2="118"/><line x1="0" y1="128" x2="${W}" y2="128"/><line x1="0" y1="470" x2="${W}" y2="470"/><line x1="0" y1="482" x2="${W}" y2="482"/>`;
  for (let i = 0; i <= bays; i++) {
    const x = i * bw;
    s += `<line x1="${x - 10}" y1="128" x2="${x - 10}" y2="${H}"/><line x1="${x + 10}" y1="128" x2="${x + 10}" y2="${H}"/>`;
  }
  for (let i = 0; i < bays; i++) {
    const cx = i * bw + bw / 2, w = bw * 0.5, r = w / 2;
    // tầng trên: cửa sổ vòm
    const t = 200, b = 430;
    s += `<path d="M${cx - r} ${b} V${t + r} A${r} ${r} 0 0 1 ${cx + r} ${t + r} V${b} Z"/>`;
    s += `<path d="M${cx - r + 9} ${b} V${t + r} A${r - 9} ${r - 9} 0 0 1 ${cx + r - 9} ${t + r} V${b}"/>`;
    s += `<line x1="${cx}" y1="${t + 9}" x2="${cx}" y2="${b}"/>`;
    for (let k = 1; k < 4; k++) s += `<line x1="${cx - r + 9}" y1="${t + r + k * ((b - t - r) / 4)}" x2="${cx + r - 9}" y2="${t + r + k * ((b - t - r) / 4)}"/>`;
    s += `<line x1="${cx - r - 14}" y1="${b + 8}" x2="${cx + r + 14}" y2="${b + 8}"/>`;
    // tầng dưới: cửa lớn
    const t2 = 540, w2 = bw * 0.62, r2 = w2 / 2;
    s += `<path d="M${cx - r2} ${H} V${t2 + r2} A${r2} ${r2} 0 0 1 ${cx + r2} ${t2 + r2} V${H}"/>`;
    s += `<path d="M${cx - r2 + 12} ${H} V${t2 + r2} A${r2 - 12} ${r2 - 12} 0 0 1 ${cx + r2 - 12} ${t2 + r2} V${H}"/>`;
  }
  // dentils
  for (let x = 0; x < W; x += 16) s += `<rect x="${x}" y="100" width="8" height="12"/>`;
  s += `</g>`;
  s += `<rect x="0" y="${H * 0.45}" width="${W}" height="${H * 0.55}" fill="url(#fg-fog)"/>`;
  return `<svg class="facade" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="fg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--paper-2)" stop-opacity=".0"/><stop offset="1" stop-color="var(--paper-2)" stop-opacity=".9"/></linearGradient>
<linearGradient id="fg-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--paper)" stop-opacity="0"/><stop offset=".7" stop-color="var(--paper)" stop-opacity=".85"/><stop offset="1" stop-color="var(--paper)" stop-opacity="1"/></linearGradient></defs>${s}</svg>`;
}

const ICON = {
  zalo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.5 2 2 5.9 2 10.7c0 2.7 1.4 5.1 3.7 6.7l-.6 3.6 3.6-1.9c1 .3 2.1.4 3.3.4 5.5 0 10-3.9 10-8.8S17.5 2 12 2zm-3.9 11.6H5.6v-.8l1.9-2.6H5.7V9.3h2.4v.8l-1.9 2.6h1.9v.9zm2.4 0h-.9V9.3h.9v4.3zm3.4 0h-.8l-.1-.3c-.3.2-.6.4-1 .4-.9 0-1.5-.7-1.5-1.6s.6-1.6 1.5-1.6c.4 0 .7.1 1 .4V11h.9v2.6zm2.9.1c-.9 0-1.6-.7-1.6-1.6 0-.9.7-1.6 1.6-1.6.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6zm0-.8c.4 0 .7-.4.7-.8s-.3-.8-.7-.8-.7.4-.7.8.3.8.7.8zm-4.6 0c.4 0 .7-.4.7-.8s-.3-.8-.7-.8-.7.4-.7.8.3.8.7.8z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>',
  fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v7h4v-7h3l.5-4h-3.5V9c0-.6.4-1 1-1z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/></svg>',
  tt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 3c.4 2.2 1.8 3.7 4 3.9v3.2c-1.5.1-2.8-.3-4-1.1v6.2c0 3.6-2.6 5.8-5.6 5.8a5.6 5.6 0 0 1-5.6-5.7c0-3.5 3-6 6.5-5.5v3.3c-1.6-.4-3.2.6-3.2 2.2 0 1.3 1 2.3 2.3 2.3 1.5 0 2.4-1 2.4-2.8V3h3.2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M3 6h18v12H3z M3 7l9 6 9-6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M6 18L18 6M8 6h10v10"/></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M5 8h14l-1 13H6L5 8zm4 0V6a3 3 0 0 1 6 0v2"/></svg>',
};

function productCard(p, idx, cat, layout, shape) {
  const imgs = arr(p.images).map(img).filter(Boolean);
  const label = `${pad(idx)} / ${esc((cat && cat.short) || 'ESER').toUpperCase()}`;
  const sizes = arr(p.sizes).map((z) => `<span>${esc(z)}</span>`).join('');
  const price = Number(p.price) > 0 ? `<b>${money(p.price)}</b><small>VNĐ</small>` : `<b class="price__ask">Liên hệ</b>`;
  const old = Number(p.oldPrice) > Number(p.price) ? `<s>${money(p.oldPrice)}đ</s>` : '';
  const media = `<div class="card__media rv mask-${shape}" data-view>
      ${imgs[0] ? `<img src="${imgs[0]}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : '<div class="ph"></div>'}
      ${imgs[1] ? `<img class="alt" src="${imgs[1]}" alt="" loading="lazy" decoding="async">` : ''}
      ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
      <span class="card__pill">Xem chi tiết →</span>
    </div>`;
  if (layout === 'feature') {
    return `<article class="card card--feature" role="button" tabindex="0" data-pid="${esc(p.id)}" aria-label="Xem ${esc(p.name)}" data-up>
    ${media}
    <div class="card__meta">
      <span class="mono">${label}</span>
      <h4 class="card__name card__name--xl">${esc(p.name)}</h4>
      <p class="card__desc">${esc(p.description)}</p>
      ${p.details ? `<p class="card__details mono">${esc(p.details).replace(/\r?\n/g, '<br>')}</p>` : ''}
      <div class="card__row"><div class="chips">${sizes}</div><span class="price">${old}${price}</span></div>
      <span class="btn btn--ink">Chọn size &amp; đặt hàng <i>→</i></span>
    </div></article>`;
  }
  return `<article class="card card--${layout}" role="button" tabindex="0" data-pid="${esc(p.id)}" aria-label="Xem ${esc(p.name)}" data-up>
    ${media}
    <div class="card__meta">
      <div class="card__top"><span class="mono">${label}</span><div class="chips">${sizes}</div></div>
      <h4 class="card__name">${esc(p.name)}</h4>
      <p class="card__desc">${esc(p.description)}</p>
      <span class="price">${old}${price}</span>
    </div></article>`;
}

/* Lưới bất đối xứng: 7/5 → 4/4/4 → 5/7 → 1 thẻ lớn, không để mồ côi */
function groupGrid(items, cats, startIdx) {
  const pattern = [['w7', 'n5'], ['t4', 't4', 't4'], ['n5', 'w7'], ['feature']];
  const shapes = ['arch', 'corner', 'plain', 'corner-l', 'arch', 'plain'];
  const rows = [];
  let i = 0, pi = 0, n = startIdx, sh = 0;
  while (i < items.length) {
    const left = items.length - i;
    let pat = pattern[pi % pattern.length];
    if (pat.length > left) pat = left === 1 ? ['feature'] : left === 2 ? ['w7', 'n5'] : ['t4', 't4', 't4'];
    const cells = pat.map((layout) => {
      const p = items[i++];
      return productCard(p, ++n, cats[p.category], layout, layout === 'feature' ? 'arch' : shapes[sh++ % shapes.length]);
    });
    rows.push(`<div class="row row--${pat.length === 1 ? 'feature' : pat.join('-')}">${cells.join('')}</div>`);
    pi++;
  }
  return { html: rows.join(''), n };
}

function renderPage(c, opt = {}) {
  const v = opt.v || '1';
  const site = c.site || {}, hero = c.hero || {}, about = c.about || {}, col = c.collection || {};
  const lines = c.lines || {}, proc = c.process || {}, lb = c.lookbook || {}, cta = c.cta || {}, ct = c.contact || {}, ft = c.footer || {};
  const cats = {}; arr(c.categories).forEach((k) => (cats[k.id] = k));
  const products = arr(c.products).filter((p) => p && p.visible !== false && p.name);
  const short = site.shortName || 'ESER';
  const wm = String(hero.wordmark || short);
  const phone = digits(ct.phone);
  const zaloUrl = ct.zalo ? `https://zalo.me/${digits(ct.zalo)}` : '';
  const heroImgs = arr(hero.images).map(img).filter(Boolean).slice(0, 3);

  /* nhóm sản phẩm theo danh mục */
  const groups = [];
  arr(c.categories).forEach((k) => { const it = products.filter((p) => p.category === k.id); if (it.length) groups.push({ cat: k, items: it }); });
  const orphan = products.filter((p) => !cats[p.category]);
  if (orphan.length) groups.push({ cat: { id: 'khac', name: 'Khác', short: 'ESER' }, items: orphan });
  let counter = 0;
  const groupsHTML = groups.map((g, gi) => {
    const r = groupGrid(g.items, cats, counter); counter = r.n;
    return `<div class="group" data-cat="${esc(g.cat.id)}">
      <div class="group__head" data-up><span class="mono">${LETTERS[gi] || '·'} — ${pad(g.items.length)} mẫu</span><h3 class="group__title">${esc(g.cat.name)}</h3><span class="group__rule"></span></div>
      ${r.html}</div>`;
  }).join('');

  const marqueeItems = arr((c.marquee || {}).items);
  const mq = marqueeItems.map((t, i) => `<span class="${i % 2 ? 'fill' : 'outline'}">${esc(t)}</span><i>✳</i>`).join('');

  const stats = arr(about.stats).map((s) => `<div class="stat" data-up><b class="stat__n" data-count="${esc(s.value)}">${esc(s.value)}</b><span class="mono">${esc(s.label)}</span></div>`).join('');

  const lineRows = arr(lines.items).map((l, i) => `<a class="line" href="${l.link ? href(l.link) : '#collection'}" ${l.category ? `data-filter="${esc(l.category)}"` : ''}>
      <span class="line__fill" aria-hidden="true"></span>
      <span class="mono line__i">${pad(i + 1)}</span>
      <span class="line__name">${esc(l.name)} <em class="it">${esc(l.qualifier)}</em></span>
      <span class="line__price">${esc(l.price)}</span>
      <span class="line__arrow">${ICON.arrow}</span></a>`).join('');

  const steps = arr(proc.steps).map((s, i) => `<li class="step" data-up><span class="mono step__n">${pad(i + 1)}</span><h4>${esc(s.title)}</h4><p>${esc(s.text)}</p></li>`).join('');

  const lbShapes = ['arch', 'plain', 'circle', 'corner', 'arch', 'corner-l', 'plain'];
  const lbItems = arr(lb.items).filter((x) => img(x.image)).map((x, i) => `<figure class="lb__item lb__item--${i % 3}">
      <div class="lb__media rv mask-${lbShapes[i % lbShapes.length]}" data-view><img src="${img(x.image)}" alt="${esc(plain(x.caption) || 'Lookbook ESER')}" loading="lazy" decoding="async"></div>
      <figcaption class="mono">${esc(x.caption)} <span>${pad(i + 1)}</span></figcaption></figure>`).join('');

  const socials = [
    zaloUrl && `<a class="soc" href="${esc(zaloUrl)}" target="_blank" rel="noopener">${ICON.zalo}<span>Zalo</span></a>`,
    ct.facebook && `<a class="soc" href="${href(ct.facebook)}" target="_blank" rel="noopener">${ICON.fb}<span>Facebook</span></a>`,
    ct.instagram && `<a class="soc" href="${href(ct.instagram)}" target="_blank" rel="noopener">${ICON.ig}<span>Instagram</span></a>`,
    ct.tiktok && `<a class="soc" href="${href(ct.tiktok)}" target="_blank" rel="noopener">${ICON.tt}<span>TikTok</span></a>`,
    ct.email && `<a class="soc" href="mailto:${esc(ct.email)}">${ICON.mail}<span>Email</span></a>`,
  ].filter(Boolean).join('');

  const catOptions = arr(c.categories).map((k) => `<option>${esc(k.name)}</option>`).join('');
  const pageData = {
    products: products.map((p) => ({ id: p.id, name: p.name, category: p.category, price: Number(p.price) || 0, oldPrice: Number(p.oldPrice) || 0, sizes: arr(p.sizes), description: p.description || '', details: p.details || '', images: arr(p.images).map(img).filter(Boolean), badge: p.badge || '' })),
    categories: arr(c.categories),
    zalo: zaloUrl, phone,
  };
  const dataJSON = JSON.stringify(pageData).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(site.seoTitle || site.name)}</title>
<meta name="description" content="${esc(site.seoDescription)}">
<meta name="theme-color" content="#F2ECE3">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(site.seoTitle || site.name)}">
<meta property="og:description" content="${esc(site.seoDescription)}">
${site.ogImage ? `<meta property="og:image" content="${img(site.ogImage)}">` : ''}
<link rel="icon" href="${img(site.logo) || '/images/logo.png'}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,800;0,900;1,500&family=Cormorant+Garamond:ital,wght@1,500;1,600&family=Be+Vietnam+Pro:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap&subset=vietnamese">
${heroImgs.map((u) => `<link rel="preload" as="image" href="${u}">`).join('')}
<link rel="stylesheet" href="/css/site.css?v=${v}">
<script>(function(d){var r=d.documentElement,m=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;r.classList.add('js');if(!m){r.classList.add('intro','has-curtain');setTimeout(function(){r.classList.remove('intro','has-curtain')},4500)}if('scrollRestoration' in history)history.scrollRestoration='manual'})(document)</script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'ClothingStore', name: site.name, slogan: site.slogan, telephone: phone, email: ct.email, address: { '@type': 'PostalAddress', streetAddress: ct.address, addressLocality: 'Hà Nội', addressCountry: 'VN' } }).replace(/</g, '\\u003c')}</script>
</head>
<body>
<a class="skip" href="#main">Bỏ qua tới nội dung</a>

<div class="curtain" aria-hidden="true">
  <div class="curtain__in">
    <span class="curtain__mark">${esc(short)}</span>
    <span class="mono curtain__slogan">${esc(site.slogan)}</span>
    <span class="mono curtain__count"><b>000</b></span>
  </div>
  <span class="curtain__bar"></span>
</div>
<div class="progress" aria-hidden="true"><span></span></div>

<header class="nav" id="nav">
  <div class="wrap nav__in">
    <a class="nav__logo" href="#top" aria-label="${esc(site.name)} — về đầu trang"><b>${esc(short)}</b><span>${esc(site.slogan)}</span></a>
    <nav class="nav__links" aria-label="Điều hướng chính">
      <a href="#collection">Bộ sưu tập</a><a href="#about">Về ${esc(short)}</a><a href="#lookbook">Lookbook</a><a href="#contact">Liên hệ</a>
    </nav>
    <div class="nav__right">
      ${phone ? `<a class="nav__phone mono" href="tel:${esc(phone)}">${esc(fmtPhone(ct.phone))}</a>` : ''}
      <button class="bagbtn" type="button" data-open-bag aria-label="Mở túi hàng">${ICON.bag}<span class="bagbtn__n" data-bag-count>0</span></button>
      <button class="burger" type="button" aria-label="Mở menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <nav class="wrap menu__in" aria-label="Menu di động">
    <a href="#collection">Bộ sưu tập</a><a href="#about">Về ${esc(short)}</a><a href="#lookbook">Lookbook</a><a href="#contact">Liên hệ</a>
    <div class="menu__foot mono">${phone ? `<a href="tel:${esc(phone)}">${esc(fmtPhone(ct.phone))}</a>` : ''}${ct.email ? `<a href="mailto:${esc(ct.email)}">${esc(ct.email)}</a>` : ''}</div>
  </nav>
</div>

<main id="main">
<!-- 1. HERO -->
<section class="hero" id="top">
  <div class="hero__back" data-par="0.15">${facadeSVG()}</div>
  <div class="hero__title" data-par="0.32">
    <p class="hero__tag it" data-in style="--d:.15s">${rich(hero.tagline)}</p>
    <h1 class="wm" data-fit="0.69" data-fit-m="0.92" aria-label="${esc(wm)} — ${esc(site.slogan)}">${[...wm].map((ch, i) => `<span class="wm__m"><span class="wm__l" style="--d:${(0.08 * i).toFixed(2)}s">${esc(ch)}</span></span>`).join('')}</h1>
  </div>
  <div class="hero__labels wrap mono">${arr(hero.labels).slice(0, 3).map((l, i) => `<span data-in style="--d:${(0.55 + i * 0.08).toFixed(2)}s">${esc(l)}</span>`).join('')}</div>
  <div class="hero__front" data-par="0.05">
    ${heroImgs.map((u, i) => `<div class="hero__arch hero__arch--${i}" data-in style="--d:${[0.35, 0.2, 0.45][i]}s"><div class="hero__img mask-arch"><img src="${u}" alt="${esc(site.name)} — look ${i + 1}" fetchpriority="${i === 1 ? 'high' : 'auto'}"></div></div>`).join('')}
  </div>
  <div class="hero__bar wrap">
    <p class="hero__pitch" data-in style="--d:.7s">${rich(hero.pitch)}</p>
    <div class="hero__actions" data-in style="--d:.8s">
      <a class="btn btn--ink" href="${href(hero.ctaLink)}">${esc(hero.ctaText)} <i>→</i></a>
      <a class="hero__cue mono" href="#marquee"><span class="hero__cue-line"></span>Cuộn</a>
    </div>
  </div>
</section>

<!-- 2. MARQUEE -->
<section class="marquee" id="marquee" aria-label="Danh mục">
  <div class="marquee__track"><div class="marquee__set">${mq}</div><div class="marquee__set" aria-hidden="true">${mq}</div></div>
</section>

<!-- 3. ABOUT -->
<section class="about wrap" id="about">
  <div class="about__grid">
    <p class="eyebrow mono">${esc(about.eyebrow)}</p>
    <div>
      <h2 class="statement" data-scrub>${rich(about.headline)}</h2>
      <p class="about__body" data-up>${esc(about.body)}</p>
    </div>
  </div>
  <div class="stats">${stats}</div>
</section>

<!-- 4. COLLECTION -->
<section class="collection" id="collection">
  <div class="wrap">
    <p class="eyebrow mono">${esc(col.eyebrow)}</p>
    <h2 class="giant" data-up>${esc(col.title)}<sup class="mono">(${pad(products.length)})</sup></h2>
    <div class="collection__bar">
      <p class="collection__intro" data-up>${esc(col.intro)}</p>
      <div class="pills" role="group" aria-label="Lọc theo danh mục">
        <button type="button" class="pill is-on" data-filter="all" aria-pressed="true">Tất cả</button>
        ${groups.map((g) => `<button type="button" class="pill" data-filter="${esc(g.cat.id)}" aria-pressed="false">${esc(g.cat.name)}</button>`).join('')}
      </div>
    </div>
    ${groupsHTML || '<p class="empty">Bộ sưu tập đang được cập nhật.</p>'}
  </div>
</section>

<!-- 5. LINES -->
${lineRows ? `<section class="lines" id="lines">
  <div class="wrap">
    <div class="lines__head"><p class="eyebrow mono">${esc(lines.eyebrow)}</p><h2 class="h2" data-scrub>${rich(lines.title)}</h2></div>
    <div class="lines__list">${lineRows}</div>
  </div>
</section>` : ''}

<!-- 6. PROCESS (dark) -->
<section class="process" id="process">
  <canvas class="silk" aria-hidden="true"></canvas>
  <div class="wrap process__in">
    <p class="eyebrow mono">${esc(proc.eyebrow)}</p>
    <h2 class="h2 h2--light" data-scrub>${rich(proc.title)}</h2>
    <ol class="steps">${steps}</ol>
    ${proc.noticeText ? `<div class="notice" data-up>
      <span class="mono notice__t">✳ ${esc(proc.noticeTitle || 'Lưu ý')}</span>
      <p>${esc(proc.noticeText)}</p>
      ${zaloUrl ? `<a class="btn btn--cream" href="${esc(zaloUrl)}" target="_blank" rel="noopener">${esc(proc.noticeCta || 'Chat Zalo')} <i>→</i></a>` : ''}
    </div>` : ''}
  </div>
</section>

<!-- 7. LOOKBOOK (ghim + trượt ngang) -->
<section class="lookbook" id="lookbook">
  <div class="lookbook__pin">
    <div class="lookbook__track">
      <div class="lb__intro">
        <p class="eyebrow mono">${esc(lb.eyebrow)}</p>
        <h2 class="giant giant--lb">${rich(lb.title)}</h2>
        <p class="mono lb__hint">Cuộn để xem →</p>
      </div>
      ${lbItems}
    </div>
  </div>
</section>
${lb.quote ? `<section class="quote wrap"><p class="quote__t" data-scrub>${esc(lb.quote)} <span class="muted">${esc(lb.quoteMuted)}</span></p></section>` : ''}

<!-- 8. CTA -->
<section class="cta" id="cta">
  <div class="cta__glow" aria-hidden="true"></div>
  <div class="wrap cta__in">
    <p class="eyebrow mono">${esc(cta.eyebrow)}</p>
    <h2 class="cta__l1" data-up>${esc(cta.line1)}</h2>
    <p class="cta__l2 it" data-up>${esc(cta.line2)}</p>
    <p class="cta__t" data-up>${esc(cta.text)}</p>
    <a class="btn btn--rouge" href="${href(cta.buttonLink)}" data-up>${esc(cta.buttonText)} <i>→</i></a>
  </div>
</section>

<!-- 9. CONTACT -->
<section class="contact wrap" id="contact">
  <div class="contact__grid">
    <div class="contact__info">
      <p class="eyebrow mono">${esc(ct.eyebrow)}</p>
      <h2 class="h2" data-scrub>${rich(ct.headline)}</h2>
      ${phone ? `<a class="contact__phone" href="tel:${esc(phone)}">${esc(fmtPhone(ct.phone))}</a>` : ''}
      <dl class="contact__dl">
        ${ct.address ? `<div><dt class="mono">Địa chỉ</dt><dd>${esc(ct.address)}</dd></div>` : ''}
        ${ct.email ? `<div><dt class="mono">Email</dt><dd><a href="mailto:${esc(ct.email)}">${esc(ct.email)}</a></dd></div>` : ''}
        ${ct.hours ? `<div><dt class="mono">Giờ mở cửa</dt><dd>${esc(ct.hours)}</dd></div>` : ''}
      </dl>
      <div class="socials">${socials}</div>
    </div>
    <form class="form" id="contact-form" novalidate>
      <h3 class="form__t">${esc(ct.formTitle || 'Để lại lời nhắn')}</h3>
      <p class="form__note">${esc(ct.formNote)}</p>
      <label class="fld"><span class="mono">Họ tên *</span><input name="name" required autocomplete="name" maxlength="80"></label>
      <label class="fld"><span class="mono">Số điện thoại *</span><input name="phone" required inputmode="tel" autocomplete="tel" maxlength="20"></label>
      <label class="fld"><span class="mono">Bạn quan tâm</span><select name="interest"><option value="">— Chọn —</option>${catOptions}<option>Tư vấn phối đồ</option></select></label>
      <label class="fld"><span class="mono">Lời nhắn</span><textarea name="message" rows="3" maxlength="1500" placeholder="Chiều cao, cân nặng, dịp cần mặc…"></textarea></label>
      <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
      <button class="btn btn--ink" type="submit">Gửi cho ${esc(short)} <i>→</i></button>
      <p class="form__msg" role="status" aria-live="polite"></p>
    </form>
  </div>
  ${ct.mapQuery ? `<div class="map mask-corner rv"><iframe title="Bản đồ ${esc(site.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(ct.mapQuery)}&amp;output=embed"></iframe></div>` : ''}
</section>
</main>

<!-- 10. FOOTER -->
<footer class="footer">
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__brand">
        ${img(site.logo) ? `<img class="footer__logo" src="${img(site.logo)}" alt="Logo ${esc(site.name)}" loading="lazy">` : ''}
        <p>${esc(ft.blurb)}</p>
      </div>
      <div class="footer__col"><p class="mono">Bộ sưu tập</p>${groups.map((g) => `<a href="#collection" data-filter="${esc(g.cat.id)}">${esc(g.cat.name)}</a>`).join('')}</div>
      <div class="footer__col"><p class="mono">${esc(short)}</p><a href="#about">Về chúng tôi</a><a href="#process">Mua sắm &amp; đổi size</a><a href="#lookbook">Lookbook</a><a href="#contact">Liên hệ</a></div>
      <div class="footer__col"><p class="mono">Liên hệ</p>${phone ? `<a href="tel:${esc(phone)}">${esc(fmtPhone(ct.phone))}</a>` : ''}${ct.email ? `<a href="mailto:${esc(ct.email)}">${esc(ct.email)}</a>` : ''}<span>${esc(ct.address)}</span></div>
    </div>
    <div class="footer__bar mono"><span>© ${new Date().getFullYear()} ${esc(site.name)}</span><span>${esc(site.slogan)} — ${esc(site.sloganVi)}</span><a href="#top">Lên đầu trang ↑</a></div>
  </div>
  <div class="footer__wm" aria-hidden="true"><span data-fit="0.86" data-fit-m="0.9">${esc(wm)}</span></div>
</footer>

<!-- nổi: gọi / zalo -->
<div class="float">
  ${zaloUrl ? `<a class="float__b float__b--zalo" href="${esc(zaloUrl)}" target="_blank" rel="noopener" aria-label="Chat Zalo">${ICON.zalo}</a>` : ''}
  ${phone ? `<a class="float__b" href="tel:${esc(phone)}" aria-label="Gọi ${esc(fmtPhone(ct.phone))}">${ICON.phone}</a>` : ''}
</div>

<!-- product sheet -->
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-name" hidden>
  <div class="sheet__scrim" data-close></div>
  <div class="sheet__panel">
    <button class="sheet__x" type="button" data-close aria-label="Đóng">✕</button>
    <div class="sheet__media"><div class="sheet__main mask-arch"><img alt=""></div><div class="sheet__thumbs"></div></div>
    <div class="sheet__body">
      <span class="mono sheet__cat"></span>
      <h3 id="sheet-name" class="sheet__name"></h3>
      <p class="sheet__desc"></p>
      <p class="sheet__details mono"></p>
      <div class="sheet__opt"><span class="mono">Chọn size</span><div class="sizes" role="radiogroup" aria-label="Size"></div></div>
      <div class="sheet__opt"><span class="mono">Số lượng</span><div class="stepper"><button type="button" data-step="-1" aria-label="Giảm">−</button><output>1</output><button type="button" data-step="1" aria-label="Tăng">+</button></div></div>
      <div class="sheet__total"><span class="mono">Tạm tính</span><b class="sheet__sum"></b></div>
      <div class="sheet__actions">
        <button class="btn btn--ink" type="button" data-add>Thêm vào túi <i>→</i></button>
        ${zaloUrl ? `<a class="btn btn--line" data-zalo href="${esc(zaloUrl)}" target="_blank" rel="noopener">Hỏi qua Zalo</a>` : ''}
      </div>
      <p class="mono sheet__hint">Chưa chắc size? Nhắn ESER chiều cao &amp; cân nặng để được tư vấn.</p>
    </div>
  </div>
</div>

<!-- bag drawer -->
<aside class="bag" id="bag" role="dialog" aria-modal="true" aria-labelledby="bag-t" hidden>
  <div class="bag__scrim" data-close-bag></div>
  <div class="bag__panel">
    <div class="bag__head"><h3 id="bag-t">Túi của bạn <sup class="mono" data-bag-count>0</sup></h3><button type="button" class="sheet__x" data-close-bag aria-label="Đóng">✕</button></div>
    <div class="bag__items"></div>
    <div class="bag__foot">
      <div class="sheet__total"><span class="mono">Tổng tạm tính</span><b class="bag__sum">0đ</b></div>
      <form class="form form--bag" id="order-form" novalidate>
        <label class="fld"><span class="mono">Họ tên *</span><input name="name" required autocomplete="name" maxlength="80"></label>
        <label class="fld"><span class="mono">Số điện thoại *</span><input name="phone" required inputmode="tel" autocomplete="tel" maxlength="20"></label>
        <label class="fld"><span class="mono">Địa chỉ nhận hàng</span><input name="address" autocomplete="street-address" maxlength="200"></label>
        <label class="fld"><span class="mono">Ghi chú</span><input name="message" maxlength="500" placeholder="Chiều cao, cân nặng, giờ nhận…"></label>
        <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
        <button class="btn btn--rouge" type="submit">Gửi đơn đặt hàng <i>→</i></button>
        <p class="form__msg" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>
</aside>

<div class="toast" role="status" aria-live="polite"></div>
<div class="cursor-pill mono" aria-hidden="true">Xem</div>

<script id="eser-data" type="application/json">${dataJSON}</script>
<script src="/js/site.js?v=${v}" defer></script>
</body>
</html>`;
}

module.exports = { renderPage, esc, rich };
