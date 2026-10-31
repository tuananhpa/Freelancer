import { Hono } from 'hono';
import * as XLSX from 'xlsx';
import type { AppEnv, Bindings, UserRow } from '../types';
import { bad, body, forbidden, notFound, ok, pageParams, springPage, str, uuid } from '../lib/http';
import { auth } from '../lib/auth';
import { all, batch, count, inList, one, run, SQL_UUID } from '../db';
import { javaTime, nowISO } from '../lib/time';
import { sanitizeStudentCode } from './auth';
import { canManage, getClass } from './classrooms';

type Env = Bindings;
const pad = (s: string) => (s.length === 1 ? `0${s}` : s);
const iso = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? `${y}-${pad(String(m))}-${pad(String(d))}` : null;
};
/** StudentProfileService.parseFlexibleDob: dd/MM/yyyy, d/M/yy, yyyy-MM-dd, dd.MM.yyyy → yyyy-MM-dd */
export function parseDob(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') { const p = XLSX.SSF.parse_date_code(v); return p ? iso(p.y, p.m, p.d) : null; } // số serial Excel
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (!m) return null;
  const y = m[3].length === 2 ? (+m[3] < 50 ? 2000 : 1900) + +m[3] : +m[3];
  return iso(y, +m[2], +m[1]);
}
console.assert(parseDob('14/07/2009') === '2009-07-14' && parseDob('4-7-09') === '2009-07-04' && parseDob('2009-07-14') === '2009-07-14' && parseDob('31/02/2009') === null && parseDob(39999) === '2009-07-05', 'parseDob');
/** normalizeVietnamese: NFC, bỏ ký tự điều khiển/vô hình, gộp khoảng trắng */
const normName = (s: unknown) => String(s ?? '').replace(/[\p{Cc}\p{Cf}]/gu, '').normalize('NFC').replace(/[\s ]+/g, ' ').trim().toLowerCase();
const cleanPhone = (p: unknown) => {
  const d = String(p ?? '').replace(/\D/g, '');
  return d ? (d.startsWith('0') ? d : `0${d}`) : null;
};

async function dto(env: Env, p: any) {
  const enr = await all<any>(env, 'SELECT c.id, c.name FROM student_class_enrollments e JOIN classrooms c ON c.id = e.classroom_id WHERE e.student_profile_id = ? ORDER BY e.created_at', p.id);
  const us = p.user_id ? (await one<{ status: string }>(env, 'SELECT status FROM users WHERE id = ?', p.user_id))?.status ?? null : null;
  return { id: p.id, studentCode: p.student_code, fullName: p.full_name, dateOfBirth: p.date_of_birth, phone: p.phone, facility: p.facility, status: p.status, userId: p.user_id, userStatus: us, enrollments: enr.map((e) => ({ classroomId: e.id, classroomName: e.name })), createdAt: javaTime(p.created_at) };
}
async function getProfile(env: Env, id: string) {
  const p = await one<any>(env, 'SELECT * FROM student_profiles WHERE id = ?', id);
  if (!p) throw notFound('Không tìm thấy hồ sơ học sinh.');
  return p;
}
/** ensureClassMember: tài khoản đã liên kết thì vào lớp luôn */
const memberStmt = (classId: string, userId: string): [string, ...unknown[]] => ["INSERT OR IGNORE INTO class_members (id, classroom_id, user_id, role, joined_at) VALUES (?,?,?, 'STUDENT', ?)", uuid(), classId, userId, nowISO()];
async function enroll(env: Env, p: any, classId: string) {
  const stmts: [string, ...unknown[]][] = [['INSERT OR IGNORE INTO student_class_enrollments (id, student_profile_id, classroom_id, created_at) VALUES (?,?,?,?)', uuid(), p.id, classId, nowISO()]];
  if (p.user_id) stmts.push(memberStmt(classId, p.user_id));
  await batch(env, stmts);
}
async function unenroll(env: Env, p: any, classId: string) {
  await batch(env, [['DELETE FROM student_class_enrollments WHERE student_profile_id = ? AND classroom_id = ?', p.id, classId], ["DELETE FROM class_members WHERE classroom_id = ? AND user_id = ? AND role = 'STUDENT'", classId, p.user_id ?? '']]);
}
/** Nối hồ sơ với tài khoản: ACTIVE + đưa vào mọi lớp đã ghi danh (synchronizeClassMembers) */
async function linkProfile(env: Env, p: any, userId: string) {
  await batch(env, [
    ["UPDATE student_profiles SET user_id = ?, status = 'ACTIVE', updated_at = ? WHERE id = ?", userId, nowISO(), p.id],
    [`INSERT OR IGNORE INTO class_members (id, classroom_id, user_id, role, joined_at) SELECT ${SQL_UUID}, classroom_id, ?, 'STUDENT', ? FROM student_class_enrollments WHERE student_profile_id = ?`, userId, nowISO(), p.id],
    ['UPDATE users SET pending_student_code = NULL WHERE id = ?', userId],
  ]);
}

