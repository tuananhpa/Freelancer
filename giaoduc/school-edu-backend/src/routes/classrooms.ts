import { Hono } from 'hono';
import type { AppEnv, Bindings, UserRow } from '../types';
import { bad, body, notFound, ok, pageParams, springPage, str, uuid } from '../lib/http';
import { auth, USER_SELECT } from '../lib/auth';
import { all, batch, count, inList, one, parseJson, run } from '../db';
import { javaTime, nowISO, todayVN, utcTime } from '../lib/time';
import { notify } from '../lib/notify';
import { recordActivity } from './gamification';

type Cls = { id: string; name: string; section: string | null; subject: string | null; invite_code: string; teacher_id: string | null; is_admin_group: number; status: string | null; leaderboard_enabled: number | null; meeting_link: string | null; thumbnail: string | null; created_at: string | null };
type Env = Bindings;

export async function getClass(env: Env, id: string) {
  const c = await one<Cls>(env, 'SELECT * FROM classrooms WHERE id = ?', id);
  if (!c) throw notFound('Không tìm thấy lớp học.');
  return c;
}
const memberRole = async (env: Env, classId: string, userId: string) => (await one<{ role: string }>(env, 'SELECT role FROM class_members WHERE classroom_id = ? AND user_id = ?', classId, userId))?.role ?? null;

/** ClassroomAuthorizationService.canManageClassroom (isTeacherOrTA cho ra cùng kết quả) */
export async function canManage(env: Env, cls: Cls, u: UserRow) {
  if (u.role === 'ADMIN' || u.role === 'OFFICE') return true;
  if (cls.teacher_id === u.id) return true;
  const role = await memberRole(env, cls.id, u.id);
  if (role === 'TEACHER' || role === 'TA') return true;
  return (u.role === 'TEACHER' || u.role === 'TEACHING_ASSISTANT') && role != null;
}
export async function checkAccess(env: Env, cls: Cls, u: UserRow) {
  if (await canManage(env, cls, u)) return;
  if (await memberRole(env, cls.id, u.id)) return;
  throw bad('Bạn không có quyền truy cập lớp học này.');
}
const requireManage = async (env: Env, cls: Cls, u: UserRow, msg = 'Chỉ giáo viên và trợ giảng quản lý lớp mới có quyền thực hiện.') => { if (!(await canManage(env, cls, u))) throw bad(msg); };

const genInviteCode = async (env: Env) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (;;) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => chars[b % chars.length]).join('');
    if (!(await one(env, 'SELECT 1 AS x FROM classrooms WHERE invite_code = ?', code))) return code;
  }
};

/** ClassroomService.mapToResponse */
export async function classDto(env: Env, cls: Cls, me: UserRow | null) {
  const members = await all<{ user_id: string; role: string; u_role: string; full_name: string; avatar_url: string | null }>(env,
    'SELECT m.user_id, m.role, u.role AS u_role, u.full_name, u.avatar_url FROM class_members m JOIN users u ON u.id = m.user_id WHERE m.classroom_id = ?', cls.id);
  let teacher = cls.teacher_id ? await one<{ id: string; role: string; full_name: string; avatar_url: string | null }>(env, 'SELECT id, role, full_name, avatar_url FROM users WHERE id = ?', cls.teacher_id) : null;
  if (!teacher || teacher.role === 'ADMIN' || teacher.role === 'OFFICE') {
    const t = members.find((m) => m.role === 'TEACHER' && m.u_role === 'TEACHER') ?? members.find((m) => m.role === 'TEACHER');
    if (t) teacher = { id: t.user_id, role: t.u_role, full_name: t.full_name, avatar_url: t.avatar_url };
  }
  let pendingCount: number | null = null, nearestDeadline: string | null = null, nearestTaskTitle: string | null = null, nearestTaskType: string | null = null;
  if (me) {
    const now = nowISO();
    let assign: { title: string; due: string } | null, exam: { title: string; due: string } | null;
    if (me.role === 'STUDENT') {
      const pa = await all<{ title: string; due: string }>(env, 'SELECT title, due_date AS due FROM assignments a WHERE classroom_id = ? AND due_date IS NOT NULL AND due_date > ? AND NOT EXISTS (SELECT 1 FROM assignment_submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) ORDER BY due_date', cls.id, now, me.id);
      const pe = await all<{ title: string; due: string }>(env, 'SELECT e.title, ce.close_time AS due FROM class_exams ce JOIN exams e ON e.id = ce.exam_id WHERE ce.classroom_id = ? AND ce.close_time IS NOT NULL AND ce.close_time > ? AND NOT EXISTS (SELECT 1 FROM student_exam_results r WHERE r.exam_id = ce.exam_id AND r.student_id = ? AND r.submitted_at IS NOT NULL) ORDER BY ce.close_time', cls.id, now, me.id);
      pendingCount = pa.length + pe.length; assign = pa[0] ?? null; exam = pe[0] ?? null;
    } else {
      assign = await one(env, 'SELECT title, due_date AS due FROM assignments WHERE classroom_id = ? AND due_date IS NOT NULL AND due_date > ? ORDER BY due_date LIMIT 1', cls.id, now);
      exam = await one(env, 'SELECT e.title, ce.close_time AS due FROM class_exams ce JOIN exams e ON e.id = ce.exam_id WHERE ce.classroom_id = ? AND ce.close_time IS NOT NULL AND ce.close_time > ? ORDER BY ce.close_time LIMIT 1', cls.id, now);
      pendingCount = (await count(env, 'SELECT COUNT(*) AS n FROM assignments WHERE classroom_id = ? AND (due_date IS NULL OR due_date > ?)', cls.id, now))
        + (await count(env, 'SELECT COUNT(*) AS n FROM class_exams WHERE classroom_id = ? AND (close_time IS NULL OR close_time > ?)', cls.id, now));
    }
    const pick = assign && exam ? (assign.due < exam.due ? 'A' : 'E') : assign ? 'A' : exam ? 'E' : null;
    if (pick === 'A') { nearestDeadline = assign!.due; nearestTaskTitle = assign!.title; nearestTaskType = 'ASSIGNMENT'; }
    if (pick === 'E') { nearestDeadline = exam!.due; nearestTaskTitle = exam!.title || 'Đề thi'; nearestTaskType = 'EXAM'; }
  }
  return {
    id: cls.id, name: cls.name, section: cls.section, subject: cls.subject, inviteCode: cls.invite_code,
    teacherId: teacher?.id ?? null, teacherName: teacher?.full_name ?? null, teacherAvatar: teacher?.avatar_url ?? null,
    memberCount: members.length, status: cls.status, leaderboardEnabled: cls.leaderboard_enabled == null ? null : !!cls.leaderboard_enabled,
    meetingLink: cls.meeting_link, thumbnail: cls.thumbnail, isAdminGroup: !!cls.is_admin_group, createdAt: javaTime(cls.created_at),
    pendingCount, nearestDeadline: javaTime(nearestDeadline), nearestTaskTitle, nearestTaskType,
  };
}

const memberDto = (m: any) => ({ id: m.id, userId: m.user_id, fullName: m.full_name, email: m.email, role: m.role, avatarUrl: m.avatar_url, joinedAt: javaTime(m.joined_at), lastActiveAt: javaTime(m.last_active_at), studentCode: m.student_code, phone: m.phone });
const MEMBER_SELECT = `SELECT m.id, m.user_id, m.role, m.joined_at, u.full_name, u.email, u.avatar_url, u.last_active_at, u.phone, (SELECT sp.student_code FROM student_profiles sp WHERE sp.user_id = u.id LIMIT 1) AS student_code FROM class_members m JOIN users u ON u.id = m.user_id`;
const folderDto = (f: any) => ({ id: f.id, name: f.name, classroomId: f.classroom_id, parentId: f.parent_id, createdAt: javaTime(f.created_at) });

