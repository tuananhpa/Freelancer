/**
 * Lớp dữ liệu duy nhất. MockAdapter và LiveAdapter có CÙNG tập hàm
 * => backend chỉ cần đúng hợp đồng REST (PLAN.md) là giao diện chạy, không sửa UI.
 *
 * Nháp & xuất bản: admin sửa bản NHÁP; website công khai đọc bản ĐÃ XUẤT BẢN.
 * "Xem trước" mở website với ?preview=1 để đọc bản nháp (chỉ khi đã đăng nhập).
 * Inbox (leads, applications): dữ liệu khách gửi lên, không qua nháp/xuất bản.
 */
import { CONFIG } from './config.js';

export class ApiError extends Error { constructor(m, status = 0) { super(m); this.status = status; } }
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const now = () => new Date().toISOString();
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const clone = (o) => JSON.parse(JSON.stringify(o));
export const slugify = (s) => String(s).normalize('NFD').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** So khớp không phân biệt dấu: "nha pho" khớp "Nhà phố" */
export const fold = (s) => String(s || '').normalize('NFD').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[̀-ͯ]/g, '').toLowerCase();
const isInbox = (col) => CONFIG.inbox.includes(col);
const store = (S) => ({ get(k) { try { return S().getItem(k); } catch { return null; } }, set(k, v) { try { S().setItem(k, v); } catch {} }, del(k) { try { S().removeItem(k); } catch {} } });
const ss = store(() => sessionStorage);               // cờ xem trước: theo từng tab
const ls = store(() => localStorage);                 // phiên đăng nhập: dùng chung các tab (để tab "Xem trước" nhận ra)

/** Chế độ xem trước bản nháp: bật bằng ?preview=1, tắt bằng ?preview=0, nhớ trong phiên */
export function previewMode() {
  const q = new URLSearchParams(location.search).get('preview');
  if (q === '1') ss.set('preview', '1');
  if (q === '0') ss.del('preview');
  return ss.get('preview') === '1' && !!ls.get('admin-token');
}
/** Chỉ giữ bản ghi đang hiển thị, sắp theo thứ tự */
function publicView(state) {
  const cols = {};
  for (const [k, arr] of Object.entries(state.collections || {})) cols[k] = (arr || []).filter((x) => x.published !== false).sort(byOrder);
  return { docs: state.docs || {}, collections: cols };
}