/** Excel: Cơ sở | "MÃ - Họ tên" | Ngày sinh | SĐT (theo chỉ số cột, bỏ dòng tiêu đề) */
async function importExcel(env: Env, file: File, classId: string | null) {
  if (!(file instanceof File)) throw bad('Vui lòng chọn tệp Excel.');
  if (file.size > 10 * 1024 * 1024) throw bad('Tệp Excel tối đa 10 MB.');
  let rows: unknown[][];
  try {
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
    rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: null });
  } catch (e) { throw bad(`Lỗi khi đọc file Excel: ${(e as Error).message}`); }
  // shortcut: tối đa 2000 dòng/lần để vừa giới hạn truy vấn của Worker; nhiều hơn thì chia tệp
  if (rows.length > 2001) throw bad('Mỗi lần nhập tối đa 2000 học sinh.');
  const out: any[] = [];
  for (const row of rows.slice(1)) {
    const nameCell = row[1] == null ? '' : String(row[1]).trim();
    const dash = nameCell.indexOf('-');
    if (dash < 0) continue;
    const code = sanitizeStudentCode(nameCell.slice(0, dash));
    const fullName = nameCell.slice(dash + 1).trim();
    if (!code || !fullName) continue;
    const facility = row[0] == null || row[0] === '' ? null : String(row[0]).trim();
    const phone = cleanPhone(row[3]);
    const dob = parseDob(row[2]);
    let p = await one<any>(env, 'SELECT * FROM student_profiles WHERE upper(student_code) = ?', code);
    if (!p) {
      const id = uuid();
      await run(env, "INSERT INTO student_profiles (id, student_code, full_name, date_of_birth, phone, facility, status, created_at, updated_at) VALUES (?,?,?,?,?,?, 'PENDING', ?, ?)", id, code, fullName, dob, phone, facility, nowISO(), nowISO());
      p = await getProfile(env, id);
    } else if (classId) {
      // importFromExcel cập nhật thông tin liên hệ của hồ sơ có sẵn; importGlobal giữ nguyên
      await run(env, 'UPDATE student_profiles SET phone = COALESCE(?, phone), facility = COALESCE(?, facility), date_of_birth = COALESCE(?, date_of_birth), updated_at = ? WHERE id = ?', phone, facility, dob, nowISO(), p.id);
      p = await getProfile(env, p.id);
    }
    if (classId) await enroll(env, p, classId);
    out.push(await dto(env, p));
  }
  return out;
}

