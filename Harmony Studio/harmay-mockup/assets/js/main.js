/* ==========================================================================
   HARMONY.STUDIO — main.js
   Một nguồn sự thật cho liên hệ + video (SITE), cùng bộ motion cho toàn site.
   ========================================================================== */
const SITE = window.SITE = {
  brand: 'HARMONY.STUDIO',
  brandConfirm: '[[CẦN XÁC NHẬN]]',
  tagline: 'Nhà mốt thiết kế cho xưởng và may đo theo số đo riêng.',
  season: 'Bộ sưu tập Thu Đông',
  phone: '0900 000 000',
  phoneNote: '[[CẦN XÁC NHẬN]]',
  phoneHref: 'tel:0900000000',
  zalo: '#zalo-can-xac-nhan',
  messenger: '#messenger-can-xac-nhan',
  instagram: '#instagram-can-xac-nhan',
  facebook: '#facebook-can-xac-nhan',
  tiktok: '#tiktok-can-xac-nhan',
  email: 'contact@harmony.studio',
  emailNote: '[[CẦN XÁC NHẬN]]',
  address: 'Studio tại Việt Nam',
  addressNote: '[[CẦN XÁC NHẬN]]',
  hours: 'Đón khách theo lịch hẹn',
  /* Đổi video hero chỉ cần sửa 1 chỗ này (Cloudinary dlw6jmsyf + fallback local) */
  cloudinaryCloud: 'dlw6jmsyf',
  heroVideo: {
    desktop: 'https://res.cloudinary.com/dlw6jmsyf/video/upload/v1793370424/harmony-studio/video/hero-desktop.mp4',
    mobile: 'https://res.cloudinary.com/dlw6jmsyf/video/upload/v1793370440/harmony-studio/video/hero-mobile.mp4',
    poster: 'https://res.cloudinary.com/dlw6jmsyf/image/upload/v1793370449/harmony-studio/video/hero-poster.webp',
    posterMobile: 'https://res.cloudinary.com/dlw6jmsyf/image/upload/v1793370451/harmony-studio/video/hero-poster-mobile.webp',
    altDesktop: 'https://res.cloudinary.com/dlw6jmsyf/video/upload/v1793370443/harmony-studio/video/hero-alt-desktop.mp4',
    altMobile: 'https://res.cloudinary.com/dlw6jmsyf/video/upload/v1793370447/harmony-studio/video/hero-alt-mobile.mp4',
    localDesktop: 'assets/video/hero-desktop.mp4',
    localMobile: 'assets/video/hero-mobile.mp4',
    localAltDesktop: 'assets/video/hero-alt-desktop.mp4',
    localAltMobile: 'assets/video/hero-alt-mobile.mp4',
  },
  motion: { easeOut: 'power3.out', easeInOut: 'power3.inOut', fast: .3, med: .65, slow: 1.15 },
};

const DATA = window.HARMONY_DATA || { niches: [], collections: [], looks: [] };
const lookById = Object.fromEntries(DATA.looks.map(l => [l.id, l]));
const collById = Object.fromEntries(DATA.collections.map(c => [c.id, c]));
const nicheById = Object.fromEntries(DATA.niches.map(n => [n.id, n]));

const ARR = `<svg class="arr" viewBox="0 0 24 10" fill="none" aria-hidden="true"><path d="M0 5H22M17 1L22 5L17 9" stroke="currentColor" stroke-width="1.3"/></svg>`;
const IC_PHONE = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.5 4h3l1.5 4-2 1.7a12 12 0 0 0 5.3 5.3l1.7-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" stroke="currentColor" stroke-width="1.5"/></svg>`;
const IC_MSG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" stroke="currentColor" stroke-width="1.5"/><path d="M7.5 13.5 10.8 10l2.2 2.2 3.5-2.2-3.3 3.5-2.2-2.2-3.5 2.2Z" fill="currentColor"/></svg>`;

const cutPicture = (l, sizes = '50vw', alt = '') => {
  const b = l.cut;
  const w = Math.round(1100 * l.cutRatio);
  return `<img src="${b}-1100.webp" srcset="${b}-600.webp 600w, ${b}-1100.webp 1100w, ${b}-1800.webp 1800w" sizes="${sizes}" width="${w}" height="1100" alt="${alt || l.name}" decoding="async">`;
};
const photoImg = (l, sizes = '40vw', alt = '') => {
  if (!l.photo) return cutPicture(l, sizes, alt);
  const b = l.photo;
  const h = Math.round(800 / l.photoRatio);
  return `<img src="${b}-800.webp" srcset="${b}-400.webp 400w, ${b}-800.webp 800w, ${b}-1365.webp 1365w" sizes="${sizes}" width="800" height="${h}" alt="${alt || l.name}" decoding="async">`;
};

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  (navigator.connection && navigator.connection.saveData);
if (reduced()) document.documentElement.classList.add('reduced');

/* ==========================================================================
   Vỏ trang dùng chung: header, menu, liên hệ nổi, thanh mobile, footer, modal, màn che
   ========================================================================== */
