// Warecon API on Cloudflare Workers + D1: accounts, sessions, record sync, photos.
// Everything outside /api/ is the static PWA, served by Workers Assets.

const ARR = ['groups', 'employees', 'customers', 'categories', 'items', 'receipts', 'moves', 'orders', 'blocks', 'expenses', 'bills', 'notes', 'reports', 'tasks', 'messages', 'notifs'];
const COLS = new Set([...ARR, 'att', 'seen', 'meta']);
const ROLES = ['owner', 'nhaplieu', 'staff'];
const DAY = 86400;
const REMEMBER = 30 * DAY, SHORT = 12 * 3600;
// What a worker (staff) may write: 'all' = create/update, 'new' = create only, [fields] = update those fields of existing records.
const STAFF_W = {
  tasks: 'all', notifs: 'all', reports: 'all', notes: 'all', seen: 'all', messages: 'new', moves: 'new', receipts: 'new',
  items: ['stock'], orders: ['process', 'status', 'doneAt', 'materialsIssued'],
};

const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const bad = (error, status = 400) => json({ error }, status);
const hex = u8 => [...u8].map(b => b.toString(16).padStart(2, '0')).join('');
const b64 = u8 => btoa(String.fromCharCode(...u8));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const randHex = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async s => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))));
function safeEq(a, b) { a = String(a); b = String(b); let r = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) r |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return r === 0; }

async function hashPw(pw, saltB64) {
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  return { hash: b64(new Uint8Array(bits)), salt: b64(salt) };
}

const pub = u => ({ id: u.id, username: u.username, name: u.name, role: u.role, employeeId: u.employee_id || '' });
const cleanUser = s => String(s || '').trim().toLowerCase();
const validUser = s => /^[a-z0-9._-]{3,32}$/.test(s);
const validPw = s => typeof s === 'string' && s.length >= 8 && s.length <= 200;
const cookie = (token, maxAge) => `wc_s=${token}; Path=/; HttpOnly; Secure; SameSite=Lax${maxAge === undefined ? '' : `; Max-Age=${maxAge}`}`;
const readToken = req => ((req.headers.get('cookie') || '').match(/(?:^|;\s*)wc_s=([a-f0-9]{64})/) || [])[1];

async function newSession(env, userId, remember) {
  const token = randHex(32);
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires, remember, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256(token), userId, now() + (remember ? REMEMBER : SHORT), remember ? 1 : 0, now()).run();
  return cookie(token, remember ? REMEMBER : undefined);
}

async function auth(req, env) {
  const token = readToken(req);
  if (!token) return null;
  const tk = await sha256(token);
  const u = await env.DB.prepare('SELECT u.*, s.remember, s.expires FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires > ? AND u.active = 1').bind(tk, now()).first();
  if (u) { u.token = token; u.tokenHash = tk; }
  return u;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try { return await route(req, env, url.pathname.slice(5)); }
    catch (e) { console.error(e); return bad('Lỗi máy chủ, thử lại sau.', 500); }
  },
};

async function route(req, env, p) {
  const m = req.method;
  // Custom header blocks cross-site form posts (CSRF); browsers cannot add it without a CORS preflight we never allow.
  if (m === 'POST' && req.headers.get('x-requested-with') !== 'warecon') return bad('Yêu cầu không hợp lệ.', 403);
  if (p === 'me' && m === 'GET') return me(req, env);
  if (p === 'setup' && m === 'POST') return setup(req, env);
  if (p === 'login' && m === 'POST') return login(req, env);
  if (p === 'logout' && m === 'POST') return logout(req, env);
  const u = await auth(req, env);
  if (!u) return bad('Phiên đăng nhập đã hết, vui lòng đăng nhập lại.', 401);
  let mm;
  if (p === 'sync' && m === 'POST') return sync(req, env, u);
  if (p === 'password' && m === 'POST') return changePassword(req, env, u);
  if (p === 'users' && m === 'GET') return listUsers(env, u);
  if (p === 'users' && m === 'POST') return createUser(req, env, u);
  if ((mm = p.match(/^users\/([\w-]{1,64})$/)) && m === 'POST') return updateUser(req, env, u, mm[1]);
  if (p === 'photo' && m === 'POST') return putPhoto(req, env, u);
  if ((mm = p.match(/^photo\/([a-f0-9]{32})$/)) && m === 'GET') return getPhoto(env, mm[1]);
  return bad('Không tìm thấy.', 404);
}

