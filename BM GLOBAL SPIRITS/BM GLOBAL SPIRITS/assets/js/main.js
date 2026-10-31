/* ==========================================================================
   BM Global Spirits — main.js
   Thông tin liên hệ: sửa MỘT chỗ duy nhất trong object SITE bên dưới.
   ========================================================================== */

/* 1. SITE — giá trị giữ chỗ, chờ khách cung cấp [[CẦN XÁC NHẬN]] ---------- */
const SITE = {
  name: 'BM Global Spirits',
  legalName: 'Công ty [[CẦN XÁC NHẬN]]',
  hotline: '0900 000 000',               // [[CẦN XÁC NHẬN]]
  hotlineHref: 'tel:+84900000000',       // [[CẦN XÁC NHẬN]]
  zalo: 'https://zalo.me/0900000000',    // [[CẦN XÁC NHẬN]]
  messenger: 'https://m.me/bmglobalspirits', // [[CẦN XÁC NHẬN]]
  facebook: 'https://facebook.com/bmglobalspirits', // [[CẦN XÁC NHẬN]]
  email: 'lienhe@bmglobalspirits.vn',    // [[CẦN XÁC NHẬN]]
  address: 'Số nhà, đường, phường, TP. Hồ Chí Minh', // [[CẦN XÁC NHẬN]]
  city: 'TP. Hồ Chí Minh',               // [[CẦN XÁC NHẬN]]
  hours: [['Thứ Hai – Thứ Bảy', '9:00 – 21:00'], ['Chủ nhật', '10:00 – 18:00']], // [[CẦN XÁC NHẬN]]
  license: 'Giấy phép kinh doanh rượu số [[CẦN XÁC NHẬN]]',
  year: new Date().getFullYear(),
};

/* 2. DỮ LIỆU ---------------------------------------------------------------- */
const D = window.BM_DATA || { categories: [], brands: {}, products: [] };
const P = D.products;
const byId = Object.fromEntries(P.map(p => [p.id, p]));
const CAT = Object.fromEntries(D.categories.map(c => [c.id, c]));
const TYPE = {};
D.categories.forEach(c => c.types.forEach(t => { TYPE[t.id] = { ...t, cat: c.id }; }));

const count = (fn) => P.filter(fn).length;
const brandName = (p) => (D.brands[p.brand] || {}).name || '';
const brandOrigin = (p) => (D.brands[p.brand] || {}).origin || '';
const groupName = (p) => (p.type ? TYPE[p.type].name : CAT[p.cat].name);
const realBrands = Object.entries(D.brands).filter(([k]) => !k.startsWith('other'));
const countries = [...new Set(realBrands.map(([, b]) => b.origin).filter(Boolean))];

const fmtAbv = (v) => (v ? String(v).replace('.', ',') + '%' : '');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = {
  product: (p) => `chi-tiet-san-pham.html?id=${p.id}`,
  list: (q = {}) => 'san-pham.html' + (Object.keys(q).length ? '?' + new URLSearchParams(q).toString() : ''),
};
const img = (id, size = 600) => `assets/img/products/${size}/${id}.webp`;
const srcset = (id) => `${img(id, 300)} 300w, ${img(id, 600)} 600w, ${img(id, 1200)} 1200w`;

/* màu vệt sáng lấy từ màu chai: giữ sắc, nâng độ sáng để luôn "phát sáng" */
function glow(p) {
  const rgb = (p && p.rgb) || [201, 151, 75];
  let [r, g, b] = rgb.map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0, l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  s = Math.min(0.78, s * 1.15);
  l = Math.max(0.58, Math.min(0.7, l + 0.12));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, pp = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255)).join(' ');
}

const TONES = ['oak', 'claret', 'bottle', 'night'];
function niche(p, { tone = 'oak', sizes = '(max-width: 960px) 50vw, 25vw', eager = false, cls = '', mirror = true, alt } = {}) {
  if (!p) return '';
  const a = alt ?? `${p.name}${p.vol ? ' ' + p.vol : ''}`;
  return `<div class="niche ${cls}" data-tone="${tone}" style="--glow:${glow(p)}">
    <span class="niche__beam" aria-hidden="true"></span>
    ${mirror ? `<img class="niche__mirror" src="${img(p.id, 300)}" alt="" aria-hidden="true" loading="lazy" width="300" height="400">` : ''}
    <span class="niche__shadow" aria-hidden="true"></span>
    <img class="niche__img" src="${img(p.id, 600)}" srcset="${srcset(p.id)}" sizes="${sizes}" alt="${esc(a)}" width="600" height="800" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
  </div>`;
}
function metaLine(p) {
  return [groupName(p), p.vol].filter(Boolean).join(' · ');
}
function card(p, i = 0, opts = {}) {
  return `<article class="card ${opts.cls || ''}"${opts.style ? ` style="${opts.style}"` : ''}>
    <a href="${url.product(p)}" class="card__link" aria-label="${esc(p.name)}">
      ${niche(p, { tone: 'oak', sizes: opts.sizes || '(max-width: 960px) 50vw, 240px' })}
      <div class="card__body">
        <span class="card__meta label">${esc(brandName(p))}</span>
        <h3 class="card__name">${esc(p.name)}</h3>
        <p class="card__foot soft">${esc([metaLine(p), p.pack ? `Thùng ${p.pack}` : ''].filter(Boolean).join(' · '))}</p>
      </div>
    </a>
    ${opts.quick === false ? '' : `<div class="card__quick"><button type="button" data-quick="${p.id}">Xem nhanh</button></div>`}
  </article>`;
}

