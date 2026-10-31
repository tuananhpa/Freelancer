/* Trang chủ: các khối hiển thị theo thứ tự & bật/tắt trong quản trị (home.sections) */
import { $, $$, esc, icon, href, onScrub, reduce, wireForm, field } from '../main.js';
import { projCard } from './projects.js';

const SLIDE_MS = 6500;
const pad = (n) => String(n).padStart(2, '0');

const BLOCKS = {
  hero: ({ home, site }) => {
    const n = home.slides.length;
    return `<section class="hero" data-scrub data-slider role="region" aria-roledescription="carousel" aria-label="Giới thiệu nổi bật" tabindex="0">
      <div class="slides">${home.slides.map((s, i) => `<article class="slide" aria-roledescription="slide" aria-label="${i + 1} / ${n}">
        <div class="slide-bg"><img src="${esc(s.image)}" alt="" width="1600" height="900" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></div>
        <div class="container slide-inner"><span class="slide-no">${pad(i + 1)} / ${pad(n)} · ${esc(s.eyebrow)}</span>
          ${i ? `<h2>${esc(s.title)}</h2>` : `<h1>${esc(s.title)}</h1>`}<p>${esc(s.text)}</p>
          <div class="slide-actions">${s.btn1 ? `<a class="btn btn-primary" href="${esc(href(s.btn1Href, site))}">${esc(s.btn1)} ${icon('arrow', 'arr')}</a>` : ''}${s.btn2 ? `<a class="btn btn-line-inv" href="${esc(href(s.btn2Href, site))}">${esc(s.btn2)}</a>` : ''}</div></div>
      </article>`).join('')}</div>
      <div class="slider-ui"><div class="container"><div class="slider-count"><b>01</b><span> / ${pad(n)}</span></div><div class="slider-bars"></div>
        <button class="slider-prev" type="button" aria-label="Slide trước">${icon('arrow')}</button><button class="slider-next" type="button" aria-label="Slide sau">${icon('arrow')}</button></div></div>
      <span class="scroll-hint" aria-hidden="true">Cuộn xuống</span></section>`;
  },
  intro: ({ home, site }) => { const it = home.intro; return `<section class="section grid-paper" id="gioi-thieu"><div class="container split">
    <div class="collage tilt-wrap" data-tilt="0.6" data-reveal="rise3d">
      <div class="c1"><img src="${esc(it.image1)}" alt="Kỹ sư xem bản vẽ tại công trường" width="1200" height="900" loading="lazy"></div>
      <div class="c2"><img src="${esc(it.image2)}" alt="Kiểm tra cốt thép trước khi đổ bê tông" width="1200" height="800" loading="lazy"></div>
      <div class="badge"><b>${esc(it.badgeValue)}</b><span>${esc(it.badgeLabel)}</span></div></div>
    <div data-reveal="up"><span class="eyebrow">${esc(it.eyebrow)}</span><h2>${esc(it.title)}</h2><p class="lead">${esc(it.text)}</p>
      <ul class="fields">${it.fields.map((f) => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>
      <p class="area-note">${icon('pin')}<span><b>Khu vực hoạt động:</b> ${esc(site.areas)}</span></p>
      <a class="btn btn-ghost" href="gioi-thieu.html">Tìm hiểu về chúng tôi ${icon('arrow', 'arr')}</a></div>
  </div></section>`; },
  services: ({ cols }) => { const list = cols.services.filter((s) => s.featured); return list.length ? `<section class="section alt" id="dich-vu"><div class="container">
    <div class="sec-head"><div><span class="eyebrow">Dịch vụ nổi bật</span><h2>Giải pháp xây dựng cho mọi nhu cầu</h2><p class="lead">Từ ngôi nhà đầu tiên của gia đình đến nhà xưởng hàng nghìn mét vuông.</p></div><a class="link-more" href="dich-vu.html">Tất cả dịch vụ ${icon('arrow')}</a></div>
    <div class="grid c3" data-stagger="rise3d">${list.map((s) => `<a class="svc-card" data-tilt href="dich-vu.html#${esc(s.slug)}">
      <div class="media"><img src="${esc(s.image)}" alt="${esc(s.name)}" width="1200" height="900" loading="lazy"></div><span class="ico">${icon(s.icon)}</span>
      <div class="body"><h3>${esc(s.name)}</h3><p>${esc(s.summary)}</p><span class="link-more">Xem chi tiết ${icon('arrow')}</span></div></a>`).join('')}</div>
  </div></section>` : ''; },
  process: ({ home, site }) => { const pr = home.process; return `<section class="process blueprint" id="quy-trinh" aria-label="${esc(pr.title)}"><div class="process-stage">
    <div class="process-canvas" aria-hidden="true"><div class="process-fallback"><img src="assets/img/photos/hero-1.webp" alt="" loading="lazy" width="1600" height="900"></div></div>
    <div class="container process-ui">
      <div class="process-head"><span class="eyebrow">${esc(pr.eyebrow)}</span><h2>${esc(pr.title)}</h2><p class="lead">${esc(pr.text)}</p></div>
      <ol class="process-steps">${pr.steps.map((s, i) => `<li><span class="n">${i + 1}</span><b>${esc(s.title)}</b><span>${esc(s.text)}</span></li>`).join('')}</ol>
    </div>
    <div class="process-meter" aria-hidden="true"><b>0%</b><div class="bar"><i></i></div><span>TIẾN ĐỘ</span></div>
    <div class="process-final"><h3>${esc(pr.finalTitle)}</h3><p>${esc(pr.finalText)}</p><a class="btn btn-primary btn-sm" href="lien-he.html#tu-van">Đăng ký khảo sát</a> <a class="btn btn-ghost btn-sm" href="${href('tel', site)}">${icon('phone')} Gọi ngay</a></div>
  </div></section>`; },
  projects: ({ cols }) => { const list = cols.projects.filter((p) => p.featured).slice(0, 4); return list.length ? `<section class="section" id="cong-trinh"><div class="container">
    <div class="sec-head"><div><span class="eyebrow">Công trình tiêu biểu</span><h2>Những công trình chúng tôi tự hào</h2><p class="lead">Nhấn vào từng công trình để xem quy mô, hạng mục đảm nhận và album hình ảnh.</p></div><a class="link-more" href="cong-trinh.html">Xem tất cả công trình ${icon('arrow')}</a></div>
    <div class="proj-grid feat" data-stagger="rise3d">${list.map(projCard).join('')}</div></div></section>` : ''; },
  capability: ({ home }) => { const c = home.capability; return `<section class="section why" id="nang-luc"><div class="why-bg" data-parallax="0.12"><img src="${esc(c.image)}" alt="" loading="lazy" width="1600" height="900"></div><div class="container on-dark">
    <div class="sec-head"><div><span class="eyebrow">${esc(c.eyebrow)}</span><h2 style="color:#fff">${esc(c.title)}</h2><p class="lead">${esc(c.text)}</p></div></div>
    <div class="stats" data-stagger>${home.stats.map((s) => `<div class="stat"><b><span data-count="${+s.value}">${+s.value}</span><sup>${esc(s.suffix)}</sup></b><span>${esc(s.label)}</span></div>`).join('')}</div>
    <div class="grid c3" data-stagger="flip">${c.strengths.map((s) => `<div class="feature"><span class="ico">${icon(s.icon)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div>
  </div></section>`; },
  jobs: ({ cols }) => { const list = cols.jobs.filter((j) => j.status === 'open').slice(0, 3); return list.length ? `<section class="section alt grid-paper" id="tuyen-dung"><div class="container">
    <div class="sec-head"><div><span class="eyebrow">Tuyển dụng</span><h2>Đang tìm đồng đội mới</h2><p class="lead">Kỹ sư, chỉ huy trưởng và công nhân lành nghề: cùng chúng tôi xây những công trình bền vững.</p></div><a class="link-more" href="tuyen-dung.html">Tất cả vị trí ${icon('arrow')}</a></div>
    <div class="job-list" data-stagger="flip">${list.map(jobRow).join('')}</div></div></section>` : ''; },
  contact: ({ home, site, cols }) => `<section class="section cta" id="lien-he"><div class="container"><div class="cta-box" data-reveal="rise3d">
    <div><span class="eyebrow" style="color:#fff">Tư vấn miễn phí</span><h2>${esc(home.cta.title)}</h2><p>${esc(home.cta.text)}</p>
      <div class="cta-actions"><a class="btn btn-light" href="${href('tel', site)}">${icon('phone')} ${esc(site.hotline || site.phone)}</a><a class="btn btn-line-inv" href="${href('zalo', site)}" target="_blank" rel="noopener">${icon('zalo')} Chat Zalo</a><a class="btn btn-line-inv" href="${esc(site.facebook)}" target="_blank" rel="noopener">${icon('facebook')} Facebook</a></div></div>
    <form class="form form-card" novalidate><div class="row2">${field('name', 'Họ và tên', { req: 1, ac: 'name' })}${field('phone', 'Số điện thoại', { req: 1, type: 'tel', ac: 'tel' })}</div>
      ${field('service', 'Nhu cầu', { type: 'select', options: [...cols.services.map((s) => s.name), 'Khác'] })}
      <button class="btn btn-primary" type="submit">Gửi yêu cầu tư vấn ${icon('send')}</button><p class="form-msg" hidden role="status"></p>
      <p class="mock-note">Thông tin chỉ dùng để liên hệ tư vấn.</p></form>
  </div></div></section>`,
};

export const jobRow = (j) => `<a class="job" href="tuyen-dung-chi-tiet.html?vt=${esc(j.slug)}">
  <div><h3>${esc(j.title)}</h3><ul class="meta"><li>${icon('users')}${esc(j.quantity)} người</li><li>${icon('pin')}${esc(j.location)}</li><li>${icon('calendar')}Hạn nộp ${new Intl.DateTimeFormat('vi-VN').format(new Date(j.deadline))}</li></ul></div>
  <span class="salary">${esc(j.salary)}</span><span class="status${j.status === 'open' ? '' : ' closed'}">${j.status === 'open' ? 'Đang tuyển' : 'Đã đóng'}</span></a>`;

export function render(data) {
  const ctx = { home: data.docs.home, site: data.docs.site, cols: data.collections };
  return ctx.home.sections.filter((s) => s.enabled).map((s) => BLOCKS[s.key]?.(ctx) || '').join('');
}

export async function init(data) {
  heroSlider();
  const f = $('#lien-he form'); if (f) wireForm(f, 'leads', () => ({ source: 'Trang chủ' }));
  const sec = $('#quy-trinh'); if (sec) await process(sec);
}

function heroSlider() {
  const hero = $('[data-slider]'); if (!hero) return;
  const slides = $$('.slide', hero), n = slides.length, bars = $('.slider-bars', hero), count = $('.slider-count b', hero);
  slides.forEach((_, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Slide ${i + 1}/${n}`); b.innerHTML = '<i></i>'; b.onclick = () => go(i); bars.append(b); });
  let cur = -1, timer = 0, paused = false;
  const restart = () => { clearTimeout(timer); if (!reduce && !paused && !document.hidden) timer = setTimeout(() => go(cur + 1), SLIDE_MS); };
  function go(i) {
    i = (i + n) % n; if (i === cur) return;
    slides.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.inert = k !== i; s.setAttribute('aria-hidden', String(k !== i)); });
    [...bars.children].forEach((b, k) => { b.classList.toggle('is-active', k === i); b.classList.toggle('is-done', k < i); b.setAttribute('aria-current', String(k === i)); });
    cur = i; count.textContent = pad(i + 1); hero.style.setProperty('--slide-ms', SLIDE_MS + 'ms'); restart();
  }
  $('.slider-prev', hero).onclick = () => go(cur - 1);
  $('.slider-next', hero).onclick = () => go(cur + 1);
  hero.addEventListener('mouseenter', () => { paused = true; hero.classList.add('is-paused'); clearTimeout(timer); });
  hero.addEventListener('mouseleave', () => { paused = false; hero.classList.remove('is-paused'); restart(); hero.style.setProperty('--mx', '0px'); hero.style.setProperty('--my', '0px'); });
  hero.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; hero.style.setProperty('--mx', ((e.clientX / innerWidth - 0.5) * -24).toFixed(1) + 'px'); hero.style.setProperty('--my', ((e.clientY / innerHeight - 0.5) * -16).toFixed(1) + 'px'); });
  document.addEventListener('visibilitychange', restart);
  hero.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1); });
  let x0 = 0;
  hero.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  hero.addEventListener('pointerup', (e) => { const dx = e.clientX - x0; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); });
  go(0);
}

async function process(sec) {
  const steps = $$('.process-steps li', sec), meter = $('.process-meter b', sec), bar = $('.process-meter', sec), fin = $('.process-final', sec);
  let update = null, marks = [];
  if (!reduce) {
    try { const m = await import('../building3d.js'); update = m.mountBuilding($('.process-canvas', sec)); marks = m.STEPS; }
    catch { document.documentElement.classList.add('no-webgl'); }
  }
  if (!update) { steps.forEach((s) => s.classList.add('is-active')); return; }
  onScrub(sec, (p) => {
    update(p);
    const k = marks.reduce((a, t, i) => (p >= t ? i : a), 0);
    steps.forEach((s, i) => { s.classList.toggle('is-active', i === k); s.classList.toggle('is-done', i < k); });
    meter.textContent = Math.round(p * 100) + '%'; bar.style.setProperty('--p', p.toFixed(3));
    fin.classList.toggle('on', p > 0.92);
  }, 'pin');
}