/* ---------- auth endpoints ---------- */
async function me(req, env) {
  const u = await auth(req, env);
  if (!u) {
    const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first();
    return json({ user: null, setup: n === 0 });
  }
  if (!u.remember) return json({ user: pub(u) });
  // "Lưu đăng nhập": slide the 30-day window each time the app opens.
  await env.DB.prepare('UPDATE sessions SET expires = ? WHERE token = ?').bind(now() + REMEMBER, u.tokenHash).run();
  return json({ user: pub(u) }, 200, { 'set-cookie': cookie(u.token, REMEMBER) });
}

async function setup(req, env) {
  const b = await req.json().catch(() => ({}));
  if (!env.SETUP_CODE) return bad('Máy chủ chưa cấu hình mã khởi tạo.', 403);
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first();
  if (n > 0) return bad('Xưởng đã được khởi tạo. Hãy đăng nhập.', 403);
  if (!safeEq(b.code || '', env.SETUP_CODE)) return bad('Mã khởi tạo không đúng.', 403);
  const username = cleanUser(b.username), name = String(b.name || '').trim().slice(0, 80);
  if (!validUser(username)) return bad('Tên đăng nhập 3–32 ký tự: chữ không dấu, số, dấu chấm, gạch.');
  if (!name) return bad('Nhập tên hiển thị.');
  if (!validPw(b.password)) return bad('Mật khẩu tối thiểu 8 ký tự.');
  const { hash, salt } = await hashPw(b.password);
  const id = randHex(12);
  await env.DB.prepare('INSERT INTO users (id, username, name, role, employee_id, pass_hash, salt, active, created_by, created_at) VALUES (?, ?, ?, ?, NULL, ?, ?, 1, NULL, ?)')
    .bind(id, username, name, 'owner', hash, salt, now()).run();
  return json({ user: { id, username, name, role: 'owner', employeeId: '' } }, 200, { 'set-cookie': await newSession(env, id, true) });
}

async function login(req, env) {
  const b = await req.json().catch(() => ({}));
  const username = cleanUser(b.username);
  const fail = await env.DB.prepare('SELECT count, until FROM login_fail WHERE username = ?').bind(username).first();
  if (fail && fail.until > now()) return bad(`Sai mật khẩu nhiều lần. Thử lại sau ${Math.ceil((fail.until - now()) / 60)} phút.`, 429);
  const u = username && await env.DB.prepare('SELECT * FROM users WHERE username = ? AND active = 1').bind(username).first();
  // Always run the hash, so a wrong username takes as long as a wrong password.
  const check = await hashPw(String(b.password || ''), u?.salt || 'AAAAAAAAAAAAAAAAAAAAAA==');
  const ok = !!u && safeEq(check.hash, u.pass_hash);
  if (!ok) {
    const count = (fail?.count || 0) + 1;
    await env.DB.prepare('INSERT INTO login_fail (username, count, until) VALUES (?, ?, ?) ON CONFLICT(username) DO UPDATE SET count = excluded.count, until = excluded.until')
      .bind(username || '-', count >= 5 ? 0 : count, count >= 5 ? now() + 600 : 0).run();
    return bad('Sai tên đăng nhập hoặc mật khẩu.', 401);
  }
  await env.DB.batch([
    env.DB.prepare('DELETE FROM login_fail WHERE username = ?').bind(username),
    env.DB.prepare('DELETE FROM sessions WHERE expires < ?').bind(now()),
  ]);
  return json({ user: pub(u) }, 200, { 'set-cookie': await newSession(env, u.id, !!b.remember) });
}