function mountChrome() {
  const page = document.body.dataset.page || '';
  const cur = p => (p === page ? ' aria-current="page"' : '');
  const navItems = [
    ['index.html', 'home', 'Trang chủ', '04', '#E7B2A8'],
    ['bo-suu-tap.html', 'collections', 'Bộ sưu tập', '07', '#BCD6D1'],
    ['dich-vu.html', 'services', 'Dịch vụ', '00', '#D4D6D8'],
    ['gioi-thieu.html', 'about', 'Câu chuyện', '03', '#E6D6BD'],
    ['lien-he.html', 'contact', 'Liên hệ', '15', '#E7B2A8'],
  ];

  const shell = document.createElement('div');
  shell.innerHTML = `
    <div class="curtain" id="curtain" aria-hidden="true"><span class="brand">HARMONY<i>.</i>STUDIO</span></div>
    <div class="cursor" id="cursor" aria-hidden="true">Xem</div>
    <header class="header" id="header">
      <a class="brand" href="index.html" aria-label="Harmony.Studio — Trang chủ">HARMONY<i>.</i>STUDIO</a>
      <nav class="nav" aria-label="Điều hướng chính">
        <a href="bo-suu-tap.html"${cur('collections')}>Bộ sưu tập</a>
        <a href="dich-vu.html#xuong"${cur('services')}>Thiết kế cho xưởng</a>
        <a href="dich-vu.html#may-do">May đo riêng</a>
        <a href="gioi-thieu.html"${cur('about')}>Câu chuyện</a>
        <a href="lien-he.html"${cur('contact')}>Liên hệ</a>
        <button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="menu">
          <span id="menuBtnLbl">Menu</span><span class="bars" aria-hidden="true"></span>
        </button>
      </nav>
    </header>
    <div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden="true">
      <div>
        <ul class="menu__links">
          ${navItems.map(([href, key, lbl], i) => `
            <li><a class="menu__link" href="${href}" data-pv="${i}"${cur(key)}>
              <small>0${i + 1}</small><span>${lbl}</span>
            </a></li>`).join('')}
        </ul>
        <div class="menu__colls">
          ${DATA.collections.map(c => `<a href="chi-tiet-bo-suu-tap.html?id=${c.id}">${c.code} — ${c.name}</a>`).join('')}
        </div>
      </div>
      <div class="menu__aside">
        <div class="menu__preview" aria-hidden="true">
          ${navItems.map(([, , , lid, bg], i) => `
            <div class="pv${i === 0 ? ' is-on' : ''}" data-pv-box="${i}">
              <div class="pv-bg" style="background:${bg}"></div>
              ${cutPicture(lookById[lid] || DATA.looks[0], '32vw')}
            </div>`).join('')}
        </div>
        <div class="menu__foot">
          <span>Hotline: <a href="${SITE.phoneHref}">${SITE.phone}</a> <b class="tbc">${SITE.phoneNote}</b></span>
          <span><a href="${SITE.zalo}">Zalo</a> · <a href="${SITE.messenger}">Messenger</a></span>
        </div>
      </div>
    </div>
    <div class="float-contact" aria-label="Liên hệ nhanh">
      <a class="fc" href="${SITE.zalo}" aria-label="Nhắn Zalo"><b>Zalo</b><span>Nhắn Zalo ${SITE.phoneNote}</span></a>
      <a class="fc" href="${SITE.messenger}" aria-label="Nhắn Messenger">${IC_MSG}<span>Nhắn Messenger</span></a>
      <a class="fc" href="${SITE.phoneHref}" aria-label="Gọi Hotline">${IC_PHONE}<span>Gọi ${SITE.phone}</span></a>
    </div>
    <nav class="mbar" aria-label="Liên hệ nhanh">
      <a href="${SITE.zalo}"><b>Zalo</b></a>
      <a href="${SITE.messenger}">${IC_MSG}<span>Messenger</span></a>
      <a href="${SITE.phoneHref}">${IC_PHONE}<span>Gọi</span></a>
    </nav>
    <div class="modal" id="lookModal" role="dialog" aria-modal="true" aria-labelledby="lmTitle" aria-hidden="true">
      <div class="modal__bg" data-close></div>
      <div class="modal__box">
        <button class="modal__close" type="button" data-close aria-label="Đóng"><svg viewBox="0 0 16 16"><path d="M2 2l12 12M14 2 2 14" stroke="currentColor" stroke-width="1.5"/></svg></button>
        <div class="modal__fig" id="lmFig"></div>
        <div class="modal__txt">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
              <span class="label" id="lmNo">LOOK 01</span>
              <div class="modal__nav">
                <button type="button" id="lmPrev" aria-label="Look trước"><svg viewBox="0 0 24 10" fill="none"><path d="M24 5H2M7 1 2 5l5 4" stroke="currentColor" stroke-width="1.3"/></svg></button>
                <button type="button" id="lmNext" aria-label="Look tiếp"><svg viewBox="0 0 24 10" fill="none"><path d="M0 5h22m-5-4 5 4-5 4" stroke="currentColor" stroke-width="1.3"/></svg></button>
              </div>
            </div>
            <h3 id="lmTitle">—</h3>
            <p class="small" style="color:var(--ink-soft);margin-bottom:18px" id="lmMeta"></p>
            <ul id="lmPieces"></ul>
          </div>
          <div class="modal__btns">
            <a class="btn btn--accent" id="lmOrder" href="lien-he.html"><span>Đặt may mẫu này</span>${ARR}</a>
            <a class="btn btn--ghost" href="${SITE.zalo}"><span>Nhắn Zalo</span></a>
            <a class="btn btn--ghost" href="${SITE.messenger}"><span>Nhắn Messenger</span></a>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.prepend(shell);

  const footer = document.getElementById('footer');
  if (footer) {
    footer.innerHTML = `
      <div class="footer__cols">
        <ul>
          <li><h4>Thương hiệu</h4></li>
          <li>${SITE.brand} <b class="tbc">${SITE.brandConfirm}</b></li>
          <li>${SITE.tagline}</li>
          <li>${SITE.address} <b class="tbc">${SITE.addressNote}</b></li>
          <li>${SITE.hours}</li>
        </ul>
        <ul>
          <li><h4>Điều hướng</h4></li>
          <li><a href="index.html">Trang chủ</a></li>
          <li><a href="bo-suu-tap.html">Bộ sưu tập</a></li>
          <li><a href="dich-vu.html#xuong">Thiết kế cho xưởng</a></li>
          <li><a href="dich-vu.html#may-do">May đo riêng</a></li>
          <li><a href="gioi-thieu.html">Câu chuyện</a></li>
          <li><a href="lien-he.html">Liên hệ</a></li>
        </ul>
        <ul>
          <li><h4>Ngách thời trang</h4></li>
          ${DATA.niches.map(n => `<li><a href="bo-suu-tap.html?ngach=${n.id}">${n.name}</a></li>`).join('')}
        </ul>
        <ul>
          <li><h4>Liên hệ trực tiếp</h4></li>
          <li><a href="${SITE.phoneHref}">Hotline: ${SITE.phone}</a> <b class="tbc">${SITE.phoneNote}</b></li>
          <li><a href="mailto:${SITE.email}">${SITE.email}</a> <b class="tbc">${SITE.emailNote}</b></li>
          <li><a href="${SITE.zalo}">Nhắn Zalo</a> · <a href="${SITE.messenger}">Messenger</a></li>
          <li><a href="${SITE.facebook}">Facebook</a> · <a href="${SITE.instagram}">Instagram</a> · <a href="${SITE.tiktok}">TikTok</a></li>
        </ul>
      </div>
      <div></div>
      <div>
        <div class="footer__big" aria-hidden="true">
          <svg viewBox="0 0 1700 205"><text x="0" y="178" font-size="196" textLength="1700" lengthAdjust="spacing">HARMONY.STUDIO</text></svg>
        </div>
        <div class="footer__legal">
          <span>© ${SITE.brand} — Bản thiết kế giao diện gửi duyệt. Các mục có nhãn <b class="tbc">[[CẦN XÁC NHẬN]]</b> chờ khách bổ sung.</span>
          <span>Video mở đầu: Mixkit Free License · Ảnh: bộ ảnh khách cung cấp</span>
        </div>
      </div>`;
  }

  // điền thông tin SITE vào các phần tử có data-site
  document.querySelectorAll('[data-site]').forEach(el => {
    const k = el.dataset.site;
    if (SITE[k]) el.textContent = SITE[k];
  });
  document.querySelectorAll('[data-site-href]').forEach(el => {
    const k = el.dataset.siteHref;
    if (SITE[k]) el.setAttribute('href', SITE[k]);
  });
}

/* ==========================================================================
   Lenis + GSAP + Header + Menu + Curtain + Con trỏ + Modal
   ========================================================================== */
let lenis;
function initScrollEngine() {
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  if (window.Flip) gsap.registerPlugin(Flip);
  if (window.CustomEase) {
    gsap.registerPlugin(CustomEase);
    CustomEase.create('hmOut', '.22,1,.36,1');
    CustomEase.create('hmInOut', '.65,0,.35,1');
    SITE.motion.easeOut = 'hmOut';
    SITE.motion.easeInOut = 'hmInOut';
  }
  if (!reduced() && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.documentElement.classList.add('motion-ready');
}

function syncFooterSpacer() {
  const main = document.querySelector('.page-main');
  if (main) main.style.marginBottom = '0px';
}

function initHeaderAndMenu() {
  const header = document.getElementById('header');
  const btn = document.getElementById('menuBtn');
  const lbl = document.getElementById('menuBtnLbl');
  const menu = document.getElementById('menu');
  const links = menu.querySelectorAll('.menu__link > span');
  const svcTabs = document.querySelector('.svc-tabs');
  let open = false;

  const onScroll = () => {
    const y = window.scrollY;
    const solid = y > window.innerHeight * 0.72 || document.body.dataset.header === 'dark';
    header.classList.toggle('is-solid', solid);
    if (svcTabs) {
      const rect = svcTabs.getBoundingClientRect();
      const passedSubMenu = rect.top <= 4 && y > 120;
      header.classList.toggle('is-hidden', !open && passedSubMenu);
      const mayDo = document.getElementById('may-do');
      if (mayDo) {
        const isMayDo = mayDo.getBoundingClientRect().top <= 160;
        const chips = svcTabs.querySelectorAll('.chip');
        if (chips[0]) chips[0].setAttribute('aria-pressed', String(!isMayDo));
        if (chips[1]) chips[1].setAttribute('aria-pressed', String(isMayDo));
      }
    } else {
      header.classList.remove('is-hidden');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  if (document.body.dataset.header === 'dark') header.classList.add('is-solid');
  onScroll();

  const setOpen = v => {
    open = v;
    btn.setAttribute('aria-expanded', String(v));
    menu.setAttribute('aria-hidden', String(!v));
    lbl.textContent = v ? 'Đóng' : 'Menu';
    header.classList.toggle('is-menu', v);
    document.body.classList.toggle('is-locked', v);
    if (lenis) v ? lenis.stop() : lenis.start();
    if (!window.gsap || reduced()) {
      menu.classList.toggle('is-open', v);
      menu.style.clipPath = v ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)';
      return;
    }
    if (v) {
      menu.classList.add('is-open');
      gsap.killTweensOf([menu, links]);
      gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .7, ease: SITE.motion.easeInOut });
      gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: .65, stagger: .055, delay: .18, ease: SITE.motion.easeOut });
    } else {
      gsap.killTweensOf([menu, links]);
      gsap.to(links, { yPercent: -105, duration: .35, stagger: { each: .03, from: 'end' }, ease: 'power2.in' });
      gsap.to(menu, {
        clipPath: 'inset(0 0 100% 0)', duration: .55, delay: .12, ease: SITE.motion.easeInOut,
        onComplete: () => menu.classList.remove('is-open'),
      });
    }
  };
  btn.addEventListener('click', () => setOpen(!open));
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && open) setOpen(false); });

  const boxes = menu.querySelectorAll('[data-pv-box]');
  menu.querySelectorAll('[data-pv]').forEach(a => {
    const idx = +a.dataset.pv;
    a.addEventListener('mouseenter', () => boxes.forEach((b, i) => b.classList.toggle('is-on', i === idx)));
  });
}

function initPageTransitions() {
  const curtain = document.getElementById('curtain');
  const revealCurtain = () => {
    if (!window.gsap || reduced()) { curtain.style.transform = 'translateY(-101%)'; return; }
    gsap.to(curtain, { yPercent: -101, duration: .75, ease: SITE.motion.easeInOut });
  };

  // Intro trên trang chủ (chỉ chạy lần đầu mỗi phiên, hoặc khi ?intro=1)
  const intro = document.getElementById('intro');
  const forceIntro = new URLSearchParams(location.search).has('intro');
  if (intro && !reduced() && (!sessionStorage.getItem('hm_intro') || forceIntro)) {
    sessionStorage.setItem('hm_intro', '1');
    curtain.style.transform = 'translateY(-101%)';
    document.body.classList.add('is-locked');
    if (lenis) lenis.stop();
    const word = intro.querySelector('.intro__word');
    const txt = word.textContent.trim();
    word.innerHTML = [...txt].map(c => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      document.body.classList.remove('is-locked');
      if (lenis) lenis.start();
      gsap.to(intro, {
        clipPath: 'inset(0 0 100% 0)', duration: .85, ease: SITE.motion.easeInOut,
        onComplete: () => intro.remove(),
      });
    };
    gsap.set(intro, { clipPath: 'inset(0 0 0% 0)' });
    gsap.fromTo(word.querySelectorAll('.ch'),
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: .6, stagger: .045, ease: SITE.motion.easeOut });
    gsap.delayedCall(1.65, finish);
    ['click', 'wheel', 'touchstart', 'keydown'].forEach(ev =>
      window.addEventListener(ev, finish, { once: true, passive: true }));
  } else {
    if (intro) intro.remove();
    revealCurtain();
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || a.target === '_blank') return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    if (!window.gsap || reduced()) return;
    e.preventDefault();
    gsap.set(curtain, { yPercent: 101 });
    gsap.to(curtain.querySelector('.brand'), { opacity: 1, duration: .25, delay: .15 });
    gsap.to(curtain, {
      yPercent: 0, duration: .5, ease: SITE.motion.easeInOut,
      onComplete: () => { location.href = a.href; },
    });
  });
}

function initCursor() {
  const cur = document.getElementById('cursor');
  if (!cur || !window.gsap || window.matchMedia('(hover: none)').matches) return;
  const xTo = gsap.quickTo(cur, 'x', { duration: .22, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: .22, ease: 'power3' });
  window.addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-cursor]');
    gsap.to(cur, { scale: t ? 1 : 0, opacity: t ? 1 : 0, duration: .28, ease: SITE.motion.easeOut });
    if (t && t.dataset.cursor) cur.textContent = t.dataset.cursor;
  });
}

/* Modal xem nhanh look */
let modalIdx = 0;
function openLookModal(lookId) {
  const modal = document.getElementById('lookModal');
  const idx = DATA.looks.findIndex(l => l.id === lookId);
  modalIdx = idx >= 0 ? idx : 0;
  const render = () => {
    const l = DATA.looks[modalIdx];
    const c = collById[l.collection];
    const n = nicheById[l.niche];
    const fig = document.getElementById('lmFig');
    fig.style.setProperty('--tint', c ? c.tint : '#D4D6D8');
    fig.innerHTML = cutPicture(l, '42vw');
    document.getElementById('lmNo').textContent = `LOOK ${l.no}`;
    document.getElementById('lmTitle').textContent = l.name;
    document.getElementById('lmMeta').textContent = `${n ? n.name : ''} · ${c ? c.code + ' — ' + c.name : ''} · Màu: ${l.color}`;
    document.getElementById('lmPieces').innerHTML = l.pieces.map((p, i) => `<li><span style="opacity:.55;margin-right:10px">0${i + 1}</span>${p}</li>`).join('');
    document.getElementById('lmOrder').href = `lien-he.html?nhu-cau=dat-may&look=${l.no}`;
  };
  render();
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  if (lenis) lenis.stop();
  if (window.gsap && !reduced()) {
    gsap.to(modal.querySelector('.modal__bg'), { opacity: 1, duration: .35 });
    gsap.fromTo(modal.querySelector('.modal__box'), { opacity: 0, y: 24, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .45, ease: SITE.motion.easeOut });
  } else {
    modal.querySelector('.modal__bg').style.opacity = 1;
    modal.querySelector('.modal__box').style.opacity = 1;
  }
  document.getElementById('lmPrev').onclick = () => { modalIdx = (modalIdx - 1 + DATA.looks.length) % DATA.looks.length; render(); };
  document.getElementById('lmNext').onclick = () => { modalIdx = (modalIdx + 1) % DATA.looks.length; render(); };
}
function closeLookModal() {
  const modal = document.getElementById('lookModal');
  if (!modal.classList.contains('is-open')) return;
  document.body.classList.remove('is-locked');
  if (lenis) lenis.start();
  const done = () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); };
  if (window.gsap && !reduced()) {
    gsap.to(modal.querySelector('.modal__bg'), { opacity: 0, duration: .25 });
    gsap.to(modal.querySelector('.modal__box'), { opacity: 0, y: 16, duration: .25, onComplete: done });
  } else done();
}
function initModalEvents() {
  document.addEventListener('click', e => {
    const open = e.target.closest('[data-open-look]');
    if (open) { e.preventDefault(); openLookModal(open.dataset.openLook); return; }
    if (e.target.closest('[data-close]')) closeLookModal();
  });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeLookModal(); });
}

/* Reveal chung cho mọi trang */
function initReveals() {
  if (!window.gsap || reduced()) return;
  document.querySelectorAll('[data-reveal]').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: .75, ease: SITE.motion.easeOut,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  document.querySelectorAll('[data-stagger]').forEach(group => {
    const kids = group.children;
    gsap.from(kids, {
      opacity: 0, y: 28, duration: .7, stagger: .08, ease: SITE.motion.easeOut,
      scrollTrigger: { trigger: group, start: 'top 86%', once: true },
    });
  });
}

/* ==========================================================================
   TRANG CHỦ
   ========================================================================== */
function initHome() {
  initHeroVideo();
  initManifesto();
  initChapters();
  initMarquee();
  initRunway();
  initNiches();
  initProcess();
  initCta();
}

function initHeroVideo() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const video = document.getElementById('heroVideo');
  const poster = document.getElementById('heroPoster');
  const playBtn = document.getElementById('heroPlay');
  const srcBtn = document.getElementById('heroSource');
  const isMob = window.matchMedia('(max-width: 767px)').matches;
  let useAlt = false;

  const applySrc = () => {
    const d = useAlt ? SITE.heroVideo.altDesktop : SITE.heroVideo.desktop;
    const m = useAlt ? SITE.heroVideo.altMobile : SITE.heroVideo.mobile;
    const ld = useAlt ? SITE.heroVideo.localAltDesktop : SITE.heroVideo.localDesktop;
    const lm = useAlt ? SITE.heroVideo.localAltMobile : SITE.heroVideo.localMobile;
    poster.src = isMob ? SITE.heroVideo.posterMobile : SITE.heroVideo.poster;
    video.poster = poster.src;
    video.onerror = () => { video.onerror = null; video.src = isMob ? lm : ld; video.play().catch(() => {}); };
    video.src = isMob ? m : d;
  };
  applySrc();

  if (reduced()) {
    hero.classList.add('no-motion');
    video.pause();
  } else {
    const p = video.play();
    if (p && p.catch) p.catch(() => { playBtn.dataset.paused = '1'; playBtn.querySelector('span').textContent = 'Phát'; });
  }

  playBtn.addEventListener('click', () => {
    if (video.paused) {
      hero.classList.remove('no-motion');
      video.play(); playBtn.querySelector('span').textContent = 'Tạm dừng';
    } else {
      video.pause(); playBtn.querySelector('span').textContent = 'Phát';
    }
  });
  if (srcBtn) {
    srcBtn.addEventListener('click', () => {
      useAlt = !useAlt;
      srcBtn.querySelector('span').textContent = useAlt ? 'Phim sàn diễn' : 'Lookbook chuyển động';
      applySrc();
      video.play().catch(() => {});
    });
  }

  if (!window.gsap || reduced()) return;
  const frame = hero.querySelector('.hero__frame');
  const ui = hero.querySelector('.hero__ui');
  const behind = hero.querySelector('.hero__behind .mega');
  const tl = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: '+=95%', pin: true, scrub: .5 },
  });
  tl.to(frame, { clipPath: isMob ? 'inset(12% 7% 16% 7%)' : 'inset(11% 16% 13% 16%)', ease: 'none' }, 0)
    .to(video, { scale: 1.12, ease: 'none' }, 0)
    .to(ui, { opacity: 0, y: -24, duration: .45, ease: 'none' }, 0)
    .to(behind, { opacity: 1, y: 0, duration: .55, ease: 'none' }, .25);
}

function initManifesto() {
  const txt = document.getElementById('manifestoTxt');
  if (!txt || !window.gsap || reduced()) return;
  const raw = txt.textContent.trim().split(/\s+/);
  txt.innerHTML = raw.map(w => `<span class="w">${w}</span>`).join(' ');
  gsap.to(txt.querySelectorAll('.w'), {
    opacity: 1, stagger: .05, ease: 'none',
    scrollTrigger: { trigger: txt, start: 'top 80%', end: 'bottom 45%', scrub: true },
  });
  const path = document.querySelector('.manifesto .stitch path');
  if (path) {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: '.manifesto', start: 'top 75%', end: 'bottom 30%', scrub: true },
    });
  }
}

function initChapters() {
  const root = document.getElementById('chapters');
  if (!root) return;
  const sidePos = ['left:9%', 'right:9%', 'left:10%', 'right:10%'];
  root.innerHTML = DATA.collections.map((c, idx) => {
    const hero = lookById[c.hero];
    const second = lookById[c.looks[1] || c.hero];
    return `
      <article class="chapter" style="--tint:${c.tint};--cink:${c.ink};--cacc:${c.accent}" ${c.dark ? 'data-dark' : ''}>
        <div class="chapter__top">
          <span class="label">Chương 0${idx + 1} / 0${DATA.collections.length} — ${c.tag}</span>
          <span class="label">${c.looks.length} mẫu</span>
        </div>
        <div class="chapter__giant" aria-hidden="true"><span class="mega">${c.code}</span></div>
        <svg class="chapter__scribble" viewBox="0 0 600 320" style="width:min(48vw,640px);top:18%;${idx % 2 ? 'left:6%' : 'right:6%'}" aria-hidden="true">
          <path d="M12 250 C 160 40, 340 300, 588 60"/>
        </svg>
        <div class="chapter__stage">
          <figure class="chapter__model chapter__model--b" style="${sidePos[idx]};--w:${second.cutRatio}" data-open-look="${second.id}" data-cursor="Xem">
            ${cutPicture(second, '28vw')}
          </figure>
          <figure class="chapter__model chapter__model--a" style="--w:${hero.cutRatio}" data-open-look="${hero.id}" data-cursor="Xem">
            ${cutPicture(hero, '(max-width:860px) 75vw, 42vw')}
          </figure>
        </div>
        <div class="chapter__info">
          <h3>${c.name} <b class="tbc">[[CẦN XÁC NHẬN]]</b></h3>
          <p>${c.blurb}</p>
          <a class="btn" href="chi-tiet-bo-suu-tap.html?id=${c.id}"><span>Xem ${c.looks.length} mẫu</span>${ARR}</a>
        </div>
        <div class="chapter__side">
          <span class="label">Look mở màn</span>
          <span class="n">LOOK ${hero.no}</span>
          <button class="link-u" type="button" data-open-look="${hero.id}"><span>Xem nhanh</span>${ARR}</button>
        </div>
      </article>`;
  }).join('');

  if (!window.gsap || reduced()) return;
  root.querySelectorAll('.chapter').forEach(ch => {
    const giant = ch.querySelector('.chapter__giant .mega');
    const ma = ch.querySelector('.chapter__model--a');
    const mb = ch.querySelector('.chapter__model--b');
    gsap.fromTo(giant, { yPercent: 18 }, {
      yPercent: -18, ease: 'none',
      scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo(ma, { yPercent: 10 }, {
      yPercent: -6, ease: 'none',
      scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true },
    });
    if (mb) gsap.fromTo(mb, { yPercent: 22 }, {
      yPercent: -14, ease: 'none',
      scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

function initMarquee() {
  const track = document.getElementById('marqueeTrack');
  if (!track || !window.gsap || reduced()) return;
  let x = 0, dir = -1, boost = 1;
  ScrollTrigger.create({
    onUpdate(self) {
      const v = self.getVelocity();
      dir = v < 0 ? 1 : -1;
      boost = gsap.utils.clamp(1, 4.5, 1 + Math.abs(v) / 600);
    },
  });
  gsap.ticker.add((_, dt) => {
    x += dir * 0.012 * dt * boost;
    boost += (1 - boost) * 0.08;
    if (x <= -50) x += 50;
    if (x > 0) x -= 50;
    track.style.transform = `translate3d(${x}%,0,0)`;
  });
}

/* Runway Experience + công cụ thử màu nền trực tiếp */
function initRunway() {
  const sec = document.getElementById('runway');
  if (!sec) return;
  const order = ['04', '00', '03', '06', '07', '09', '10', '13', '14', '15'];
  const swColors = { '04': '#C9241F', '00': '#1E1E22', '03': '#DEC9A6', '06': '#1F7A7C', '07': '#223634', '09': '#7FA9D8', '10': '#B5472A', '13': '#6E4C73', '14': '#C9B8A8', '15': '#B8292B' };
  const looks = order.map(id => lookById[id]);
  const line = document.getElementById('rwLine');
  const dots = document.getElementById('rwDots');
  line.innerHTML = looks.map((l, i) => `
    <figure class="rw-look" data-rw="${i}" style="height:min(86svh,880px)" data-open-look="${l.id}" data-cursor="Xem">
      ${cutPicture(l, '(max-width:860px) 75vw, 36vw')}
    </figure>`).join('');
  dots.innerHTML = looks.map((l, i) => `
    <button type="button" data-rw-go="${i}" style="--c:${swColors[l.id]}" aria-label="Look ${l.no}" ${i === 0 ? 'aria-current="true"' : ''}><i></i></button>`).join('');

  const noEl = document.getElementById('rwNo');
  const nameEl = document.getElementById('rwName');
  const nicheEl = document.getElementById('rwNiche');
  const piecesEl = document.getElementById('rwPieces');
  const swDot = document.getElementById('rwSwDot');
  const swTxt = document.getElementById('rwSwTxt');
  const orderBtn = document.getElementById('rwOrder');
  const quickBtn = document.getElementById('rwQuick');
  const els = [...line.querySelectorAll('.rw-look')];
  const dotBtns = [...dots.querySelectorAll('button')];
  let active = -1;

  const setInfo = i => {
    if (i === active) return;
    active = i;
    const l = looks[i];
    const n = nicheById[l.niche];
    noEl.innerHTML = `LOOK ${l.no} <small>0${i + 1} / ${looks.length}</small>`;
    nameEl.textContent = l.name;
    nicheEl.textContent = `${n ? n.name : ''} — Màu: ${l.color}`;
    piecesEl.innerHTML = l.pieces.map((p, k) => `<li><i>0${k + 1}</i><span>${p}</span></li>`).join('');
    swDot.style.background = swColors[l.id];
    swTxt.textContent = l.color;
    orderBtn.href = `lien-he.html?nhu-cau=dat-may&look=${l.no}`;
    quickBtn.dataset.openLook = l.id;
    dotBtns.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
  };

  const renderAt = t => {
    const idx = Math.round(gsap.utils ? gsap.utils.clamp(0, looks.length - 1, t) : 0);
    setInfo(idx);
    els.forEach((el, i) => {
      const d = i - t; // >0: phía sau đang tiến tới; <0: đã bước qua
      if (d < -0.85 || d > 4.3) {
        el.style.opacity = '0'; el.style.pointerEvents = 'none'; return;
      }
      el.style.pointerEvents = Math.abs(d) < 0.45 ? 'auto' : 'none';
      let x, y, sc, op, bl;
      if (d >= 0) {
        const side = i % 2 ? 1 : -1;
        x = side * Math.min(d, 3.5) * 9.5;
        y = -d * 5.2;
        sc = Math.max(0.34, 1 - d * 0.165);
        op = Math.max(0, 1 - d * 0.23);
        bl = Math.min(9, d * 2.4);
      } else {
        x = d * 18;
        y = -d * 10;
        sc = 1 - d * 0.25;
        op = Math.max(0, 1 + d * 1.35);
        bl = Math.min(8, -d * 6);
      }
      el.style.zIndex = String(50 - Math.round(d * 10));
      el.style.opacity = op.toFixed(3);
      el.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}vw), ${y.toFixed(2)}vh, 0) scale(${sc.toFixed(3)})`;
      el.style.filter = bl > 0.25 ? `blur(${bl.toFixed(1)}px)` : 'none';
    });
  };
  renderAt(0);

  let st;
  if (window.gsap && !reduced()) {
    const state = { t: 0 };
    st = ScrollTrigger.create({
      trigger: sec, start: 'top top', end: '+=220%', pin: true, scrub: .45,
      onUpdate(self) {
        state.t = self.progress * (looks.length - 1);
        renderAt(state.t);
      },
    });
  }
  dotBtns.forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.rwGo;
    if (st && lenis) {
      const y = st.start + (st.end - st.start) * (i / (looks.length - 1));
      lenis.scrollTo(y, { duration: .9 });
    } else renderAt(i);
  }));
}

