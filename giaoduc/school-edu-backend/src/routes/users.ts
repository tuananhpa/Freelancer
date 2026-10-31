import { Hono } from 'hono';
import type { AppEnv, Role, UserRow } from '../types';
import { ROLES } from '../types';
import { ApiError, bad, body, notFound, orderBy, pageParams, raw, springPage, str, EMAIL_RE, USERNAME_RE, uuid } from '../lib/http';
import { auth, USER_SELECT } from '../lib/auth';
import { hashPassword, verifyPassword } from '../lib/password';
import { all, batch, count, inList, one, run, SQL_UUID } from '../db';
import { javaTime, nowISO } from '../lib/time';
import { notify } from '../lib/notify';
import { sanitizeStudentCode } from './auth';
import { audit } from './misc';

/** JSON entity User của Java — KHÔNG trả password (bản Java cũ lộ hash) */
export const userJson = (u: UserRow) => ({
  id: u.id, email: u.email, username: u.username, fullName: u.full_name, phone: u.phone, avatarUrl: u.avatar_url, role: u.role, status: u.status,
  authProvider: u.auth_provider, createdAt: javaTime(u.created_at), updatedAt: javaTime(u.updated_at), lastActiveAt: javaTime(u.last_active_at),
  studentCode: u.student_code ?? null, pendingStudentCode: u.pending_student_code, mustChangePassword: !!u.must_change_password,
});
const profileJson = (u: UserRow) => ({ id: u.id, email: u.email, username: u.username, fullName: u.full_name, phone: u.phone, avatarUrl: u.avatar_url, role: u.role, authProvider: u.auth_provider, createdAt: javaTime(u.created_at), studentCode: u.student_code ?? null, mustChangePassword: !!u.must_change_password });

/** UserService.formatFullName: viết hoa chữ đầu mỗi từ */
export const formatFullName = (name: string) => name.trim().toLowerCase().split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
console.assert(formatFullName('  nguyễn  văn an ') === 'Nguyễn Văn An', 'formatFullName');

const getUser = async (c: { env: AppEnv['Bindings'] }, id: string) => {
  const u = await one<UserRow>(c.env, `${USER_SELECT} WHERE u.id = ?`, id);
  if (!u) throw notFound('Không tìm thấy người dùng.');
  return u;
};
const checkUsername = async (env: AppEnv['Bindings'], name: string, exceptId: string) => {
  if (!USERNAME_RE.test(name)) throw bad('Tên đăng nhập 3–32 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới, gạch ngang.', 'VALIDATION');
  if (await one(env, 'SELECT 1 AS x FROM users WHERE lower(username) = lower(?) AND id <> ?', name, exceptId)) throw new ApiError(409, 'USERNAME_EXISTS', 'Tên đăng nhập đã có người dùng.');
};

/* ---------- /api/users/me ---------- */
export const me = new Hono<AppEnv>();
me.use('*', auth());
me.get('/', (c) => raw(c, profileJson(c.get('user'))));
me.put('/', async (c) => {
  const u = c.get('user');
  const b = await body(c);
  const name = formatFullName(str(b.fullName, 'Họ tên', 255)!);
  if (u.role === 'STUDENT' && name.toLowerCase() !== u.full_name.trim().toLowerCase()) throw bad('Học sinh không được phép tự thay đổi họ tên hợp lệ. Vui lòng liên hệ trung tâm.');
  const avatar = b.avatarUrl && String(b.avatarUrl).trim() ? String(b.avatarUrl).slice(0, 2000) : null;
  await run(c.env, 'UPDATE users SET full_name = ?, phone = ?, avatar_url = ?, updated_at = ? WHERE id = ?', name, str(b.phone, 'Số điện thoại', 30, false), avatar, nowISO(), u.id);
  return raw(c, profileJson(await getUser(c, u.id)));
});
me.put('/password', async (c) => {
  const u = c.get('user');
  const b = await body(c);
  if (!b.currentPassword) throw bad('Mật khẩu hiện tại không được để trống');
  if (typeof b.newPassword !== 'string' || b.newPassword.length < 6) throw bad('Mật khẩu mới phải có ít nhất 6 ký tự');
  if (!u.password || !(await verifyPassword(String(b.currentPassword), u.password))) throw new ApiError(400, 'WRONG_PASSWORD', 'Mật khẩu hiện tại không chính xác.');
  await run(c.env, 'UPDATE users SET password = ?, must_change_password = 0, updated_at = ? WHERE id = ?', await hashPassword(b.newPassword), nowISO(), u.id);
  return raw(c, { message: 'Đổi mật khẩu thành công' });
});
// Mới: admin đổi tên đăng nhập của chính mình
me.put('/username', auth('ADMIN'), async (c) => {
  const u = c.get('user');
  const b = await body(c);
  const name = String(b.username ?? '').trim();
  if (!u.password || !(await verifyPassword(String(b.currentPassword ?? ''), u.password))) throw new ApiError(400, 'WRONG_PASSWORD', 'Mật khẩu hiện tại không chính xác.');
  await checkUsername(c.env, name, u.id);
  await run(c.env, 'UPDATE users SET username = ?, updated_at = ? WHERE id = ?', name, nowISO(), u.id);
  return raw(c, { username: name });
});
// Vai trò UNASSIGNED đã bỏ: mọi tài khoản do admin tạo đều có vai trò
me.put('/role', () => { throw bad('Bạn đã có vai trò trên hệ thống, không thể cập nhật lại.'); });

