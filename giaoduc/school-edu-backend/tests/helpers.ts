// Gọi API thật đang chạy (wrangler dev) cho các test hợp đồng
export const BASE = process.env.BASE_URL || 'http://localhost:8787';

export async function api(method: string, path: string, body?: unknown, token?: string) {
  const r = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* file hoặc rỗng */ }
  return { status: r.status, json, data: json && typeof json === 'object' && 'data' in json && 'status' in json ? json.data : json, headers: r.headers, raw: text };
}

export const login = async (username: string, password: string) =>
  (await api('POST', '/auth/login', username.includes('@') ? { email: username, password } : { username, studentCode: username, password })).data?.accessToken as string;

let n = 0;
/** Admin tạo tài khoản mới và đăng nhập, trả token + id */
export async function makeUser(admin: string, role: string, name = role) {
  const tag = `${role.toLowerCase()}${Date.now() % 1e7}${n++}`;
  const r = await api('POST', '/admin/users', { fullName: `${name} ${tag}`, email: `${tag}@test.vn`, username: tag, password: 'Abc12345', role }, admin);
  if (r.status !== 200) throw new Error(`makeUser ${r.status} ${r.raw}`);
  return { id: r.data.id as string, token: await login(tag, 'Abc12345'), email: `${tag}@test.vn`, username: tag };
}