const classes = new Hono<AppEnv>();
classes.use('*', auth());

classes.post('/', auth('ADMIN'), async (c) => {
  const b = await body(c);
  const me = c.get('user');
  let teacher = me;
  if (b.teacherId && String(b.teacherId).trim()) {
    const t = await one<UserRow>(c.env, `${USER_SELECT} WHERE u.id = ?`, String(b.teacherId));
    if (!t) throw notFound('Không tìm thấy giáo viên.');
    teacher = t;
  }
  const id = uuid();
  await batch(c.env, [
    ['INSERT INTO classrooms (id, name, section, subject, invite_code, teacher_id, is_admin_group, status, leaderboard_enabled, thumbnail, created_at) VALUES (?,?,?,?,?,?,0,?,1,?,?)',
      id, str(b.name, 'Tên lớp'), b.section ?? null, b.subject ?? null, await genInviteCode(c.env), teacher.id, 'ACTIVE', b.thumbnail ?? null, nowISO()],
    ['INSERT INTO class_members (id, classroom_id, user_id, role, joined_at) VALUES (?,?,?,?,?)', uuid(), id, teacher.id, 'TEACHER', nowISO()],
  ]);
  return ok(c, await classDto(c.env, await getClass(c.env, id), me));
});

classes.post('/join', async (c) => {
  const me = c.get('user');
  const code = String((await body(c)).inviteCode || '').trim().toUpperCase();
  const cls = await one<Cls>(c.env, 'SELECT * FROM classrooms WHERE invite_code = ?', code);
  if (!cls) throw bad('Mã lớp không hợp lệ hoặc lớp không tồn tại.');
  if (cls.status === 'ARCHIVED') throw bad('Lớp học này đã bị lưu trữ.');
  if (await memberRole(c.env, cls.id, me.id)) throw bad('Bạn đã tham gia lớp học này rồi.');
  const role = me.role === 'TEACHER' ? 'TEACHER' : me.role === 'TEACHING_ASSISTANT' ? 'TA' : 'STUDENT';
  await run(c.env, 'INSERT INTO class_members (id, classroom_id, user_id, role, joined_at) VALUES (?,?,?,?,?)', uuid(), cls.id, me.id, role, nowISO());
  const staff = await all<{ user_id: string }>(c.env, "SELECT user_id FROM class_members WHERE classroom_id = ? AND role IN ('TEACHER','TA')", cls.id);
  const ids = new Set(staff.map((s) => s.user_id));
  if (cls.teacher_id) ids.add(cls.teacher_id);
  for (const id of ids) await notify(c.env, id, 'Học sinh mới tham gia', `${me.full_name} đã tham gia lớp học ${cls.name}`, `/classes/${cls.id}?tab=people`, 'CLASSROOM', me, 'CLASSROOM', cls.id);
  await recordActivity(c.env, me, 'CLASSROOM_JOIN');
  return ok(c, await classDto(c.env, cls, null));
});

classes.get('/', async (c) => {
  const me = c.get('user');
  const { page, size } = pageParams(c, 20, 1000);
  const rows = await all<Cls>(c.env, `SELECT DISTINCT c.* FROM classrooms c
     LEFT JOIN class_members cm ON cm.classroom_id = c.id
     LEFT JOIN student_class_enrollments e ON e.classroom_id = c.id LEFT JOIN student_profiles sp ON sp.id = e.student_profile_id
     WHERE (c.teacher_id = ? OR cm.user_id = ? OR sp.user_id = ?) AND (c.status IS NULL OR c.status <> 'ARCHIVED')`, me.id, me.id, me.id);
  const dtos = await Promise.all(rows.map((r) => classDto(c.env, r, me)));
  // Sắp xếp như ClassroomService.getMyClasses: lớp còn việc trước, hạn gần trước, rồi theo tên
  dtos.sort((a, b) => {
    const ap = a.pendingCount ?? 0, bp = b.pendingCount ?? 0;
    if (ap > 0 && bp === 0) return -1;
    if (ap === 0 && bp > 0) return 1;
    if (a.nearestDeadline && b.nearestDeadline && a.nearestDeadline !== b.nearestDeadline) return a.nearestDeadline < b.nearestDeadline ? -1 : 1;
    if (a.nearestDeadline && !b.nearestDeadline) return -1;
    if (!a.nearestDeadline && b.nearestDeadline) return 1;
    if (ap !== bp) return bp - ap;
    return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
  });
  return ok(c, springPage(dtos.slice(page * size, page * size + size), dtos.length, page, size));
});

const adminOrOffice = auth('ADMIN', 'OFFICE');
classes.get('/admin/all', adminOrOffice, async (c) => ok(c, await Promise.all((await all<Cls>(c.env, 'SELECT * FROM classrooms ORDER BY created_at DESC')).map((r) => classDto(c.env, r, null)))));
classes.get('/admin/groups', adminOrOffice, async (c) => ok(c, await Promise.all((await all<Cls>(c.env, 'SELECT * FROM classrooms WHERE is_admin_group = 1 ORDER BY created_at DESC')).map((r) => classDto(c.env, r, null)))));
classes.post('/admin/groups', adminOrOffice, async (c) => {
  const b = await body(c);
  const id = uuid();
  await run(c.env, 'INSERT INTO classrooms (id, name, section, subject, invite_code, teacher_id, is_admin_group, status, leaderboard_enabled, created_at) VALUES (?,?,?,?,?,?,1,?,1,?)',
    id, str(b.name, 'Tên lớp'), b.description ?? '', b.subject ?? null, await genInviteCode(c.env), c.get('user').id, 'ACTIVE', nowISO());
  return ok(c, await classDto(c.env, await getClass(c.env, id), null));
});
classes.put('/admin/groups/:classId', adminOrOffice, async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  const b = await body(c);
  let teacherId: string | null = null;
  if (b.teacherId) {
    const t = await one<{ role: string }>(c.env, 'SELECT role FROM users WHERE id = ?', String(b.teacherId));
    if (!t) throw notFound('Không tìm thấy giáo viên');
    if (!['TEACHER', 'TEACHING_ASSISTANT', 'ADMIN'].includes(t.role)) throw bad('Người dùng không phải là giáo viên hoặc trợ giảng');
    teacherId = String(b.teacherId);
  }
  await run(c.env, 'UPDATE classrooms SET name = ?, section = ?, subject = ?, teacher_id = ? WHERE id = ?',
    b.name && String(b.name).trim() ? String(b.name) : cls.name, b.section ?? cls.section, b.subject ?? cls.subject, teacherId, cls.id);
  return ok(c, await classDto(c.env, await getClass(c.env, cls.id), null));
});
classes.delete('/admin/groups/:classId', adminOrOffice, async (c) => {
  const id = (await getClass(c.env, c.req.param('classId'))).id;
  // D1 bật khóa ngoại: xóa dữ liệu con trước (mỗi lệnh xóa cả cha lẫn con cùng bảng nên cây bình luận/thư mục không vướng)
  const posts = 'SELECT id FROM class_posts WHERE classroom_id = ?';
  const asg = 'SELECT id FROM assignments WHERE classroom_id = ?';
  await batch(c.env, [
    [`DELETE FROM class_post_comment_likes WHERE comment_id IN (SELECT id FROM class_post_comments WHERE post_id IN (${posts}))`, id],
    [`DELETE FROM class_post_comments WHERE post_id IN (${posts})`, id],
    [`DELETE FROM class_post_likes WHERE post_id IN (${posts})`, id],
    ['DELETE FROM class_posts WHERE classroom_id = ?', id],
    [`DELETE FROM writing_assessment_versions WHERE assessment_id IN (SELECT id FROM writing_assessments WHERE assignment_id IN (${asg}))`, id],
    [`DELETE FROM writing_assessments WHERE assignment_id IN (${asg})`, id],
    [`DELETE FROM assignment_submissions WHERE assignment_id IN (${asg})`, id],
    ['DELETE FROM assignments WHERE classroom_id = ?', id],
    ...['attendances', 'class_exams', 'class_resources', 'class_folders', 'class_members', 'classroom_courses', 'student_class_enrollments'].map((t): [string, string] => [`DELETE FROM ${t} WHERE classroom_id = ?`, id]),
    ['DELETE FROM classrooms WHERE id = ?', id],
  ]);
  return ok(c, null);
});

