/* Warecon – server mode: login, "lưu đăng nhập", record sync with the Cloudflare Worker.
   Opened without a server (local python http.server) the app runs as the demo mockup with data in this browser only. */
const LIVE = { on: false, user: null, ver: 0, base: {}, timer: 0, saveT: 0, inflight: null, again: false, offline: false, deferRender: false };
const SYNC_ARR = ['groups', 'employees', 'customers', 'categories', 'items', 'receipts', 'moves', 'orders', 'blocks', 'expenses', 'bills', 'notes', 'reports', 'tasks', 'messages', 'notifs'];
const ORDERED = ['groups', 'blocks', 'categories']; // user-sorted lists keep their order through _i
const LOCAL_META = ['role', 'meId']; // who is signed in on this device, never synced
const cacheKey = () => 'warecon.live.' + LIVE.user.id;

async function api(path, body, opts = {}) {
  const init = body === undefined ? { cache: 'no-store' }
    : { method: 'POST', headers: { 'content-type': opts.type || 'application/json', 'x-requested-with': 'warecon' }, body: opts.type ? body : JSON.stringify(body) };
  const r = await fetch('/api/' + path, init);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || `Lỗi máy chủ (${r.status})`), { status: r.status });
  return data;
}

function emptyDb() {
  const d = { v: 4, meta: { name: 'Xưởng của tôi', shiftStart: '07:30', capacity: 3, ignoreLock: false }, att: {}, seen: {} };
  for (const c of SYNC_ARR) d[c] = [];
  return d;
}

// db → Map("col|id" → JSON). One entry per record, so two people editing different records never overwrite each other.
function flatten(d) {
  const m = new Map();
  for (const c of SYNC_ARR) (d[c] || []).forEach((x, i) => m.set(`${c}|${x.id}`, JSON.stringify(ORDERED.includes(c) ? { ...x, _i: i } : x)));
  for (const [day, rec] of Object.entries(d.att || {})) for (const [e, r] of Object.entries(rec)) m.set(`att|${day}~${e}`, JSON.stringify(r));
  for (const [w, chs] of Object.entries(d.seen || {})) for (const [ch, at] of Object.entries(chs)) m.set(`seen|${w}~${ch}`, JSON.stringify(at));
  for (const [k, v] of Object.entries(d.meta || {})) if (!LOCAL_META.includes(k)) m.set(`meta|${k}`, JSON.stringify(v));
  return m;
}
const splitKey = k => { const j = k.indexOf('|'); return [k.slice(0, j), k.slice(j + 1)]; };

function applyRow(c, i, d) {
  if (SYNC_ARR.includes(c)) {
    const list = (db[c] ||= []), at = list.findIndex(x => x.id === i);
    if (d == null) { if (at >= 0) list.splice(at, 1); } else if (at >= 0) list[at] = d; else list.push(d);
  } else if (c === 'att' || c === 'seen') {
    const [a, b] = i.split('~'), box = (db[c] ||= {});
    if (d == null) { if (box[a]) delete box[a][b]; } else (box[a] ||= {})[b] = d;
  } else if (c === 'meta' && !LOCAL_META.includes(i)) {
    if (d == null) delete db.meta[i]; else db.meta[i] = d;
  }
}

function writeCache() {
  try { localStorage.setItem(cacheKey(), JSON.stringify({ ver: LIVE.ver, base: LIVE.base, db })); } catch { /* storage full: data is still on the server */ }
}

function setOffline(off) {
  LIVE.offline = off;
  document.body.classList.toggle('offline', off);
}

