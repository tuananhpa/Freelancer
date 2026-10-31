/* ESER — motion & interactions (vanilla, không thư viện) */
(() => {
  'use strict';
  const d = document, root = d.documentElement, W = window;
  const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = W.matchMedia('(pointer: fine)').matches;
  const DATA = JSON.parse(($('#eser-data') || {}).textContent || '{}');
  const PRODUCTS = DATA.products || [];
  const CATS = Object.fromEntries((DATA.categories || []).map((c) => [c.id, c]));
  const money = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  let vh = innerHeight, vw = innerWidth;

  /* ---------- fit-to-width ---------- */
  function fit() {
    $$('[data-fit]').forEach((el) => {
      const mob = vw <= 640 || (vw <= 1000 && vh > vw);
      const ratio = parseFloat(mob ? el.dataset.fitM || el.dataset.fit : el.dataset.fit);
      const box = el.parentElement.clientWidth || vw;
      el.style.fontSize = '100px';
      const w = el.scrollWidth || el.getBoundingClientRect().width;
      let fs = (100 * box * ratio) / w;
      if (el.classList.contains('wm')) fs = Math.min(fs, vh * (mob ? 0.3 : 0.5));
      el.style.fontSize = fs.toFixed(2) + 'px';
    });
  }
  fit();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => { fit(); measure(); });

  /* ---------- intro (curtain → hero) ---------- */
  if (!reduce && !location.hash) W.scrollTo(0, 0);
  const curtain = $('.curtain');
  function endIntro() {
    root.classList.remove('intro');
    if (curtain) curtain.classList.add('out');
    setTimeout(() => { root.classList.remove('has-curtain'); $('#nav').classList.add('is-ready'); }, 1700);
  }
  if (root.classList.contains('intro') && curtain && getComputedStyle(curtain).display !== 'none') {
    const b = $('.curtain__count b'), bar = $('.curtain__bar');
    const t0 = performance.now(), dur = 1050;
    const tick = (t) => {
      const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
      b.textContent = String(Math.round(e * 100)).padStart(3, '0');
      bar.style.setProperty('--cp', e);
      if (p < 1) requestAnimationFrame(tick); else setTimeout(endIntro, 120);
    };
    requestAnimationFrame(tick);
  } else { root.classList.remove('intro', 'has-curtain'); $('#nav') && $('#nav').classList.add('is-ready'); }

  /* ---------- split scrub headings into words (giữ thẻ <em>) ---------- */
  const scrubs = $$('[data-scrub]').map((el) => {
    const tw = d.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
    nodes.forEach((n) => {
      const parts = n.textContent.split(/(\s+)/);
      const frag = d.createDocumentFragment();
      parts.forEach((p) => {
        if (!p) return;
        if (/^\s+$/.test(p)) frag.appendChild(d.createTextNode(p));
        else { const s = d.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); }
      });
      n.parentNode.replaceChild(frag, n);
    });
    return { el, words: $$('.w', el) };
  });

  /* ---------- elements ---------- */
  const nav = $('#nav');
  const floatEl = $('.float');
  const prog = $('.progress span');
  const pars = $$('[data-par]').map((el) => ({ el, f: parseFloat(el.dataset.par) }));
  const hero = $('.hero');
  const reveals = $$('.rv');
  const lb = $('.lookbook'), lbPin = $('.lookbook__pin'), lbTrack = $('.lookbook__track');
  let lbDist = 0;
  const silk = $('.silk'), proc = $('.process');

  function measure() {
    vh = innerHeight; vw = innerWidth;
    if (lb && lbTrack && !reduce) {
      lbDist = Math.max(0, lbTrack.scrollWidth - vw);
      lb.style.height = (vh + lbDist) + 'px';
    }
    if (silk) sizeSilk();
  }

  /* ---------- silk canvas (lụa trong dải tối) ---------- */
  let sctx, sW = 0, sH = 0, lastPhase = -1;
  function sizeSilk() {
    const dpr = Math.min(2, W.devicePixelRatio || 1);
    sW = silk.clientWidth; sH = silk.clientHeight;
    silk.width = sW * dpr; silk.height = sH * dpr;
    sctx = silk.getContext('2d'); sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastPhase = -1;
  }
  function drawSilk(phase) {
    if (!sctx || Math.abs(phase - lastPhase) < 0.004) return;
    lastPhase = phase;
    sctx.clearRect(0, 0, sW, sH);
    const N = 34;
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1);
      sctx.beginPath();
      for (let x = -20; x <= sW + 20; x += 14) {
        const u = x / sW;
        const y = sH * (0.12 + k * 0.8)
          + Math.sin(u * 5.2 + phase * 2.4 + i * 0.22) * sH * 0.07
          + Math.sin(u * 11.0 - phase * 1.6 + i * 0.09) * sH * 0.025
          + Math.exp(-Math.pow((u - 0.68 + phase * 0.12) / 0.18, 2)) * sH * 0.12 * Math.sin(i * 0.35 + phase);
        x === -20 ? sctx.moveTo(x, y) : sctx.lineTo(x, y);
      }
      const a = 0.16 + 0.34 * Math.sin(k * Math.PI);
      sctx.strokeStyle = i % 7 === 3 ? `rgba(190,52,40,${a + 0.12})` : `rgba(176,138,85,${a})`;
      sctx.lineWidth = i % 5 === 0 ? 1.6 : 1;
      sctx.stroke();
    }
  }

  /* ---------- main scroll frame ---------- */
  let ticking = false, lastY = 0, navHold = 0;
  function frame() {
    ticking = false;
    const y = W.scrollY;
    // nav
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 40);
      const menuOpen = !$('#menu').hidden;
      nav.classList.toggle('is-hidden', !menuOpen && performance.now() > navHold && y > vh * 0.8 && y > lastY + 2);
      if (y < lastY - 2) nav.classList.remove('is-hidden');
    }
    lastY = y;
    if (floatEl) floatEl.classList.toggle('off', y < vh * 0.6);
    if (prog) prog.style.setProperty('--p', clamp(y / (d.documentElement.scrollHeight - vh), 0, 1));
    if (reduce) return;

    // parallax hero
    if (hero && y < hero.offsetHeight * 1.2) pars.forEach((p) => { p.el.style.translate = `0 ${(y * p.f).toFixed(1)}px`; });

    // scrub words
    scrubs.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = clamp((vh * 0.92 - r.top) / (vh * 0.5), 0, 1), N = words.length;
      words.forEach((w, i) => {
        const l = clamp(p * (N + 2) - i, 0, 1);
        w.style.setProperty('--b', ((1 - l) * 12).toFixed(2) + 'px');
        w.style.setProperty('--o', (0.18 + 0.82 * l).toFixed(3));
      });
    });

    // image reveal
    reveals.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const p = clamp((vh - r.top) / (vh * 0.55), 0, 1), e = 1 - Math.pow(1 - p, 2);
      el.style.setProperty('--rb', ((1 - e) * 14).toFixed(2) + 'px');
      el.style.setProperty('--rs', (0.35 + 0.65 * e).toFixed(3));
      el.style.setProperty('--rsc', (1.08 - 0.08 * e).toFixed(4));
    });

    // lookbook pin → horizontal
    if (lb && lbDist > 0) {
      const r = lb.getBoundingClientRect();
      const p = clamp(-r.top / (lb.offsetHeight - vh), 0, 1);
      lbTrack.style.transform = `translate3d(${(-p * lbDist).toFixed(1)}px,0,0)`;
    }

    // silk
    if (proc) {
      const r = proc.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) drawSilk((vh - r.top) / (vh + r.height));
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { measure(); fit(); frame(); }, 120); });
  measure(); frame();
  if (silk && reduce) drawSilk(0.4);
  W.addEventListener('load', () => { measure(); fit(); frame(); });

  /* ---------- fade-up + count-up ---------- */
  function countUp(el) {
    const raw = el.dataset.count || el.textContent;
    const m = /^(\D*)(\d+)(.*)$/.exec(raw.trim());
    if (!m || reduce) return;
    const [, pre, num, suf] = m, target = parseInt(num, 10), padLen = num.startsWith('0') ? num.length : 0;
    const from = target > 1000 ? target - 60 : 0, t0 = performance.now();
    const step = (t) => {
      const p = clamp((t - t0) / 1600, 0, 1), e = 1 - Math.pow(1 - p, 3);
      let v = String(Math.round(from + (target - from) * e)); if (padLen) v = v.padStart(padLen, '0');
      el.textContent = pre + v + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in W) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      const n = e.target.querySelector('[data-count]'); if (n) countUp(n);
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('[data-up]').forEach((el) => io.observe(el));
  } else $$('[data-up]').forEach((el) => el.classList.add('in'));

  /* ---------- cursor: đường chỉ may + pill "Xem" ---------- */
  if (fine && !reduce) {
    const pill = $('.cursor-pill');
    let lx = null, ly = null, acc = 0, side = 1, count = 0;
    addEventListener('pointermove', (e) => {
      if (pill) pill.style.left = e.clientX + 'px', pill.style.top = e.clientY + 'px';
      if (lx === null) { lx = e.clientX; ly = e.clientY; return; }
      const dx = e.clientX - lx, dy = e.clientY - ly, dist = Math.hypot(dx, dy);
      acc += dist;
      if (acc >= 22) {
        acc = 0; side = -side;
        if (count < 34) {
          const a = Math.atan2(dy, dx), s = d.createElement('i');
          const ox = Math.cos(a + Math.PI / 2) * 2 * side, oy = Math.sin(a + Math.PI / 2) * 2 * side;
          s.className = 'stitch';
          s.style.transform = `translate(${e.clientX + ox - 6}px,${e.clientY + oy - 1}px) rotate(${a}rad)`;
          d.body.appendChild(s); count++;
          setTimeout(() => { s.remove(); count--; }, 1500);
        }
      }
      lx = e.clientX; ly = e.clientY;
    }, { passive: true });
    d.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest('[data-view]')) pill.classList.add('on'); });
    d.addEventListener('pointerout', (e) => { if (e.target.closest && e.target.closest('[data-view]') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[data-view]'))) pill.classList.remove('on'); });
  }

  /* ---------- mobile menu ---------- */
  const burger = $('.burger'), menu = $('#menu');
  function setMenu(open) {
    menu.hidden = !open; burger.setAttribute('aria-expanded', open);
    d.body.style.overflow = open ? 'hidden' : '';
  }
  burger && burger.addEventListener('click', () => setMenu(menu.hidden));
  menu && menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- filter ---------- */
  function applyFilter(cat) {
    $$('.pill').forEach((p) => { const on = p.dataset.filter === cat; p.classList.toggle('is-on', on); p.setAttribute('aria-pressed', on); });
    $$('.group').forEach((g) => { g.hidden = !(cat === 'all' || g.dataset.cat === cat); });
    $$('.group:not([hidden]) [data-up]').forEach((el) => el.classList.add('in'));
    requestAnimationFrame(() => { measure(); frame(); });
  }
  d.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]');
    if (!f) return;
    if (f.classList.contains('pill')) { applyFilter(f.dataset.filter); return; }
    e.preventDefault();
    applyFilter(f.dataset.filter);
    $('#collection').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- toast ---------- */
  const toastEl = $('.toast'); let toastT;
  function toast(msg, action) {
    toastEl.textContent = msg;
    if (action) { const b = d.createElement('button'); b.type = 'button'; b.className = 'toast__a'; b.textContent = action.label; b.addEventListener('click', action.fn); toastEl.append(b); }
    toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), action ? 4200 : 2600);
  }

  /* ---------- bag (lưu trên trình duyệt) ---------- */
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem('eser_bag') || '[]').filter((i) => PRODUCTS.some((p) => p.id === i.id)); } catch { bag = []; }
  const saveBag = () => { try { localStorage.setItem('eser_bag', JSON.stringify(bag)); } catch {} };
  function bagCount() { return bag.reduce((s, i) => s + i.qty, 0); }
  function updateBadge(pop) {
    $$('[data-bag-count]').forEach((el) => { el.textContent = bagCount(); if (pop && el.classList.contains('bagbtn__n')) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } });
  }
  function renderBag() {
    const box = $('.bag__items');
    if (!bag.length) { box.innerHTML = '<p class="bag__empty">Túi đang trống. Chọn một thiết kế bạn yêu thích nhé.</p>'; }
    else box.innerHTML = bag.map((it, i) => {
      const p = PRODUCTS.find((x) => x.id === it.id) || {};
      return `<div class="bi"><img src="${p.images && p.images[0] ? p.images[0] : ''}" alt=""><div><h5></h5><span class="mono">Size ${esc(it.size)} · ${money(p.price)}</span>
        <div class="bi__q"><button type="button" data-q="${i}" data-d="-1" aria-label="Giảm">−</button><span>${it.qty}</span><button type="button" data-q="${i}" data-d="1" aria-label="Tăng">+</button></div></div>
        <div class="bi__r"><b>${money(p.price * it.qty)}</b><button type="button" class="bi__rm" data-rm="${i}">Xoá</button></div></div>`;
    }).join('');
    $$('.bi h5', box).forEach((h, i) => { const p = PRODUCTS.find((x) => x.id === bag[i].id); h.textContent = p ? p.name : ''; });
    $('.bag__sum').textContent = money(bag.reduce((s, it) => { const p = PRODUCTS.find((x) => x.id === it.id); return s + (p ? p.price * it.qty : 0); }, 0));
    $('#order-form').style.display = bag.length ? '' : 'none';
    updateBadge();
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  $('.bag__items').addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
    if (q) { const it = bag[+q.dataset.q]; it.qty = clamp(it.qty + +q.dataset.d, 1, 20); }
    if (rm) bag.splice(+rm.dataset.rm, 1);
    if (q || rm) { saveBag(); renderBag(); }
  });

  /* ---------- dialogs ---------- */
  let lastFocus = null;
  function openDlg(el) { lastFocus = d.activeElement; el.hidden = false; d.body.style.overflow = 'hidden'; const f = el.querySelector('button, [href], input'); f && f.focus({ preventScroll: true }); }
  function closeDlg(el) { el.hidden = true; d.body.style.overflow = ''; lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true }); }
  const sheet = $('#sheet'), bagEl = $('#bag');
  $$('[data-open-bag]').forEach((b) => b.addEventListener('click', () => { renderBag(); openDlg(bagEl); }));
  bagEl.addEventListener('click', (e) => { if (e.target.closest('[data-close-bag]')) closeDlg(bagEl); });
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDlg(sheet); });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!sheet.hidden) closeDlg(sheet); else if (!bagEl.hidden) closeDlg(bagEl); else if (menu && !menu.hidden) setMenu(false); }
    if (e.key === 'Tab') { // giữ focus trong dialog
      const open = !sheet.hidden ? sheet : !bagEl.hidden ? bagEl : null; if (!open) return;
      const f = $$('button:not([disabled]), [href], input, select, textarea', open).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && d.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && d.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- product sheet ---------- */
  let cur = null, size = null, qty = 1;
  function openProduct(id) {
    const p = PRODUCTS.find((x) => x.id === id); if (!p) return;
    cur = p; size = p.sizes.length === 1 ? p.sizes[0] : null; qty = 1;
    const cat = CATS[p.category];
    $('.sheet__cat', sheet).textContent = (cat ? cat.name : 'ESER') + (p.badge ? ' · ' + p.badge : '');
    $('.sheet__name', sheet).textContent = p.name;
    $('.sheet__desc', sheet).textContent = p.description;
    $('.sheet__details', sheet).innerHTML = esc(p.details || '').replace(/\n/g, '<br>');
    const main = $('.sheet__main img', sheet);
    const setImg = (i) => { main.src = p.images[i] || ''; main.alt = p.name; $$('.sheet__thumbs button', sheet).forEach((b, j) => b.setAttribute('aria-current', i === j)); };
    $('.sheet__thumbs', sheet).innerHTML = p.images.length > 1 ? p.images.map((u, i) => `<button type="button" aria-label="Ảnh ${i + 1}"><img src="${esc(u)}" alt=""></button>`).join('') : '';
    $$('.sheet__thumbs button', sheet).forEach((b, i) => b.addEventListener('click', () => setImg(i)));
    setImg(0);
    $('.sizes', sheet).innerHTML = p.sizes.map((s) => `<button type="button" role="radio" aria-checked="${s === size}">${esc(s)}</button>`).join('') || '<span class="mono">Free size</span>';
    $('.sheet__opt:nth-of-type(1)', sheet);
    const z = $('[data-zalo]', sheet);
    if (z && DATA.zalo) z.href = DATA.zalo;
    updSheet();
    openDlg(sheet);
  }
  function updSheet() {
    $('.stepper output', sheet).textContent = qty;
    $('.sheet__sum', sheet).textContent = cur.price ? money(cur.price * qty) : 'Liên hệ';
    $$('.sizes button', sheet).forEach((b) => b.setAttribute('aria-checked', b.textContent === size));
  }
  $('.sizes', sheet).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { size = b.textContent; updSheet(); } });
  $$('[data-step]', sheet).forEach((b) => b.addEventListener('click', () => { qty = clamp(qty + +b.dataset.step, 1, 20); updSheet(); }));
  $('[data-add]', sheet).addEventListener('click', () => {
    if (cur.sizes.length && !size) { toast('Bạn chọn size giúp ESER nhé'); $('.sizes button', sheet) && $('.sizes button', sheet).focus(); return; }
    const sz = size || 'Free';
    const ex = bag.find((i) => i.id === cur.id && i.size === sz);
    if (ex) ex.qty = clamp(ex.qty + qty, 1, 20); else bag.push({ id: cur.id, size: sz, qty });
    saveBag(); updateBadge(true);
    closeDlg(sheet);
    navHold = performance.now() + 3000; nav && nav.classList.remove('is-hidden');
    toast(`Đã thêm “${cur.name}” · size ${sz}`, { label: 'Xem túi →', fn: () => { toastEl.classList.remove('show'); renderBag(); openDlg(bagEl); } });
  });
  d.addEventListener('click', (e) => { const c = e.target.closest('.card[data-pid]'); if (c) openProduct(c.dataset.pid); });
  d.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.card[data-pid]')) { e.preventDefault(); openProduct(e.target.dataset.pid); } });

  /* ---------- forms → /api/inquiries ---------- */
  async function submit(form, extra) {
    const msg = $('.form__msg', form), btn = $('button[type=submit]', form);
    const fd = Object.fromEntries(new FormData(form).entries());
    let bad = false;
    $$('[required]', form).forEach((i) => { const ok = i.value.trim() && (i.name !== 'phone' || i.value.replace(/\D/g, '').length >= 9); i.closest('.fld').classList.toggle('err', !ok); if (!ok) bad = true; });
    if (bad) { msg.className = 'form__msg bad'; msg.textContent = 'Vui lòng nhập họ tên và số điện thoại hợp lệ.'; return false; }
    btn.disabled = true; msg.className = 'form__msg'; msg.textContent = 'Đang gửi…';
    try {
      const r = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fd, ...extra }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Không gửi được');
      msg.className = 'form__msg ok'; form.reset(); return true;
    } catch (err) {
      msg.className = 'form__msg bad'; msg.textContent = (err.message || 'Lỗi kết nối') + (DATA.phone ? ` — hoặc gọi ${DATA.phone}` : ''); return false;
    } finally { btn.disabled = false; }
  }
  const cf = $('#contact-form');
  cf && cf.addEventListener('submit', async (e) => { e.preventDefault(); if (await submit(cf, {})) { $('.form__msg', cf).textContent = 'Cảm ơn bạn! ESER sẽ liên hệ lại sớm.'; toast('Đã gửi lời nhắn ✳'); } });
  const of = $('#order-form');
  of && of.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!bag.length) return;
    if (await submit(of, { items: bag })) {
      bag = []; saveBag(); renderBag(); updateBadge();
      $('.bag__items').innerHTML = '<p class="bag__empty">Cảm ơn bạn! ESER đã nhận đơn và sẽ gọi xác nhận trong thời gian sớm nhất.</p>';
      toast('Đặt hàng thành công ✳');
    }
  });

  updateBadge();
})();