classes.get('/:classId', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await checkAccess(c.env, cls, c.get('user'));
  return ok(c, await classDto(c.env, cls, c.get('user')));
});

/* ---- Thư mục (chủ đề) lồng tối đa 4 cấp ---- */
const MAX_DEPTH = 4;
const folders = async (env: Env, classId: string) => all<any>(env, 'SELECT * FROM class_folders WHERE classroom_id = ? ORDER BY created_at', classId);
const depthOf = (all_: any[], id: string | null) => { let d = 0; let cur = all_.find((f) => f.id === id); while (cur && d <= MAX_DEPTH + 1) { d++; cur = all_.find((f) => f.id === cur.parent_id); } return d; };
const heightOf = (all_: any[], id: string, guard = 0): number => { const kids = all_.filter((f) => f.parent_id === id); return !kids.length || guard > MAX_DEPTH ? 1 : 1 + Math.max(...kids.map((k) => heightOf(all_, k.id, guard + 1))); };
const resolveParent = async (env: Env, classId: string, parentId: unknown) => {
  if (!parentId) return null;
  const p = await one<any>(env, 'SELECT * FROM class_folders WHERE id = ?', String(parentId));
  if (!p) throw notFound('Chủ đề cha không tồn tại');
  if (p.classroom_id !== classId) throw bad('Chủ đề cha không thuộc lớp học này.');
  return p;
};

classes.get('/:classId/folders', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await checkAccess(c.env, cls, c.get('user'));
  return ok(c, (await folders(c.env, cls.id)).map(folderDto));
});
classes.post('/:classId/folders', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'), 'Chỉ giáo viên và trợ giảng quản lý lớp mới có thể tạo thư mục.');
  const b = await body(c);
  const name = String(b.name ?? '').trim();
  if (!name) throw bad('Tên thư mục không được để trống.');
  const parent = await resolveParent(c.env, cls.id, b.parentId);
  if (parent && depthOf(await folders(c.env, cls.id), parent.id) + 1 > MAX_DEPTH) throw bad(`Chủ đề chỉ được lồng tối đa ${MAX_DEPTH} cấp.`);
  const id = uuid();
  await run(c.env, 'INSERT INTO class_folders (id, name, classroom_id, parent_id, created_at) VALUES (?,?,?,?,?)', id, name.slice(0, 255), cls.id, parent?.id ?? null, nowISO());
  return ok(c, folderDto(await one(c.env, 'SELECT * FROM class_folders WHERE id = ?', id)));
});
classes.put('/:classId/folders/:folderId', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'), 'Chỉ giáo viên và trợ giảng quản lý lớp mới có thể sửa thư mục.');
  const f = await one<any>(c.env, 'SELECT * FROM class_folders WHERE id = ?', c.req.param('folderId'));
  if (!f) throw notFound('Thư mục không tồn tại');
  if (f.classroom_id !== cls.id) throw bad('Thư mục không thuộc lớp học này.');
  const b = await body(c);
  let parentId = f.parent_id;
  if ('parentId' in b) {
    const np = await resolveParent(c.env, cls.id, b.parentId);
    if (np) {
      const list = await folders(c.env, cls.id);
      if (np.id === f.id) throw bad('Không thể đặt một chủ đề làm chủ đề cha của chính nó.');
      let cur = list.find((x) => x.id === np.parent_id), g = 0;
      while (cur && g++ <= MAX_DEPTH + 1) { if (cur.id === f.id) throw bad('Không thể chuyển một chủ đề vào bên trong chủ đề con của nó.'); cur = list.find((x) => x.id === cur.parent_id); }
      if (depthOf(list, np.id) + heightOf(list, f.id) > MAX_DEPTH) throw bad(`Chuyển vào đây sẽ vượt quá ${MAX_DEPTH} cấp cho phép.`);
    }
    parentId = np?.id ?? null;
  }
  await run(c.env, 'UPDATE class_folders SET name = ?, parent_id = ? WHERE id = ?', b.name && String(b.name).trim() ? String(b.name).trim() : f.name, parentId, f.id);
  return ok(c, folderDto(await one(c.env, 'SELECT * FROM class_folders WHERE id = ?', f.id)));
});
classes.delete('/:classId/folders/:folderId', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'), 'Chỉ giáo viên và trợ giảng quản lý lớp mới có thể xóa thư mục.');
  const f = await one<any>(c.env, 'SELECT * FROM class_folders WHERE id = ?', c.req.param('folderId'));
  if (!f) throw notFound('Thư mục không tồn tại');
  if (f.classroom_id !== cls.id) throw bad('Thư mục không thuộc lớp học này.');
  await run(c.env, 'DELETE FROM class_folders WHERE id = ?', f.id);
  return ok(c, null);
});

/* ---- Thành viên ---- */
classes.get('/:classId/members', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await checkAccess(c.env, cls, c.get('user'));
  return ok(c, (await all(c.env, `${MEMBER_SELECT} WHERE m.classroom_id = ? ORDER BY m.joined_at`, cls.id)).map(memberDto));
});
classes.post('/:classId/members', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, me, 'Chỉ giáo viên và trợ giảng quản lý lớp mới có thể thêm thành viên.');
  const b = await body(c);
  const target = await one<UserRow>(c.env, 'SELECT * FROM users WHERE lower(email) = lower(?)', String(b.email || '').trim());
  if (!target) throw notFound('Không tìm thấy người dùng với email này trên hệ thống.');
  if (cls.teacher_id === target.id) throw bad('Người dùng này đã là chủ sở hữu của lớp học.');
  const role = String(b.role || 'STUDENT').toUpperCase();
  if (!['TEACHER', 'TA', 'STUDENT'].includes(role)) throw bad(`Vai trò không hợp lệ: ${b.role}`);
  if (role === 'TEACHER') {
    const owner = cls.teacher_id ? await one<{ role: string }>(c.env, 'SELECT role FROM users WHERE id = ?', cls.teacher_id) : null;
    if (!owner || owner.role === 'ADMIN' || owner.role === 'OFFICE') await run(c.env, 'UPDATE classrooms SET teacher_id = ? WHERE id = ?', target.id, cls.id);
  }
  const existing = await one<{ id: string }>(c.env, 'SELECT id FROM class_members WHERE classroom_id = ? AND user_id = ?', cls.id, target.id);
  if (existing) {
    await run(c.env, 'UPDATE class_members SET role = ? WHERE id = ?', role, existing.id);
    await notify(c.env, target.id, 'Cập nhật vai trò trong lớp', `Vai trò của bạn trong lớp ${cls.name} đã được cập nhật thành: ${role}`, `/classes/${cls.id}`, 'CLASSROOM', me, 'CLASSROOM_MEMBER', cls.id);
  } else {
    await run(c.env, 'INSERT INTO class_members (id, classroom_id, user_id, role, joined_at) VALUES (?,?,?,?,?)', uuid(), cls.id, target.id, role, nowISO());
    await notify(c.env, target.id, 'Bạn đã được thêm vào lớp học', `Bạn đã được thêm vào lớp học ${cls.name} với vai trò ${role}`, `/classes/${cls.id}`, 'CLASSROOM', me, 'CLASSROOM_MEMBER', cls.id);
  }
  return ok(c, memberDto(await one(c.env, `${MEMBER_SELECT} WHERE m.classroom_id = ? AND m.user_id = ?`, cls.id, target.id)));
});
classes.delete('/:classId/members/:studentId', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, me, 'Chỉ giáo viên mới có thể xóa thành viên.');
  const sid = c.req.param('studentId');
  if (!(await memberRole(c.env, cls.id, sid))) throw notFound('Thành viên không có trong lớp này.');
  if (cls.teacher_id === sid) throw bad('Không thể xóa chủ sở hữu lớp học khỏi lớp.');
  await run(c.env, 'DELETE FROM class_members WHERE classroom_id = ? AND user_id = ?', cls.id, sid);
  await notify(c.env, sid, 'Thông báo lớp học', `Bạn đã được xóa khỏi lớp học ${cls.name}`, '/classes', 'CLASSROOM', me, 'CLASSROOM_MEMBER', cls.id);
  return ok(c, null);
});
classes.put('/:classId/members/:studentId/role', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, me, 'Chỉ giáo viên và trợ giảng quản lý lớp mới có thể thay đổi vai trò.');
  const sid = c.req.param('studentId');
  if (!(await memberRole(c.env, cls.id, sid))) throw notFound('Thành viên không có trong lớp này.');
  if (cls.teacher_id === sid) throw bad('Không thể thay đổi vai trò của chủ sở hữu lớp học.');
  const role = String((await body(c)).role || '').toUpperCase();
  if (!['TEACHER', 'TA', 'STUDENT'].includes(role)) throw bad(`Vai trò không hợp lệ: ${role}`);
  await run(c.env, 'UPDATE class_members SET role = ? WHERE classroom_id = ? AND user_id = ?', role, cls.id, sid);
  await notify(c.env, sid, 'Cập nhật vai trò trong lớp', `Vai trò của bạn trong lớp ${cls.name} đã được cập nhật thành: ${role}`, `/classes/${cls.id}`, 'CLASSROOM', me, 'CLASSROOM_MEMBER', cls.id);
  return ok(c, null);
});