function initNiches() {
  const list = document.getElementById('nicheList');
  const floater = document.getElementById('nicheFloat');
  if (!list) return;
  list.innerHTML = DATA.niches.map((n, i) => {
    const cnt = DATA.looks.filter(l => l.niche === n.id).length;
    const pl = lookById[n.photo];
    return `
      <div class="niche" data-niche="${i}">
        <a class="niche__row" href="bo-suu-tap.html?ngach=${n.id}">
          <span class="niche__no">0${i + 1}</span>
          <span class="niche__name">${n.name}</span>
          <span class="niche__count">${cnt} mẫu · ${n.note}</span>
          <span class="niche__go" aria-hidden="true">${ARR}</span>
        </a>
        <div class="niche__panel">
          <div class="niche__panel-in">
            ${photoImg(pl, '38vw')}
            <div>
              <p>${n.note}</p>
              <a class="btn btn--sm" href="bo-suu-tap.html?ngach=${n.id}"><span>Xem ${cnt} mẫu</span>${ARR}</a>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  if (floater) {
    floater.innerHTML = DATA.niches.map((n, i) => {
      const pl = lookById[n.photo];
      return `<img data-nf="${i}" src="${pl.photo}-800.webp" alt="${n.name}" width="600" height="800">`;
    }).join('');
  }

  const isMob = () => window.matchMedia('(hover: none), (max-width: 860px)').matches;
  const rows = list.querySelectorAll('.niche');

  if (window.gsap && floater && !isMob()) {
    const xTo = gsap.quickTo(floater, 'x', { duration: .35, ease: 'power3' });
    const yTo = gsap.quickTo(floater, 'y', { duration: .35, ease: 'power3' });
    const rTo = gsap.quickTo(floater, 'rotation', { duration: .4, ease: 'power3' });
    let lx = 0;
    list.addEventListener('pointermove', e => {
      xTo(e.clientX + 28); yTo(e.clientY - 140);
      rTo(gsap.utils.clamp(-8, 8, (e.clientX - lx) * 0.35));
      lx = e.clientX;
    });
    list.addEventListener('pointerenter', () => gsap.to(floater, { opacity: 1, scale: 1, duration: .35, ease: SITE.motion.easeOut }));
    list.addEventListener('pointerleave', () => gsap.to(floater, { opacity: 0, scale: .85, duration: .3 }));
    const imgs = floater.querySelectorAll('img');
    rows.forEach((r, i) => r.addEventListener('pointerenter', () => imgs.forEach((im, k) => im.classList.toggle('is-on', k === i))));
  }

  // Mobile: chạm lần 1 mở xem trước, chạm nút bên trong mới sang trang
  rows.forEach((r, idx) => {
    r.querySelector('.niche__row').addEventListener('click', e => {
      if (!isMob()) return;
      e.preventDefault();
      rows.forEach((other, k) => {
        const p = other.querySelector('.niche__panel');
        const open = k === idx && !other.classList.contains('is-open');
        other.classList.toggle('is-open', open);
        if (window.gsap) gsap.to(p, { height: open ? 'auto' : 0, duration: .4, ease: SITE.motion.easeOut });
        else p.style.height = open ? 'auto' : '0px';
      });
    });
  });
}

function initProcess() {
  const sec = document.getElementById('process');
  if (!sec) return;
  const DATA_STEPS = {
    b2b: [
      ['01', 'BREEF', 'Nhận yêu cầu từ xưởng', 'Chốt ngách hàng, số lượng mẫu cần ra, tệp khách của xưởng và tiến độ mong muốn.'],
      ['02', 'SKETCH', 'Phác thảo & chọn hướng', 'Lên bảng màu, phom chủ đạo và các mẫu trong bộ để xưởng duyệt trước khi dựng rập.'],
      ['03', 'PATTERN', 'Ra rập & may mẫu đầu', 'Dựng phom, may mẫu thử trên vải thật và chỉnh đường may cho dễ lên chuyền.'],
      ['04', 'HANDOFF', 'Bàn giao đưa vào sản xuất', 'Giao mẫu hoàn chỉnh và thông số kỹ thuật để xưởng sản xuất hàng loạt.'],
    ],
    bespoke: [
      ['01', 'CHOOSE', 'Chọn mẫu hoặc gửi ý tưởng', 'Chọn một look trên website hoặc gửi kiểu dáng, màu sắc và dịp mặc bạn mong muốn.'],
      ['02', 'MEASURE', 'Lấy số đo riêng', 'Đo trực tiếp tại studio theo lịch hẹn hoặc gửi số đo theo hướng dẫn của Harmony.'],
      ['03', 'FITTING', 'Dựng phom & thử đồ', 'May theo số đo riêng, hẹn thử để ôm vừa vai, eo và độ dài tà.'],
      ['04', 'FINISH', 'Hoàn thiện & trao tay', 'Ủi phom, kiểm từng đường chỉ và gửi sản phẩm tận tay khách.'],
    ],
  };
  const body = document.getElementById('procBody');
  const word = document.getElementById('procWord');
  const nodes = sec.querySelectorAll('.process__nodes span');
  const runPath = sec.querySelector('.process__thread .run');
  const tabs = sec.querySelectorAll('[data-proc-tab]');
  let mode = 'b2b', curStep = 0;

  const mountSteps = () => {
    const arr = DATA_STEPS[mode];
    body.querySelectorAll('.process__step').forEach(e => e.remove());
    arr.forEach(([no, w, title, desc], i) => {
      const d = document.createElement('div');
      d.className = 'process__step';
      d.innerHTML = `<span class="label no">Bước ${no} / 04</span><h3>${title}</h3><p class="lead">${desc}</p>`;
      body.appendChild(d);
    });
    showStep(curStep, true);
  };

  const showStep = (i, instant = false) => {
    curStep = i;
    const arr = DATA_STEPS[mode];
    const steps = body.querySelectorAll('.process__step');
    word.textContent = arr[i][1];
    nodes.forEach((n, k) => n.classList.toggle('is-on', k <= i));
    steps.forEach((el, k) => {
      if (!window.gsap || reduced() || instant) {
        el.style.opacity = k === i ? 1 : 0;
        el.style.transform = 'none';
      } else {
        gsap.to(el, { opacity: k === i ? 1 : 0, y: k === i ? 0 : (k < i ? -24 : 24), duration: .45, ease: SITE.motion.easeOut });
      }
    });
  };
  mountSteps();

  tabs.forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.procTab;
    tabs.forEach(t => t.setAttribute('aria-selected', String(t === b)));
    mountSteps();
  }));

  if (!window.gsap || reduced()) return;
  const len = runPath.getTotalLength();
  gsap.set(runPath, { strokeDasharray: len, strokeDashoffset: len });
  ScrollTrigger.create({
    trigger: sec, start: 'top top', end: '+=170%', pin: true, scrub: .4,
    onUpdate(self) {
      gsap.set(runPath, { strokeDashoffset: len * (1 - self.progress) });
      const idx = Math.min(3, Math.floor(self.progress * 4));
      if (idx !== curStep) showStep(idx);
    },
  });
}

function initCta() {
  const sec = document.querySelector('.cta');
  if (!sec || !window.gsap || reduced()) return;
  gsap.fromTo('.cta__giant', { scale: .92 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
}

/* ==========================================================================
   TRANG DANH SÁCH BỘ SƯU TẬP
   ========================================================================== */
function initCollectionsPage() {
  const list = document.getElementById('collList');
  const bar = document.getElementById('collFilters');
  if (!list) return;
  const params = new URLSearchParams(location.search);
  let active = params.get('ngach') || 'all';

  const countFor = nid => nid === 'all' ? DATA.looks.length : DATA.looks.filter(l => l.niche === nid).length;
  bar.innerHTML = [
    ['all', 'Tất cả bộ sưu tập'],
    ...DATA.niches.map(n => [n.id, n.name]),
  ].map(([id, name]) => `
    <button class="chip" type="button" data-filter="${id}" aria-pressed="${id === active}">
      <span>${name}</span><small>(${countFor(id)})</small>
    </button>`).join('');

  const render = () => {
    list.innerHTML = DATA.collections.map((c, idx) => {
      const looks = c.looks.map(id => lookById[id]).filter(l => active === 'all' || l.niche === active);
      if (!looks.length) return '';
      const h = looks[0];
      const s = looks[1];
      const niches = [...new Set(looks.map(l => nicheById[l.niche]?.name))].filter(Boolean);
      return `
        <article class="cl-item" style="--tint:${c.tint};--cink:${c.ink}" ${c.dark ? 'data-dark' : ''}>
          <div class="cl-item__no">
            <span class="label">Chương 0${idx + 1} — ${c.tag}</span>
            <span class="label">${looks.length} mẫu</span>
          </div>
          <div class="cl-item__giant" aria-hidden="true"><span class="mega">${c.code}</span></div>
          <div class="cl-item__img">
            ${s ? `<img src="${s.cut}-1100.webp" alt="${s.name}" style="height:66%;transform:translateX(22vw)" loading="lazy">` : ''}
            ${cutPicture(h, '(max-width:860px) 75vw, 38vw')}
          </div>
          <div class="cl-item__info">
            <div class="cl-item__tags">${niches.map(n => `<span>${n}</span>`).join('')}</div>
            <h2>${c.name} <b class="tbc">[[CẦN XÁC NHẬN]]</b></h2>
            <p>${c.blurb}</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <a class="btn" href="chi-tiet-bo-suu-tap.html?id=${c.id}"><span>Mở lookbook (${c.looks.length} mẫu)</span>${ARR}</a>
              <button class="btn btn--ghost" type="button" data-open-look="${h.id}"><span>Xem nhanh Look ${h.no}</span></button>
            </div>
          </div>
          <div class="cl-item__more">
            <span class="label">Mẫu tiêu biểu</span>
            <span class="n">LOOK ${h.no}</span>
          </div>
        </article>`;
    }).join('');
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };
  render();

  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    active = b.dataset.filter;
    bar.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
    render();
  });
}

/* ==========================================================================
   TRANG CHI TIẾT BỘ SƯU TẬP (LOOKBOOK)
   ========================================================================== */
function initCollectionDetailPage() {
  const root = document.getElementById('cdRoot');
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id') || 'rouge';
  const c = collById[id] || DATA.collections[0];
  const hero = lookById[c.hero];
  const looks = c.looks.map(k => lookById[k]);
  document.title = `${c.code} — ${c.name} | HARMONY.STUDIO`;

  root.innerHTML = `
    <section class="cd-hero" style="--tint:${c.tint};--cink:${c.ink}" ${c.dark ? 'data-dark' : ''}>
      <div class="cd-hero__crumb label">
        <a href="bo-suu-tap.html">← Bộ sưu tập</a><span>/</span><span>${c.code}</span>
      </div>
      <div class="cd-hero__giant" aria-hidden="true"><span class="mega">${c.code}</span></div>
      <figure class="cd-hero__model" data-open-look="${hero.id}" data-cursor="Xem">
        ${cutPicture(hero, '(max-width:860px) 78vw, 44vw')}
      </figure>
      <div class="cd-hero__meta">
        <div>
          <span class="label">${c.tag} · ${looks.length} mẫu</span>
          <h1>${c.name} <b class="tbc">[[CẦN XÁC NHẬN]]</b></h1>
          <p>${c.blurb}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn" href="lien-he.html?nhu-cau=dat-may&bst=${c.id}"><span>Đặt may theo bộ này</span>${ARR}</a>
          <a class="btn btn--ghost" href="${SITE.zalo}"><span>Nhắn Zalo</span></a>
        </div>
      </div>
    </section>
    <section class="lb" aria-label="Danh sách look">
      ${looks.map((l, idx) => {
        const n = nicheById[l.niche];
        return `
          <article class="lb-item">
            <figure class="lb-item__fig" style="--tint:${c.tint};--cink:${c.ink}" data-open-look="${l.id}" data-cursor="Xem">
              <span class="lb-item__giant mega" aria-hidden="true">${l.no}</span>
              ${cutPicture(l, '(max-width:860px) 92vw, 46vw')}
            </figure>
            <div class="lb-item__txt">
              <div class="lb-item__no">
                <span class="mega">LOOK ${l.no}</span>
                <span class="label">0${idx + 1} / 0${looks.length}</span>
              </div>
              <h3>${l.name}</h3>
              <p class="meta">${n ? n.name : ''} · Màu: ${l.color}</p>
              <ul>${l.pieces.map(p => `<li>${p}</li>`).join('')}</ul>
              <div class="lb-item__btns">
                <a class="btn btn--accent" href="lien-he.html?nhu-cau=dat-may&look=${l.no}"><span>Đặt may mẫu này</span>${ARR}</a>
                <a class="btn btn--ghost" href="${SITE.zalo}"><span>Nhắn Zalo</span></a>
                <button class="btn btn--ghost" type="button" data-open-look="${l.id}"><span>Phóng to</span></button>
              </div>
            </div>
          </article>`;
      }).join('')}
    </section>
    <section class="lb-more wrap">
      <div class="sec-head">
        <div><span class="label">Khám phá tiếp</span><h2>Các chương khác</h2></div>
        <a class="link-u" href="bo-suu-tap.html"><span>Tất cả bộ sưu tập</span>${ARR}</a>
      </div>
      <div class="grid" style="row-gap:24px">
        ${DATA.collections.filter(x => x.id !== c.id).map(x => {
          const h = lookById[x.hero];
          return `
            <a href="chi-tiet-bo-suu-tap.html?id=${x.id}" style="grid-column:span 4;--tint:${x.tint};--cink:${x.ink};background:${x.tint};color:${x. dark ? '#F1EFEA' : x.ink};padding:24px;display:flex;flex-direction:column;justify-content:space-between;min-height:420px;position:relative;overflow:hidden" data-cursor="Xem">
              <span class="label">${x.code} · ${x.looks.length} mẫu</span>
              <div style="position:absolute;inset:12% 0 0 0;display:flex;justify-content:center;align-items:flex-end;pointer-events:none">${cutPicture(h, '28vw')}</div>
              <div style="position:relative;z-index:2;background:rgba(244,241,236,.9);color:#111112;padding:10px 16px;width:max-content;box-shadow:0 0 0 1px rgba(17,17,18,.1)"><h3>${x.name}</h3></div>
            </a>`;
        }).join('')}
      </div>
    </section>`;

  if (window.gsap && !reduced()) {
    root.querySelectorAll('.lb-item__fig').forEach(fig => {
      gsap.fromTo(fig, { clipPath: 'inset(12% 8% 12% 8%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: SITE.motion.easeOut,
        scrollTrigger: { trigger: fig, start: 'top 85%', end: 'top 35%', scrub: true },
      });
    });
  }
}

/* ==========================================================================
   TRANG GIỚI THIỆU (gallery ngang) & FORM
   ========================================================================== */
function initAboutPage() {
  const gal = document.getElementById('aboutGal');
  const track = document.getElementById('aboutTrack');
  if (!gal || !track) return;
  const picks = ['04', '00', '03', '06', '07', '09', '10', '14', '15', '16'];
  track.innerHTML = picks.map(id => {
    const l = lookById[id];
    const c = collById[l.collection];
    return `
      <figure class="hgal__card" style="--tint:${c.tint}" data-open-look="${l.id}" data-cursor="Xem">
        ${cutPicture(l, '26vw')}
        <span>LOOK ${l.no}</span>
      </figure>`;
  }).join('');
  if (!window.gsap || reduced()) return;
  gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth + 48),
    ease: 'none',
    scrollTrigger: { trigger: gal, start: 'top top', end: '+=180%', pin: true, scrub: .5, invalidateOnRefresh: true },
  });
}

function initForms() {
  const params = new URLSearchParams(location.search);
  const need = params.get('nhu-cau');
  const look = params.get('look');
  if (need) {
    const r = document.querySelector(`input[name="need"][value="${need}"]`);
    if (r) r.checked = true;
  }
  if (look) {
    const l = lookById[look];
    const inp = document.getElementById('fLook');
    if (inp && l) inp.value = `LOOK ${l.no} — ${l.name}`;
  }
  document.querySelectorAll('form[data-mock-form]').forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      const ok = f.parentElement.querySelector('.form-ok');
      f.style.display = 'none';
      if (ok) {
        ok.classList.add('is-on');
        if (window.gsap && !reduced()) gsap.fromTo(ok, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .45 });
      }
    });
  });
}

/* ==========================================================================
   Khởi chạy
   ========================================================================== */
mountChrome();
initScrollEngine();
initHeaderAndMenu();
initPageTransitions();
initCursor();
initModalEvents();
if (document.body.dataset.page === 'home') initHome();
if (document.body.dataset.page === 'collections') initCollectionsPage();
if (document.body.dataset.page === 'collection-detail') initCollectionDetailPage();
if (document.body.dataset.page === 'about') initAboutPage();
initForms();
initReveals();
syncFooterSpacer();
window.addEventListener('load', () => {
  syncFooterSpacer();
  if (window.ScrollTrigger) ScrollTrigger.refresh();
});
