import { BM_DATA } from '../data/bmData.js';
import { SITE } from '../data/siteConfig.js';

export const D = BM_DATA || { categories: [], brands: {}, products: [] };
export const P = D.products;
export const byId = Object.fromEntries(P.map((p) => [p.id, p]));
export const CAT = Object.fromEntries(D.categories.map((c) => [c.id, c]));
export const TYPE = {};
D.categories.forEach((c) =>
  c.types.forEach((t) => {
    TYPE[t.id] = { ...t, cat: c.id };
  })
);

export const count = (fn) => P.filter(fn).length;
export const brandName = (p) => (p && D.brands[p.brand] ? D.brands[p.brand].name : '') || '';
export const brandOrigin = (p) => (p && D.brands[p.brand] ? D.brands[p.brand].origin : '') || '';
export const groupName = (p) => {
  if (!p) return '';
  return p.type && TYPE[p.type] ? TYPE[p.type].name : CAT[p.cat] ? CAT[p.cat].name : '';
};

export const realBrands = Object.entries(D.brands).filter(([k]) => !k.startsWith('other'));
export const countries = [...new Set(realBrands.map(([, b]) => b.origin).filter(Boolean))];

export const fmtAbv = (v) => (v ? String(v).replace('.', ',') + '%' : '');
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const url = {
  product: (p) => `chi-tiet-san-pham.html?id=${typeof p === 'string' ? p : p.id}`,
  list: (q = {}) => 'san-pham.html' + (Object.keys(q).length ? '?' + new URLSearchParams(q).toString() : ''),
};

export const img = (id, size = 600) => `assets/img/products/${size}/${id}.webp`;
export const srcset = (id) => `${img(id, 300)} 300w, ${img(id, 600)} 600w, ${img(id, 1200)} 1200w`;

/* màu vệt sáng lấy từ màu chai: giữ sắc, nâng độ sáng để luôn "phát sáng" */
export function glow(p) {
  const rgb = (p && p.rgb) || [201, 151, 75];
  let [r, g, b] = rgb.map((v) => v / 255);
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  s = Math.min(0.78, s * 1.15);
  l = Math.max(0.58, Math.min(0.7, l + 0.12));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s,
    pp = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255)).join(' ');
}

export function metaLine(p) {
  if (!p) return '';
  return [groupName(p), p.vol].filter(Boolean).join(' · ');
}

export function topBrands(cat, n) {
  const m = {};
  P.filter((p) => p.cat === cat && !p.brand.startsWith('other')).forEach((p) => {
    m[p.brand] = (m[p.brand] || 0) + 1;
  });
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export function matchFilter(f) {
  return (p) => Object.entries(f).every(([k, v]) => p[k] === v);
}

/* tìm kiếm không dấu */
export const fold = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const INDEX = P.map((p) =>
  fold(`${p.name} ${brandName(p)} ${groupName(p)} ${CAT[p.cat] ? CAT[p.cat].name : ''} ${p.vol || ''}`)
);

export function search(q) {
  const terms = fold(q).split(' ').filter(Boolean);
  if (!terms.length) return P.slice();
  return P.filter((p, i) => terms.every((t) => INDEX[i].includes(t)));
}

/* giữ focus trong hộp thoại đang mở */
export function trap(el) {
  if (!el) return () => {};
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    const f = [...el.querySelectorAll(sel)].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0],
      last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!el.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}

/* mở/đóng lớp nổi: hiện (display) trước, rồi mới chạy chuyển động; đóng xong thì ẩn hẳn */
export function pop(el, open, cls = 'is-open') {
  if (!el) return;
  clearTimeout(el._popT);
  if (open) {
    el.classList.add('is-shown');
    void el.offsetWidth;
    el.classList.add(cls);
  } else {
    el.classList.remove(cls);
    el._popT = setTimeout(() => {
      if (!el.classList.contains(cls)) el.classList.remove('is-shown');
    }, 420);
  }
}

export function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('is-on'), 3200);
}

export function askText(p) {
  return `Chào BM Global Spirits, cho mình hỏi giá: ${p.name}${p.vol ? ' ' + p.vol : ''} (mã ${p.id}).`;
}

export function copy(text) {
  try {
    navigator.clipboard && navigator.clipboard.writeText(text);
  } catch (e) {
    /* bỏ qua */
  }
}

export function copyAsk(p) {
  if (!p) return;
  copy(askText(p));
  toast('Đã chép tên sản phẩm — dán vào khung chat để được báo giá.');
}