const st = new Hono<AppEnv>();
const office = auth('ADMIN', 'OFFICE');
const staff = auth('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'OFFICE');

st.post('/import', staff, async (c) => {
  const form = await c.req.formData();
  const cls = await getClass(c.env, String(form.get('classroomId') || ''));
  const me = c.get('user');
  if (!['ADMIN', 'OFFICE'].includes(me.role) && !(await canManage(c.env, cls, me))) throw forbidden('Bạn không có quyền quản lý lớp này.');
  return ok(c, await importExcel(c.env, form.get('file') as File, cls.id));
});
st.post('/import-global', office, async (c) => ok(c, await importExcel(c.env, (await c.req.formData()).get('file') as File, null)));
st.post('/import-admin', office, async (c) => {
  const form = await c.req.formData();
  const cid = form.get('classroomId') || c.req.query('classroomId');
  return ok(c, await importExcel(c.env, form.get('file') as File, cid ? (await getClass(c.env, String(cid))).id : null));
});
st.get('/by-classroom/:cid', office, async (c) => {
  const rows = await all(c.env, 'SELECT p.* FROM student_class_enrollments e JOIN student_profiles p ON p.id = e.student_profile_id WHERE e.classroom_id = ? ORDER BY p.full_name', c.req.param('cid'));
  return ok(c, await Promise.all(rows.map((p) => dto(c.env, p))));
});
st.get('/', staff, async (c) => {
  const { page, size, offset } = pageParams(c, 20, 200);
  const q = (k: string) => c.req.query(k)?.trim();
  const where: string[] = [];
  const p: unknown[] = [];
  const kw = q('keyword')?.toLowerCase();
  if (kw) { where.push('(lower(p.student_code) LIKE ? OR lower(p.full_name) LIKE ? OR lower(p.phone) LIKE ?)'); p.push(`%${kw}%`, `%${kw}%`, `%${kw}%`); }
  if (q('facility')) { where.push('lower(p.facility) LIKE ?'); p.push(`%${q('facility')!.toLowerCase()}%`); }
  if (q('status')) { where.push('p.status = ?'); p.push(q('status')); }
  if (q('fromDate')) { where.push('p.date_of_birth >= ?'); p.push(q('fromDate')); }
  if (q('toDate')) { where.push('p.date_of_birth <= ?'); p.push(q('toDate')); }
  if (q('className') || q('teacherName')) {
    const sub = ['1=1'];
    if (q('className')) { sub.push('lower(c.name) LIKE ?'); p.push(`%${q('className')!.toLowerCase()}%`); }
    if (q('teacherName')) { sub.push('lower(t.full_name) LIKE ?'); p.push(`%${q('teacherName')!.toLowerCase()}%`); }
    where.push(`p.id IN (SELECT e.student_profile_id FROM student_class_enrollments e JOIN classrooms c ON c.id = e.classroom_id LEFT JOIN users t ON t.id = c.teacher_id WHERE ${sub.join(' AND ')})`);
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sort = c.req.query('sort')?.startsWith('fullName') ? 'p.full_name' : c.req.query('sort')?.startsWith('studentCode') ? 'p.student_code' : 'p.created_at';
  const dir = /,asc$/i.test(c.req.query('sort') || '') ? 'ASC' : 'DESC';
  const rows = await all(c.env, `SELECT p.* FROM student_profiles p ${w} ORDER BY ${sort} ${dir} LIMIT ? OFFSET ?`, ...p, size, offset);
  return ok(c, springPage(await Promise.all(rows.map((r) => dto(c.env, r))), await count(c.env, `SELECT COUNT(*) AS n FROM student_profiles p ${w}`, ...p), page, size));
});
st.get('/user/:uid', staff, async (c) => {
  const p = await one(c.env, 'SELECT * FROM student_profiles WHERE user_id = ?', c.req.param('uid'));
  if (!p) throw notFound('Không tìm thấy hồ sơ học sinh cho user này.');
  return ok(c, await dto(c.env, p));
});
st.get('/verify-code', async (c) => {
  const code = sanitizeStudentCode(c.req.query('code') || '');
  if (!code) throw bad('Vui lòng nhập mã số học sinh');
  const p = await one<any>(c.env, 'SELECT * FROM student_profiles WHERE upper(student_code) = ?', code);
  if (!p) throw notFound('Mã số học sinh không tồn tại');
  if (!c.req.query('fullName') || normName(p.full_name) !== normName(c.req.query('fullName'))) throw bad('Họ và tên không khớp với mã số học sinh này');
  const d = await dto(c.env, p);
  return ok(c, { ...d, phone: d.phone && d.phone.length > 4 ? `****${d.phone.slice(-4)}` : d.phone });
});
// Trường chỉ cho admin tạo tài khoản → tắt tự đăng ký bằng mã học sinh (giống /api/auth/register)
st.post('/register', (c) => c.json({ status: 403, errorCode: 'REGISTRATION_DISABLED', message: 'Tài khoản do quản trị viên cấp. Vui lòng liên hệ nhà trường.', timestamp: nowISO() }, 403));
st.post('/link-account', auth('STUDENT'), async (c) => {
  const me = c.get('user');
  const b = await body(c);
  if (await one(c.env, 'SELECT 1 AS x FROM student_profiles WHERE user_id = ?', me.id)) throw bad('Tài khoản này đã được liên kết với một hồ sơ học sinh.');
  const p = await one<any>(c.env, 'SELECT * FROM student_profiles WHERE upper(student_code) = ?', sanitizeStudentCode(str(b.studentCode, 'Mã số học sinh', 20)!));
  if (!p) throw bad('Mã số học sinh không tồn tại trong hệ thống.');
  if (p.user_id) throw bad('Mã học sinh này đã được liên kết với một tài khoản khác.');
  if (p.date_of_birth) {
    const given = parseDob(b.dateOfBirth);
    if (!given) throw bad('Định dạng ngày sinh không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY (ví dụ: 14/07/2009).');
    if (given !== p.date_of_birth) throw bad('Ngày sinh không khớp. Vui lòng kiểm tra lại.');
  }
  await linkProfile(c.env, p, me.id);
  return ok(c, 'Liên kết tài khoản thành công!');
});
st.post('/', office, async (c) => {
  const b = await body(c);
  const code = sanitizeStudentCode(str(b.studentCode, 'Mã học sinh', 20)!);
  const name = str(b.fullName, 'Họ và tên', 255);
  const dob = b.dateOfBirth ? parseDob(b.dateOfBirth) : null;
  if (b.dateOfBirth && !dob) throw bad('Ngày sinh không hợp lệ.');
  let p = await one<any>(c.env, 'SELECT * FROM student_profiles WHERE upper(student_code) = ?', code);
  if (p) await run(c.env, 'UPDATE student_profiles SET full_name = ?, date_of_birth = COALESCE(?, date_of_birth), phone = COALESCE(?, phone), facility = COALESCE(?, facility), updated_at = ? WHERE id = ?', name, dob, b.phone ?? null, b.facility ?? null, nowISO(), p.id);
  else { const id = uuid(); await run(c.env, "INSERT INTO student_profiles (id, student_code, full_name, date_of_birth, phone, facility, status, created_at, updated_at) VALUES (?,?,?,?,?,?, 'PENDING', ?, ?)", id, code, name, dob, b.phone ?? null, b.facility ?? null, nowISO(), nowISO()); p = { id }; }
  p = await getProfile(c.env, p.id);
  if (b.classroomId) await enroll(c.env, p, (await getClass(c.env, String(b.classroomId))).id);
  return ok(c, await dto(c.env, p));
});
st.delete('/bulk', office, async (c) => {
  const ids = await body(c);
  if (!Array.isArray(ids) || !ids.length) return ok(c, null);
  for (const id of ids.slice(0, 500)) await deleteProfile(c.env, String(id));
  return ok(c, null);
});
st.put('/:id', office, async (c) => {
  const p = await getProfile(c.env, c.req.param('id'));
  const b = await body(c);
  const set: Record<string, unknown> = {};
  if (b.studentCode != null) {
    const code = sanitizeStudentCode(String(b.studentCode));
    if (!code) throw bad('Mã số học sinh không được để trống');
    if (code !== p.student_code.toUpperCase() && (await one(c.env, 'SELECT 1 AS x FROM student_profiles WHERE upper(student_code) = ? AND id <> ?', code, p.id))) throw bad(`Mã số học sinh đã tồn tại: ${code}`);
    set.student_code = code;
  }
  if (b.fullName != null) set.full_name = str(b.fullName, 'Họ và tên', 255);
  if (b.dateOfBirth != null) { set.date_of_birth = parseDob(b.dateOfBirth); if (!set.date_of_birth) throw bad('Ngày sinh không hợp lệ.'); }
  if (b.phone != null) set.phone = b.phone;
  if (b.facility != null) set.facility = b.facility;
  const stmts: [string, ...unknown[]][] = [];
  if (Object.keys(set).length) stmts.push([`UPDATE student_profiles SET ${Object.keys(set).map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`, ...Object.values(set), nowISO(), p.id]);
  // giữ tên/SĐT tài khoản khớp hồ sơ (UserService làm chiều ngược lại)
  if (p.user_id && set.full_name) stmts.push(['UPDATE users SET full_name = ? WHERE id = ?', set.full_name, p.user_id]);
  if (p.user_id && set.phone) stmts.push(['UPDATE users SET phone = ? WHERE id = ?', set.phone, p.user_id]);
  if (stmts.length) await batch(c.env, stmts);
  return ok(c, await dto(c.env, await getProfile(c.env, p.id)));
});
/** Java chỉ xóa ghi danh; ở đây xóa luôn hồ sơ chưa gắn tài khoản. Hồ sơ đã gắn tài khoản giữ lại (xóa tài khoản ở Quản lý người dùng). */
async function deleteProfile(env: Env, id: string) {
  const p = await one<any>(env, 'SELECT * FROM student_profiles WHERE id = ?', id);
  if (!p) return;
  const stmts: [string, ...unknown[]][] = [['DELETE FROM student_class_enrollments WHERE student_profile_id = ?', p.id]];
  if (!p.user_id) stmts.push(['DELETE FROM student_profiles WHERE id = ?', p.id]);
  await batch(env, stmts);
}
st.delete('/:id', office, async (c) => { await getProfile(c.env, c.req.param('id')); await deleteProfile(c.env, c.req.param('id')); return ok(c, null); });
st.post('/:id/classrooms/:cid', office, async (c) => {
  const p = await getProfile(c.env, c.req.param('id'));
  await enroll(c.env, p, (await getClass(c.env, c.req.param('cid'))).id);
  return ok(c, null);
});
st.delete('/:id/classrooms/:cid', office, async (c) => {
  const p = await getProfile(c.env, c.req.param('id'));
  if (!(await one(c.env, 'SELECT 1 AS x FROM student_class_enrollments WHERE student_profile_id = ? AND classroom_id = ?', p.id, c.req.param('cid')))) throw notFound('Học sinh không có trong lớp này.');
  await unenroll(c.env, p, c.req.param('cid'));
  return ok(c, null);
});
st.put('/:id/classrooms', office, async (c) => {
  const p = await getProfile(c.env, c.req.param('id'));
  const target = [...new Set(((await body(c)).classroomIds ?? []).map(String))] as string[];
  if (target.length && (await count(c.env, `SELECT COUNT(*) AS n FROM classrooms WHERE id IN ${inList(target.length)}`, ...target)) !== target.length) throw notFound('Không tìm thấy lớp học.');
  const cur = (await all<{ classroom_id: string }>(c.env, 'SELECT classroom_id FROM student_class_enrollments WHERE student_profile_id = ?', p.id)).map((r) => r.classroom_id);
  for (const cid of cur.filter((x) => !target.includes(x))) await unenroll(c.env, p, cid);
  for (const cid of target.filter((x) => !cur.includes(x))) await enroll(c.env, p, cid);
  return ok(c, await dto(c.env, p));
});

export default st;
