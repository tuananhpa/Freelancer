import './fonts.css';
import './style.css';
import './assembly-hero.css';
import './hero-carousel.css';
import { createHeroCarousel } from './hero-carousel.js';
import * as pages from './pages.js';
import { products, articles } from './data.js';
import { createPageMotion, refreshPageMotion } from './motion.js';
import { buildInquiryMailto } from './inquiry.js';
import { icon } from './icons.js';

const app = document.querySelector('#app');
let cleanupMotion = () => {}, cleanupScene = () => {}, cleanupCarousel = () => {}, generation = 0;
const pageTitles = { '/': 'Giải pháp vật liệu cho sản xuất điện tử', '/gioi-thieu': 'Giới thiệu', '/san-pham': 'Sản phẩm', '/ung-dung': 'Ứng dụng', '/tin-tuc': 'Kiến thức & tin tức', '/lien-he': 'Liên hệ', '/tuyen-dung': 'Tuyển dụng' };

function currentPage(url) {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { html: pages.home(), title: pageTitles[path] };
  if (path === '/gioi-thieu') return { html: pages.about(), title: pageTitles[path] };
  if (path === '/san-pham') return { html: pages.catalog(url), title: pageTitles[path] };
  if (path === '/ung-dung') return { html: pages.applicationPage(), title: pageTitles[path] };
  if (path === '/tin-tuc') return { html: pages.news(), title: pageTitles[path] };
  if (path === '/lien-he') return { html: pages.contact(url), title: pageTitles[path] };
  if (path === '/tuyen-dung') return { html: pages.recruitment(), title: pageTitles[path] };
  if (path.startsWith('/san-pham/')) {
    const id = path.slice('/san-pham/'.length);
    const product = products.find(p => p.id === id);
    return { html: pages.productDetail(id), title: product?.name || 'Không tìm thấy sản phẩm' };
  }
  if (path.startsWith('/tin-tuc/')) {
    const id = path.slice('/tin-tuc/'.length);
    return { html: pages.article(id), title: articles.find(a => a.id === id)?.title || 'Không tìm thấy bài viết' };
  }
  return { html: pages.notFound(), title: 'Không tìm thấy trang' };
}

function render({ focus = false, scroll = 0 } = {}) {
  const id = ++generation;
  cleanupCarousel(); cleanupCarousel = () => {};
  cleanupScene(); cleanupScene = () => {};
  cleanupMotion(); cleanupMotion = () => {};
  const url = new URL(window.location.href);
  const page = currentPage(url);
  app.innerHTML = pages.shell(page.html, url.pathname);
  document.title = `${page.title} — TENSAN Việt Nam`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
  canonical.href = window.location.origin + (url.pathname.replace(/\/+$/, '') || '/');
  document.querySelector('meta[name="description"]').content = page.title === pageTitles['/'] ? 'TENSAN Việt Nam cung cấp keo công nghiệp, vật liệu tản nhiệt, silicone và giải pháp phụ trợ SMT cho sản xuất điện tử.' : `${page.title}. Khám phá giải pháp vật liệu và kết nối với đội ngũ kỹ thuật TENSAN Việt Nam.`;
  const carousel = document.querySelector('.hero-carousel');
  if (carousel) cleanupCarousel = createHeroCarousel(carousel, refreshPageMotion);
  cleanupMotion = createPageMotion(document.querySelector('main'));
  const host = document.querySelector('#hero-scene');
  if (host) {
    import('./hero-scene.js').then(module => {
    if (generation === id) {
      cleanupScene = module.createHeroScene(host);
    }
  }).catch(() => {
    if (generation === id) {
      document.querySelector('.hero').classList.add('assembly-scene-unavailable');
      document.querySelector('#scene-status').textContent = 'Đang hiển thị sơ đồ lớp keo tản nhiệt.';
    }
    });
  }
  requestAnimationFrame(() => {
    if (generation !== id) return;
    if (url.hash) {
      let hash = url.hash.slice(1);
      try { hash = decodeURIComponent(hash); } catch { /* A malformed external hash must not interrupt navigation. */ }
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo(0, scroll);
    } else window.scrollTo(0, scroll);
    if (focus) document.querySelector('main').focus({ preventScroll: true });
  });
}

function navigate(href) {
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) return;
  history.replaceState({ scroll: window.scrollY }, '');
  history.pushState({ scroll: 0 }, '', url.pathname + url.search + url.hash);
  render({ focus: true });
}

document.addEventListener('click', event => {
  const anchor = event.target.closest('a[data-link]');
  if (anchor && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
    event.preventDefault(); navigate(anchor.href); return;
  }
  if (event.target.closest('#open-search')) { document.querySelector('#search-dialog').showModal(); document.querySelector('#global-query').focus(); return; }
  if (event.target.closest('#close-search')) { document.querySelector('#search-dialog').close(); return; }
  if (event.target.id === 'search-dialog') {
    const rect = event.target.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close();
  }
  if (event.target.closest('#mobile-menu-toggle')) {
    const button = document.querySelector('#mobile-menu-toggle');
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', expanded ? 'Đóng menu' : 'Mở menu');
    button.innerHTML = icon(expanded ? 'close' : 'menu');
    document.querySelector('.main-nav').classList.toggle('is-open', expanded);
  }
  if (event.target.closest('#back-to-top')) window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    const button = document.querySelector('#mobile-menu-toggle');
    if (button.getAttribute('aria-expanded') === 'true') { button.click(); button.focus(); }
  }
});
document.addEventListener('submit', event => {
  const form = event.target;
  if (form.matches('[data-search-form]')) {
    event.preventDefault();
    const data = new FormData(form);
    const params = new URLSearchParams();
    if (data.get('q')?.trim()) params.set('q', data.get('q').trim());
    if (data.get('nhom') && data.get('nhom') !== 'all') params.set('nhom', data.get('nhom'));
    navigate(`/san-pham${params.size ? '?' + params : ''}`);
  }
  if (form.id === 'inquiry-form') {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    const result = document.querySelector('#inquiry-result');
    result.replaceChildren();
    const message = document.createElement('p');
    message.textContent = 'Bản nháp đã sẵn sàng. Mở ứng dụng email, kiểm tra nội dung và gửi tới Tensan.';
    const anchor = document.createElement('a');
    anchor.href = buildInquiryMailto(values);
    anchor.className = 'text-link'; anchor.textContent = 'Mở ứng dụng email →';
    result.append(message, anchor); result.hidden = false;
    result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
});
window.addEventListener('popstate', event => render({ focus: true, scroll: event.state?.scroll || 0 }));
history.scrollRestoration = 'manual';
render();
