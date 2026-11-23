/* Backend Mì Studio: Cloudflare Worker + static assets + KV.
   GET  /api/content          nội dung đã lưu (hoặc {empty:true})
   PUT  /api/content          lưu nội dung            (cần token)
   DELETE /api/content        đặt lại về mặc định     (cần token)
   POST /api/login            {user, pass} -> {token} (token hết hạn sau 12 giờ)
   POST /api/media            thân là ảnh -> {url}    (cần token)
   GET  /media/:id            trả ảnh đã tải lên
   Secrets: ADMIN_USER, ADMIN_PASS, TOKEN_SECRET. KV binding: CONTENT. */

const MAX_CONTENT = 2 * 1024 * 1024;   // nội dung chỉ chứa link ảnh, không chứa ảnh
const MAX_MEDIA = 6 * 1024 * 1024;
const TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const TTL = 12 * 3600;

const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
});
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = (s) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
// so sánh không lộ thời gian
function same(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function sign(env, user) {
  const body = b64u(enc.encode(JSON.stringify({ u: user, exp: Math.floor(Date.now() / 1000) + TTL })));
  return body + '.' + await hmac(env.TOKEN_SECRET, body);
}
async function authed(req, env) {
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const [body, sig] = t.split('.');
  if (!body || !sig || !same(sig, await hmac(env.TOKEN_SECRET, body))) return false;
  try { return JSON.parse(fromB64u(body)).exp > Date.now() / 1000; } catch (_) { return false; }
}

async function api(req, env, url) {
  const p = url.pathname, m = req.method;

  if (p === '/api/login' && m === 'POST') {
    let d; try { d = await req.json(); } catch (_) { return json({ error: 'Sai định dạng' }, 400); }
    const ok = typeof d.user === 'string' && typeof d.pass === 'string'
      && same(await hmac(env.TOKEN_SECRET, d.user.trim()), await hmac(env.TOKEN_SECRET, env.ADMIN_USER))
      && same(await hmac(env.TOKEN_SECRET, d.pass), await hmac(env.TOKEN_SECRET, env.ADMIN_PASS));
    if (!ok) { await new Promise((r) => setTimeout(r, 600)); return json({ error: 'Sai tài khoản hoặc mật khẩu' }, 401); }
    return json({ token: await sign(env, env.ADMIN_USER), ttl: TTL });
  }

  if (p === '/api/content' && m === 'GET') {
    const v = await env.CONTENT.get('content');
    return v ? new Response(v, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache' } }) : json({ empty: true });
  }

  if (!(await authed(req, env))) return json({ error: 'Cần đăng nhập lại' }, 401);

  if (p === '/api/content' && m === 'PUT') {
    const text = await req.text();
    if (text.length > MAX_CONTENT) return json({ error: 'Nội dung quá lớn' }, 413);
    let d; try { d = JSON.parse(text); } catch (_) { return json({ error: 'Sai định dạng' }, 400); }
    if (!d || typeof d !== 'object' || !Array.isArray(d.albums) || typeof d.texts !== 'object') return json({ error: 'Sai cấu trúc nội dung' }, 400);
    if (/"data:image\//.test(text)) return json({ error: 'Ảnh phải tải lên qua /api/media' }, 400);
    await env.CONTENT.put('content', text);
    return json({ ok: true, savedAt: new Date().toISOString() });
  }
  if (p === '/api/content' && m === 'DELETE') { await env.CONTENT.delete('content'); return json({ ok: true }); }

  if (p === '/api/media' && m === 'POST') {
    const type = (req.headers.get('content-type') || '').split(';')[0].trim();
    if (!TYPES[type]) return json({ error: 'Chỉ nhận ảnh webp, jpg, png' }, 415);
    const buf = await req.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > MAX_MEDIA) return json({ error: 'Ảnh rỗng hoặc quá 6MB' }, 413);
    const id = crypto.randomUUID() + '.' + TYPES[type];
    // shortcut: ảnh nằm trong KV (tối đa 25MB/ảnh, 1.000 lượt ghi/ngày gói free); nhiều ảnh hơn thì chuyển sang R2. Ảnh bị xoá khỏi nội dung chưa được dọn khỏi KV.
    await env.CONTENT.put('m/' + id, buf, { metadata: { type } });
    return json({ url: '/media/' + id });
  }

  return json({ error: 'Không tìm thấy' }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      try { return await api(req, env, url); }
      catch (e) { return json({ error: 'Lỗi máy chủ' }, 500); }
    }
    if (url.pathname.startsWith('/media/')) {
      const id = url.pathname.slice(7);
      if (!/^[\w-]+\.(webp|jpg|png)$/.test(id)) return new Response('Not found', { status: 404 });
      const { value, metadata } = await env.CONTENT.getWithMetadata('m/' + id, { type: 'stream' });
      if (!value) return new Response('Not found', { status: 404 });
      return new Response(value, { headers: { 'content-type': metadata.type, 'cache-control': 'public, max-age=31536000, immutable' } });
    }
    return env.ASSETS.fetch(req);
  },
};
