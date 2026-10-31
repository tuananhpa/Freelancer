import type { MiddlewareHandler } from 'hono';
import type { AppEnv, Bindings, Role, UserRow } from '../types';
import { ApiError, forbidden, unauthorized } from './http';
import { one, run } from '../db';
import { nowISO } from './time';

const enc = new TextEncoder();
const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

const hmacKey = (secret: string) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export const ACCESS_TTL_S = 24 * 3600; // app.jwt.expiration-ms = 24h
export const REFRESH_TTL_S = 7 * 24 * 3600;

/** JWT HS256, sub = email như JwtUtils.java */
export async function signJwt(env: Bindings, sub: string, ttl = ACCESS_TTL_S, extra: Record<string, unknown> = {}) {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET chưa cấu hình (>=32 ký tự)');
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = b64url(enc.encode(JSON.stringify({ ...extra, sub, iat: now, exp: now + ttl })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(env.JWT_SECRET), enc.encode(`${head}.${payload}`));
  return `${head}.${payload}.${b64url(sig)}`;
}

export async function verifyJwt(env: Bindings, token: string): Promise<{ sub: string; exp: number; typ?: string } | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const head = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
    if (head.alg !== 'HS256') return null;
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(env.JWT_SECRET), fromB64url(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`));
    if (!valid) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(parts[1])));
    if (typeof p.sub !== 'string' || typeof p.exp !== 'number' || p.exp * 1000 < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export const USER_SELECT = `SELECT u.*, (SELECT sp.student_code FROM student_profiles sp WHERE sp.user_id = u.id LIMIT 1) AS student_code FROM users u`;

export const loadUserByEmail = (env: Bindings, email: string) => one<UserRow>(env, `${USER_SELECT} WHERE lower(u.email) = lower(?)`, email);

const blacklistKey = (token: string) => `blacklist:${token}`;
export async function blacklist(env: Bindings, token: string) {
  if (env.SESSIONS) await env.SESSIONS.put(blacklistKey(token), '1', { expirationTtl: ACCESS_TTL_S });
}

/** Lấy user từ Bearer token; không throw nếu thiếu token (cho route công khai có tùy chọn đăng nhập) */
/** Access token hợp lệ, chưa đăng xuất, tài khoản không bị khóa → user (dùng cả cho WebSocket) */
export async function userFromToken(env: Bindings, token: string): Promise<UserRow | null> {
  const claims = await verifyJwt(env, token);
  if (!claims || claims.typ === 'refresh') return null;
  if (env.SESSIONS && (await env.SESSIONS.get(blacklistKey(token)))) return null;
  const user = await loadUserByEmail(env, claims.sub);
  return !user || user.status === 'BANNED' ? null : user;
}
export async function currentUser(c: Parameters<MiddlewareHandler<AppEnv>>[0]): Promise<UserRow | null> {
  const h = c.req.header('Authorization') || '';
  if (!h.startsWith('Bearer ')) return null;
  const token = h.slice(7);
  const user = await userFromToken(c.env, token);
  if (!user) return null;
  c.set('user', user);
  c.set('token', token);
  return user;
}

/** Bắt buộc đăng nhập; nếu truyền roles thì kiểm tra vai trò như hasAnyRole(...) */
export const auth = (...roles: Role[]): MiddlewareHandler<AppEnv> => async (c, next) => {
  const user = c.get('user') ?? (await currentUser(c));
  if (!user) throw unauthorized();
  if (roles.length && !roles.includes(user.role)) throw forbidden();
  // lastActiveAt: cập nhật tối đa mỗi 5 phút để không ghi DB mỗi request
  if (!user.last_active_at || Date.now() - Date.parse(user.last_active_at) > 300_000) {
    c.executionCtx.waitUntil(run(c.env, 'UPDATE users SET last_active_at = ? WHERE id = ?', nowISO(), user.id).catch(() => {}));
  }
  await next();
};

/** Đăng nhập tùy chọn: gắn user nếu có token hợp lệ */
export const optionalAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  await currentUser(c);
  await next();
};

export const isStaff = (u: UserRow) => u.role === 'ADMIN' || u.role === 'TEACHER' || u.role === 'TEACHING_ASSISTANT';
export const requireRole = (u: UserRow, ...roles: Role[]) => { if (!roles.includes(u.role)) throw forbidden(); };
export { ApiError };