/** Nhắc hạn: thông báo cho học sinh còn bài chưa làm (bài tập trong 30 ngày tới + đề còn mở) */
export async function remindClass(env: Env, cls: Cls, sender: UserRow | null) {
  const now = nowISO();
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const students = await all<{ user_id: string }>(env, "SELECT user_id FROM class_members WHERE classroom_id = ? AND role = 'STUDENT'", cls.id);
  let n = 0;
  for (const s of students) {
    const pending = (await count(env, 'SELECT COUNT(*) AS n FROM assignments a WHERE classroom_id = ? AND due_date > ? AND due_date <= ? AND NOT EXISTS (SELECT 1 FROM assignment_submissions x WHERE x.assignment_id = a.id AND x.student_id = ?)', cls.id, now, in30, s.user_id))
      + (await count(env, 'SELECT COUNT(*) AS n FROM class_exams ce WHERE classroom_id = ? AND close_time > ? AND NOT EXISTS (SELECT 1 FROM student_exam_results r WHERE r.exam_id = ce.exam_id AND r.student_id = ? AND r.submitted_at IS NOT NULL)', cls.id, now, s.user_id));
    if (pending > 0) {
      await notify(env, s.user_id, `⏰ Nhắc nhở: Lớp ${cls.name} có ${pending} bài tập/đề thi sắp đến hạn!`,
        `${sender ? `Giáo viên ${sender.full_name}` : 'Hệ thống'} nhắc bạn hoàn thành các bài tập/đề thi trước hạn chót. Hãy bấm vào để kiểm tra ngay!`, `/classes/${cls.id}/classwork`, 'DEADLINE');
      n++;
    }
  }
  return n;
}
classes.post('/:classId/remind-deadline', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'), 'Chỉ giáo viên hoặc trợ giảng mới có thể gửi nhắc nhở deadline.');
  const n = await remindClass(c.env, cls, c.get('user'));
  return ok(c, { notifiedCount: n, message: `Đã gửi thông báo nhắc hạn chót tới ${n} học viên.` });
});

/* ---- Bảng tin ---- */
const postDto = async (env: Env, p: any, meId: string) => {
  const likes = await count(env, 'SELECT COUNT(*) AS n FROM class_post_likes WHERE post_id = ?', p.id);
  const liked = !!(await one(env, 'SELECT 1 AS x FROM class_post_likes WHERE post_id = ? AND user_id = ?', p.id, meId));
  return { id: p.id, classroomId: p.classroom_id, authorId: p.author_id, authorName: p.full_name, authorAvatar: p.avatar_url, type: p.type, content: p.content, attachments: parseJson<string[]>(p.attachments, []),
    createdAt: javaTime(p.created_at), commentCount: await count(env, 'SELECT COUNT(*) AS n FROM class_post_comments WHERE post_id = ?', p.id), likeCount: likes, isLikedByCurrentUser: liked, likedByCurrentUser: liked };
};
const POST_SELECT = 'SELECT p.*, u.full_name, u.avatar_url FROM class_posts p JOIN users u ON u.id = p.author_id';
const getPost = async (env: Env, classId: string, postId: string) => {
  const p = await one<any>(env, `${POST_SELECT} WHERE p.id = ?`, postId);
  if (!p) throw notFound('Không tìm thấy bài đăng.');
  if (p.classroom_id !== classId) throw bad('Bài đăng không thuộc lớp học này.');
  return p;
};
const attachments = (v: unknown) => JSON.stringify(Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 20) : []);

classes.post('/:classId/posts', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  if (!(await canManage(c.env, cls, me)) && !(await memberRole(c.env, cls.id, me.id))) throw bad('Bạn không phải thành viên lớp này');
  // Java so sánh String với enum nên luôn cho qua; chặn đúng ý định: học sinh không đăng bài
  if (me.role === 'STUDENT') throw bad('Học viên không có quyền đăng bài trong lớp.');
  const b = await body(c);
  const id = uuid();
  await run(c.env, 'INSERT INTO class_posts (id, classroom_id, author_id, type, content, created_at, attachments) VALUES (?,?,?,?,?,?,?)', id, cls.id, me.id, b.type || 'ANNOUNCEMENT', str(b.content, 'Nội dung', 50_000), nowISO(), attachments(b.attachments));
  for (const m of await all<{ user_id: string }>(c.env, 'SELECT user_id FROM class_members WHERE classroom_id = ? AND user_id <> ?', cls.id, me.id))
    await notify(c.env, m.user_id, `Thông báo mới từ lớp ${cls.name}`, `${me.full_name} đã đăng một thông báo mới trên bảng tin lớp học.`, `/classes/${cls.id}`, 'CLASSROOM', me, 'CLASS_POST', id);
  return c.json({ status: 200, message: 'Success', data: await postDto(c.env, await getPost(c.env, cls.id, id), me.id) }, 201);
});
classes.get('/:classId/posts', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  if (!(await canManage(c.env, cls, me)) && !(await memberRole(c.env, cls.id, me.id))) throw bad('Bạn không có quyền xem bảng tin của lớp học này.');
  const { page, size, offset } = pageParams(c, 20, 100);
  const rows = await all(c.env, `${POST_SELECT} WHERE p.classroom_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?`, cls.id, size, offset);
  return ok(c, springPage(await Promise.all(rows.map((p) => postDto(c.env, p, me.id))), await count(c.env, 'SELECT COUNT(*) AS n FROM class_posts WHERE classroom_id = ?', cls.id), page, size));
});
classes.put('/:classId/posts/:postId', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  const p = await getPost(c.env, cls.id, c.req.param('postId'));
  if (p.author_id !== me.id && !(await canManage(c.env, cls, me))) throw bad('Bạn không có quyền sửa/xóa bài đăng này');
  const b = await body(c);
  await run(c.env, 'UPDATE class_posts SET content = ?, attachments = ? WHERE id = ?', str(b.content, 'Nội dung', 50_000), attachments(b.attachments), p.id);
  return ok(c, await postDto(c.env, await getPost(c.env, cls.id, p.id), me.id));
});
classes.delete('/:classId/posts/:postId', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  const p = await getPost(c.env, cls.id, c.req.param('postId'));
  if (p.author_id !== me.id && !(await canManage(c.env, cls, me))) throw bad('Bạn không có quyền xóa bài viết này.');
  await batch(c.env, [
    ['DELETE FROM class_post_comment_likes WHERE comment_id IN (SELECT id FROM class_post_comments WHERE post_id = ?)', p.id],
    ['DELETE FROM class_post_comments WHERE post_id = ?', p.id], ['DELETE FROM class_post_likes WHERE post_id = ?', p.id], ['DELETE FROM class_posts WHERE id = ?', p.id],
  ]);
  return ok(c, null);
});
classes.post('/:classId/posts/:postId/like', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  await checkAccess(c.env, cls, me);
  const p = await getPost(c.env, cls.id, c.req.param('postId'));
  const liked = await one<{ id: string }>(c.env, 'SELECT id FROM class_post_likes WHERE post_id = ? AND user_id = ?', p.id, me.id);
  if (liked) await run(c.env, 'DELETE FROM class_post_likes WHERE id = ?', liked.id);
  else await run(c.env, 'INSERT INTO class_post_likes (id, post_id, user_id, created_at) VALUES (?,?,?,?)', uuid(), p.id, me.id, nowISO());
  return ok(c, await postDto(c.env, p, me.id));
});