/* 3. ICONS (nét mảnh 1.4px, cùng một bộ) -------------------------------------- */
const ICONS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h12"/></symbol>
<symbol id="i-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h16M14 6l6 6-6 6"/></symbol>
<symbol id="i-arrow-ur" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></symbol>
<symbol id="i-zalo" viewBox="0 0 24 24"><path d="M12 3.5c-5 0-9 3.4-9 7.6 0 2.4 1.3 4.5 3.3 5.9L5.5 20.5l4-2a10.6 10.6 0 0 0 2.5.3c5 0 9-3.4 9-7.6s-4-7.7-9-7.7Z"/><path d="M8 9h3.5L8 13.5h3.5M14 9v4.5"/></symbol>
<symbol id="i-messenger" viewBox="0 0 24 24"><path d="M12 3C7 3 3 6.7 3 11.4c0 2.6 1.2 4.9 3.2 6.5V21l3-1.6c.9.2 1.8.4 2.8.4 5 0 9-3.7 9-8.4S17 3 12 3Z"/><path d="m7.5 13.5 3-3.2 2.3 2 3.7-2.6-3 3.2-2.3-2Z"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4Z"/><path d="M8 10h8M8 13h5"/></symbol>
<symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.5L16 9.5"/></symbol>
<symbol id="i-zoom" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 8v5M8 10.5h5"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14"/><path d="m3 6 9 7 9-7"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/></symbol>
</svg>`;
const ic = (n, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

/* 4. KHUNG CHUNG: header, mega menu, tìm kiếm, footer, nút liên hệ, xác nhận tuổi */
const page = document.body.dataset.page || '';

function megaMenu() {
  const col = (cats) => cats.map((cid) => {
    const c = CAT[cid];
    const items = c.types.length
      ? c.types.map((t) => `<li><a href="${url.list({ cat: cid, type: t.id })}">${esc(t.name)}<span class="num">${count((p) => p.type === t.id)}</span></a></li>`).join('')
      : topBrands(cid, 4).map(([b, n]) => `<li><a href="${url.list({ cat: cid, brand: b })}">${esc(D.brands[b].name)}<span class="num">${n}</span></a></li>`).join('');
    return `<div class="mega__group"><h3><a href="${url.list({ cat: cid })}">${esc(c.name)}</a></h3><ul class="mega__list">${items}</ul></div>`;
  }).join('');
  const feat = byId[FEATURE_MEGA] || P[0];
  return `<div class="mega" id="mega" role="region" aria-label="Danh mục sản phẩm"><div class="wrap mega__in">
    <div class="mega__col">${col(['whisky', 'cognac-brandy'])}</div>
    <div class="mega__col">${col(['spirits', 'japanese-spirits'])}</div>
    <div class="mega__col">${col(['liqueurs-aperitifs', 'vietnamese-spirits'])}</div>
    <div class="mega__col mega__feature">
      <a href="${url.product(feat)}">${niche(feat, { tone: 'claret', sizes: '200px', mirror: false })}</a>
      <div><p class="label soft">${esc(brandName(feat))}</p><p class="h3" style="margin-top:6px">${esc(feat.name)}</p>
      <p class="small soft">${esc(metaLine(feat))}</p><p style="margin-top:16px"><a class="link" href="${url.list()}">Xem toàn bộ ${P.length} sản phẩm ${ic('arrow')}</a></p></div>
    </div></div></div>`;
}
function topBrands(cat, n) {
  const m = {};
  P.filter((p) => p.cat === cat && !p.brand.startsWith('other')).forEach((p) => { m[p.brand] = (m[p.brand] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
}

function header() {
  const cur = (p) => (page === p ? ' aria-current="page"' : '');
  return `<a class="skip" href="#main">Bỏ qua, tới nội dung chính</a>
  <header class="site-header" id="header">
    <div class="wrap site-header__in">
      <a class="brand" href="index.html" aria-label="BM Global Spirits — Trang chủ">
        <img class="brand__mark" src="assets/img/brand/mark.svg" alt="" width="34" height="40">
        <img class="brand__word" src="assets/img/brand/word.svg" alt="" width="132" height="15">
      </a>
      <nav class="nav" aria-label="Chính">
        <button class="nav__link" type="button" aria-expanded="false" aria-controls="mega" id="megaBtn"${page === 'catalog' || page === 'product' ? ' aria-current="page"' : ''}>Sản phẩm ${ic('down')}</button>
        <a class="nav__link" href="${url.list({ cat: 'whisky' })}">Whisky</a>
        <a class="nav__link" href="${url.list({ cat: 'vietnamese-spirits' })}">Rượu Việt</a>
        <a class="nav__link" href="gioi-thieu.html"${cur('about')}>Giới thiệu</a>
        <a class="nav__link" href="lien-he.html"${cur('contact')}>Liên hệ</a>
      </nav>
      <div class="header-tools">
        <button class="icon-btn" type="button" data-open-search aria-label="Tìm sản phẩm">${ic('search')}</button>
        <a class="btn btn--sm" href="${SITE.zalo}" target="_blank" rel="noopener">${ic('zalo')}Hỏi giá</a>
        <button class="icon-btn menu-btn" type="button" aria-label="Mở menu" aria-expanded="false" aria-controls="drawerNav" id="menuBtn">${ic('menu')}</button>
      </div>
    </div>
    ${megaMenu()}
  </header>
  <div class="drawer-nav" id="drawerNav" aria-label="Menu">
    <details open><summary>Sản phẩm ${ic('plus')}</summary><div class="drawer-nav__sub">
      ${D.categories.map((c) => `<a href="${url.list({ cat: c.id })}">${esc(c.name)}<span class="num soft">${count((p) => p.cat === c.id)}</span></a>`).join('')}
      <a href="${url.list()}" class="gold">Tất cả<span class="num">${P.length}</span></a>
    </div></details>
    <div class="drawer-nav__big"><a href="gioi-thieu.html">Giới thiệu</a><a href="lien-he.html">Liên hệ</a></div>
    <p class="small soft" style="margin-top:32px">Hotline <a class="gold" href="${SITE.hotlineHref}">${SITE.hotline}</a></p>
    <p class="age-note" style="margin-top:8px">Không dành cho người dưới 18 tuổi.</p>
  </div>
  <div class="search" id="search" role="dialog" aria-modal="true" aria-label="Tìm sản phẩm">
    <div class="search__panel"><div class="wrap">
      <form class="search__row" action="san-pham.html" role="search">
        ${ic('search')}
        <label class="sr-only" for="searchInput">Tên sản phẩm hoặc thương hiệu</label>
        <input class="search__input" id="searchInput" name="q" type="search" autocomplete="off" placeholder="Macallan, Hennessy, Dassai…">
        <button class="icon-btn" type="button" data-close-search aria-label="Đóng">${ic('x')}</button>
      </form>
      <div class="search__results" id="searchResults"></div>
      <p class="search__hint" id="searchHint">Gõ tên chai hoặc thương hiệu — ${P.length} sản phẩm, ${realBrands.length} thương hiệu.</p>
    </div></div>
  </div>`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="foot-grid">
      <div class="foot-tile foot-tile--statement">
        <p>Rượu mạnh nhập khẩu, chọn từng chai, giao tận tay.</p>
        <p class="age-note">Sản phẩm dành cho người từ 18 tuổi trở lên. Thưởng thức có trách nhiệm — đã uống rượu bia, không lái xe.</p>
      </div>
      <nav class="foot-tile foot-tile--nav" aria-label="Chân trang">
        <h3>Danh mục</h3>
        ${D.categories.map((c) => `<a href="${url.list({ cat: c.id })}">${esc(c.name)}</a>`).join('')}
      </nav>
      <div class="foot-tile foot-tile--hours">
        <h3>Giờ làm việc</h3>
        <ul>${SITE.hours.map(([d, h]) => `<li>${d}<br><span class="num">${h}</span></li>`).join('')}</ul>
      </div>
      <div class="foot-tile foot-tile--contact">
        <div><h3>Liên hệ</h3>
          <a href="${SITE.hotlineHref}" class="num">${SITE.hotline}</a>
          <a href="mailto:${SITE.email}">${SITE.email}</a>
        </div>
        <p class="soft">${SITE.address}</p>
      </div>
      <div class="foot-tile foot-tile--word" aria-hidden="true"><img src="assets/img/brand/word-gold.svg" alt="" width="2128" height="241" style="width:min(70%,680px);opacity:.85"></div>
      <a class="foot-tile foot-tile--cta" href="${SITE.zalo}" target="_blank" rel="noopener">
        <p>Nhắn Zalo hỏi giá</p>
        <svg class="arrow" viewBox="0 0 56 56" aria-hidden="true"><path d="M10 46 46 10M18 10h28v28"/></svg>
      </a>
    </div>
    <div class="foot-legal">
      <span>© ${SITE.year} ${SITE.name}. ${SITE.license}</span>
      <span><strong>Không dành cho người dưới 18 tuổi.</strong></span>
    </div>
  </footer>
  <div class="fab" id="fab">
    <div class="fab__list" id="fabList">
      <a class="fab__item" href="${SITE.zalo}" target="_blank" rel="noopener">${ic('zalo')}Zalo</a>
      <a class="fab__item" href="${SITE.messenger}" target="_blank" rel="noopener">${ic('messenger')}Messenger</a>
      <a class="fab__item" href="${SITE.hotlineHref}">${ic('phone')}<span class="num">${SITE.hotline}</span></a>
    </div>
    <button class="fab__toggle" type="button" aria-expanded="false" aria-controls="fabList" aria-label="Liên hệ nhanh">${ic('chat', 'icon-chat')}${ic('x', 'icon-x')}</button>
  </div>
  <nav class="mbar" aria-label="Liên hệ nhanh">
    <a href="${SITE.zalo}" target="_blank" rel="noopener">${ic('zalo')}Zalo</a>
    <a href="${SITE.messenger}" target="_blank" rel="noopener">${ic('messenger')}Messenger</a>
    <a href="${SITE.hotlineHref}">${ic('phone')}Gọi Hotline</a>
  </nav>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

function ageGate() {
  let ok = false;
  try { ok = localStorage.getItem('bm-age-ok') === '1'; } catch (e) { ok = false; }
  if (ok) return;
  const g = document.createElement('div');
  g.className = 'gate';
  g.setAttribute('role', 'dialog');
  g.setAttribute('aria-modal', 'true');
  g.setAttribute('aria-labelledby', 'gateTitle');
  g.innerHTML = `<span class="gate__beam" aria-hidden="true"></span>
    <div class="gate__box">
      <img class="gate__mark" src="assets/img/brand/mark.svg" alt="BM Global Spirits" width="64" height="75">
      <h2 id="gateTitle">Bạn đã đủ 18 tuổi?</h2>
      <p>Website giới thiệu đồ uống có cồn, chỉ dành cho người từ 18 tuổi trở lên.</p>
      <div class="gate__actions">
        <button class="btn" type="button" data-age="yes">Tôi đã đủ 18 tuổi</button>
        <button class="btn btn--ghost" type="button" data-age="no">Chưa đủ 18 tuổi</button>
      </div>
      <p class="gate__no">Hẹn gặp lại bạn khi đủ tuổi. Cảm ơn bạn đã ghé thăm.</p>
      <p class="gate__law">Theo Luật Phòng, chống tác hại của rượu, bia — không bán rượu cho người dưới 18 tuổi.</p>
    </div>`;
  document.body.appendChild(g);
  document.body.classList.add('is-locked');
  const untrap = trap(g);
  g.querySelector('[data-age="yes"]').focus();
  g.addEventListener('click', (e) => {
    const b = e.target.closest('[data-age]');
    if (!b) return;
    if (b.dataset.age === 'yes') {
      try { localStorage.setItem('bm-age-ok', '1'); } catch (err) { /* chế độ riêng tư */ }
      untrap();
      g.classList.add('is-done');
      document.body.classList.remove('is-locked');
      document.dispatchEvent(new CustomEvent('bm:age-ok'));
      setTimeout(() => g.remove(), 800);
    } else {
      g.classList.add('is-denied');
    }
  });
}

/* 5. HÀNH VI CHUNG ------------------------------------------------------------ */
/* giữ focus trong hộp thoại đang mở */
function trap(el) {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    const f = [...el.querySelectorAll(sel)].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}

/* mở/đóng lớp nổi: hiện (display) trước, rồi mới chạy chuyển động; đóng xong thì ẩn hẳn */
function pop(el, open, cls = 'is-open') {
  if (!el) return;
  clearTimeout(el._popT);
  if (open) {
    el.classList.add('is-shown');
    void el.offsetWidth;
    el.classList.add(cls);
  } else {
    el.classList.remove(cls);
    el._popT = setTimeout(() => { if (!el.classList.contains(cls)) el.classList.remove('is-shown'); }, 420);
  }
}
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('is-on'), 3200);
}
function askText(p) { return `Chào BM Global Spirits, cho mình hỏi giá: ${p.name}${p.vol ? ' ' + p.vol : ''} (mã ${p.id}).`; }
function copy(text) {
  try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) { /* bỏ qua */ }
}

function initChrome() {
  document.body.insertAdjacentHTML('afterbegin', ICONS + header());
  document.body.insertAdjacentHTML('beforeend', footer());
  const h = document.getElementById('header');
  const overHero = !!document.querySelector('[data-header-over]');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    h.classList.toggle('is-solid', !overHero || y > 40);
    if (!h.classList.contains('is-open')) h.classList.toggle('is-hidden', y > 700 && y > lastY + 4);
    if (y < lastY - 4) h.classList.remove('is-hidden');
    lastY = y;
  };
  const fabEl = () => document.getElementById('fab');
  const onScrollFab = () => { const f = fabEl(); if (f && page !== 'product') f.classList.toggle('is-visible', window.scrollY > 560); };
  onScroll();
  window.addEventListener('scroll', () => { onScroll(); onScrollFab(); }, { passive: true });
  setTimeout(onScrollFab, 0);

  // mega menu
  const megaBtn = document.getElementById('megaBtn');
  const mega = document.getElementById('mega');
  let tOpen, tClose;
  const setMega = (open) => {
    if (!open && !mega.classList.contains('is-open')) return;
    pop(mega, open);
    h.classList.toggle('is-open', open || document.getElementById('drawerNav').classList.contains('is-open'));
    megaBtn.setAttribute('aria-expanded', open);
  };
  megaBtn.addEventListener('click', () => setMega(!mega.classList.contains('is-open')));
  [megaBtn, mega].forEach((el) => {
    el.addEventListener('mouseenter', () => { clearTimeout(tClose); tOpen = setTimeout(() => setMega(true), 90); });
    el.addEventListener('mouseleave', () => { clearTimeout(tOpen); tClose = setTimeout(() => setMega(false), 220); });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setMega(false); closeSearch(); closeDrawer(); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('#mega, #megaBtn')) setMega(false); });

  // menu mobile
  const menuBtn = document.getElementById('menuBtn');
  const drawer = document.getElementById('drawerNav');
  function closeDrawer() { pop(drawer, false); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.innerHTML = ic('menu'); h.classList.remove('is-open'); document.body.classList.remove('is-locked'); }
  menuBtn.addEventListener('click', () => {
    const open = !drawer.classList.contains('is-open');
    if (!open) return closeDrawer();
    pop(drawer, true); h.classList.add('is-open'); menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.innerHTML = ic('x'); document.body.classList.add('is-locked');
  });

  // tìm kiếm
  const s = document.getElementById('search');
  const si = document.getElementById('searchInput');
  const sr = document.getElementById('searchResults');
  let untrapS = null;
  function openSearch() { untrapS = trap(s); pop(s, true); document.body.classList.add('is-locked'); setTimeout(() => si.focus(), 60); }
  function closeSearch() { if (untrapS) { untrapS(); untrapS = null; } pop(s, false); if (!drawer.classList.contains('is-open')) document.body.classList.remove('is-locked'); }
  document.querySelectorAll('[data-open-search]').forEach((b) => b.addEventListener('click', openSearch));
  s.querySelector('[data-close-search]').addEventListener('click', closeSearch);
  s.addEventListener('click', (e) => { if (e.target === s) closeSearch(); });
  si.addEventListener('input', () => {
    const q = si.value.trim();
    if (q.length < 2) { sr.innerHTML = ''; return; }
    const res = search(q).slice(0, 9);
    sr.innerHTML = res.length
      ? res.map((p) => `<a class="search__item" href="${url.product(p)}"><img src="${img(p.id, 300)}" alt="" loading="lazy" width="52" height="70"><span><b>${esc(p.name)}</b><span>${esc(brandName(p))} · ${esc(metaLine(p))}</span></span></a>`).join('')
      : `<p class="soft">Chưa thấy "${esc(q)}". Thử tên thương hiệu, hoặc <a class="gold" href="${SITE.zalo}">hỏi chúng tôi qua Zalo</a>.</p>`;
    document.getElementById('searchHint').innerHTML = res.length ? `Nhấn Enter để xem tất cả kết quả cho “${esc(q)}”.` : '';
  });

  // nút liên hệ nổi
  const fab = document.getElementById('fab');
  fab.querySelector('.fab__toggle').addEventListener('click', (e) => {
    const open = !fab.classList.contains('is-open');
    pop(fab, open);
    e.currentTarget.setAttribute('aria-expanded', open);
  });

  // form: chỉ hiện thông báo gửi thành công (mockup)
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-fake]');
    if (!f) return;
    e.preventDefault();
    let first = null;
    f.querySelectorAll('input, textarea').forEach((i) => {
      const field = i.closest('.field');
      if (!field) return;
      let msg = '';
      if (i.required && !i.value.trim()) msg = i.name === 'phone' ? 'Cho chúng tôi số điện thoại để gọi lại.' : 'Vui lòng điền mục này.';
      else if (i.type === 'tel' && i.value && !/^[+\d][\d\s.-]{7,}$/.test(i.value.trim())) msg = 'Số điện thoại chưa đúng — ví dụ 0901 234 567.';
      else if (i.type === 'email' && i.value && !i.checkValidity()) msg = 'Email chưa đúng định dạng.';
      field.classList.toggle('is-invalid', !!msg);
      i.setAttribute('aria-invalid', msg ? 'true' : 'false');
      let err = field.querySelector('.field__err');
      if (msg) {
        if (!err) { err = document.createElement('p'); err.className = 'field__err'; err.id = i.id + 'Err'; field.appendChild(err); i.setAttribute('aria-describedby', err.id); }
        err.textContent = msg;
        first = first || i;
      } else if (err) err.remove();
    });
    if (first) { first.focus(); return; }
    const btn = f.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang gửi…'; }
    setTimeout(() => { f.classList.add('is-sent'); const ok = f.querySelector('.form__ok'); if (ok) { ok.setAttribute('tabindex', '-1'); ok.focus(); } }, 700);
  });

  // điền liên hệ & số liệu từ SITE / catalog
  const hrefs = { zalo: SITE.zalo, messenger: SITE.messenger, hotline: SITE.hotlineHref, email: 'mailto:' + SITE.email, facebook: SITE.facebook };
  document.querySelectorAll('[data-site]').forEach((a) => { a.href = hrefs[a.dataset.site] || '#'; });
  document.querySelectorAll('[data-site-text]').forEach((el) => { el.textContent = SITE[el.dataset.siteText] ?? ''; });
  document.querySelectorAll('[data-count-cat]').forEach((el) => { el.textContent = count((p) => p.cat === el.dataset.countCat); });

  // hỏi giá qua Zalo: chép sẵn nội dung
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-ask]');
    if (!a) return;
    const p = byId[a.dataset.ask];
    if (p) { copy(askText(p)); toast('Đã chép tên sản phẩm — dán vào khung chat để được báo giá.'); }
  });
}

/* tìm kiếm không dấu */
const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
const INDEX = P.map((p) => fold(`${p.name} ${brandName(p)} ${groupName(p)} ${CAT[p.cat].name} ${p.vol || ''}`));
function search(q) {
  const terms = fold(q).split(' ').filter(Boolean);
  if (!terms.length) return P.slice();
  return P.filter((p, i) => terms.every((t) => INDEX[i].includes(t)));
}

/* 6. CHUYỂN ĐỘNG (GSAP + ScrollTrigger, có phương án khi không nạp được) ---- */
function initMotion() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduce) return;
  const { gsap } = window;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  document.documentElement.classList.add('js-motion');
  const ST = window.ScrollTrigger;

  // xuất hiện theo lớp cho từng section: tiêu đề → chữ → hình (IntersectionObserver: không phụ thuộc vị trí tính trước)
  const revealIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    revealIO.unobserve(e.target);
    gsap.to(e.target._items, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.075, overwrite: true, clearProps: 'transform' });
  }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal-group]').forEach((grp) => {
    const items = grp.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    gsap.set(items, { autoAlpha: 0, y: 26 });
    revealIO.observe(grp);
    grp._items = items;
  });
  // parallax nhẹ cho chai
  if (ST) {
    gsap.utils.toArray('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 8;
      gsap.fromTo(el, { yPercent: amt }, { yPercent: -amt, ease: 'none', scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    });
  }
  return { gsap, ST };
}

/* 7. TRANG CHỦ ---------------------------------------------------------------- */
const FEATURE_MEGA = '0427';
const HERO_PICKS = [
  // [nhãn, bộ lọc, id chai]
  ['Single Malt', { type: 'single-malt' }, '0352'],
  ['Blended', { type: 'blended' }, '0437'],
  ['Cognac', { cat: 'cognac-brandy' }, '0266'],
  ['Bourbon', { type: 'american' }, '0372'],
  ['Gin', { type: 'gin' }, '0400'],
  ['Rum', { type: 'rum' }, '0616'],
  ['Tequila', { type: 'tequila-mezcal' }, '0153'],
  ['Sake', { type: 'sake' }, '0476'],
  ['Rượu Việt', { cat: 'vietnamese-spirits' }, '0207'],
];
const CAT_COVER = { whisky: '0277', 'cognac-brandy': '0347', spirits: '0060', 'liqueurs-aperitifs': '0089', 'japanese-spirits': '0467', 'vietnamese-spirits': '0338' };
const FEATURED = ['0370', '0347', '0133', '0427', '0614', '0429', '0205', '0243'];
const STORY = ['0408', '0366', '0338'];

function matchFilter(f) { return (p) => Object.entries(f).every(([k, v]) => p[k] === v); }

function initHome(m) {
  // --- hero: chọn dòng rượu (live thing)
  const stage = document.getElementById('heroStage');
  const picker = document.getElementById('heroPicker');
  const picks = HERO_PICKS.filter(([, , id]) => byId[id]);
  const EXTRA = ['Bourbon', 'Rum', 'Tequila'];
  picker.innerHTML = picks.map(([label], i) => `<button type="button" aria-pressed="${i === 0}" data-i="${i}"${EXTRA.includes(label) ? ' class="is-extra"' : ''}>${esc(label)}</button>`).join('');
  const nameEl = document.getElementById('heroName');
  const metaEl = document.getElementById('heroMeta');
  const linkEl = document.getElementById('heroLink');
  let cur = 0, timer;
  function show(i, first) {
    const [label, f, id] = picks[i];
    const p = byId[id];
    const n = count(matchFilter(f));
    const nicheEl = stage.querySelector('.niche');
    const apply = () => {
      nicheEl.style.setProperty('--glow', glow(p));
      const im = nicheEl.querySelector('.niche__img');
      const mi = nicheEl.querySelector('.niche__mirror');
      im.srcset = srcset(p.id); im.src = img(p.id, 1200); im.alt = `${p.name}${p.vol ? ' ' + p.vol : ''}`;
      mi.src = img(p.id, 600);
      nameEl.textContent = p.name;
      metaEl.innerHTML = `1 trong <span class="hero__count">${n}</span> chai ${esc(label)} đang có`;
      linkEl.href = url.list(f);
      linkEl.innerHTML = `Xem ${n} chai ${esc(label)} ${ic('arrow')}`;
    };
    if (first) { apply(); return; }
    const im = nicheEl.querySelector('.niche__img');
    const mi = nicheEl.querySelector('.niche__mirror');
    const beam = nicheEl.querySelector('.niche__beam');
    if (m && m.gsap) {
      const tl = m.gsap.timeline();
      tl.to([im, mi], { autoAlpha: 0, y: 14, duration: 0.35, ease: 'power2.in' })
        .to(beam, { opacity: 0.2, duration: 0.35 }, 0)
        .add(() => { apply(); })
        .add(() => new Promise((r) => { if (im.complete) r(); else im.onload = r; setTimeout(r, 600); }))
        .fromTo([im, mi], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' })
        .fromTo(beam, { opacity: 0.2, '--beam-x': '-30%' }, { opacity: 1, '--beam-x': '0%', duration: 1.2, ease: 'expo.out' }, '<');
    } else apply();
  }
  picker.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    cur = +b.dataset.i;
    picker.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    clearInterval(timer);
    show(cur);
  });
  show(0, true);
  const auto = () => { timer = setInterval(() => { cur = (cur + 1) % picks.length; picker.querySelectorAll('button').forEach((x, k) => x.setAttribute('aria-pressed', k === cur)); show(cur); }, 6000); };
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) auto();
  stage.addEventListener('pointerenter', () => clearInterval(timer));
  stage.addEventListener('focusin', () => clearInterval(timer));

  // số liệu thật từ catalog
  document.querySelectorAll('[data-stat]').forEach((el) => {
    el.textContent = { products: P.length, brands: realBrands.length, countries: countries.length }[el.dataset.stat];
  });

  // --- danh mục
  const run = document.getElementById('catRun');
  const order = ['whisky', 'cognac-brandy', 'spirits', 'japanese-spirits', 'liqueurs-aperitifs', 'vietnamese-spirits'];
  run.innerHTML = order.map((cid, i) => {
    const c = CAT[cid], p = byId[CAT_COVER[cid]] || P.find((x) => x.cat === cid);
    const n = count((x) => x.cat === cid);
    const types = c.types.map((t) => t.name).join(', ');
    return `<div class="cat ${i === 0 ? 'cat--lift' : ''}" data-reveal><a href="${url.list({ cat: cid })}">
      ${niche(p, { tone: 'oak', sizes: i === 0 ? '(max-width:960px) 90vw, 420px' : '(max-width:960px) 44vw, 230px' })}
      <div class="cat__meta"><span class="cat__name">${esc(c.name)}</span><span class="cat__count">${n} chai</span>${types && i === 0 ? `<span class="cat__types">${esc(types)}</span>` : ''}</div>
    </a></div>`;
  }).join('');
  const sm = count((p) => p.type === 'single-malt'), bl = count((p) => p.type === 'blended');
  document.getElementById('catNote').textContent = `Whisky chiếm hơn nửa kho: ${sm} chai Single Malt, ${bl} chai Blended, cùng Bourbon, Rye và Irish whiskey.`;

  // --- tuyển chọn
  const fg = document.getElementById('featGrid');
  fg.innerHTML = FEATURED.map((id) => byId[id]).filter(Boolean).map((p, i) => `
    <a class="tag-card" href="${url.product(p)}" data-reveal>
      ${niche(p, { tone: 'oak', sizes: '(max-width:960px) 50vw, 25vw' })}
      <div class="tag" data-pair="${(i % 4) + 1}">
        <div class="tag__row"><span>${esc(brandName(p))}</span><span>${esc([p.vol, fmtAbv(p.abv)].filter(Boolean).join(' · '))}</span></div>
        <p class="tag__name">${esc(p.name)}</p>
        <div class="tag__foot"><span>${esc(brandOrigin(p) || groupName(p))}</span><b>Liên hệ</b></div>
      </div>
    </a>`).join('');

  // --- câu chuyện: chai ghim đổi theo chương
  const pin = document.getElementById('storyPin');
  const sp = STORY.map((id) => byId[id]).filter(Boolean);
  const setStory = (k) => {
    const p = sp[k]; if (!p) return;
    const n = pin.querySelector('.niche');
    n.style.setProperty('--glow', glow(p));
    const im = n.querySelector('.niche__img'), mi = n.querySelector('.niche__mirror');
    if (im.dataset.id === p.id) return;
    im.style.opacity = 0; mi.style.opacity = 0;
    setTimeout(() => { im.srcset = srcset(p.id); im.src = img(p.id, 600); im.alt = p.name; im.dataset.id = p.id; mi.src = img(p.id, 300); im.style.opacity = ''; mi.style.opacity = ''; }, 260);
    pin.querySelector('figcaption').innerHTML = `<b>${esc(p.name)}</b><span>${esc(metaLine(p))}</span>`;
  };
  pin.innerHTML = niche(sp[0], { tone: 'night', sizes: '(max-width:960px) 90vw, 40vw' }) + `<figcaption><b>${esc(sp[0].name)}</b><span>${esc(metaLine(sp[0]))}</span></figcaption>`;
  pin.querySelector('.niche__img').dataset.id = sp[0].id;
  const chapters = document.querySelectorAll('.chapter');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setStory(+e.target.dataset.k); }), { rootMargin: '-45% 0px -45% 0px' });
    chapters.forEach((c) => io.observe(c));
  }

  // --- xuất xứ
  const byCountry = {};
  realBrands.forEach(([k, b]) => {
    if (!b.origin) return;
    (byCountry[b.origin] ||= { brands: [], n: 0 }).brands.push(k);
  });
  P.forEach((p) => { const o = brandOrigin(p); if (o && byCountry[o]) byCountry[o].n++; });
  const rows = Object.entries(byCountry).sort((a, b) => b[1].n - a[1].n);
  const top = rows.slice(0, 9);
  const rest = rows.slice(9);
  const list = document.getElementById('originList');
  list.innerHTML = top.map(([c, v]) => {
    const bs = v.brands.map((k) => [k, count((p) => p.brand === k)]).sort((a, b) => b[1] - a[1]);
    const shown = bs.slice(0, 6).map(([k]) => `<a href="${url.list({ brand: k })}">${esc(D.brands[k].name)}</a>`).join(', ');
    return `<div class="origin-row" data-reveal>
      <h3 class="origin-row__country">${esc(c)}</h3>
      <div class="origin-row__brands"><span class="origin-row__count">${v.brands.length} thương hiệu · ${v.n} chai</span>${shown}${bs.length > 6 ? ` và ${bs.length - 6} thương hiệu khác` : ''}</div>
    </div>`;
  }).join('') + (rest.length ? `<div class="origin-row" data-reveal><h3 class="origin-row__country">${rest.length} quốc gia khác</h3><div class="origin-row__brands"><span class="origin-row__count">${rest.reduce((s, [, v]) => s + v.n, 0)} chai</span>${rest.map(([c]) => esc(c)).join(', ')}</div></div>` : '');
  document.getElementById('originLead').textContent = `${realBrands.length} thương hiệu từ ${countries.length} quốc gia — từ Speyside, Islay đến Cognac, Jalisco, Kyoto và Đà Lạt.`;
  const rider = document.getElementById('originRider');
  const riderP = byId['0352'];
  if (rider && riderP) rider.innerHTML = `<div class="origins__rider-in" style="--glow:${glow(riderP)}"><span class="origins__rider-beam"></span><img src="${img(riderP.id, 600)}" alt="" loading="lazy" width="600" height="800"></div>`;
  if ('IntersectionObserver' in window) {
    const rowsEl = list.querySelectorAll('.origin-row');
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { rowsEl.forEach((r) => r.classList.remove('is-active')); e.target.classList.add('is-active'); } }), { rootMargin: '-48% 0px -48% 0px' });
    rowsEl.forEach((r) => io2.observe(r));
  }

  // --- những cái tên trong kho: một dòng chữ chạy theo cuộn + 24 thương hiệu nhiều chai nhất
  const sorted = realBrands.map(([k, b]) => [k, b.name, count((p) => p.brand === k), b.origin]).sort((a, b) => b[2] - a[2]);
  document.getElementById('marquee1').innerHTML = sorted.slice(0, 30).map(([k, n]) => `<span>${esc(n)}</span>`).join('');
  document.getElementById('brandTop').innerHTML = sorted.slice(0, 24).map(([k, n, c, o]) => `<li><a href="${url.list({ brand: k })}"><span class="brand-top__name">${esc(n)}</span><span class="brand-top__meta">${c} chai${o ? ' · ' + esc(o) : ''}</span></a></li>`).join('');
  const ba = document.getElementById('brandAll');
  if (ba) ba.textContent = `Xem cả ${realBrands.length} thương hiệu`;

  // --- chuyển động riêng trang chủ
  if (m && m.gsap) {
    const { gsap, ST } = m;
    const intro = () => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.hero__stage .niche__beam', { opacity: 0, '--beam-x': '-60%', duration: 1.8 })
        .from('.hero__stage .niche__img, .hero__stage .niche__mirror', { autoAlpha: 0, y: 40, duration: 1.4 }, 0.25)
        .from('.hero__beam', { autoAlpha: 0, duration: 2.2, ease: 'power2.out' }, 0)
        .from('.hero [data-hero]', { autoAlpha: 0, y: 28, duration: 1.1, stagger: 0.09 }, 0.35)
        .from('.hero__picker, .hero__caption', { autoAlpha: 0, y: 14, duration: 1, stagger: 0.1 }, 0.8);
    };
    if (document.querySelector('.gate')) document.addEventListener('bm:age-ok', intro, { once: true }); else intro();
    if (ST) {
      gsap.fromTo('#marquee1', { xPercent: 4 }, { xPercent: -36, ease: 'none', scrollTrigger: { trigger: '.brandwall', start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
      gsap.to('.hero__beam', { xPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__stage .niche__img', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  }
}

/* 8. GIỚI THIỆU & LIÊN HỆ ------------------------------------------------------ */
const SHELF = ['0352', '0347', '0370', '0153', '0400'];
function initAbout() {
  const sh = document.getElementById('shelf');
  const items = SHELF.map((id) => byId[id]).filter(Boolean);
  sh.style.setProperty('--glow', glow(items[2]));
  sh.innerHTML = '<span class="shelf__beam" aria-hidden="true"></span>' + items.map((p) => `<a class="shelf__item" href="${url.product(p)}" data-reveal aria-label="${esc(p.name)}"><img src="${img(p.id, 600)}" alt="${esc(p.name)}" width="600" height="800" loading="lazy"></a>`).join('');
  const st = { products: P.length, brands: realBrands.length, countries: countries.length, whisky: count((p) => p.cat === 'whisky') };
  document.querySelectorAll('[data-stat-a]').forEach((el) => { el.textContent = st[el.dataset.statA]; });
}
function initContact() {
  const sh = document.getElementById('contactShelf');
  if (sh) { const it = ['0266', '0400', '0476', '0207'].map((id) => byId[id]).filter(Boolean); sh.style.setProperty('--glow', glow(it[0])); sh.innerHTML = '<span class="shelf__beam" aria-hidden="true"></span>' + it.map((p) => `<a class="shelf__item" href="${url.product(p)}" aria-label="${esc(p.name)}"><img src="${img(p.id, 600)}" alt="${esc(p.name)}" width="600" height="800" loading="lazy"></a>`).join(''); }
  const h = document.getElementById('hoursText');
  if (h) h.innerHTML = SITE.hours.map(([d, t]) => `${d}: <span class="num">${t}</span>`).join('<br>');
  const dl = document.getElementById('productList');
  if (dl) dl.innerHTML = P.map((p) => `<option value="${esc(p.name + (p.vol ? ' ' + p.vol : ''))}">`).join('');
  const want = new URLSearchParams(location.search).get('sp');
  if (want && byId[want]) { const f = document.getElementById('fWant'); f.value = byId[want].name + (byId[want].vol ? ' ' + byId[want].vol : ''); }
}

/* 9. KHỞI ĐỘNG ---------------------------------------------------------------- */
window.BM = { pop, trap, SITE, D, P, byId, CAT, TYPE, count, brandName, brandOrigin, groupName, realBrands, countries, fmtAbv, esc, url, img, srcset, glow, niche, card, metaLine, ic, search, fold, toast, copy, askText, TONES, matchFilter };

document.addEventListener('DOMContentLoaded', () => {
  initChrome();
  ageGate();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const m = window.gsap && !reduce ? { gsap: window.gsap, ST: window.ScrollTrigger } : null;
  if (m && m.ST) m.gsap.registerPlugin(m.ST);
  window.BM.motion = m;
  if (page === 'home') initHome(m);
  if (page === 'about') initAbout();
  if (page === 'contact') initContact();
  document.dispatchEvent(new CustomEvent('bm:ready', { detail: m }));
  initMotion();
  if (window.ScrollTrigger) { setTimeout(() => window.ScrollTrigger.refresh(), 300); window.addEventListener('load', () => window.ScrollTrigger.refresh()); document.fonts && document.fonts.ready.then(() => window.ScrollTrigger.refresh()); }
});