/* ---------- /api/admin/users ---------- */
export const adminUsers = new Hono<AppEnv>();
adminUsers.use('*', auth('ADMIN'));

adminUsers.get('/', async (c) => {
  const { page, size, offset } = pageParams(c, 10);
  const where: string[] = [];
  const params: unknown[] = [];
  const search = c.req.query('search')?.trim().toLowerCase();
  if (search) {
    const p = `%${search}%`;
    where.push('(lower(u.full_name) LIKE ? OR lower(u.email) LIKE ? OR lower(u.phone) LIKE ? OR lower(u.username) LIKE ? OR u.id IN (SELECT user_id FROM student_profiles WHERE lower(student_code) LIKE ?))');
    params.push(p, p, p, p, p);
  }
  const role = c.req.query('role');
  if (role) { where.push('u.role = ?'); params.push(role); }
  const status = c.req.query('status');
  if (status) { where.push('u.status = ?'); params.push(status); }
  const w = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const order = orderBy(c, { fullName: 'u.full_name', email: 'u.email', role: 'u.role', status: 'u.status', createdAt: 'u.created_at', lastActiveAt: 'u.last_active_at', studentCode: 'student_code' }, 'u.created_at DESC');
  const rows = await all<UserRow>(c.env, `${USER_SELECT}${w} ORDER BY ${order} LIMIT ? OFFSET ?`, ...params, size, offset);
  return raw(c, springPage(rows.map(userJson), await count(c.env, `SELECT COUNT(*) AS n FROM users u${w}`, ...params), page, size));
});

adminUsers.get('/:id', async (c) => raw(c, userJson(await getUser(c, c.req.param('id')))));

adminUsers.post('/', async (c) => {
  const b = await body(c);
  const email = str(b.email, 'Email')!.toLowerCase();
  if (!EMAIL_RE.test(email)) throw bad('Email không hợp lệ.', 'VALIDATION');
  if (await one(c.env, 'SELECT 1 AS x FROM users WHERE lower(email) = ?', email)) throw new ApiError(409, 'EMAIL_EXISTS', 'Email đã được sử dụng.');
  if (typeof b.password !== 'string' || b.password.length < 6) throw bad('Mật khẩu phải có ít nhất 6 ký tự.', 'VALIDATION');
  const role = (b.role || 'STUDENT') as Role;
  if (!ROLES.includes(role)) throw bad('Vai trò không hợp lệ.', 'VALIDATION');
  const username = b.username ? String(b.username).trim() : null;
  if (username) await checkUsername(c.env, username, '');
  const id = uuid();
  const now = nowISO();
  await run(c.env, 'INSERT INTO users (id, email, password, full_name, phone, avatar_url, role, status, auth_provider, created_at, updated_at, username, must_change_password) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)',
    id, email, await hashPassword(b.password), formatFullName(str(b.fullName, 'Họ tên')!), str(b.phone, 'Số điện thoại', 30, false), b.avatarUrl || null, role,
    b.status === 'INACTIVE' || b.status === 'BANNED' ? b.status : 'ACTIVE', 'LOCAL', now, now, username);
  const created = await getUser(c, id);
  await audit(c.env, c.get('user'), 'CREATE', 'User', id, null, userJson(created), c.req.header('CF-Connecting-IP') ?? null);
  return raw(c, userJson(created));
});

adminUsers.put('/bulk-status', async (c) => {
  const b = await body(c);
  const ids: string[] = (Array.isArray(b.userIds) ? b.userIds : []).filter((x: unknown) => typeof x === 'string' && x !== c.get('user').id);
  const status = String(b.status);
  if (!['ACTIVE', 'INACTIVE', 'BANNED'].includes(status)) throw bad('Trạng thái không hợp lệ.');
  if (ids.length) await run(c.env, `UPDATE users SET status = ?, updated_at = ? WHERE id IN ${inList(ids.length)}`, status, nowISO(), ...ids);
  return c.body(null, 200);
});