async function logout(req, env) {
  const token = readToken(req);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) });
}

async function changePassword(req, env, u) {
  const b = await req.json().catch(() => ({}));
  if (!safeEq((await hashPw(String(b.old || ''), u.salt)).hash, u.pass_hash)) return bad('Mật khẩu hiện tại không đúng.', 403);
  if (!validPw(b.new)) return bad('Mật khẩu mới tối thiểu 8 ký tự.');
  const { hash, salt } = await hashPw(b.new);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET pass_hash = ?, salt = ? WHERE id = ?').bind(hash, salt, u.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token <> ?').bind(u.id, u.tokenHash), // sign out other devices
  ]);
  return json({ ok: true });
}

/* ---------- accounts (owner / nhaplieu only) ---------- */
const canManage = u => u.role === 'owner' || u.role === 'nhaplieu';

async function listUsers(env, u) {
  if (!canManage(u)) return bad('Không có quyền.', 403);
  const { results } = await env.DB.prepare('SELECT id, username, name, role, employee_id, active, created_at FROM users ORDER BY created_at').all();
  return json({ users: results.map(x => ({ id: x.id, username: x.username, name: x.name, role: x.role, employeeId: x.employee_id || '', active: !!x.active, createdAt: x.created_at })) });
}

async function employeeExists(env, id) {
  return !!(await env.DB.prepare("SELECT 1 FROM records WHERE col = 'employees' AND id = ? AND del = 0").bind(id).first());
}

async function createUser(req, env, u) {
  if (!canManage(u)) return bad('Chỉ chủ xưởng hoặc người nhập liệu được tạo tài khoản.', 403);
  const b = await req.json().catch(() => ({}));
  const username = cleanUser(b.username), name = String(b.name || '').trim().slice(0, 80), role = b.role;
  if (!ROLES.includes(role)) return bad('Vai trò không hợp lệ.');
  if (u.role === 'nhaplieu' && role !== 'staff') return bad('Người nhập liệu chỉ tạo được tài khoản nhân viên.', 403);
  if (!validUser(username)) return bad('Tên đăng nhập 3–32 ký tự: chữ không dấu, số, dấu chấm, gạch.');
  if (!name) return bad('Nhập tên hiển thị.');
  if (!validPw(b.password)) return bad('Mật khẩu tối thiểu 8 ký tự.');
  const employeeId = role === 'staff' ? String(b.employeeId || '') : '';
  if (role === 'staff' && !(await employeeExists(env, employeeId))) return bad('Chọn nhân viên cho tài khoản này.');
  if (await env.DB.prepare('SELECT 1 FROM users WHERE username = ?').bind(username).first()) return bad('Tên đăng nhập đã có người dùng.', 409);
  const { hash, salt } = await hashPw(b.password);
  const id = randHex(12);
  await env.DB.prepare('INSERT INTO users (id, username, name, role, employee_id, pass_hash, salt, active, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)')
    .bind(id, username, name, role, employeeId || null, hash, salt, u.id, now()).run();
  return json({ user: { id, username, name, role, employeeId, active: true } });
}