// Push local changes (diff against what the server last confirmed), then pull everything newer than LIVE.ver.
// Unsent changes stay in the diff, so working offline is safe: they go out on the next successful sync.
function syncNow() {
  if (!LIVE.on) return Promise.resolve();
  if (LIVE.inflight) { LIVE.again = true; return LIVE.inflight; }
  LIVE.inflight = (async () => {
    const snap = flatten(db), changes = [];
    for (const [k, v] of snap) if (LIVE.base[k] !== v) { const [c, i] = splitKey(k); changes.push({ c, i, d: JSON.parse(v) }); }
    for (const k of Object.keys(LIVE.base)) if (!snap.has(k)) { const [c, i] = splitKey(k); changes.push({ c, i, d: null }); }
    try {
      const unreadBefore = unreadNotifs().length;
      const res = await api('sync', { since: LIVE.ver, changes });
      for (const ch of changes) { const k = `${ch.c}|${ch.i}`; if (ch.d === null) delete LIVE.base[k]; else LIVE.base[k] = snap.get(k); }
      const cur = flatten(db), applied = [];
      let changed = false;
      for (const r of res.rows) {
        const k = `${r.c}|${r.i}`;
        if (cur.get(k) !== snap.get(k)) { if (r.del) delete LIVE.base[k]; else LIVE.base[k] = JSON.stringify(r.d); continue; } // edited while syncing: keep local, it goes out next time
        if (r.del ? cur.has(k) : cur.get(k) !== JSON.stringify(r.d)) changed = true;
        applyRow(r.c, r.i, r.del ? null : r.d); applied.push(r);
      }
      for (const c of ORDERED) (db[c] ||= []).sort((a, b) => (a._i ?? 1e9) - (b._i ?? 1e9));
      const after = flatten(db);
      for (const r of applied) { const k = `${r.c}|${r.i}`; if (r.del) delete LIVE.base[k]; else LIVE.base[k] = after.get(k); }
      LIVE.ver = res.ver; setOffline(false); writeCache();
      if (changed) softRender();
      const unread = unreadNotifs();
      if (unread.length > unreadBefore) { toast(`🔔 ${unread[unread.length - 1].text}`); sysNotify(); }
    } catch (err) {
      if (err.status === 401) { stopLive(); showLogin('Phiên đăng nhập đã hết, vui lòng đăng nhập lại.'); return; }
      setOffline(true);
    } finally {
      LIVE.inflight = null;
      if (LIVE.again) { LIVE.again = false; setTimeout(syncNow, 50); }
    }
  })();
  return LIVE.inflight;
}

function liveSave() {
  writeCache();
  clearTimeout(LIVE.saveT);
  LIVE.saveT = setTimeout(syncNow, 300);
}

// Re-render after remote changes without wiping what someone is typing.
function softRender() {
  const a = document.activeElement;
  if (a && a.closest?.('.composer')) {
    const v = a.value, pos = a.selectionStart;
    render();
    const n = $('.composer input[name=text]');
    if (n) { n.value = v; n.focus(); try { n.setSelectionRange(pos, pos); } catch {} }
    return;
  }
  if (a && a.closest?.('#view') && a.matches('input, textarea, select')) { LIVE.deferRender = true; return; }
  render();
}
document.addEventListener('focusout', () => { if (LIVE.deferRender) setTimeout(() => { if (!document.activeElement?.closest?.('#view')) { LIVE.deferRender = false; render(); } }, 0); });

async function startLive(user, opts = {}) {
  LIVE.on = true; LIVE.user = user;
  try { localStorage.setItem('warecon.lastUser', JSON.stringify(user)); } catch {}
  let c = null;
  try { c = JSON.parse(localStorage.getItem(cacheKey())); } catch {}
  if (c?.db) { db = c.db; LIVE.ver = c.ver || 0; LIVE.base = c.base || {}; }
  else if (opts.seed) { db = makeSeed(today()); LIVE.ver = 0; LIVE.base = {}; } // first setup with sample data: push it all
  else { db = emptyDb(); LIVE.ver = 0; LIVE.base = Object.fromEntries(flatten(db)); } // fresh device: pull only, never push defaults over real data
  db.meta.role = user.role; db.meta.meId = user.employeeId || '';
  document.body.classList.add('live');
  hideAuth(); render();
  if (opts.offline) setOffline(true);
  await syncNow();
  clearInterval(LIVE.timer);
  LIVE.timer = setInterval(() => { if (document.visibilityState === 'visible') syncNow(); }, 15000);
}

function stopLive() { clearInterval(LIVE.timer); LIVE.on = false; }

async function logout() {
  try { await syncNow(); await api('logout', {}); } catch {}
  stopLive();
  try { localStorage.removeItem(cacheKey()); localStorage.removeItem('warecon.lastUser'); } catch {}
  location.hash = '#/'; location.reload();
}

addEventListener('online', () => syncNow());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });

