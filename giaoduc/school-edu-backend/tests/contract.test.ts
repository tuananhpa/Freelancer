// Kiểm thử nghiệm thu theo PLAN.md §11. Chạy với backend đang chạy:  BASE_URL=http://localhost:8787 npm test
// Cố ý FAIL cho tới khi backend làm xong.
import { describe, it, expect, beforeAll } from 'vitest';

const BASE = process.env.BASE_URL || 'http://localhost:8787';
const api = async (method: string, path: string, body?: unknown, token?: string) => {
  const r = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* file hoặc rỗng */ }
  return { status: r.status, json, data: json && 'data' in json ? json.data : json, headers: r.headers };
};
const login = async (username: string, password: string) => (await api('POST', '/auth/login', { username, studentCode: username, password })).data?.accessToken as string;

let admin = '';
beforeAll(async () => { admin = await login('Admin', 'admin123@'); });

describe('1. Đăng nhập', () => {
  it('Admin/admin123@ đăng nhập được', () => expect(admin).toBeTruthy());
  it('sai mật khẩu -> 400 BAD_CREDENTIALS', async () => {
    const r = await api('POST', '/auth/login', { username: 'Admin', password: 'sai' });
    expect(r.status).toBe(400);
    expect(r.json.errorCode).toBe('BAD_CREDENTIALS');
  });
  it('tự đăng ký bị tắt -> 403', async () => {
    const r = await api('POST', '/auth/register', { email: 'x@y.vn', password: 'Abc12345', fullName: 'X' });
    expect(r.status).toBe(403);
  });
  it('không token -> 401', async () => expect((await api('GET', '/users/me')).status).toBe(401));
});

describe('2–3. Tài khoản do admin quản lý', () => {
  const u = `gv${Date.now() % 100000}`;
  let teacher = '';
  it('admin tạo giáo viên có username, giáo viên đăng nhập bằng username', async () => {
    const r = await api('POST', '/admin/users', { fullName: 'GV Test', email: `${u}@test.vn`, username: u, password: 'Abc12345', role: 'TEACHER' }, admin);
    expect(r.status).toBe(200);
    teacher = await login(u, 'Abc12345');
    expect(teacher).toBeTruthy();
  });
  it('giáo viên không tạo được tài khoản -> 403', async () => {
    expect((await api('POST', '/admin/users', { fullName: 'X', email: 'z@z.vn', password: 'Abc12345' }, teacher)).status).toBe(403);
  });
  it('đổi mật khẩu sai mật khẩu hiện tại -> 400', async () => {
    expect((await api('PUT', '/users/me/password', { currentPassword: 'sai', newPassword: 'Moi12345' }, teacher)).status).toBe(400);
  });
  it('admin không tự khóa chính mình', async () => {
    const me = (await api('GET', '/users/me', undefined, admin)).data;
    expect((await api('PUT', `/admin/users/${me.id}`, { status: 'BANNED' }, admin)).status).toBe(400);
  });
});

// 4–6 (Đ/S 3/4 ý = 50%, sổ điểm cột TX thang 10, export Excel): kiểm đầy đủ trong tests/exams.test.ts

describe('9. Cài đặt AI', () => {
  it('lưu khóa nhưng GET không trả khóa', async () => {
    const put = await api('PUT', '/users/me/ai-settings', { provider: 'GEMINI', model: 'gemini-2.5-flash', apiKey: 'AIzaTestKey1234567890', strictness: 'STANDARD', autoGradeOnSubmit: true, requireTeacherReview: true }, admin);
    expect(put.status).toBe(200);
    const get = await api('GET', '/users/me/ai-settings', undefined, admin);
    expect(get.data.hasKey).toBe(true);
    expect(get.data.keyLast4).toBe('7890');
    expect(JSON.stringify(get.json)).not.toContain('AIzaTestKey');
  });
});
