/* =========================================================
   main.js – khung dùng chung cho mọi trang công khai
   1. Đọc dữ liệu đã xuất bản (api.site) -> dựng header, footer, nút liên hệ, chatbot
   2. Gọi renderer của trang (pages/<data-page>.js) -> HTML nội dung
   3. Motion: reveal · counter · parallax · tilt · chữ sáng dần · scrub 3D (--p) theo cuộn
   ========================================================= */
import { api, previewMode } from './api.js';
import { icon } from './icons.js';
import { mountChatbot } from './chatbot.js';

export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => [...c.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const paras = (s) => String(s || '').split(/\n\s*\n/).map((p) => `<p>${esc(p)}</p>`).join('');
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const fmtDate = (d) => (d ? new Intl.DateTimeFormat('vi-VN').format(new Date(d)) : '');
export { icon, fmtDate };

/** Liên kết đặc biệt trong dữ liệu: "tel" | "zalo" | "facebook" | "mail" -> URL thật từ site */
export function href(h, site) {
  const tel = '+84' + String(site.hotline || site.phone || '').replace(/\D/g, '').replace(/^0/, '');
  return { tel: 'tel:' + tel, zalo: 'https://zalo.me/' + String(site.zalo || '').replace(/\D/g, ''), facebook: site.facebook || '#', mail: 'mailto:' + site.email }[h] || h || '#';
}
/** Thay {phone}, {workingHours}… trong chuỗi bằng thông tin site */
export const fill = (s, site) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => site[k] ?? '');

export function pageHero(p, crumb) {
  return `<section class="page-hero" data-scrub>
    <div class="bg"><img src="${esc(p.image)}" alt="" width="1600" height="900" fetchpriority="high"></div>
    <div class="container">
      <ol class="crumbs"><li><a href="index.html">Trang chủ</a></li>${crumb.map((c) => `<li>${c}</li>`).join('')}</ol>
      <h1>${esc(p.title)}</h1><p class="lead">${esc(p.lead)}</p>
    </div></section>`;
}