/* ---------------- LIVE ---------------- */
class LiveAdapter {
  constructor(base) { this.base = base.replace(/\/$/, ''); }
  async req(method, path, body, auth) {
    const headers = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    const t = ls.get('admin-token'); if (auth && t) headers.Authorization = 'Bearer ' + t;
    let res; try { res = await fetch(this.base + path, { method, headers, body: body ? JSON.stringify(body) : undefined, credentials: 'include' }); }
    catch { throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'); }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(data?.message || `Lỗi máy chủ (${res.status})`, res.status);
    return data;
  }
  /* public */
  site() { return this.req('GET', previewMode() ? '/public/site?draft=1' : '/public/site', null, previewMode()); }
  submit(col, rec) { return this.req('POST', `/public/${col}`, rec); }
  /* admin */
  list(col) { return this.req('GET', `/admin/${col}`, null, true); }
  get(col, id) { return this.req('GET', `/admin/${col}/${encodeURIComponent(id)}`, null, true); }
  save(col, o) { return o.id ? this.req('PUT', `/admin/${col}/${encodeURIComponent(o.id)}`, o, true) : this.req('POST', `/admin/${col}`, o, true); }
  remove(col, id) { return this.req('DELETE', `/admin/${col}/${encodeURIComponent(id)}`, null, true); }
  reorder(col, ids) { return this.req('POST', `/admin/${col}/reorder`, { ids }, true); }
  getDoc(key) { return this.req('GET', `/admin/docs/${encodeURIComponent(key)}`, null, true); }
  saveDoc(key, d) { return this.req('PUT', `/admin/docs/${encodeURIComponent(key)}`, d, true); }
  status() { return this.req('GET', '/admin/status', null, true); }
  publish() { return this.req('POST', '/admin/publish', {}, true); }
  discard() { return this.req('POST', '/admin/discard', {}, true); }
  async login(username, password) { const r = await this.req('POST', '/auth/login', { username, password }); ls.set('admin-token', r.token); return r.user; }
  logout() { ls.del('admin-token'); ss.del('preview'); return this.req('POST', '/auth/logout', null, true).catch(() => null); }
  me() { return this.req('GET', '/auth/me', null, true); }
  exportAll() { return this.req('GET', '/admin/export', null, true); }
  importAll(d) { return this.req('POST', '/admin/import', d, true); }
  resetDemo() { throw new ApiError('Chỉ có ở chế độ demo.'); }
}

/* ---------------- MOCK (IndexedDB) ---------------- */
let dbp = null;
const idb = () => (dbp ||= new Promise((res, rej) => {
  const r = indexedDB.open(CONFIG.storeKey, 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
}));
const mem = new Map();                                  // dự phòng khi IndexedDB bị chặn
const kv = {
  async get(k) { try { const db = await idb(); return await new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } catch { return mem.get(k); } },
  async set(k, v) { mem.set(k, v); try { const db = await idb(); await new Promise((res, rej) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); } catch { /* bộ nhớ tạm */ } },
  async del(k) { mem.delete(k); try { const db = await idb(); await new Promise((res) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = res; }); } catch {} },
};

class MockAdapter {
  async load() {
    if (this.s) return this.s;
    let draft = await kv.get('draft'), pub = await kv.get('pub'), inbox = await kv.get('inbox');
    if (!draft || !pub || !inbox) {
      const r = await fetch(CONFIG.seedUrl); if (!r.ok) throw new ApiError('Không đọc được dữ liệu mẫu.');
      const seed = await r.json();
      inbox = {}; CONFIG.inbox.forEach((c) => { inbox[c] = seed.collections[c] || []; delete seed.collections[c]; });
      draft = seed; pub = clone(seed); pub.publishedAt = now();
      await Promise.all([kv.set('draft', draft), kv.set('pub', pub), kv.set('inbox', inbox)]);
    }
    return (this.s = { draft, pub, inbox });
  }
  async persist(...keys) { const s = await this.load(); await Promise.all(keys.map((k) => kv.set(k, s[k]))); }
  async arr(col) {
    const s = await this.load();
    if (isInbox(col)) { s.inbox = (await kv.get('inbox')) || s.inbox; return (s.inbox[col] ||= []); }   // khách gửi từ tab khác
    return (s.draft.collections[col] ||= []);
  }
  /* public */
  async site() { const s = await this.load(); return publicView(previewMode() ? s.draft : s.pub); }
  async submit(col, rec) {
    if (!isInbox(col)) throw new ApiError('Không hỗ trợ.', 400);
    const a = await this.arr(col); const r = { ...rec, id: uid(col[0]), status: 'new', createdAt: now() };
    a.unshift(r); await this.persist('inbox'); return { ok: true, id: r.id };
  }
  /* admin */
  async list(col) { const a = await this.arr(col); return isInbox(col) ? a.slice() : a.slice().sort(byOrder); }
  async get(col, id) { const x = (await this.arr(col)).find((o) => o.id === id || o.slug === id); if (!x) throw new ApiError('Không tìm thấy.', 404); return x; }
  async save(col, o) {
    const arr = await this.arr(col);
    const rec = { ...o, updatedAt: now() };
    if (!rec.id) {
      rec.id = uid(col[0]); rec.createdAt = now(); rec.order = arr.length ? Math.max(...arr.map((x) => x.order ?? 0)) + 1 : 0;
      if (!rec.slug && (rec.title || rec.name)) rec.slug = slugify(rec.title || rec.name);
      if (rec.slug && arr.some((x) => x.slug === rec.slug)) rec.slug += '-' + rec.id.slice(-4);
      arr.push(rec);
    } else { const i = arr.findIndex((x) => x.id === rec.id); if (i < 0) throw new ApiError('Không tìm thấy.', 404); arr[i] = { ...arr[i], ...rec }; }
    await this.persist(isInbox(col) ? 'inbox' : 'draft'); return rec;
  }
  async remove(col, id) {
    const s = await this.load();
    if (isInbox(col)) s.inbox[col] = (s.inbox[col] || []).filter((x) => x.id !== id);
    else s.draft.collections[col] = (s.draft.collections[col] || []).filter((x) => x.id !== id);
    await this.persist(isInbox(col) ? 'inbox' : 'draft'); return null;
  }
  async reorder(col, ids) { const arr = await this.arr(col); ids.forEach((id, i) => { const x = arr.find((o) => o.id === id); if (x) x.order = i; }); await this.persist('draft'); return { ok: true }; }
  async getDoc(key) { const s = await this.load(); return clone(s.draft.docs[key] || {}); }
  async saveDoc(key, v) { const s = await this.load(); s.draft.docs[key] = v; await this.persist('draft'); return v; }
  async status() {
    const s = await this.load(); s.inbox = (await kv.get('inbox')) || s.inbox; const { publishedAt, ...p } = s.pub; const { publishedAt: _x, ...d } = s.draft;
    return { dirty: JSON.stringify(d) !== JSON.stringify(p), publishedAt, newLeads: (s.inbox.leads || []).filter((x) => x.status === 'new').length, newApplications: (s.inbox.applications || []).filter((x) => x.status === 'new').length };
  }
  async publish() { const s = await this.load(); s.pub = clone(s.draft); s.pub.publishedAt = now(); await this.persist('pub'); return { ok: true }; }
  async discard() { const s = await this.load(); s.draft = clone(s.pub); delete s.draft.publishedAt; await this.persist('draft'); return { ok: true }; }
  async login(u, p) { if (u === CONFIG.mockAdmin.username && p === CONFIG.mockAdmin.password) { ls.set('admin-token', 'mock'); return { username: u, role: 'admin' }; } throw new ApiError('Sai tên đăng nhập hoặc mật khẩu.', 401); }
  async logout() { ls.del('admin-token'); ss.del('preview'); return null; }
  async me() { if (!ls.get('admin-token')) throw new ApiError('Chưa đăng nhập.', 401); return { username: CONFIG.mockAdmin.username, role: 'admin' }; }
  async exportAll() { const s = await this.load(); return clone(s); }
  async importAll(d) {
    if (!d || !d.draft?.docs || !d.draft?.collections || !d.pub || !d.inbox) throw new ApiError('File không đúng định dạng dữ liệu của website này.');
    this.s = d; await this.persist('draft', 'pub', 'inbox'); return { ok: true };
  }
  async resetDemo() { await Promise.all(['draft', 'pub', 'inbox'].map((k) => kv.del(k))); this.s = null; return { ok: true }; }
}

export const api = CONFIG.mode === 'live' ? new LiveAdapter(CONFIG.apiBase) : new MockAdapter();

/** Nén ảnh phía trình duyệt về tối đa uploadMaxWidth, trả về data URL WebP (mock) hoặc Blob (live) */
export async function compressImage(file, asBlob = false) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, CONFIG.uploadMaxWidth / bmp.width);
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) });
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return asBlob ? new Promise((r) => c.toBlob(r, 'image/webp', 0.82)) : c.toDataURL('image/webp', 0.82);
}