/* ---- Bình luận (có trả lời lồng) ---- */
const commentTree = async (env: Env, postId: string, meId: string) => {
  const rows = await all<any>(env, `SELECT cm.*, u.full_name, u.avatar_url, (SELECT COUNT(*) FROM class_post_comment_likes l WHERE l.comment_id = cm.id) AS likes,
     EXISTS(SELECT 1 FROM class_post_comment_likes l WHERE l.comment_id = cm.id AND l.user_id = ?) AS liked
     FROM class_post_comments cm JOIN users u ON u.id = cm.author_id WHERE cm.post_id = ? ORDER BY cm.created_at`, meId, postId);
  const dto = (r: any): any => ({ id: r.id, postId: r.post_id, parentId: r.parent_id, authorId: r.author_id, authorName: r.full_name, authorAvatar: r.avatar_url, content: r.content,
    createdAt: javaTime(r.created_at), likeCount: r.likes, isLikedByCurrentUser: !!r.liked, likedByCurrentUser: !!r.liked, replies: rows.filter((x) => x.parent_id === r.id).map(dto) });
  return { all: rows, dto };
};
const verifyCommentMember = async (env: Env, cls: Cls, u: UserRow) => {
  if (cls.teacher_id !== u.id && !(await memberRole(env, cls.id, u.id)) && u.role !== 'ADMIN') throw bad('Bạn không phải là thành viên của lớp học này.');
};
const getComment = async (env: Env, cls: Cls, postId: string, commentId: string) => {
  const cm = await one<any>(env, 'SELECT cm.*, p.classroom_id FROM class_post_comments cm JOIN class_posts p ON p.id = cm.post_id WHERE cm.id = ?', commentId);
  if (!cm) throw notFound('Không tìm thấy bình luận.');
  if (cm.post_id !== postId || cm.classroom_id !== cls.id) throw bad('Bình luận không hợp lệ.');
  return cm;
};
const commentOut = async (env: Env, postId: string, id: string, meId: string) => { const t = await commentTree(env, postId, meId); return t.dto(t.all.find((x) => x.id === id)); };

classes.get('/:classId/posts/:postId/comments', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  await verifyCommentMember(c.env, cls, me);
  const p = await getPost(c.env, cls.id, c.req.param('postId'));
  const t = await commentTree(c.env, p.id, me.id);
  return ok(c, t.all.filter((x) => !x.parent_id).map(t.dto));
});
classes.post('/:classId/posts/:postId/comments', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  await verifyCommentMember(c.env, cls, me);
  const p = await getPost(c.env, cls.id, c.req.param('postId'));
  const b = await body(c);
  const content = str(b.content, 'Nội dung', 5000)!;
  let parent: any = null;
  if (b.parentId) {
    parent = await one(c.env, 'SELECT * FROM class_post_comments WHERE id = ?', String(b.parentId));
    if (!parent) throw notFound('Không tìm thấy bình luận cha.');
    if (parent.post_id !== p.id) throw bad('Bình luận cha không thuộc bài đăng này.');
  }
  const id = uuid();
  await run(c.env, 'INSERT INTO class_post_comments (id, post_id, author_id, content, created_at, parent_id) VALUES (?,?,?,?,?,?)', id, p.id, me.id, content, nowISO(), parent?.id ?? null);
  const short = content.length > 60 ? `${content.slice(0, 60)}...` : content;
  if (parent && parent.author_id !== me.id) await notify(c.env, parent.author_id, `Phản hồi bình luận trong lớp ${cls.name}`, `${me.full_name} đã trả lời bình luận của bạn: "${short}"`, `/classes/${cls.id}`, 'COMMENT', me, 'CLASS_COMMENT', id);
  if (p.author_id !== me.id && (!parent || parent.author_id !== p.author_id)) await notify(c.env, p.author_id, `Bình luận mới trong lớp ${cls.name}`, `${me.full_name} đã bình luận vào bài đăng của bạn: "${short}"`, `/classes/${cls.id}`, 'COMMENT', me, 'CLASS_COMMENT', id);
  return ok(c, await commentOut(c.env, p.id, id, me.id));
});
classes.put('/:classId/posts/:postId/comments/:commentId', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  const cm = await getComment(c.env, cls, c.req.param('postId'), c.req.param('commentId'));
  if (cm.author_id !== me.id && me.role !== 'ADMIN') throw bad('Bạn không có quyền chỉnh sửa bình luận này');
  await run(c.env, 'UPDATE class_post_comments SET content = ? WHERE id = ?', str((await body(c)).content, 'Nội dung', 5000), cm.id);
  return ok(c, await commentOut(c.env, cm.post_id, cm.id, me.id));
});
classes.delete('/:classId/posts/:postId/comments/:commentId', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  const cm = await getComment(c.env, cls, c.req.param('postId'), c.req.param('commentId'));
  if (cm.author_id !== me.id && !(await canManage(c.env, cls, me))) throw bad('Bạn không có quyền xóa bình luận này');
  // Xóa cả trả lời con để không mồ côi
  const ids = [cm.id, ...(await all<{ id: string }>(c.env, 'SELECT id FROM class_post_comments WHERE parent_id = ?', cm.id)).map((x) => x.id)];
  await batch(c.env, [[`DELETE FROM class_post_comment_likes WHERE comment_id IN ${inList(ids.length)}`, ...ids], [`DELETE FROM class_post_comments WHERE id IN ${inList(ids.length)}`, ...ids]]);
  return ok(c, null);
});
classes.post('/:classId/posts/:postId/comments/:commentId/like', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  await checkAccess(c.env, cls, me);
  const cm = await getComment(c.env, cls, c.req.param('postId'), c.req.param('commentId'));
  const liked = await one<{ id: string }>(c.env, 'SELECT id FROM class_post_comment_likes WHERE comment_id = ? AND user_id = ?', cm.id, me.id);
  if (liked) await run(c.env, 'DELETE FROM class_post_comment_likes WHERE id = ?', liked.id);
  else await run(c.env, 'INSERT INTO class_post_comment_likes (id, comment_id, user_id, created_at) VALUES (?,?,?,?)', uuid(), cm.id, me.id, nowISO());
  return ok(c, await commentOut(c.env, cm.post_id, cm.id, me.id));
});