/* ---------- 1. Khung trang ---------- */
function layout(data) {
  const s = data.docs.site, page = document.body.dataset.page;
  const file = location.pathname.split('/').pop() || 'index.html';
  const menu = (s.menu || []).filter((m) => m.visible !== false);
  const cur = (m) => (m.href === file || (file.startsWith('cong-trinh') && m.href === 'cong-trinh.html') || (file.startsWith('tuyen-dung') && m.href === 'tuyen-dung.html') ? ' aria-current="page"' : '');
  const hot = esc(s.hotline || s.phone);
  const top = `${previewMode() ? `<div class="demo-ribbon" style="background:#5B9BFF;color:#fff">Đang xem BẢN NHÁP chưa xuất bản · <a href="?preview=0" style="color:#fff">Thoát xem trước</a></div>` : ''}
  ${s.showDemoRibbon ? `<div class="demo-ribbon" id="ribbon">Bản mockup: hình ảnh minh hoạ tạo bằng AI, nội dung & số liệu mẫu – sẽ thay bằng thông tin thật của doanh nghiệp.<button type="button" aria-label="Đóng thông báo">×</button></div>` : ''}
  <header class="site-header"><div class="container header-row">
    <a class="brand" href="index.html" aria-label="${esc(s.name)} – Trang chủ"><img class="logo-light" src="${esc(s.logoLight || s.logo)}" alt="${esc(s.name)}" width="236" height="56"><img class="logo-dark" src="${esc(s.logo)}" alt="" width="236" height="56"></a>
    <nav class="nav" aria-label="Chính"><ul>${menu.map((m) => `<li><a href="${esc(m.href)}"${cur(m)}>${esc(m.label)}</a></li>`).join('')}</ul></nav>
    <a class="header-hot" href="${href('tel', s)}"><span class="ico">${icon('phone')}</span><span><small>Hotline</small>${hot}</span></a>
    <a class="btn btn-primary btn-sm header-cta" href="lien-he.html#tu-van">Nhận tư vấn</a>
    <button class="menu-toggle" id="navToggle" type="button" aria-label="Mở menu" aria-expanded="false" aria-controls="drawer"><span></span><span></span><span></span></button>
  </div></header>
  <div class="drawer" id="drawer" hidden><div class="drawer-panel" role="dialog" aria-modal="true" aria-label="Menu">
    <button class="drawer-close" type="button" data-close aria-label="Đóng menu">×</button>
    ${menu.map((m) => `<a href="${esc(m.href)}"${cur(m)}>${esc(m.label)}</a>`).join('')}
    <a class="btn btn-primary" href="${href('tel', s)}">${icon('phone')} Gọi ${hot}</a>
  </div></div>`;
  document.body.insertAdjacentHTML('afterbegin', `<a class="skip" href="#main">Chuyển đến nội dung chính</a>${top}`);

  const svcs = data.collections.services || [];
  const socials = [['facebook', s.facebook], ['tiktok', s.tiktok], ['youtube', s.youtube]].filter(([, u]) => u);
  document.body.insertAdjacentHTML('beforeend', `<footer class="site-footer"><div class="container">
    <div class="footer-grid">
      <div><img class="flogo" src="${esc(s.logoLight || s.logo)}" alt="${esc(s.name)}" width="236" height="56" loading="lazy">
        <p>${esc(s.footerAbout)}</p><p><b style="color:#fff">${esc(s.legalName)}</b><br>MST: ${esc(s.taxCode)}</p>
        <div class="socials">${socials.map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener" aria-label="${k}">${icon(k)}</a>`).join('')}<a href="${href('zalo', s)}" target="_blank" rel="noopener" aria-label="Zalo">Zalo</a></div></div>
      <div><h4>Dịch vụ</h4><ul>${svcs.map((v) => `<li><a href="dich-vu.html#${esc(v.slug)}">${esc(v.name)}</a></li>`).join('')}</ul></div>
      <div><h4>Liên kết</h4><ul>${menu.map((m) => `<li><a href="${esc(m.href)}">${esc(m.label)}</a></li>`).join('')}</ul></div>
      <div><h4>Liên hệ</h4><ul class="f-contact">
        <li>${icon('pin')}<span>${esc(s.address)}</span></li>
        <li>${icon('phone')}<a href="${href('tel', s)}">${hot}</a></li>
        <li>${icon('mail')}<a href="${href('mail', s)}">${esc(s.email)}</a></li>
        <li>${icon('clock')}<span>${esc(s.workingHours)}</span></li></ul></div>
    </div>
    <div class="copyright"><span>© <span id="year"></span> ${esc(s.legalName)}. Bảo lưu mọi quyền.</span><span>Khu vực hoạt động: ${esc(s.areas)}</span></div>
  </div></footer>
  <div class="float-contact" aria-label="Liên hệ nhanh">
    <a class="fc-zalo" href="${href('zalo', s)}" target="_blank" rel="noopener" aria-label="Chat Zalo">Zalo</a>
    <a class="fc-fb" href="${esc(s.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a>
    <a class="fc-tel" href="${href('tel', s)}" aria-label="Gọi ${hot}">${icon('phone')}</a>
  </div>
  <nav class="mobile-bar" aria-label="Liên hệ nhanh">
    <a href="${href('tel', s)}">${icon('phone')}Gọi ngay</a>
    <a href="${href('zalo', s)}" target="_blank" rel="noopener">${icon('zalo')}Zalo</a>
    <a href="${esc(s.facebook)}" target="_blank" rel="noopener">${icon('facebook')}Facebook</a>
  </nav>`);
  $('#year').textContent = new Date().getFullYear();
  $('#ribbon button')?.addEventListener('click', (e) => e.target.parentElement.remove());

  const seo = (s.seo || {})[{ index: 'home', about: 'about', services: 'services', projects: 'projects', project: 'projects', jobs: 'jobs', job: 'jobs', contact: 'contact' }[page]];
  if (seo) { document.title = seo.title; $('meta[name="description"]')?.setAttribute('content', seo.description); }

  // header: trong suốt trên hero tối, đặc lại khi cuộn
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const drawer = $('#drawer'), toggle = $('#navToggle');
  const open = () => { drawer.hidden = false; toggle.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('.drawer-close', drawer).focus(); };
  const close = () => { drawer.hidden = true; toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; toggle.focus({ preventScroll: true }); };
  toggle.addEventListener('click', open);
  drawer.addEventListener('click', (e) => { if (e.target === drawer || e.target.closest('[data-close]') || e.target.closest('a')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) close(); });
}

/* ---------- 3. Motion ---------- */
const scrubbers = [];
/** Đăng ký hàm nhận tiến trình cuộn 0..1. mode 'pin': theo chiều cao khối dính; 'view': từ lúc vào đến lúc ra khỏi khung nhìn */
export function onScrub(el, fn, mode = 'view') { scrubbers.push({ el, fn, mode }); }

function motion() {
  const root = document.documentElement;
  $$('[data-stagger]').forEach((box) => [...box.children].forEach((c, i) => {
    c.dataset.reveal ||= box.dataset.stagger || 'up'; c.dataset.delay ||= String(Math.min(i, 8) * 90);
  }));
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.style.transitionDelay = (e.target.dataset.delay || 0) + 'ms';
    e.target.classList.add('is-in'); io.unobserve(e.target);
    setTimeout(() => { e.target.style.transitionDelay = ''; }, 1200 + +(e.target.dataset.delay || 0));
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  $$('[data-reveal]').forEach((el) => (reduce ? el.classList.add('is-in') : io.observe(el)));

  // counter
  const fmt = new Intl.NumberFormat('vi-VN');
  const co = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; const el = e.target, end = +el.dataset.count; co.unobserve(el);
    const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / 1600); el.textContent = fmt.format(Math.round(end * (1 - (1 - p) ** 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach((el) => { if (reduce) el.textContent = fmt.format(+el.dataset.count); else { el.textContent = '0'; co.observe(el); } });

  // chữ sáng dần
  const words = $$('[data-words]').map((el) => {
    const ws = el.textContent.trim().split(/\s+/); el.textContent = '';
    return { el, spans: ws.map((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; el.append(s, i < ws.length - 1 ? ' ' : ''); return s; }) };
  });
  // [data-scrub]: ghi --p (0..1) lên phần tử để CSS dựng hiệu ứng 3D
  $$('[data-scrub]').forEach((el) => onScrub(el, (p) => el.style.setProperty('--p', p.toFixed(4)), el.dataset.scrub || 'out'));
  $$('[data-unfold]').forEach((el) => onScrub(el, (p) => el.style.setProperty('--q', Math.min(1, p * 2.2).toFixed(4)), 'view'));
  const par = $$('[data-parallax]');

  if (reduce) { words.forEach(({ spans }) => spans.forEach((s) => s.classList.add('on'))); root.classList.add('reduce'); scrubbers.forEach(({ fn }) => fn(1)); return; }
  let ticking = false;
  const frame = () => {
    ticking = false; const vh = innerHeight;
    for (const { el, fn, mode } of scrubbers) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const p = mode === 'pin' ? -r.top / Math.max(1, r.height - vh)
        : mode === 'out' ? -r.top / Math.max(1, r.height)              // 0 khi chạm đỉnh, 1 khi cuộn hết
        : (vh - r.top) / (vh + r.height);                              // view
      fn(Math.min(1, Math.max(0, p)));
    }
    par.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - vh / 2) * -(+el.dataset.parallax || 0.15)).toFixed(1)}px, 0)`;
    });
    words.forEach(({ el, spans }) => {
      const r = el.getBoundingClientRect(); const n = Math.round(Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5 + r.height))) * spans.length);
      spans.forEach((s, i) => s.classList.toggle('on', i < n));
    });
  };
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue); frame();

  if (canHover) $$('[data-tilt]').forEach((el) => {
    const k = +el.dataset.tilt || 1;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', (px * 10 * k).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-py * 8 * k).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
  });
  $$('.marquee-track').forEach((t) => { const c = t.cloneNode(true); c.setAttribute('aria-hidden', 'true'); t.parentElement.append(c); });
}

