/* Mì Studio – Phóng Sự Cưới. Không build step; GSAP + ScrollTrigger + Lenis từ CDN (thiếu thì site vẫn chạy, chỉ mất motion).
   Nội dung đọc qua MiStore (store.js): mặc định + phần chỉnh trong admin.html. */
(async () => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { toHTML, esc } = window.MiStore;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGsap && !reduce;
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
  let lenis = null;

  let C;
  try { C = await window.MiStore.load(); } catch (_) { C = window.MiStore.defaults(); }
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- áp nội dung ---------- */
  Object.entries(C.texts).forEach(([k, v]) => $$(`[data-edit="${k}"]`).forEach((el) => { el.innerHTML = toHTML(v); }));
  $$('[data-edit-list]').forEach((ul) => {
    const v = C.texts[ul.dataset.editList];
    if (v != null) ul.innerHTML = v.split('\n').filter((l) => l.trim()).map((l) => `<li>${toHTML(l)}</li>`).join('');
  });
  Object.entries(C.imgs).forEach(([k, v]) => $$(`[data-edit-img="${k}"]`).forEach((im) => { if (v) { im.removeAttribute('srcset'); im.src = v; } }));
  if (C.seo.title) document.title = C.seo.title;
  if (C.seo.desc) $('meta[name=description]').content = C.seo.desc;

  const ct = C.contact, digits = ct.phone.replace(/[^\d+]/g, '');
  const links = { tel: 'tel:' + digits, zalo: ct.zalo, fb: ct.fb, msg: ct.msg, ig: ct.ig, yt: ct.yt };
  $$('[data-site]').forEach((a) => { if (links[a.dataset.site]) a.href = links[a.dataset.site]; });
  const defArea = window.MiStore.defaults().contact.area;
  $$('[data-site-text]').forEach((el) => {
    const k = el.dataset.siteText;
    if (k === 'area' && ct.area === defArea) return; // giữ ghi chú cần xác nhận khi chưa sửa
    const v = k === 'areaShort' ? ct.area : ct[k];
    if (v) el.textContent = v;
  });

  /* album: chỉ album đang bật */
  const ALB = C.albums.filter((a) => a.visible && a.photos.length);
  const grid = $('#albumGrid');
  grid.innerHTML = ALB.map((a, i) => {
    const c = a.photos[a.cover] || a.photos[0], big = [0, 1, 2, 6].includes(i % 7);
    return `<button class="acard" data-album="${i}" aria-label="Xem album ${esc(a.title)}, ${a.photos.length} ảnh tuyển chọn">
      <img src="${esc(big ? c.src : (c.sm || c.src))}" width="${c.w}" height="${c.h}" alt="" loading="lazy">
      <span class="acard__go" aria-hidden="true">→</span>
      <span class="acard__txt">
        <span class="acard__type">${esc(a.type)}${a.date ? ' · ' + esc(a.date) : ''}</span>
        <span class="acard__title">${esc(a.title)}</span>
        <span class="acard__meta"><span>${a.photos.length} ảnh tuyển chọn</span>${a.total ? `<span>${fmt(a.total)} ảnh đã bàn giao</span>` : ''}</span>
      </span></button>`;
  }).join('');

  const pages = C.layouts.filter((l) => l.visible);
  $('#bookStack').innerHTML = pages.map((l) =>
    `<figure class="page${l.w > l.h ? ' page--wide' : ''}"><img src="${esc(l.src)}" width="${l.w}" height="${l.h}" alt="Mẫu layout ảnh cưới do Mì Studio thiết kế" decoding="async"></figure>`).join('');

  const films = C.films.filter((f) => f.visible && f.drive);
  $('#filmGrid').innerHTML = films.map((f, i) => `
    <button class="film-card${i === 0 ? ' film-card--big' : ''}" data-video="${esc(f.drive)}" data-reveal>
      <img src="${esc(f.poster)}" alt="" loading="lazy">
      <span class="film-card__play" aria-hidden="true"></span>
      <span class="film-card__cap"><small>${esc(f.sub)}</small>${esc(f.title)}</span>
    </button>`).join('');
  $('#phim').hidden = !films.length;

  $('#printList').innerHTML = C.print.map((p) => `<div><dt>${esc(p.name)}</dt><dd>${esc(p.price)}</dd></div>`).join('');
  $('#wallList').innerHTML = C.wall.map((w) => `<tr><th scope="row">${esc(w.size)}</th><td>${esc(w.glass)}</td><td>${esc(w.wood)}</td></tr>`).join('');
  const revs = C.reviews.filter((r) => r.visible);
  $('#reviewGrid').innerHTML = revs.map((r) => `<blockquote class="rcard" data-reveal><p>${toHTML(r.text)}</p><footer>${esc(r.name)}</footer></blockquote>`).join('');
  $('#cam-nhan').hidden = !revs.length;

  /* ---------- modal chung: khoá cuộn, giữ focus, Esc ---------- */
  let lastFocus = null, openEl = null;
  function openModal(el) {
    lastFocus = document.activeElement; openEl = el;
    el.hidden = false; document.body.classList.add('no-scroll'); lenis && lenis.stop();
    $('.viewer__close', el).focus();
  }
  function closeModal() {
    if (!openEl) return;
    openEl.hidden = true;
    if (openEl.id === 'vmodal') $('.vmodal__box').innerHTML = '';
    openEl = null; document.body.classList.remove('no-scroll'); lenis && lenis.start();
    lastFocus && lastFocus.focus();
  }
  document.addEventListener('keydown', (e) => {
    if (!openEl) return;
    if (e.key === 'Escape') return closeModal();
    if (e.key === 'Tab') {
      const f = $$('button,[href],iframe,[tabindex="0"]', openEl);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    if (openEl.id === 'viewer' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
  });
  $$('.viewer__close').forEach((b) => b.addEventListener('click', closeModal));

  /* ---------- trình xem album ---------- */
  const viewer = $('#viewer'), strip = $('#viewerStrip'), count = $('#viewerCount');
  let total = 0;
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.acard'); if (!b) return;
    const a = ALB[+b.dataset.album];
    $('#viewerTitle').textContent = a.title;
    $('#viewerType').textContent = a.type + (a.date ? ' · ' + a.date : '');
    total = a.photos.length;
    strip.innerHTML = a.photos.map((p, i) =>
      `<figure><img src="${esc(p.src)}" width="${p.w}" height="${p.h}" alt="${esc(a.title)}, ảnh ${i + 1}/${total}" ${i > 2 ? 'loading="lazy"' : ''}></figure>`).join('');
    strip.scrollLeft = 0; count.textContent = `1 / ${total}`;
    openModal(viewer);
  });
  const current = () => {
    const mid = strip.scrollLeft + strip.clientWidth / 2;
    let best = 0, d = Infinity;
    [...strip.children].forEach((f, i) => { const c = f.offsetLeft + f.offsetWidth / 2, dd = Math.abs(c - mid); if (dd < d) { d = dd; best = i; } });
    return best;
  };
  function step(dir) {
    const i = Math.max(0, Math.min(total - 1, current() + dir)), f = strip.children[i];
    count.textContent = `${i + 1} / ${total}`;
    strip.scrollTo({ left: f.offsetLeft - (strip.clientWidth - f.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }
  strip.addEventListener('scroll', () => { count.textContent = `${current() + 1} / ${total}`; }, { passive: true });
  $('.viewer__prev').addEventListener('click', () => step(-1));
  $('.viewer__next').addEventListener('click', () => step(1));

  /* ---------- phim (Google Drive preview) ---------- */
  $('#filmGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-video]'); if (!b) return;
    $('.vmodal__box').innerHTML = `<iframe src="https://drive.google.com/file/d/${encodeURIComponent(b.dataset.video)}/preview" allow="autoplay; fullscreen" allowfullscreen title="${esc(b.querySelector('.film-card__cap').textContent.trim())}"></iframe>`;
    openModal($('#vmodal'));
  });

  /* ---------- menu di động ---------- */
  const burger = $('.burger'), drawer = $('#drawer'), hdr = $('.hdr');
  const setDrawer = (open) => {
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    drawer.hidden = !open; document.body.classList.toggle('no-scroll', open); hdr.classList.toggle('is-open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener('click', () => setDrawer(drawer.hidden));
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setDrawer(false); });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a || !lenis) return;
    const t = a.getAttribute('href') === '#top' ? 0 : $(a.getAttribute('href'));
    if (t === null) return;
    e.preventDefault(); lenis.scrollTo(t, { offset: t === 0 ? 0 : -70, duration: 1.4 });
  });

  /* header: nền đặc khi qua hero, ẩn khi cuộn xuống; nút nổi chỉ hiện sau hero */
  const story = $('#cau-chuyen'), dock = $('.dock');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY, past = y > story.offsetTop - 90;
    hdr.classList.toggle('is-solid', past);
    dock.classList.toggle('is-on', past);
    hdr.classList.toggle('is-hidden', past && y > lastY + 4 && drawer.hidden);
    if (y < lastY - 4) hdr.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- form: soạn tin, chép, mở Zalo ---------- */
  const form = $('#bookForm'), msg = $('.form__msg', form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const bad = [];
    if (!d.name.trim()) bad.push(form.name);
    if (!/^[0-9 +.]{9,14}$/.test(d.phone.trim())) bad.push(form.phone);
    $$('input', form).forEach((i) => i.removeAttribute('aria-invalid'));
    if (bad.length) {
      bad.forEach((i) => i.setAttribute('aria-invalid', 'true')); bad[0].focus();
      msg.className = 'form__msg is-err'; msg.textContent = 'Vui lòng nhập họ tên và số điện thoại hợp lệ.'; return;
    }
    const date = d.date ? d.date.split('-').reverse().join('/') : 'chưa chốt';
    const text = `Chào Mì Studio, mình là ${d.name.trim()} (SĐT ${d.phone.trim()}). Ngày cưới: ${date}. Lễ cần quay chụp: ${d.type}. Địa điểm: ${d.place.trim() || 'chưa rõ'}. Mình muốn được tư vấn ạ.`;
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch (_) { /* trình duyệt chặn clipboard: vẫn mở Zalo */ }
    msg.className = 'form__msg';
    msg.textContent = copied ? 'Đã chép nội dung. Zalo đang mở, bạn chỉ cần dán và gửi nhé!' : `Zalo đang mở. Bạn gửi giúp nội dung: "${text}"`;
    window.open(ct.zalo, '_blank', 'noopener');
  });

  if (!motion) { $('.intro').classList.add('is-done'); return; }

  /* ================= MOTION ================= */
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('motion');
  const mm = gsap.matchMedia();

  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* màn mở đầu → hero tự mở (không cần cuộn) */
  const intro = $('.intro');
  const master = gsap.timeline({ onComplete: () => intro.classList.add('is-done') })
    .from('.intro__mi', { yPercent: 60, opacity: 0, duration: .6, ease: 'power3.out' })
    .from('.intro__studio', { xPercent: -20, opacity: 0, duration: .5, ease: 'power3.out' }, '-=.35')
    .from('.intro__sub', { opacity: 0, letterSpacing: '.8em', duration: .5 }, '-=.25')
    .to(intro, { yPercent: -100, duration: .9, ease: 'expo.inOut', delay: .2 })
    .addLabel('hero', '-=.15');

  /* 1. HERO: khung vòm mở ra thành toàn màn hình */
  const heroLines = $$('.hero__l');
  let firstHero = true;
  mm.add({ mob: '(max-width: 1024px)', desk: '(min-width: 1025px)' }, (ctx) => {
    const mob = ctx.conditions.mob, W = innerWidth, H = innerHeight;
    const fw = mob ? Math.min(W * .72, 440) : Math.min(W * .32, 520), fh = mob ? H * .52 : H * .64;
    // chữ đứng hai bên vòm (desktop) / trên-dưới vòm (mobile), tính ngược từ vị trí cuối
    const targets = mob ? [[W / 2, H * .15], [W / 2, H * .86]] : [[W * .2, H * .5], [W * .8, H * .5]];
    const sc = mob ? .62 : .72;
    heroLines.forEach((l, i) => {
      const r = l.getBoundingClientRect();
      gsap.set(l, { x: targets[i][0] - (r.left + r.width / 2), y: targets[i][1] - (r.top + r.height / 2), scale: sc, color: '#23332f' });
    });
    gsap.set('.hero__frame', { width: fw, height: fh, borderRadius: `${fw / 2}px ${fw / 2}px 16px 16px` });
    // dời ảnh để khuôn mặt cô dâu (≈68% ngang, 30% dọc) nằm giữa vòm lúc đầu
    gsap.set('.hero__img', { xPercent: -50, yPercent: -50, scale: 1.25, x: -W * (mob ? .22 : .2), y: H * .1 });
    gsap.set('.hero__shade', { opacity: 0 });
    gsap.set(['.hero__script', '.hero__meta'], { opacity: 0, y: 30 });
    hdr.classList.add('on-paper');

    const tl = gsap.timeline({ delay: .5, defaults: { ease: 'power3.inOut' } });
    tl.to('.hero__frame', { width: W, height: H, borderRadius: '0px 0px 0px 0px', duration: 1.8 }, 0)
      .to('.hero__img', { scale: 1, x: 0, y: 0, duration: 1.8 }, 0)
      .to('.hero__shade', { opacity: 1, duration: 1 }, .7)
      .to(heroLines, { x: 0, y: 0, scale: 1, color: '#ffffff', duration: 1.4, stagger: .12 }, .35)
      .call(() => hdr.classList.remove('on-paper'), null, .9)
      .to('.hero__script', { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, 1.5)
      .to('.hero__meta', { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, 1.7);
    // lần đầu: chạy sau màn mở đầu; đổi breakpoint sau đó: chạy ngay
    if (firstHero) { firstHero = false; tl.pause(); master.add(tl.play(), 'hero'); }
    return () => hdr.classList.remove('on-paper');
  });

  /* 2. lời mở: chữ sáng dần theo cuộn */
  const lead = $('.story__lead');
  lead.innerHTML = lead.textContent.split(/(\s+)/).map((w) => (/\s/.test(w) ? w : `<span class="w">${esc(w)}</span>`)).join('');
  gsap.to('.story__lead .w', { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: lead, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  $$('[data-speed]').forEach((el) => gsap.to(el, { y: () => +el.dataset.speed * 500, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } }));

  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%', once: true,
    onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: .12, overwrite: true }),
  });

  /* 4. một ngày cưới: mỗi chương rộng đúng 1 màn hình, cuộn xong thì hít vào giữa */
  const track = $('.day__track'), chaps = $$('.chap');
  const dist = () => track.scrollWidth - innerWidth;
  const hScroll = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: '.day', start: 'top top', end: () => '+=' + dist() * 1.3, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      snap: { snapTo: 1 / (chaps.length - 1), duration: { min: .3, max: .8 }, delay: .1, ease: 'power2.inOut' },
    },
  });
  gsap.to('.day__progress span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.day', start: 'top top', end: () => '+=' + dist() * 1.3, scrub: true } });
  chaps.forEach((c) => {
    const st = { containerAnimation: hScroll, trigger: c, start: 'left right', end: 'right left', scrub: true };
    $$('.ph img', c).forEach((im, i) => gsap.fromTo(im, { xPercent: -8 - i * 2 }, { xPercent: 8 + i * 2, ease: 'none', scrollTrigger: st }));
    $$('.ph', c).forEach((p, i) => gsap.from(p, { y: (i % 2 ? -1 : 1) * 80, rotate: (i - 1) * 4, opacity: 0, ease: 'power2.out', scrollTrigger: { containerAnimation: hScroll, trigger: c, start: 'left 80%', end: 'left 15%', scrub: true } }));
    const txt = $('.chap__txt', c);
    txt && gsap.from(txt.children, { y: 40, opacity: 0, stagger: .1, scrollTrigger: { containerAnimation: hScroll, trigger: c, start: 'left 65%', end: 'left 20%', scrub: true } });
  });

  /* 5. bộ đếm: đọc số từ chữ (vd "1.300+", "5,4K") */
  $$('[data-count]').forEach((el) => {
    const m = el.textContent.trim().match(/^([\d.,]+)(.*)$/); if (!m) return;
    const dec = m[1].includes(',') ? m[1].split(',')[1].length : 0;
    const end = parseFloat(m[1].replace(/\./g, '').replace(',', '.')), suf = m[2], o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power2.out', onUpdate: () => { el.textContent = o.v.toLocaleString('vi-VN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; } }),
    });
  });

  /* 6. album: thẻ mở ra như rèm */
  gsap.set('.acard', { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set('.acard img', { scale: 1.3 });
  ScrollTrigger.batch('.acard', {
    start: 'top 90%', once: true,
    onEnter: (b) => {
      gsap.to(b, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out', stagger: .12 });
      gsap.to(b.map((x) => x.querySelector('img')), { scale: 1, duration: 1.8, ease: 'expo.out', stagger: .12, clearProps: 'transform' });
    },
  });

  /* 7. photobook: từng trang layout rơi xuống chồng lên nhau */
  const stack = $('#bookStack'), pg = $$('.page', stack);
  if (pg.length > 1) {
    stack.classList.add('is-live');
    const rot = pg.map((_, i) => ((i * 37) % 13) - 6);
    pg.forEach((p, i) => gsap.set(p, { xPercent: -50, yPercent: -50, rotate: rot[i], zIndex: i }));
    const btl = gsap.timeline({ scrollTrigger: { trigger: '.book', start: 'top top', end: () => '+=' + pg.length * 32 + '%', pin: '.book__pin', scrub: 1, anticipatePin: 1, invalidateOnRefresh: true } });
    pg.forEach((p, i) => {
      if (i === 0) return;
      // fromTo (không dùng from): invalidateOnRefresh sẽ ghi nhận sai điểm đích của from()
      btl.fromTo(p, { y: () => innerHeight * .9, rotate: rot[i] * 3 + (i % 2 ? 25 : -25), opacity: 0 },
        { y: 0, rotate: rot[i], opacity: 1, ease: 'power2.out', duration: 1 }, i - 1)
        .to(pg[i - 1].firstElementChild, { filter: 'brightness(0.9)', duration: 1, ease: 'none' }, i - 1);
    });
  }

  gsap.from('.process__photo img', { scale: 1.25, ease: 'none', scrollTrigger: { trigger: '.process', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.contact__bg', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.contact__script', { opacity: 0, x: -60, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.contact', start: 'top 70%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