/* ---- Khóa học liên kết ---- */
const linkDto = (l: any) => ({ id: l.id, courseId: l.course_id, title: l.title, description: l.description, status: l.status, linkedAt: javaTime(l.linked_at) });
const LINK_SELECT = 'SELECT l.id, l.course_id, l.linked_at, co.title, co.description, co.status, co.teacher_id FROM classroom_courses l JOIN courses co ON co.id = l.course_id';
classes.get('/:classId/courses', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await checkAccess(c.env, cls, c.get('user'));
  return ok(c, (await all(c.env, `${LINK_SELECT} WHERE l.classroom_id = ? ORDER BY l.linked_at DESC`, cls.id)).map(linkDto));
});
classes.post('/:classId/courses/:courseId', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, me, 'Chỉ giáo viên và trợ giảng quản lý lớp mới có thể liên kết khóa học.');
  const course = await one<{ teacher_id: string }>(c.env, 'SELECT teacher_id FROM courses WHERE id = ?', c.req.param('courseId'));
  if (!course) throw notFound('Khóa học không tồn tại');
  if (me.role !== 'ADMIN' && course.teacher_id !== me.id) throw bad('Bạn chỉ có thể liên kết khóa học do mình tạo.');
  if (await one(c.env, 'SELECT 1 AS x FROM classroom_courses WHERE classroom_id = ? AND course_id = ?', cls.id, c.req.param('courseId'))) throw bad('Khóa học đã được liên kết với lớp này.');
  const id = uuid();
  await run(c.env, 'INSERT INTO classroom_courses (id, classroom_id, course_id, linked_at) VALUES (?,?,?,?)', id, cls.id, c.req.param('courseId'), nowISO());
  return ok(c, linkDto(await one(c.env, `${LINK_SELECT} WHERE l.id = ?`, id)));
});
classes.delete('/:classId/courses/:courseId', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'), 'Chỉ giáo viên và trợ giảng quản lý lớp mới có thể gỡ liên kết.');
  const r = await run(c.env, 'DELETE FROM classroom_courses WHERE classroom_id = ? AND course_id = ?', cls.id, c.req.param('courseId'));
  if (!r.meta.changes) throw notFound('Liên kết không tồn tại');
  return ok(c, null);
});

/* ---- Cài đặt lớp ---- */
classes.put('/:classId/settings/leaderboard', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'), 'Chỉ giáo viên và trợ giảng quản lý lớp mới có thể thay đổi cài đặt.');
  await run(c.env, 'UPDATE classrooms SET leaderboard_enabled = ? WHERE id = ?', (await body(c)).enabled === true ? 1 : 0, cls.id);
  return ok(c, null);
});
classes.put('/:classId/settings/meeting-link', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'));
  const link = (await body(c)).meetingLink;
  if (link && !/^https?:\/\//i.test(String(link))) throw bad('Link phòng học phải bắt đầu bằng http(s)://');
  await run(c.env, 'UPDATE classrooms SET meeting_link = ? WHERE id = ?', link ? String(link).slice(0, 1000) : null, cls.id);
  return ok(c, null);
});
classes.put('/:classId/settings/info', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  if (cls.teacher_id !== me.id && me.role !== 'ADMIN') throw bad('Bạn không có quyền sửa thông tin lớp này');
  const b = await body(c);
  await run(c.env, 'UPDATE classrooms SET name = ?, subject = ?, section = ? WHERE id = ?', b.name && String(b.name).trim() ? String(b.name).trim() : cls.name, b.subject ?? cls.subject, b.section ?? cls.section, cls.id);
  return ok(c, await classDto(c.env, await getClass(c.env, cls.id), me));
});
classes.put('/:classId/settings/thumbnail', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'));
  await run(c.env, 'UPDATE classrooms SET thumbnail = ? WHERE id = ?', (await body(c)).thumbnail ?? null, cls.id);
  return ok(c, null);
});
// Mới: hệ số điểm học kì theo lớp (TX/GK/CK)
classes.get('/:classId/settings/grade-weights', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await checkAccess(c.env, cls, c.get('user'));
  const w = await one<any>(c.env, 'SELECT w_tx, w_gk, w_ck FROM classroom_grade_weights WHERE classroom_id = ?', cls.id);
  return ok(c, { tx: w?.w_tx ?? 1, gk: w?.w_gk ?? 2, ck: w?.w_ck ?? 3 });
});
classes.put('/:classId/settings/grade-weights', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'));
  const b = await body(c);
  const w = (v: unknown, d: number) => { const n = v == null ? d : Number(v); if (!Number.isFinite(n) || n < 0 || n > 5) throw bad('Hệ số phải từ 0 đến 5.'); return n; };
  const tx = w(b.tx, 1), gk = w(b.gk, 2), ck = w(b.ck, 3);
  await run(c.env, 'INSERT INTO classroom_grade_weights (classroom_id, w_tx, w_gk, w_ck) VALUES (?,?,?,?) ON CONFLICT(classroom_id) DO UPDATE SET w_tx = excluded.w_tx, w_gk = excluded.w_gk, w_ck = excluded.w_ck', cls.id, tx, gk, ck);
  return ok(c, { tx, gk, ck });
});

/* ---- Học liệu gắn lớp (Java chỉ hiển thị bộ thẻ; bản ghi mồ côi tự dọn) ---- */
classes.get('/:classId/resources', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await checkAccess(c.env, cls, c.get('user'));
  const rows = await all<any>(c.env, 'SELECT r.*, d.title, d.description, d.id AS deck_id FROM class_resources r LEFT JOIN flashcard_decks d ON d.id = r.resource_id WHERE r.classroom_id = ?', cls.id);
  const orphan = rows.filter((r) => !r.deck_id).map((r) => r.id);
  if (orphan.length) await run(c.env, `DELETE FROM class_resources WHERE id IN ${inList(orphan.length)}`, ...orphan);
  return ok(c, rows.filter((r) => r.deck_id).map((r) => ({ id: r.id, classroomId: r.classroom_id, folderId: r.folder_id, resourceType: r.resource_type, resourceId: r.resource_id, createdAt: javaTime(r.created_at), title: r.title, description: r.description })));
});
classes.post('/:classId/resources', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'));
  const b = await body(c);
  if (!b.resourceId) throw bad('Thiếu resourceId.');
  const existing = await one<any>(c.env, 'SELECT * FROM class_resources WHERE classroom_id = ? AND resource_id = ?', cls.id, String(b.resourceId));
  let id = existing?.id;
  if (existing) await run(c.env, 'UPDATE class_resources SET folder_id = ?, resource_type = ? WHERE id = ?', b.folderId ?? null, b.resourceType ?? existing.resource_type, id);
  else { id = uuid(); await run(c.env, 'INSERT INTO class_resources (id, classroom_id, folder_id, resource_type, resource_id, created_at) VALUES (?,?,?,?,?,?)', id, cls.id, b.folderId ?? null, b.resourceType || 'FLASHCARD', String(b.resourceId), nowISO()); }
  const r = await one<any>(c.env, 'SELECT * FROM class_resources WHERE id = ?', id);
  return ok(c, { id: r.id, classroomId: r.classroom_id, folderId: r.folder_id, resourceType: r.resource_type, resourceId: r.resource_id, createdAt: javaTime(r.created_at) });
});
classes.delete('/:classId/resources/:resourceId', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'));
  // Frontend gửi resourceId của học liệu (hoặc id bản ghi) — xóa theo cả hai trong lớp này
  await run(c.env, 'DELETE FROM class_resources WHERE classroom_id = ? AND (id = ? OR resource_id = ?)', cls.id, c.req.param('resourceId'), c.req.param('resourceId'));
  return ok(c, null);
});

