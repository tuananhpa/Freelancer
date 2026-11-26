/* Lớp dữ liệu dùng chung cho index.html và admin.html.
   Có Worker (worker.js) thì đọc/ghi qua /api; chạy bằng server tĩnh thì dùng IndexedDB của trình duyệt (chỉ để phát triển). */
window.MiStore = (() => {
  'use strict';
  const DB = 'mistudio', ST = 'kv', KEY = 'content', LS = 'mistudio-content';
  const pad = (n) => String(n).padStart(2, '0');

  const CONTACT = {
    phone: '0983 861 096',
    zalo: 'https://zalo.me/0983861096',
    fb: 'https://www.facebook.com/Mistudiophongsucuoiii',
    fbName: 'Tô Duy Hùng (Mì Studio – PS Cưới)',
    msg: 'https://m.me/Mistudiophongsucuoiii',
    ig: 'https://www.instagram.com/mistudiophongsucuoi',
    igName: '@mistudiophongsucuoi',
    yt: 'https://www.youtube.com/@mistudiophongsucuoi',
    area: 'Biên Hòa, Đồng Nai',
  };
  const FILMS = [
    { drive: '12mS-nyzsEThSG46YE3MrUDs2ArzrqVf8', sub: 'Hậu trường', title: 'Một ngày làm việc của Mì Studio', poster: 'assets/img/albums/a2/07-sm.webp', visible: true },
    { drive: '1oScVSAXr7a9Ig14xZZhziCovUnpglptH', sub: 'Teaser · 27.09.2025', title: 'Đạt Phước & Lan Phương', poster: 'assets/img/albums/a1/15-sm.webp', visible: true },
    { drive: '13PeaJBjiggroV7lhk4t0_CXy8amkqL2F', sub: 'Teaser', title: 'Thanh Hoà & Sĩ Học', poster: 'assets/img/albums/a2/16-sm.webp', visible: true },
    { drive: '1TyJMlTAkrfApFyYynTEHEorA7mRkhac4', sub: 'Phóng sự · 18.10.2025', title: 'Huy Hoàng & Lâm Phương', poster: 'assets/img/albums/a3/04-sm.webp', visible: true },
    { drive: '143C5cxnFqblyCVGAiUN8mVETtSJjAq2g', sub: 'Phóng sự · 29.11.2025', title: 'Bách Hợp & Thành Trí', poster: 'assets/img/albums/a5/14-sm.webp', visible: true },
  ];
  // nguồn: "Bảng giá in ảnh.jpg" trong Drive của studio
  const PRINT = [
    { name: 'Album 13×18, 100 ảnh', price: '600.000đ' },
    { name: 'Ảnh để bàn 13×18 (tráng gương)', price: '60.000đ' },
    { name: 'Ảnh để bàn 13×18 (ép gỗ)', price: '45.000đ' },
  ];
  const WALL = [
    { size: '60×90', glass: '600.000đ', wood: '450.000đ' },
    { size: '50×70', glass: '450.000đ', wood: '300.000đ' },
    { size: '40×60', glass: '350.000đ', wood: '250.000đ' },
  ];
  const REVIEWS = [
    { text: '[[CẦN XÁC NHẬN: trích nhận xét thật của khách, kèm tên & ảnh nếu được phép]]', name: 'Cặp đôi · Album', visible: true },
    { text: '[[CẦN XÁC NHẬN: nhận xét thật thứ hai, ví dụ chụp màn hình bình luận Facebook]]', name: 'Cặp đôi · Album', visible: true },
    { text: '[[CẦN XÁC NHẬN: nhận xét thật thứ ba]]', name: 'Cặp đôi · Album', visible: true },
  ];
  const LAYOUT_PICK = [1, 3, 4, 5, 7, 9, 13, 14, 18, 19, 20];

  function defaults() {
    const albums = (window.ALBUMS || []).map((a) => ({
      id: a.id, title: a.title, type: a.type, date: a.date, total: a.total, visible: true,
      cover: Math.max(0, a.photos.findIndex((p) => p[0] === a.cover)),
      photos: a.photos.map(([n, w, h]) => ({ src: `assets/img/albums/${a.id}/${pad(n)}.webp`, sm: `assets/img/albums/${a.id}/${pad(n)}-sm.webp`, w, h })),
    }));
    const layouts = (window.LAYOUTS || []).map(([n, w, h]) => ({ src: `assets/img/layouts/${pad(n)}-sm.webp`, w, h, visible: LAYOUT_PICK.includes(n) }));
    return {
      v: 1, texts: {}, imgs: {}, seo: {},
      contact: { ...CONTACT }, albums, layouts,
      films: FILMS.map((f) => ({ ...f })), print: PRINT.map((x) => ({ ...x })), wall: WALL.map((x) => ({ ...x })),
      reviews: REVIEWS.map((x) => ({ ...x })),
    };
  }

  /* ---------- IndexedDB (fallback localStorage) ---------- */
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(ST, mode), q = fn(t.objectStore(ST));
      t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  };
  async function localRaw() {
    try { return (await tx('readonly', (s) => s.get(KEY))) || null; }
    catch (_) { try { return JSON.parse(localStorage.getItem(LS)); } catch (__) { return null; } }
  }

  /* ---------- chế độ: 'api' (có Worker) hoặc 'local' (server tĩnh, chỉ để phát triển) ---------- */
  let mode = null;
  async function raw() {
    try {
      const r = await fetch('/api/content', { cache: 'no-store' });
      if ((r.headers.get('content-type') || '').includes('application/json')) {
        mode = 'api';
        if (!r.ok) throw new Error('api ' + r.status);
        const d = await r.json();
        return d && d.empty ? null : d;
      }
    } catch (e) { if (mode === 'api') throw e; }
    mode = 'local';
    return localRaw();
  }
  class ApiError extends Error { constructor(msg, status) { super(msg); this.status = status; } }
  async function call(method, path, token, body, type = 'application/json') {
    const r = await fetch(path, { method, headers: { 'content-type': type, ...(token ? { authorization: 'Bearer ' + token } : {}) }, body });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new ApiError(d.error || 'Lỗi ' + r.status, r.status);
    return d;
  }

  /** Nội dung hiện hành = mặc định, đè bởi phần admin đã lưu. */
  async function load() {
    const d = defaults(), s = await raw();
    if (!s) return d;
    return { ...d, ...s, texts: { ...s.texts }, imgs: { ...s.imgs }, seo: { ...s.seo }, contact: { ...d.contact, ...s.contact } };
  }
  async function save(data, token) {
    if (mode === 'api') return call('PUT', '/api/content', token, JSON.stringify(data));
    try { await tx('readwrite', (s) => s.put(data, KEY)); }
    catch (e) { localStorage.setItem(LS, JSON.stringify(data)); /* có thể ném QuotaExceeded: admin báo lỗi */ }
  }
  async function reset(token) {
    if (mode === 'api') return call('DELETE', '/api/content', token);
    try { await tx('readwrite', (s) => s.delete(KEY)); } catch (_) { /* bỏ qua */ }
    try { localStorage.removeItem(LS); } catch (_) { /* bỏ qua */ }
  }
  const login = async (user, pass) => (await call('POST', '/api/login', null, JSON.stringify({ user, pass }))).token;
  /** Tải 1 ảnh (Blob) lên máy chủ, trả về đường dẫn /media/... */
  const upload = async (blob, token) => (await call('POST', '/api/media', token, blob, blob.type)).url;

  /* ---------- chữ: *nghiêng*, **đậm**, xuống dòng ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toHTML = (s) => esc(s)
    .replace(/\[\[(.+?)\]\]/g, '<span class="todo">[[$1]]</span>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/\n/g, '<br>');
  function fromEl(el) {
    let out = '';
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) out += n.textContent;
      else if (n.nodeName === 'BR') out += '\n';
      else if (n.nodeName === 'B' || n.nodeName === 'STRONG') out += `**${fromEl(n)}**`;
      else if (n.nodeName === 'I' || n.nodeName === 'EM') out += `*${fromEl(n)}*`;
      else out += fromEl(n);
    });
    return out.replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ');
  }

  return { load, save, reset, login, upload, defaults, toHTML, fromEl, esc, mode: () => mode };
})();