/* ---------- login / first setup screen ---------- */
const authBox = () => $('#auth');
function hideAuth() { const b = authBox(); b.hidden = true; b.innerHTML = ''; document.body.classList.remove('locked'); }
function showLogin(msg = '', setup = false) {
  document.body.classList.add('locked');
  const box = authBox(); box.hidden = false;
  box.innerHTML = `<div class="auth-card">
    <div class="auth-brand"><svg class="i"><use href="#i-logo"/></svg><div><b>Warecon</b><small>Quản lý xưởng sản xuất</small></div></div>
    ${setup ? `<h1>Khởi tạo xưởng</h1><p class="hint">Lần đầu dùng: tạo tài khoản chủ xưởng. Cần mã khởi tạo do người cài đặt cung cấp.</p>
      <form class="form" id="authForm" data-mode="setup">
        <label>Mã khởi tạo<input name="code" required autocomplete="off" autocapitalize="none" spellcheck="false"></label>
        <label>Tên của bạn<input name="name" required maxlength="80" autocomplete="name"></label>
        <label>Tên đăng nhập<input name="username" required pattern="[A-Za-z0-9._\\-]{3,32}" autocomplete="username" autocapitalize="none" spellcheck="false"><small class="hint">3–32 ký tự: chữ không dấu, số, dấu chấm, gạch.</small></label>
        <label>Mật khẩu<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
        <label>Nhập lại mật khẩu<input name="password2" type="password" required minlength="8" autocomplete="new-password"></label>
        <label class="switch"><input type="checkbox" name="seed"><span>Nạp dữ liệu mẫu để dùng thử</span></label>
        <p class="form-err" role="alert"></p>
        <button class="btn primary big">Tạo xưởng và đăng nhập</button></form>`
    : `<h1>Đăng nhập</h1>${msg ? `<p class="auth-msg">${esc(msg)}</p>` : ''}
      <form class="form" id="authForm" data-mode="login">
        <label>Tên đăng nhập<input name="username" required autocomplete="username" autocapitalize="none" spellcheck="false"></label>
        <label>Mật khẩu<input name="password" type="password" required autocomplete="current-password"></label>
        <label class="switch"><input type="checkbox" name="remember" checked><span>Lưu đăng nhập trên máy này (30 ngày)</span></label>
        <p class="form-err" role="alert"></p>
        <button class="btn primary big">Đăng nhập</button>
        <p class="hint">Chưa có tài khoản? Nhờ chủ xưởng hoặc người nhập liệu tạo cho bạn.</p></form>`}
  </div>`;
  const f = $('#authForm');
  $('input', f).focus();
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('.form-err', f), btn = $('button.primary', f), v = n => f.elements[n]?.value ?? '';
    err.textContent = ''; btn.disabled = true;
    try {
      if (f.dataset.mode === 'setup') {
        if (v('password') !== v('password2')) throw new Error('Hai mật khẩu không khớp.');
        const r = await api('setup', { code: v('code').trim(), name: v('name'), username: v('username'), password: v('password') });
        await startLive(r.user, { seed: f.elements.seed.checked });
        toast('Đã tạo xưởng. Tiếp theo: thêm nhân viên, tổ và tạo tài khoản cho họ.');
      } else {
        const r = await api('login', { username: v('username'), password: v('password'), remember: f.elements.remember.checked });
        await startLive(r.user);
      }
    } catch (x) { err.textContent = x.message === 'Failed to fetch' ? 'Không kết nối được máy chủ. Kiểm tra mạng.' : x.message; }
    finally { btn.disabled = false; }
  });
}

/* ---------- boot ---------- */
async function boot() {
  let res;
  try {
    const r = await fetch('/api/me', { cache: 'no-store' });
    res = (r.headers.get('content-type') || '').includes('application/json') ? await r.json() : null;
  } catch { res = 'offline'; }
  if (res === null) { save(); render(); return; } // no server: demo mockup
  if (res === 'offline') {
    let last = null; try { last = JSON.parse(localStorage.getItem('warecon.lastUser')); } catch {}
    return last ? startLive(last, { offline: true }) : showLogin('Không có mạng. Kết nối mạng để đăng nhập.');
  }
  if (res.user) return startLive(res.user);
  showLogin('', res.setup);
}
boot();