/* ---- Điểm danh ---- */
const attendance = async (env: Env, cls: Cls, week: number, session: number) => {
  const students = await all<any>(env, "SELECT u.id, u.full_name, u.avatar_url FROM class_members m JOIN users u ON u.id = m.user_id WHERE m.classroom_id = ? AND m.role = 'STUDENT' ORDER BY u.full_name", cls.id);
  const recs = await all<any>(env, 'SELECT student_id, status FROM attendances WHERE classroom_id = ? AND week_number = ? AND session_number = ?', cls.id, week, session);
  const map = new Map(recs.map((r) => [r.student_id, r.status]));
  return { weekNumber: week, sessionNumber: session, records: students.map((s) => ({ studentId: s.id, studentName: s.full_name, avatarUrl: s.avatar_url, status: map.get(s.id) ?? null })) };
};
classes.get('/:classId/attendance', async (c) => {
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, c.get('user'), 'Chỉ Giáo viên hoặc Trợ giảng mới có quyền điểm danh');
  const week = Number(c.req.query('weekNumber')), session = Number(c.req.query('sessionNumber'));
  if (!Number.isInteger(week) || !Number.isInteger(session)) throw bad('Thiếu tuần hoặc buổi học.');
  return ok(c, await attendance(c.env, cls, week, session));
});
classes.post('/:classId/attendance', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classId'));
  await requireManage(c.env, cls, me, 'Chỉ Giáo viên hoặc Trợ giảng mới có quyền điểm danh');
  const b = await body(c);
  const week = Number(b.weekNumber), session = Number(b.sessionNumber);
  if (!Number.isInteger(week) || !Number.isInteger(session)) throw bad('Thiếu tuần hoặc buổi học.');
  const stmts: [string, ...unknown[]][] = [];
  const absent: { id: string; status: string }[] = [];
  for (const r of Array.isArray(b.records) ? b.records : []) {
    if (!['PRESENT', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED'].includes(r.status)) continue;
    const ex = await one<{ id: string }>(c.env, 'SELECT id FROM attendances WHERE classroom_id = ? AND student_id = ? AND week_number = ? AND session_number = ?', cls.id, r.studentId, week, session);
    if (ex) stmts.push(['UPDATE attendances SET status = ?, recorded_by = ? WHERE id = ?', r.status, me.id, ex.id]);
    else stmts.push(['INSERT INTO attendances (id, classroom_id, student_id, attendance_date, week_number, session_number, status, recorded_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)', uuid(), cls.id, r.studentId, todayVN(), week, session, r.status, me.id, nowISO()]);
    if (r.status !== 'PRESENT') absent.push({ id: r.studentId, status: r.status });
  }
  if (stmts.length) await batch(c.env, stmts);
  for (const a of absent) {
    const label = a.status === 'ABSENT_EXCUSED' ? 'Vắng có phép' : 'Vắng không phép';
    await notify(c.env, a.id, `Thông báo điểm danh: ${label}`, `Bạn được ghi nhận ${label} trong buổi học Tuần ${week} - Buổi ${session} (${cls.name}).`, `/classes/${cls.id}`, 'CLASSROOM', me, 'ATTENDANCE', `${cls.id}_${week}_${session}`);
  }
  return ok(c, await attendance(c.env, cls, week, session));
});

/* ---- /api/v1/classrooms: sổ điểm & bảng xếp hạng ---- */
/** Sổ điểm: bài tập theo maxScore; đề thi quy về thang 10 (điểm/tổng điểm đề × 10), kèm loại TX/GK/CK cho điểm học kì */
export async function gradebook(env: Env, cls: Cls, onlyStudentId: string | null) {
  const now = nowISO();
  const assigns = await all<any>(env, 'SELECT id, title, max_score, due_date FROM assignments WHERE classroom_id = ? ORDER BY created_at', cls.id);
  const ces = await all<any>(env, `SELECT ce.close_time, e.id, e.title, e.assessment_type, (SELECT COALESCE(SUM(points),0) FROM questions q WHERE q.exam_id = e.id) AS max_points
     FROM class_exams ce JOIN exams e ON e.id = ce.exam_id WHERE ce.classroom_id = ? ORDER BY ce.created_at`, cls.id);
  const classworks = [
    ...assigns.map((a) => ({ id: a.id, title: a.title, type: 'ASSIGNMENT', maxScore: a.max_score ?? 10, dueDate: javaTime(a.due_date), assessmentType: 'TX' })),
    ...ces.map((e) => ({ id: e.id, title: e.title, type: 'EXAM', maxScore: 10, dueDate: javaTime(e.close_time), assessmentType: e.assessment_type ?? null })),
  ];
  const students = await all<any>(env, `SELECT u.id, u.full_name, u.avatar_url, (SELECT sp.student_code FROM student_profiles sp WHERE sp.user_id = u.id LIMIT 1) AS student_code FROM class_members m JOIN users u ON u.id = m.user_id
     WHERE m.classroom_id = ? AND m.role = 'STUDENT'${onlyStudentId ? ' AND u.id = ?' : ''} ORDER BY u.full_name`, cls.id, ...(onlyStudentId ? [onlyStudentId] : []));
  const subs = assigns.length ? await all<any>(env, `SELECT assignment_id, student_id, status, score FROM assignment_submissions WHERE assignment_id IN ${inList(assigns.length)}`, ...assigns.map((a) => a.id)) : [];
  // Lần nộp gần nhất của mỗi học sinh cho mỗi đề
  const results = ces.length ? await all<any>(env, `SELECT exam_id, student_id, total_score, submitted_at FROM student_exam_results WHERE exam_id IN ${inList(ces.length)} AND submitted_at IS NOT NULL ORDER BY submitted_at`, ...ces.map((e) => e.id)) : [];
  const subMap = new Map(subs.map((s) => [`${s.student_id}_${s.assignment_id}`, s]));
  const resMap = new Map(results.map((r) => [`${r.student_id}_${r.exam_id}`, r]));
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    classworks,
    students: students.map((s) => {
      const grades: Record<string, { score: number | null; status: string }> = {};
      for (const a of assigns) {
        const sub = subMap.get(`${s.id}_${a.id}`);
        grades[a.id] = !sub ? { score: null, status: a.due_date && a.due_date < now ? 'MISSING' : 'ASSIGNED' }
          : sub.status === 'GRADED' ? { score: round1(sub.score ?? 0), status: 'GRADED' } : { score: null, status: 'TURNED_IN' };
      }
      for (const e of ces) {
        const res = resMap.get(`${s.id}_${e.id}`);
        grades[e.id] = !res ? { score: null, status: e.close_time && e.close_time < now ? 'MISSING' : 'ASSIGNED' }
          : { score: round1(e.max_points > 0 ? ((res.total_score ?? 0) / e.max_points) * 10 : res.total_score ?? 0), status: 'GRADED' };
      }
      return { studentId: s.id, studentName: s.full_name, avatarUrl: s.avatar_url, studentCode: s.student_code, grades };
    }),
  };
}
export const classroomsV1 = new Hono<AppEnv>();
classroomsV1.use('*', auth());
classroomsV1.get('/:id/gradebook', auth('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT'), async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('id'));
  await checkAccess(c.env, cls, me);
  // Học sinh chỉ thấy dòng của mình
  return ok(c, await gradebook(c.env, cls, (await canManage(c.env, cls, me)) ? null : me.id));
});
classroomsV1.get('/:id/leaderboard', async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('id'));
  await checkAccess(c.env, cls, me);
  if (!cls.leaderboard_enabled && !(await canManage(c.env, cls, me))) throw bad('Bảng xếp hạng chưa được bật cho lớp này');
  const g = await gradebook(c.env, cls, null);
  const entries = g.students.map((s) => {
    const scores = Object.values(s.grades).map((x) => x.score).filter((x): x is number => x != null);
    return { rank: 0, studentId: s.studentId, studentName: s.studentName, avatarUrl: s.avatarUrl, averageScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0, completedCount: scores.length };
  }).sort((a, b) => b.averageScore - a.averageScore);
  entries.forEach((e, i) => { e.rank = i + 1; });
  return ok(c, entries);
});

