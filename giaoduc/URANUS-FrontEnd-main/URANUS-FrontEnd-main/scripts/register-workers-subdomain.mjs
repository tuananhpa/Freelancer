// Đăng ký tên miền con workers.dev cho tài khoản Cloudflare đang đăng nhập bằng `wrangler login`.
// Dùng: node scripts/register-workers-subdomain.mjs edu-manage-ai
// Khóa OAuth chỉ đọc từ file cấu hình wrangler trên máy và gửi tới api.cloudflare.com, không in ra.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

const name = process.argv[2];
if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(name || '')) {
  console.error('Tên chỉ gồm chữ thường, số, dấu gạch ngang (vd. edu-manage-ai).');
  process.exit(1);
}

const candidates = [
  process.env.APPDATA && join(process.env.APPDATA, 'xdg.config', '.wrangler', 'config', 'default.toml'),
  join(os.homedir(), '.wrangler', 'config', 'default.toml'),
  join(os.homedir(), '.config', '.wrangler', 'config', 'default.toml'),
].filter(Boolean);
const file = candidates.find((p) => existsSync(p));
if (!file) { console.error('Chưa thấy phiên đăng nhập wrangler. Chạy: npx wrangler@4 login'); process.exit(1); }
const token = readFileSync(file, 'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];
if (!token) { console.error('File cấu hình wrangler không có oauth_token. Chạy lại: npx wrangler@4 login'); process.exit(1); }

const cf = async (path, init = {}) => {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  const j = await r.json();
  if (!j.success) throw new Error((j.errors || []).map((e) => `${e.code}: ${e.message}`).join('; ') || `HTTP ${r.status}`);
  return j.result;
};

const accounts = await cf('/accounts');
if (!accounts.length) { console.error('Tài khoản không có account nào.'); process.exit(1); }
const acc = accounts[0];
try {
  const cur = await cf(`/accounts/${acc.id}/workers/subdomain`);
  if (cur?.subdomain) { console.log(`Tài khoản "${acc.name}" đã có tên miền con: ${cur.subdomain}.workers.dev`); process.exit(0); }
} catch { /* chưa có thì đăng ký bên dưới */ }
const res = await cf(`/accounts/${acc.id}/workers/subdomain`, { method: 'PUT', body: JSON.stringify({ subdomain: name }) });
console.log(`Đã đăng ký: ${res.subdomain}.workers.dev cho tài khoản "${acc.name}"`);