async function updateUser(req, env, u, id) {
  if (!canManage(u)) return bad('Không có quyền.', 403);
  const t = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  if (!t) return bad('Không tìm thấy tài khoản.', 404);
  if (u.role === 'nhaplieu' && t.role !== 'staff') return bad('Người nhập liệu chỉ quản lý được tài khoản nhân viên.', 403);
  const b = await req.json().catch(() => ({}));
  const sets = [], vals = [];
  let kick = false;
  if (b.name !== undefined) { const n = String(b.name).trim().slice(0, 80); if (!n) return bad('Nhập tên hiển thị.'); sets.push('name = ?'); vals.push(n); }
  if (b.active !== undefined) {
    if (t.id === u.id) return bad('Không tự khoá tài khoản của mình.');
    sets.push('active = ?'); vals.push(b.active ? 1 : 0); kick ||= !b.active;
  }
  if (b.role !== undefined) {
    if (u.role !== 'owner' || !ROLES.includes(b.role)) return bad('Không đổi được vai trò.', 403);
    if (t.id === u.id) return bad('Không tự đổi vai trò của mình.');
    sets.push('role = ?'); vals.push(b.role); kick = true;
  }
  if (b.employeeId !== undefined) {
    if (b.employeeId && !(await employeeExists(env, b.employeeId))) return bad('Nhân viên không tồn tại.');
    sets.push('employee_id = ?'); vals.push(b.employeeId || null);
  }
  if (b.password !== undefined) {
    if (!validPw(b.password)) return bad('Mật khẩu tối thiểu 8 ký tự.');
    const { hash, salt } = await hashPw(b.password);
    sets.push('pass_hash = ?', 'salt = ?'); vals.push(hash, salt); kick = true;
  }
  if (!sets.length) return bad('Không có gì để cập nhật.');
  const stmts = [env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id)];
  if (kick) stmts.push(env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id));
  await env.DB.batch(stmts);
  return json({ ok: true });
}

/* ---------- data sync ---------- */
// What each role may read. Workers never receive money; nhập liệu never receives cost, expenses or bills.
function view(col, d, u) {
  if (u.role === 'owner') return d;
  if (col === 'expenses' || col === 'bills') return null;
  if (u.role === 'nhaplieu') {
    if (col === 'orders') { const { costs, costFinal, ...rest } = d; return rest; }
    return d;
  }
  switch (col) {
    case 'orders': return { ...d, lines: (d.lines || []).map(l => ({ ...l, price: 0 })), deposit: 0, payments: [], costs: [], costFinal: false };
    case 'receipts': return { ...d, lines: (d.lines || []).map(l => ({ ...l, price: 0 })) };
    case 'items': return { ...d, lastPrice: 0 };
    case 'moves': return { ...d, price: 0 };
    case 'messages': return d.ch === 'all' || d.ch === u.groupId ? d : null;
    case 'notifs': return d.to === u.employee_id ? d : null;
    default: return d;
  }
}

// Merge one incoming change against what the server holds. Returns { data } to write, { del: true }, or null to ignore.
function decide(u, col, old, inc) {
  const del = inc === null;
  if (u.role === 'owner') return del ? (old ? { del: true } : null) : { data: inc };
  if (u.role === 'nhaplieu') {
    if (col === 'expenses' || col === 'bills') return null;
    if (del) return old ? { del: true } : null;
    if (col === 'orders') return { data: { ...inc, costs: old?.costs || [], costFinal: !!old?.costFinal } };
    return { data: inc };
  }
  const rule = STAFF_W[col];
  if (!rule || del) return null;
  if (rule === 'all') return { data: inc };
  if (rule === 'new') return old ? null : { data: inc };
  if (!old) return null;
  const out = { ...old };
  for (const f of rule) if (f in inc) out[f] = inc[f];
  return { data: out };
}

