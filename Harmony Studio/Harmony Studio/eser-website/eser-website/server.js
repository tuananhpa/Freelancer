/* ESER Fashion — website + admin
 * Node.js >= 18, không cần cài thêm thư viện.  Chạy:  node server.js
 * Biến môi trường: PORT (mặc định 3000), ADMIN_PASSWORD (mật khẩu lần đầu)
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { renderPage } = require('./lib/render');

const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const UPLOADS = path.join(PUB, 'uploads');
const BACKUPS = path.join(DATA, 'backups');
const F_CONTENT = path.join(DATA, 'content.json');
const F_INQ = path.join(DATA, 'inquiries.json');
const F_AUTH = path.join(DATA, 'auth.json');
const PORT = Number(process.env.PORT) || 3000;
const ASSET_V = Date.now().toString(36);

for (const d of [DATA, UPLOADS, BACKUPS]) fs.mkdirSync(d, { recursive: true });

/* ---------- storage ---------- */
function readJSON(f, fallback) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; }
}
function writeJSON(f, obj) {
  const tmp = f + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, f);
}
if (!fs.existsSync(F_CONTENT)) fs.copyFileSync(path.join(ROOT, 'lib', 'default-content.json'), F_CONTENT);
if (!fs.existsSync(F_INQ)) writeJSON(F_INQ, []);

let content = readJSON(F_CONTENT, null) || readJSON(path.join(ROOT, 'lib', 'default-content.json'), {});
let inquiries = readJSON(F_INQ, []);

/* ---------- auth (scrypt + HMAC token, sống qua restart) ---------- */
function hashPw(pw, salt) { return crypto.scryptSync(String(pw), salt, 64).toString('hex'); }
let auth = readJSON(F_AUTH, null);
if (!auth) {
  const initial = process.env.ADMIN_PASSWORD || 'eser2020';
  const salt = crypto.randomBytes(16).toString('hex');
  auth = { salt, hash: hashPw(initial, salt), secret: crypto.randomBytes(32).toString('hex'), v: 1 };
  writeJSON(F_AUTH, auth);
  if (!process.env.ADMIN_PASSWORD) console.warn('[ESER] Mật khẩu admin mặc định là "eser2020" — hãy đổi ngay trong /admin → Cài đặt.');
}
const b64u = (s) => Buffer.from(s).toString('base64url');
function sign(data) { return crypto.createHmac('sha256', auth.secret).update(data).digest('base64url'); }
function makeToken() {
  const payload = b64u(JSON.stringify({ exp: Date.now() + 7 * 864e5, v: auth.v }));
  return payload + '.' + sign(payload);
}
function verifyToken(tok) {
  if (!tok || !tok.includes('.')) return false;
  const [p, s] = tok.split('.');
  const good = sign(p);
  if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return false;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.exp > Date.now() && o.v === auth.v; } catch { return false; }
}
function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((c) => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
const isAuthed = (req) => verifyToken(cookies(req).eser_admin);
function setCookie(req, res, val, maxAge) {
  const secure = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted ? '; Secure' : '';
  res.setHeader('Set-Cookie', `eser_admin=${val}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`);
}

/* ---------- rate limit ---------- */
const buckets = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const b = buckets.get(key) || [];
  const fresh = b.filter((t) => now - t < windowMs);
  fresh.push(now);
  buckets.set(key, fresh);
  return fresh.length > max;
}
const ipOf = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';

