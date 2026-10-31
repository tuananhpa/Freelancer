import { Hono } from 'hono';
import type { AppEnv, UserRow } from '../types';
import { ApiError, bad, body, raw } from '../lib/http';
import { blacklist, signJwt, verifyJwt, loadUserByEmail, USER_SELECT, REFRESH_TTL_S } from '../lib/auth';
import { verifyPassword, hashPassword } from '../lib/password';
import { one, run } from '../db';
import { nowISO } from '../lib/time';

export const authUserDto = (u: UserRow) => ({ id: u.id, email: u.email, username: u.username, fullName: u.full_name, role: u.role, avatarUrl: u.avatar_url, studentCode: u.student_code ?? null, mustChangePassword: !!u.must_change_password });

/** StudentProfileService.sanitizeStudentCode: bỏ khoảng trắng/ký tự vô hình, viết hoa */
export const sanitizeStudentCode = (s: string) => s.replace(/[\s​-‍﻿]/g, '').toUpperCase();

const r = new Hono<AppEnv>();

r.post('/login', async (c) => {
  const b = await body(c);
  const password = typeof b.password === 'string' ? b.password : '';
  if (!password) throw bad('Mật khẩu không được để trống');
  let user: UserRow | null = null;
  // Thứ tự: email -> tên đăng nhập -> mã học sinh (frontend gửi cả username và studentCode khi không có "@")
  if (b.email && String(b.email).trim()) user = await loadUserByEmail(c.env, String(b.email).trim());
  else if (b.username || b.studentCode) {
    const name = String(b.username ?? b.studentCode).trim();
    user = await one<UserRow>(c.env, `${USER_SELECT} WHERE lower(u.username) = lower(?)`, name);
    if (!user && b.studentCode) {
      user = await one<UserRow>(c.env, `${USER_SELECT} JOIN student_profiles p ON p.user_id = u.id WHERE upper(p.student_code) = ?`, sanitizeStudentCode(String(b.studentCode)));
    }
  } else throw bad('Vui lòng nhập tên đăng nhập, email hoặc mã học sinh.');
  // Cùng một thông báo cho "không có tài khoản" và "sai mật khẩu" để không lộ tài khoản tồn tại
  if (!user || !user.password || !(await verifyPassword(password, user.password))) throw new ApiError(400, 'BAD_CREDENTIALS', 'Sai tên đăng nhập hoặc mật khẩu.');
  if (user.status === 'INACTIVE') throw bad('Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản trị viên.', 'ACCOUNT_INACTIVE');
  if (user.status === 'BANNED') throw new ApiError(403, 'ACCOUNT_LOCKED', 'Tài khoản của bạn đã bị khóa.');
  // Hash BCrypt cũ: băm lại sang PBKDF2 sau khi đăng nhập đúng
  if (user.password.startsWith('$2')) await run(c.env, 'UPDATE users SET password = ? WHERE id = ?', await hashPassword(password), user.id);
  await run(c.env, 'UPDATE users SET last_active_at = ? WHERE id = ?', nowISO(), user.id);
  return raw(c, { accessToken: await signJwt(c.env, user.email), refreshToken: await signJwt(c.env, user.email, REFRESH_TTL_S, { typ: 'refresh' }), user: authUserDto(user) });
});

r.post('/refresh', async (c) => {
  const b = await body(c);
  const claims = b.refreshToken ? await verifyJwt(c.env, String(b.refreshToken)) : null;
  if (!claims || claims.typ !== 'refresh') throw new ApiError(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn.');
  const user = await loadUserByEmail(c.env, claims.sub);
  if (!user || user.status !== 'ACTIVE') throw new ApiError(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn.');
  return raw(c, { accessToken: await signJwt(c.env, user.email), refreshToken: String(b.refreshToken), user: authUserDto(user) });
});

r.post('/logout', async (c) => {
  const h = c.req.header('Authorization') || '';
  if (h.startsWith('Bearer ')) await blacklist(c.env, h.slice(7));
  return raw(c, { message: 'Đăng xuất thành công' });
});

// Khách yêu cầu: chỉ quản trị viên tạo tài khoản; bỏ đăng nhập Google
const disabled = () => { throw new ApiError(403, 'REGISTRATION_DISABLED', 'Chỉ quản trị viên được tạo tài khoản.'); };
r.post('/register', disabled);
r.post('/google', () => { throw new ApiError(403, 'GOOGLE_LOGIN_DISABLED', 'Đăng nhập Google đã tắt. Vui lòng dùng tài khoản do nhà trường cấp.'); });
r.post('/verify', disabled);
r.post('/resend-verification', disabled);

// Quên mật khẩu: chưa có tên miền gửi email -> hướng dẫn liên hệ admin (không lộ email có tồn tại hay không)
r.post('/forgot-password', async (c) => raw(c, { message: 'Vui lòng liên hệ quản trị viên nhà trường để được đặt lại mật khẩu.' }));
r.post('/reset-password', async (c) => {
  const b = await body(c);
  const token = String(b.token || '');
  const pw = String(b.newPassword || '');
  if (pw.length < 6) throw bad('Mật khẩu mới phải có ít nhất 6 ký tự');
  const t = await one<{ user_id: string; expiry_date: string }>(c.env, 'SELECT user_id, expiry_date FROM password_reset_tokens WHERE token = ?', token);
  if (!t || Date.parse(t.expiry_date) < Date.now()) throw bad('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
  await run(c.env, 'UPDATE users SET password = ?, must_change_password = 0, updated_at = ? WHERE id = ?', await hashPassword(pw), nowISO(), t.user_id);
  await run(c.env, 'DELETE FROM password_reset_tokens WHERE token = ?', token);
  return raw(c, { message: 'Đặt lại mật khẩu thành công' });
});

export default r;