/* ---- /api/v1/class-exams ---- */
const ceDto = (r: any) => ({ id: r.id, classroomId: r.classroom_id, examId: r.exam_id, examTitle: r.title, durationMinutes: r.duration_minutes, openTime: javaTime(r.open_time), closeTime: javaTime(r.close_time),
  folderId: r.folder_id, createdAt: javaTime(r.created_at), questionCount: r.qcount ?? 0, examType: r.exam_type, examEndTime: javaTime(r.end_time), examStartTime: javaTime(r.start_time), assessmentType: r.assessment_type ?? null });
const CE_SELECT = 'SELECT ce.*, e.title, e.duration_minutes, e.exam_type, e.end_time, e.start_time, e.assessment_type, (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) AS qcount FROM class_exams ce JOIN exams e ON e.id = ce.exam_id';
const fmtVN = (iso: string | null) => { if (!iso) return 'Không giới hạn'; const t = javaTime(iso)!; return `${t.slice(11, 16)} ${t.slice(8, 10)}/${t.slice(5, 7)}/${t.slice(0, 4)}`; };
const canManageExamAssign = async (env: Env, examId: string, u: UserRow) => {
  const e = await one<{ teacher_id: string }>(env, 'SELECT teacher_id FROM exams WHERE id = ?', examId);
  if (!e) throw notFound('Không tìm thấy đề thi.');
  return u.role === 'ADMIN' || u.role === 'TEACHER' || u.role === 'TEACHING_ASSISTANT' || e.teacher_id === u.id;
};

export const classExams = new Hono<AppEnv>();
classExams.use('*', auth());
const staff = auth('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN');
classExams.get('/classroom/:classroomId', async (c) => {
  const cls = await getClass(c.env, c.req.param('classroomId'));
  await checkAccess(c.env, cls, c.get('user'));
  return ok(c, (await all(c.env, `${CE_SELECT} WHERE ce.classroom_id = ? ORDER BY ce.created_at`, cls.id)).map(ceDto));
});
classExams.post('/classroom/:classroomId', staff, async (c) => {
  const me = c.get('user');
  const cls = await getClass(c.env, c.req.param('classroomId'));
  await requireManage(c.env, cls, me, 'Bạn không có quyền quản lý lớp học này');
  const b = await body(c);
  const exam = await one<{ id: string; title: string }>(c.env, 'SELECT id, title FROM exams WHERE id = ?', String(b.examId || ''));
  if (!exam) throw notFound('Không tìm thấy đề thi.');
  if (await one(c.env, 'SELECT 1 AS x FROM class_exams WHERE classroom_id = ? AND exam_id = ?', cls.id, exam.id)) throw bad('Bài thi này đã được gán cho lớp học này rồi');
  const id = uuid();
  const close = utcTime(b.closeTime);
  await run(c.env, 'INSERT INTO class_exams (id, classroom_id, exam_id, open_time, close_time, folder_id, created_at) VALUES (?,?,?,?,?,?,?)', id, cls.id, exam.id, utcTime(b.openTime), close, b.folderId ?? null, nowISO());
  for (const m of await all<{ user_id: string }>(c.env, "SELECT user_id FROM class_members WHERE classroom_id = ? AND role = 'STUDENT'", cls.id))
    await notify(c.env, m.user_id, `Đề thi mới: ${exam.title}`, `Lớp ${cls.name} vừa giao đề thi mới. Hạn chót: ${fmtVN(close)}`, `/classes/${cls.id}/classwork`, 'EXAM', me, 'CLASS_EXAM', id);
  return ok(c, ceDto(await one(c.env, `${CE_SELECT} WHERE ce.id = ?`, id)));
});
classExams.delete('/:id', staff, async (c) => {
  const ce = await one<any>(c.env, 'SELECT * FROM class_exams WHERE id = ?', c.req.param('id'));
  if (!ce) throw notFound('Không tìm thấy bài thi trong lớp.');
  await requireManage(c.env, await getClass(c.env, ce.classroom_id), c.get('user'), 'Bạn không có quyền gỡ bài thi khỏi lớp này');
  await run(c.env, 'DELETE FROM class_exams WHERE id = ?', ce.id);
  return ok(c, null);
});
classExams.put('/:id', staff, async (c) => {
  const ce = await one<any>(c.env, 'SELECT * FROM class_exams WHERE id = ?', c.req.param('id'));
  if (!ce) throw notFound('Không tìm thấy bài thi trong lớp.');
  await requireManage(c.env, await getClass(c.env, ce.classroom_id), c.get('user'), 'Bạn không có quyền thao tác với đề thi trong lớp này');
  const b = await body(c);
  await run(c.env, 'UPDATE class_exams SET open_time = ?, close_time = ?, folder_id = ? WHERE id = ?', utcTime(b.openTime), utcTime(b.closeTime), b.folderId ?? null, ce.id);
  return ok(c, ceDto(await one(c.env, `${CE_SELECT} WHERE ce.id = ?`, ce.id)));
});
classExams.get('/exam/:examId', staff, async (c) => {
  if (!(await canManageExamAssign(c.env, c.req.param('examId'), c.get('user')))) throw bad('Bạn không có quyền xem thông tin giao đề của đề thi này');
  return ok(c, (await all(c.env, `${CE_SELECT} WHERE ce.exam_id = ?`, c.req.param('examId'))).map(ceDto));
});
classExams.post('/exam/:examId/batch-sync', staff, async (c) => {
  const me = c.get('user');
  const examId = c.req.param('examId');
  if (!(await canManageExamAssign(c.env, examId, me))) throw bad('Bạn không có quyền thao tác với đề thi này');
  const b = await body(c);
  const list: any[] = Array.isArray(b.assignments) ? b.assignments : [];
  const keep = list.map((a) => String(a.classroomId));
  await run(c.env, `DELETE FROM class_exams WHERE exam_id = ? AND classroom_id NOT IN ${inList(keep.length)}`, examId, ...keep);
  for (const a of list) {
    const cls = await one<Cls>(c.env, 'SELECT * FROM classrooms WHERE id = ?', String(a.classroomId));
    if (!cls || !(await canManage(c.env, cls, me))) continue; // bỏ qua lớp không quản lý
    const ex = await one<{ id: string }>(c.env, 'SELECT id FROM class_exams WHERE exam_id = ? AND classroom_id = ?', examId, cls.id);
    if (ex) await run(c.env, 'UPDATE class_exams SET folder_id = ?, open_time = ?, close_time = ? WHERE id = ?', a.folderId ?? null, utcTime(a.openTime), utcTime(a.closeTime), ex.id);
    else await run(c.env, 'INSERT INTO class_exams (id, classroom_id, exam_id, open_time, close_time, folder_id, created_at) VALUES (?,?,?,?,?,?,?)', uuid(), cls.id, examId, utcTime(a.openTime), utcTime(a.closeTime), a.folderId ?? null, nowISO());
  }
  return ok(c, null);
});

export default classes;