/* ---------- helpers ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
function send(res, code, body, type = 'application/json; charset=utf-8', extra = {}) {
  res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', ...extra });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
const json = (res, code, obj) => send(res, code, obj);
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error('too large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(Object.assign(new Error('bad json'), { code: 400 })); } });
    req.on('error', reject);
  });
}
const clip = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
function adminGuard(req, res) {
  if (!isAuthed(req)) { json(res, 401, { error: 'Chưa đăng nhập' }); return false; }
  if (req.method !== 'GET' && req.headers['x-eser-admin'] !== '1') { json(res, 403, { error: 'Thiếu header' }); return false; }
  return true;
}
function slugify(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'anh';
}
function backupContent() {
  try {
    fs.copyFileSync(F_CONTENT, path.join(BACKUPS, 'content-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json'));
    const files = fs.readdirSync(BACKUPS).filter((f) => f.endsWith('.json')).sort();
    while (files.length > 30) fs.unlinkSync(path.join(BACKUPS, files.shift()));
  } catch (e) { console.error('backup', e.message); }
}
function listMedia() {
  const out = [];
  for (const dir of ['images', 'uploads']) {
    const abs = path.join(PUB, dir);
    for (const f of fs.existsSync(abs) ? fs.readdirSync(abs) : []) {
      if (!/\.(jpe?g|png|webp|gif)$/i.test(f)) continue;
      const st = fs.statSync(path.join(abs, f));
      out.push({ url: `/${dir}/${f}`, size: st.size, mtime: st.mtimeMs, deletable: dir === 'uploads' });
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

/* ---------- static ---------- */
function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return send(res, 400, 'Bad request', 'text/plain'); }
  if (rel === '/admin' || rel === '/admin/') rel = '/admin/index.html';
  const abs = path.normalize(path.join(PUB, rel));
  if (!abs.startsWith(PUB + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.stat(abs, (err, st) => {
    if (err || !st.isFile()) return notFound(res);
    const ext = path.extname(abs).toLowerCase();
    const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
    if (req.headers['if-none-match'] === etag) { res.writeHead(304); return res.end(); }
    const isImg = /\.(jpe?g|png|webp|gif|svg|ico|woff2)$/.test(ext);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, ETag: etag,
      'Cache-Control': rel.startsWith('/admin') ? 'no-cache' : isImg ? 'public, max-age=604800' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(abs).pipe(res);
  });
}
function notFound(res) {
  send(res, 404, `<!doctype html><meta charset="utf-8"><title>Không tìm thấy</title><body style="font-family:system-ui;background:#F2ECE3;color:#191410;display:grid;place-items:center;height:100vh;margin:0"><div style="text-align:center"><p style="font:700 64px Georgia,serif;margin:0">404</p><p>Trang không tồn tại.</p><a href="/" style="color:#A3231B">Về trang chủ ESER</a></div>`, 'text/html; charset=utf-8');
}

/* ---------- API ---------- */
async function api(req, res, pathname, query) {
  const m = req.method;

  if (pathname === '/api/login' && m === 'POST') {
    if (limited('login:' + ipOf(req), 10, 15 * 60e3)) return json(res, 429, { error: 'Thử quá nhiều lần, vui lòng đợi 15 phút.' });
    const b = await readBody(req, 4e3);
    const ok = crypto.timingSafeEqual(Buffer.from(hashPw(b.password || '', auth.salt), 'hex'), Buffer.from(auth.hash, 'hex'));
    if (!ok) return json(res, 401, { error: 'Sai mật khẩu' });
    setCookie(req, res, makeToken(), 7 * 86400);
    return json(res, 200, { ok: true });
  }
  if (pathname === '/api/logout' && m === 'POST') { setCookie(req, res, '', 0); return json(res, 200, { ok: true }); }
  if (pathname === '/api/me' && m === 'GET') return json(res, 200, { authed: isAuthed(req) });

  // Public: gửi liên hệ / đơn hàng
  if (pathname === '/api/inquiries' && m === 'POST') {
    if (limited('inq:' + ipOf(req), 6, 10 * 60e3)) return json(res, 429, { error: 'Bạn gửi hơi nhiều, vui lòng thử lại sau ít phút hoặc gọi hotline.' });
    const b = await readBody(req, 30e3);
    if (b.website) return json(res, 200, { ok: true }); // honeypot
    const phone = clip(b.phone, 20).replace(/[^\d+ .]/g, '');
    const name = clip(b.name, 80);
    if (!name || phone.replace(/\D/g, '').length < 9) return json(res, 400, { error: 'Vui lòng nhập họ tên và số điện thoại hợp lệ.' });
    const products = content.products || [];
    const items = Array.isArray(b.items) ? b.items.slice(0, 30).map((it) => {
      const p = products.find((x) => x.id === it.id);
      if (!p) return null;
      const qty = Math.max(1, Math.min(20, parseInt(it.qty, 10) || 1));
      return { id: p.id, name: p.name, size: clip(it.size, 8), qty, price: Number(p.price) || 0 };
    }).filter(Boolean) : [];
    const rec = {
      id: crypto.randomBytes(6).toString('hex'), type: items.length ? 'order' : 'contact', status: 'new',
      createdAt: new Date().toISOString(), name, phone,
      address: clip(b.address, 200), interest: clip(b.interest, 80), message: clip(b.message, 1500),
      items, total: items.reduce((s, i) => s + i.price * i.qty, 0),
    };
    inquiries.unshift(rec);
    if (inquiries.length > 3000) inquiries.length = 3000;
    writeJSON(F_INQ, inquiries);
    return json(res, 200, { ok: true });
  }

  // ---- admin only ----
  if (!adminGuard(req, res)) return;

  if (pathname === '/api/content' && m === 'GET') return json(res, 200, content);
  if (pathname === '/api/content' && m === 'PUT') {
    const b = await readBody(req, 3e6);
    if (!b || typeof b !== 'object' || Array.isArray(b) || !b.site) return json(res, 400, { error: 'Dữ liệu không hợp lệ' });
    backupContent();
    content = b;
    writeJSON(F_CONTENT, content);
    return json(res, 200, { ok: true, savedAt: new Date().toISOString() });
  }
  if (pathname === '/api/content/default' && m === 'GET') return json(res, 200, readJSON(path.join(ROOT, 'lib', 'default-content.json'), {}));

  if (pathname === '/api/media' && m === 'GET') return json(res, 200, listMedia());
  if (pathname === '/api/media' && m === 'DELETE') {
    const f = String(query.get('file') || '');
    if (!/^\/uploads\/[\w.-]+$/.test(f)) return json(res, 400, { error: 'Chỉ xoá được ảnh đã tải lên' });
    try { fs.unlinkSync(path.join(PUB, f)); } catch {}
    return json(res, 200, { ok: true });
  }
  if (pathname === '/api/upload' && m === 'POST') {
    const b = await readBody(req, 15e6);
    const mt = /^data:(image\/(jpeg|png|webp|gif));base64,/.exec(b.data || '');
    if (!mt) return json(res, 400, { error: 'Chỉ nhận ảnh JPG, PNG, WEBP, GIF' });
    const ext = { jpeg: 'jpg', png: 'png', webp: 'webp', gif: 'gif' }[mt[2]];
    const buf = Buffer.from(b.data.slice(mt[0].length), 'base64');
    if (buf.length > 10e6) return json(res, 413, { error: 'Ảnh quá lớn (tối đa 10MB)' });
    const base = slugify(String(b.filename || 'anh').replace(/\.[^.]+$/, ''));
    const name = `${Date.now().toString(36)}-${base}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS, name), buf);
    return json(res, 200, { url: '/uploads/' + name });
  }

  if (pathname === '/api/inquiries' && m === 'GET') return json(res, 200, inquiries);
  const im = /^\/api\/inquiries\/([a-f0-9]+)$/.exec(pathname);
  if (im) {
    const i = inquiries.findIndex((x) => x.id === im[1]);
    if (i < 0) return json(res, 404, { error: 'Không tìm thấy' });
    if (m === 'PATCH') {
      const b = await readBody(req, 4e3);
      if (['new', 'contacted', 'done'].includes(b.status)) inquiries[i].status = b.status;
      if (typeof b.note === 'string') inquiries[i].note = clip(b.note, 1000);
      writeJSON(F_INQ, inquiries);
      return json(res, 200, inquiries[i]);
    }
    if (m === 'DELETE') { inquiries.splice(i, 1); writeJSON(F_INQ, inquiries); return json(res, 200, { ok: true }); }
  }

  if (pathname === '/api/password' && m === 'POST') {
    const b = await readBody(req, 4e3);
    const ok = crypto.timingSafeEqual(Buffer.from(hashPw(b.current || '', auth.salt), 'hex'), Buffer.from(auth.hash, 'hex'));
    if (!ok) return json(res, 400, { error: 'Mật khẩu hiện tại không đúng' });
    if (String(b.next || '').length < 6) return json(res, 400, { error: 'Mật khẩu mới tối thiểu 6 ký tự' });
    auth.salt = crypto.randomBytes(16).toString('hex');
    auth.hash = hashPw(b.next, auth.salt);
    auth.v = (auth.v || 1) + 1; // đăng xuất mọi phiên cũ
    writeJSON(F_AUTH, auth);
    setCookie(req, res, makeToken(), 7 * 86400);
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'Không có API này' });
}

/* ---------- server ---------- */
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  try {
    if (p.startsWith('/api/')) return await api(req, res, p, u.searchParams);
    if ((p === '/' || p === '/index.html') && (req.method === 'GET' || req.method === 'HEAD')) {
      const html = renderPage(content, { v: ASSET_V });
      return send(res, 200, req.method === 'HEAD' ? '' : html, 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
    return serveStatic(req, res, p);
  } catch (e) {
    const code = e.code === 413 ? 413 : e.code === 400 ? 400 : 500;
    if (code === 500) console.error(e);
    if (!res.headersSent) json(res, code, { error: code === 413 ? 'Dữ liệu quá lớn' : code === 400 ? 'Yêu cầu không hợp lệ' : 'Lỗi máy chủ' });
  }
});
server.listen(PORT, () => console.log(`[ESER] Website: http://localhost:${PORT}   Admin: http://localhost:${PORT}/admin`));