/* ---------- Form gửi về inbox (tư vấn, ứng tuyển) ---------- */
export function wireForm(form, col, extra = () => ({})) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('.form-msg', form); let ok = true;
    $$('[required]', form).forEach((inp) => {
      const f = inp.closest('.field'); const bad = !inp.value.trim() || (inp.type === 'tel' && !/^[0-9 +().-]{9,15}$/.test(inp.value.trim()));
      f.classList.toggle('invalid', bad); $('.err', f).textContent = bad ? (inp.type === 'tel' ? 'Nhập số điện thoại hợp lệ (9–15 chữ số).' : 'Vui lòng điền mục này.') : ''; if (bad) ok = false;
    });
    if (!ok) { $('.invalid input, .invalid select, .invalid textarea', form)?.focus(); return; }
    const btn = $('button[type=submit]', form); btn.disabled = true;
    try {
      await api.submit(col, { ...Object.fromEntries(new FormData(form)), ...(await extra()) });
      form.reset(); msg.hidden = false; msg.className = 'form-msg ok'; msg.textContent = 'Đã gửi thành công! Chúng tôi sẽ liên hệ lại trong giờ làm việc.';
    } catch { msg.hidden = false; msg.className = 'form-msg bad'; msg.textContent = 'Gửi chưa thành công, vui lòng thử lại hoặc gọi hotline.'; }
    btn.disabled = false;
  });
}
export const field = (name, label, opts = {}) => `<label class="field">${label}${opts.req ? ' *' : ''}
  ${opts.type === 'textarea' ? `<textarea name="${name}" ${opts.req ? 'required' : ''} placeholder="${esc(opts.ph || '')}"></textarea>`
    : opts.type === 'select' ? `<select name="${name}" ${opts.req ? 'required' : ''}>${opts.options.map((o) => `<option${o === opts.value ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`
    : `<input name="${name}" type="${opts.type || 'text'}" ${opts.req ? 'required' : ''} autocomplete="${opts.ac || 'off'}" placeholder="${esc(opts.ph || '')}" ${opts.accept ? `accept="${opts.accept}"` : ''}>`}
  <span class="err" aria-live="polite"></span></label>`;

/* ---------- Khởi động ---------- */
(async function boot() {
  document.documentElement.classList.add('js');
  const main = $('#main');
  let data;
  try { data = await api.site(); }
  catch { main.innerHTML = '<div class="loading-shell"><p>Không tải được dữ liệu. Hãy mở website qua máy chủ (http://), không mở trực tiếp file.</p></div>'; return; }
  layout(data);
  const mod = await import(`./pages/${document.body.dataset.page}.js`);
  main.innerHTML = await mod.render(data);
  await mod.init?.(data);
  motion();
  if (data.docs.chatbot?.enabled) mountChatbot(data.docs.chatbot, data.docs.site);
  if (location.hash) $(location.hash)?.scrollIntoView();
})();