async function sync(req, env, u) {
  const b = await req.json().catch(() => ({}));
  const since = Number.isInteger(b.since) && b.since > 0 ? b.since : 0;
  const changes = (Array.isArray(b.changes) ? b.changes : []).filter(c => c && COLS.has(c.c) && typeof c.i === 'string' && c.i.length && c.i.length <= 200).slice(0, 3000);
  if (u.role === 'staff' && u.employee_id) {
    const e = await env.DB.prepare("SELECT data FROM records WHERE col = 'employees' AND id = ? AND del = 0").bind(u.employee_id).first();
    u.groupId = e ? JSON.parse(e.data).groupId : '';
  }
  let rejected = 0;
  if (changes.length) {
    const olds = [];
    for (let i = 0; i < changes.length; i += 50) {
      const part = changes.slice(i, i + 50);
      const res = await env.DB.batch(part.map(c => env.DB.prepare('SELECT data FROM records WHERE col = ? AND id = ? AND del = 0').bind(c.c, c.i)));
      for (const r of res) olds.push(r.results[0] ? JSON.parse(r.results[0].data) : null);
    }
    const writes = [];
    for (const [k, c] of changes.entries()) {
      let inc = c.d === undefined ? null : c.d;
      if (inc !== null && (typeof inc !== 'object' && typeof inc !== 'string' && typeof inc !== 'number' && typeof inc !== 'boolean')) { rejected++; continue; }
      if (inc !== null && JSON.stringify(inc).length > 400000) { rejected++; continue; }
      if (u.role === 'staff' && c.c === 'moves' && inc && typeof inc === 'object') { // workers do not see prices: value issues at the item's purchase price
        const it = await env.DB.prepare("SELECT data FROM records WHERE col = 'items' AND id = ? AND del = 0").bind(inc.itemId || '').first();
        inc = { ...inc, price: it ? JSON.parse(it.data).lastPrice || 0 : 0 };
      }
      const r = decide(u, c.c, olds[k], inc);
      if (!r) { rejected++; continue; }
      writes.push(env.DB.prepare("INSERT INTO records (col, id, data, ver, del) VALUES (?1, ?2, ?3, (SELECT v FROM kv WHERE k = 'ver'), ?4) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, ver = excluded.ver, del = excluded.del")
        .bind(c.c, c.i, r.del ? null : JSON.stringify(r.data), r.del ? 1 : 0));
    }
    // One transaction: bump the version and write rows with it, so readers never see a half-applied change.
    if (writes.length) await env.DB.batch([env.DB.prepare("UPDATE kv SET v = v + 1 WHERE k = 'ver'"), ...writes]);
  }
  const [verRes, rowRes] = await env.DB.batch([
    env.DB.prepare("SELECT v FROM kv WHERE k = 'ver'"),
    since
      ? env.DB.prepare("SELECT col, id, data, del FROM records WHERE ver > ? AND ver <= (SELECT v FROM kv WHERE k = 'ver') ORDER BY ver, rowid").bind(since)
      : env.DB.prepare("SELECT col, id, data, del FROM records WHERE del = 0 AND ver <= (SELECT v FROM kv WHERE k = 'ver') ORDER BY rowid"),
  ]);
  const rows = [];
  for (const r of rowRes.results) {
    if (r.del) { rows.push({ c: r.col, i: r.id, del: 1 }); continue; }
    const d = view(r.col, JSON.parse(r.data), u);
    if (d !== null) rows.push({ c: r.col, i: r.id, d });
  }
  return json({ ver: verRes.results[0].v, rows, rejected });
}

/* ---------- photos ---------- */
async function putPhoto(req, env, u) {
  const type = (req.headers.get('content-type') || '').split(';')[0];
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return bad('Chỉ nhận ảnh JPEG/PNG/WebP.');
  const buf = await req.arrayBuffer();
  if (!buf.byteLength || buf.byteLength > 1500000) return bad('Ảnh quá lớn (tối đa 1,5MB).');
  const id = randHex(16);
  await env.DB.prepare('INSERT INTO photos (id, type, data, created_by, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, type, buf, u.id, now()).run();
  return json({ url: `/api/photo/${id}` });
}

async function getPhoto(env, id) {
  const p = await env.DB.prepare('SELECT type, data FROM photos WHERE id = ?').bind(id).first();
  if (!p) return bad('Không tìm thấy ảnh.', 404);
  return new Response(new Uint8Array(p.data), { headers: { 'content-type': p.type, 'cache-control': 'private, max-age=31536000, immutable' } });
}