adminUsers.put('/:id', async (c) => {
  const id = c.req.param('id');
  const me = c.get('user');
  const u = await getUser(c, id);
  const b = await body(c);
  if (id === me.id && ((b.role && b.role !== 'ADMIN') || (b.status && b.status !== 'ACTIVE'))) throw bad('Không thể tự hạ quyền hoặc khóa tài khoản quản trị đang dùng.', 'SELF_LOCK');
  const sets: string[] = [];
  const params: unknown[] = [];
  const set = (col: string, v: unknown) => { sets.push(`${col} = ?`); params.push(v); };
  const stmts: [string, ...unknown[]][] = [];
  if (b.email && String(b.email).trim().toLowerCase() !== u.email.toLowerCase()) {
    const email = String(b.email).trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw bad('Email không hợp lệ.', 'VALIDATION');
    if (await one(c.env, 'SELECT 1 AS x FROM users WHERE lower(email) = ? AND id <> ?', email, id)) throw bad('Email này đã được sử dụng bởi một tài khoản khác.', 'EMAIL_EXISTS');
    set('email', email);
  }
  if (b.fullName != null) {
    const name = formatFullName(String(b.fullName));
    set('full_name', name);
    if (u.role === 'STUDENT') stmts.push(['UPDATE student_profiles SET full_name = ? WHERE user_id = ?', name, id]);
  }
  if (b.phone != null) {
    set('phone', String(b.phone));
    if (u.role === 'STUDENT') stmts.push(['UPDATE student_profiles SET phone = ? WHERE user_id = ?', String(b.phone), id]);
  }
  if (b.avatarUrl != null) set('avatar_url', String(b.avatarUrl));
  if (b.username != null && b.username !== '') { await checkUsername(c.env, String(b.username).trim(), id); set('username', String(b.username).trim()); }
  if (b.role) { if (!ROLES.includes(b.role)) throw bad('Vai trò không hợp lệ.', 'VALIDATION'); set('role', b.role); }
  if (b.status) { if (!['ACTIVE', 'INACTIVE', 'BANNED'].includes(b.status)) throw bad('Trạng thái không hợp lệ.'); set('status', b.status); }
  if (b.password) {
    if (String(b.password).length < 6) throw bad('Mật khẩu phải có ít nhất 6 ký tự.', 'VALIDATION');
    set('password', await hashPassword(String(b.password)));
  }
  set('updated_at', nowISO());
  await batch(c.env, [[`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, ...params, id], ...stmts]);
  await audit(c.env, me, 'UPDATE', 'User', id, userJson(u), userJson(await getUser(c, id)), c.req.header('CF-Connecting-IP') ?? null);
  if (b.role && b.role !== u.role) await notify(c.env, id, 'Cập nhật vai trò tài khoản', `Vai trò tài khoản của bạn đã được cập nhật thành: ${b.role}`, '/dashboard', 'SYSTEM', null, 'USER_ROLE', id);
  return raw(c, userJson(await getUser(c, id)));
});

adminUsers.delete('/:id', async (c) => {
  const id = c.req.param('id');
  if (id === c.get('user').id) throw bad('Không thể tự xóa tài khoản đang dùng.', 'SELF_DELETE');
  const old = await getUser(c, id);
  await batch(c.env, [["UPDATE student_profiles SET user_id = NULL, status = 'PENDING' WHERE user_id = ?", id], ['DELETE FROM users WHERE id = ?', id]]);
  await audit(c.env, c.get('user'), 'DELETE', 'User', id, userJson(old), null, c.req.header('CF-Connecting-IP') ?? null);
  return c.body(null, 200);
});

/** Lớp của người dùng: thành viên lớp + lớp ghi danh (học sinh) + lớp chủ nhiệm (giáo viên) */
export async function userClassroomIds(env: AppEnv['Bindings'], u: UserRow) {
  const ids = new Set((await all<{ id: string }>(env, 'SELECT classroom_id AS id FROM class_members WHERE user_id = ?', u.id)).map((r) => r.id));
  if (u.role === 'STUDENT') (await all<{ id: string }>(env, 'SELECT e.classroom_id AS id FROM student_class_enrollments e JOIN student_profiles p ON p.id = e.student_profile_id WHERE p.user_id = ?', u.id)).forEach((r) => ids.add(r.id));
  if (u.role === 'TEACHER' || u.role === 'TEACHING_ASSISTANT') (await all<{ id: string }>(env, 'SELECT id FROM classrooms WHERE teacher_id = ?', u.id)).forEach((r) => ids.add(r.id));
  return [...ids];
}
adminUsers.get('/:id/classrooms', async (c) => raw(c, await userClassroomIds(c.env, await getUser(c, c.req.param('id')))));

adminUsers.put('/:id/classrooms', async (c) => {
  const u = await getUser(c, c.req.param('id'));
  const b = await body<unknown>(c);
  const want: string[] = (Array.isArray(b) ? b : []).filter((x): x is string => typeof x === 'string');
  for (const cid of want) if (!(await one(c.env, 'SELECT 1 AS x FROM classrooms WHERE id = ?', cid))) throw notFound('Không tìm thấy lớp học.');
  const memberRole = u.role === 'STUDENT' ? 'STUDENT' : u.role === 'TEACHING_ASSISTANT' ? 'TA' : 'TEACHER';
  const stmts: [string, ...unknown[]][] = [];
  const keep = inList(want.length);
  if (u.role === 'TEACHER' || u.role === 'TEACHING_ASSISTANT') stmts.push([`UPDATE classrooms SET teacher_id = NULL WHERE teacher_id = ? AND id NOT IN ${keep}`, u.id, ...want]);
  stmts.push([`DELETE FROM class_members WHERE user_id = ? AND classroom_id NOT IN ${keep}`, u.id, ...want]);
  for (const cid of want) {
    if (u.role === 'TEACHER') stmts.push(['UPDATE classrooms SET teacher_id = ? WHERE id = ? AND teacher_id IS NULL', u.id, cid]);
    stmts.push(['INSERT INTO class_members (id, classroom_id, user_id, role, joined_at) SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM class_members WHERE classroom_id = ? AND user_id = ?)', uuid(), cid, u.id, memberRole, nowISO(), cid, u.id]);
  }
  if (u.role === 'STUDENT') {
    const prof = await one<{ id: string }>(c.env, 'SELECT id FROM student_profiles WHERE user_id = ?', u.id);
    if (prof) {
      stmts.push([`DELETE FROM student_class_enrollments WHERE student_profile_id = ? AND classroom_id NOT IN ${keep}`, prof.id, ...want]);
      for (const cid of want) stmts.push(['INSERT INTO student_class_enrollments (id, student_profile_id, classroom_id, created_at) SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM student_class_enrollments WHERE student_profile_id = ? AND classroom_id = ?)', uuid(), prof.id, cid, nowISO(), prof.id, cid]);
    }
  }
  await batch(c.env, stmts);
  return c.body(null, 200);
});

adminUsers.patch('/:id/student-code', async (c) => {
  const u = await getUser(c, c.req.param('id'));
  const code = sanitizeStudentCode(str((await body(c)).studentCode, 'Mã học sinh', 50)!);
  if (u.role !== 'STUDENT') throw bad('Chỉ có thể thay đổi mã học sinh cho tài khoản có vai trò STUDENT.');
  const profile = await one<{ id: string; student_code: string }>(c.env, 'SELECT id, student_code FROM student_profiles WHERE user_id = ?', u.id);
  if (profile?.student_code === code) return raw(c, userJson(u));
  const existing = await one<{ id: string; user_id: string | null }>(c.env, 'SELECT id, user_id FROM student_profiles WHERE upper(student_code) = ?', code);
  const st = u.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING';
  if (existing) {
    if (existing.user_id && existing.user_id !== u.id) throw bad(`Mã học sinh ${code} đã được sử dụng bởi học sinh khác.`);
    const stmts: [string, ...unknown[]][] = [];
    if (profile && profile.id !== existing.id) stmts.push(['DELETE FROM student_profiles WHERE id = ?', profile.id]);
    stmts.push(['UPDATE student_profiles SET user_id = ?, status = ?, updated_at = ? WHERE id = ?', u.id, st, nowISO(), existing.id]);
    // Lớp đã ghi danh sẵn theo mã -> thành viên lớp
    stmts.push([`INSERT INTO class_members (id, classroom_id, user_id, role, joined_at) SELECT ${SQL_UUID}, e.classroom_id, ?, 'STUDENT', ? FROM student_class_enrollments e WHERE e.student_profile_id = ? AND NOT EXISTS (SELECT 1 FROM class_members m WHERE m.classroom_id = e.classroom_id AND m.user_id = ?)`, u.id, nowISO(), existing.id, u.id]);
    await batch(c.env, stmts);
  } else if (profile) await run(c.env, 'UPDATE student_profiles SET student_code = ?, updated_at = ? WHERE id = ?', code, nowISO(), profile.id);
  else await run(c.env, 'INSERT INTO student_profiles (id, student_code, full_name, phone, user_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)', uuid(), code, u.full_name, u.phone, u.id, st, nowISO(), nowISO());
  return raw(c, userJson(await getUser(c, u.id)));
});

