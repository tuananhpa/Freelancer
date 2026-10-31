import renderer from './lib/render.js';
import defaults from './lib/default-content.json' with { type: 'json' };
import originalMedia from './lib/media.json' with { type: 'json' };

const clip = (s, n) => String(s ?? '').trim().slice(0, n);
const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const cookie = (token, age) => `eser_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const hex = (bytes) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256));
}
async function equal(a, b) {
  const key = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  const enc = new TextEncoder();
  return crypto.subtle.verify('HMAC', key, await crypto.subtle.sign('HMAC', key, enc.encode(a)), enc.encode(b));
}
async function body(req, max = 4000) {
  let size = 0; const chunks = [];
  for await (const chunk of req.body || []) { size += chunk.length; if (size > max) fail(413, 'Dữ liệu quá lớn'); chunks.push(chunk); }
  const data = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  try { const b = JSON.parse(new TextDecoder().decode(data) || '{}'); if (!b || typeof b !== 'object' || Array.isArray(b)) throw Error(); return b; }
  catch { fail(400, 'Yêu cầu không hợp lệ'); }
}
async function read(db, key, fallback) {
  const row = await db.prepare('SELECT value FROM state WHERE key = ?').bind(key).first();
  return row ? JSON.parse(row.value) : fallback;
}
const write = (db, key, value) => db.prepare('INSERT INTO state(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, JSON.stringify(value)).run();
async function session(req, db) {
  const token = /(?:^|;\s*)eser_admin=([a-f0-9]{64})(?:;|$)/.exec(req.headers.get('cookie') || '')?.[1];
  return token && await db.prepare('SELECT token FROM sessions WHERE token=? AND expires>?').bind(token, Date.now()).first();
}
async function newSession(db) {
  const token = random();
  await db.prepare('DELETE FROM sessions WHERE expires<=?').bind(Date.now()).run();
  await db.prepare('INSERT INTO sessions(token,expires) VALUES (?,?)').bind(token, Date.now() + 7 * 864e5).run();
  return { 'Set-Cookie': cookie(token, 7 * 86400) };
}
async function limit(req, db, type, max, duration) {
  const now = Date.now(), key = `${type}:${req.headers.get('cf-connecting-ip') || 'local'}`;
  await db.prepare('DELETE FROM limits WHERE expires<=?').bind(now).run();
  const row = await db.prepare('INSERT INTO limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key, now + duration).first();
  if (row.count > max) fail(429, 'Thử quá nhiều lần, vui lòng thử lại sau ít phút.');
}
async function handle(req, env) {
  const db = env.DB, url = new URL(req.url), p = url.pathname, m = req.method;
  if ((p === '/' || p === '/index.html') && ['GET', 'HEAD'].includes(m)) {
    return new Response(m === 'HEAD' ? null : renderer.renderPage(await read(db, 'content', defaults), { v: 'demo1' }), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
  }
  if (p.startsWith('/uploads/') && ['GET', 'HEAD'].includes(m)) {
    const row = await db.prepare('SELECT * FROM media WHERE url=?').bind(p).first();
    if (row) return new Response(m === 'HEAD' ? null : new Uint8Array(row.data), { headers: { 'Content-Type': row.type, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
  }
  if (!p.startsWith('/api/')) return env.ASSETS.fetch(req);
  if (m !== 'GET' && req.headers.get('origin') && req.headers.get('origin') !== url.origin) fail(403, 'Nguồn yêu cầu không hợp lệ');
  if (p === '/api/me' && m === 'GET') return json({ authed: !!await session(req, db) });
  if (p === '/api/login' && m === 'POST') {
    await limit(req, db, 'login', 10, 15 * 60e3);
    const b = await body(req), auth = await read(db, 'auth', null);
    if (!auth || !await equal(await passwordHash(String(b.password || ''), auth.salt), auth.hash)) fail(401, 'Sai mật khẩu');
    return json({ ok: true }, 200, await newSession(db));
  }
  if (p === '/api/logout' && m === 'POST') {
    const active = await session(req, db);
    if (active) await db.prepare('DELETE FROM sessions WHERE token=?').bind(active.token).run();
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
  }
  if (p === '/api/inquiries' && m === 'POST') {
    await limit(req, db, 'inquiry', 6, 10 * 60e3);
    const b = await body(req, 30000);
    if (b.website) return json({ ok: true });
    const name = clip(b.name, 80), phone = clip(b.phone, 20).replace(/[^\d+ .]/g, '');
    if (!name || phone.replace(/\D/g, '').length < 9) fail(400, 'Vui lòng nhập họ tên và số điện thoại hợp lệ.');
    const content = await read(db, 'content', defaults);
    const items = (Array.isArray(b.items) ? b.items.slice(0, 30) : []).map(it => {
      const product = content.products?.find(x => x.id === it?.id);
      return product ? { id: product.id, name: product.name, size: clip(it.size, 8), qty: Math.max(1, Math.min(20, parseInt(it.qty, 10) || 1)), price: Number(product.price) || 0 } : null;
    }).filter(Boolean);
    const rec = { id: random().slice(0, 12), type: items.length ? 'order' : 'contact', status: 'new', createdAt: new Date().toISOString(), name, phone, address: clip(b.address, 200), interest: clip(b.interest, 80), message: clip(b.message, 1500), items, total: items.reduce((sum, i) => sum + i.price * i.qty, 0) };
    await db.prepare('INSERT INTO inquiries(id,value,created_at) VALUES (?,?,?)').bind(rec.id, JSON.stringify(rec), Date.now()).run();
    return json({ ok: true });
  }
  if (!await session(req, db)) fail(401, 'Chưa đăng nhập');
  if (m !== 'GET' && req.headers.get('x-eser-admin') !== '1') fail(403, 'Thiếu header');
  if (p === '/api/content/default' && m === 'GET') return json(defaults);
  if (p === '/api/content' && m === 'GET') return json(await read(db, 'content', defaults));
  if (p === '/api/content' && m === 'PUT') {
    const b = await body(req, 1500000);
    if (!b.site || !Array.isArray(b.products)) fail(400, 'Dữ liệu không hợp lệ');
    // shortcut: retain one previous content version for the demo; add history for production.
    await write(db, 'content-backup', await read(db, 'content', defaults));
    await write(db, 'content', b);
    return json({ ok: true, savedAt: new Date().toISOString() });
  }
  if (p === '/api/inquiries' && m === 'GET') {
    const rows = await db.prepare('SELECT value FROM inquiries ORDER BY created_at DESC LIMIT 3000').all();
    return json(rows.results.map(r => JSON.parse(r.value)));
  }
  const match = /^\/api\/inquiries\/([a-f0-9]+)$/.exec(p);
  if (match && ['PATCH', 'DELETE'].includes(m)) {
    const row = await db.prepare('SELECT value FROM inquiries WHERE id=?').bind(match[1]).first();
    if (!row) fail(404, 'Không tìm thấy');
    if (m === 'DELETE') { await db.prepare('DELETE FROM inquiries WHERE id=?').bind(match[1]).run(); return json({ ok: true }); }
    const b = await body(req), record = JSON.parse(row.value);
    if (['new', 'contacted', 'done'].includes(b.status)) record.status = b.status;
    if (typeof b.note === 'string') record.note = clip(b.note, 1000);
    await db.prepare('UPDATE inquiries SET value=? WHERE id=?').bind(JSON.stringify(record), match[1]).run();
    return json(record);
  }
  if (p === '/api/password' && m === 'POST') {
    const b = await body(req), auth = await read(db, 'auth', null);
    if (!auth || !await equal(await passwordHash(String(b.current || ''), auth.salt), auth.hash)) fail(400, 'Mật khẩu hiện tại không đúng');
    if (typeof b.next !== 'string' || b.next.length < 6) fail(400, 'Mật khẩu mới tối thiểu 6 ký tự');
    const salt = random();
    await write(db, 'auth', { salt, hash: await passwordHash(b.next, salt) });
    await db.prepare('DELETE FROM sessions').run();
    return json({ ok: true }, 200, await newSession(db));
  }
  if (p === '/api/media' && m === 'GET') {
    const rows = await db.prepare('SELECT url,size,mtime FROM media ORDER BY mtime DESC').all();
    return json([...rows.results.map(r => ({ ...r, deletable: true })), ...originalMedia]);
  }
  if (p === '/api/media' && m === 'DELETE') {
    const file = url.searchParams.get('file') || '';
    if (!/^\/uploads\/[\w.-]+$/.test(file)) fail(400, 'Chỉ xoá được ảnh đã tải lên');
    await db.prepare('DELETE FROM media WHERE url=?').bind(file).run();
    return json({ ok: true });
  }
  if (p === '/api/upload' && m === 'POST') {
    const b = await body(req, 1500000), match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(b.data || '');
    if (!match) fail(400, 'Chỉ nhận ảnh JPG, PNG, WEBP, GIF');
    let data; try { data = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0)); } catch { fail(400, 'Ảnh không hợp lệ'); }
    // shortcut: small demo uploads live in D1; move media to R2 for larger images.
    if (!data.length || data.length > 1000000) fail(413, 'Bản demo nhận ảnh tối đa 1MB');
    const file = `/uploads/${random().slice(0, 24)}.${match[1].split('/')[1]}`;
    await db.prepare('INSERT INTO media(url,type,data,size,mtime) VALUES (?,?,?,?,?)').bind(file, match[1], data.buffer, data.length, Date.now()).run();
    return json({ url: file });
  }
  return json({ error: 'Không có API này' }, 404);
}
export default {
  async fetch(req, env) {
    try { return await handle(req, env); }
    catch (e) { if (!e.status) console.error(e); return json({ error: e.status ? e.message : 'Lỗi máy chủ' }, e.status || 500); }
  },
};
