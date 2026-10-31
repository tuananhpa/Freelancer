import { Hono } from 'hono';
import { nDto } from '../lib/notify';
import type { AppEnv, Bindings, UserRow } from '../types';
import { bad, body, notFound, pageParams, raw, springPage, str, uuid } from '../lib/http';
import { auth, isStaff } from '../lib/auth';
import { all, count, one, run } from '../db';
import { javaTime, nowISO, todayVN, utcTime } from '../lib/time';
import { gamificationStats } from './gamification';

/* ===================== Thông báo ===================== */
export const notifications = new Hono<AppEnv>();
notifications.use('*', auth());
notifications.get('/', async (c) => {
  const me = c.get('user');
  const { page, size, offset } = pageParams(c, 20, 100);
  const where = ['user_id = ?'];
  const p: unknown[] = [me.id];
  if (c.req.query('type')) { where.push('type = ?'); p.push(c.req.query('type')); }
  if (c.req.query('unreadOnly') === 'true') where.push('is_read = 0');
  const w = where.join(' AND ');
  const rows = await all(c.env, `SELECT * FROM notifications WHERE ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`, ...p, size, offset);
  return raw(c, springPage(rows.map(nDto), await count(c.env, `SELECT COUNT(*) AS n FROM notifications WHERE ${w}`, ...p), page, size));
});
notifications.get('/unread-count', async (c) => raw(c, await count(c.env, 'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0', c.get('user').id)));
notifications.put('/read-all', async (c) => { await run(c.env, 'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', c.get('user').id); return c.body(null, 200); });
notifications.delete('/clear-read', async (c) => { await run(c.env, 'DELETE FROM notifications WHERE user_id = ? AND is_read = 1', c.get('user').id); return c.body(null, 204); });
notifications.put('/:id/read', async (c) => { await run(c.env, 'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', c.req.param('id'), c.get('user').id); return c.body(null, 200); });
notifications.delete('/:id', async (c) => { await run(c.env, 'DELETE FROM notifications WHERE id = ? AND user_id = ?', c.req.param('id'), c.get('user').id); return c.body(null, 204); });

/* ===================== Thống kê dashboard ===================== */
const months12 = () => new Date(Date.now() - 365 * 86_400_000).toISOString();
const byMonth = async (env: Bindings, sql: string, ...p: unknown[]) => (await all<{ month: string; count: number }>(env, sql, ...p)).map((r) => ({ month: r.month, count: r.count }));
async function studentStats(env: Bindings, u: UserRow) {
  const rows = await all<any>(env, `SELECT r.id, r.total_score, r.submitted_at, e.title, (SELECT COALESCE(SUM(points),0) FROM questions q WHERE q.exam_id = r.exam_id) AS max_score
     FROM student_exam_results r LEFT JOIN exams e ON e.id = r.exam_id WHERE r.student_id = ? AND r.submitted_at IS NOT NULL ORDER BY r.submitted_at DESC`, u.id);
  const pctAvg = rows.length ? rows.reduce((s, r) => s + (r.max_score > 0 ? ((r.total_score ?? 0) / r.max_score) * 100 : 0), 0) / rows.length : 0;
  // Chuỗi ngày nộp bài liên tiếp (tính đến hôm nay hoặc hôm qua)
  const days = [...new Set(rows.map((r) => todayVN(Date.parse(r.submitted_at))))];
  let streak = 0;
  if (days.length) {
    const today = todayVN();
    const yday = todayVN(Date.now() - 86_400_000);
    if (days[0] === today || days[0] === yday) {
      streak = 1;
      for (let i = 1; i < days.length && Date.parse(days[i - 1]) - Date.parse(days[i]) === 86_400_000; i++) streak++;
    }
  }
  const skills = await all<any>(env, `SELECT q.skill_tag AS skill, SUM(a.points_earned) AS earned, SUM(q.points) AS max FROM student_answers a JOIN student_exam_results r ON r.id = a.result_id JOIN questions q ON q.id = a.question_id
     WHERE r.student_id = ? AND r.submitted_at IS NOT NULL AND q.skill_tag IS NOT NULL GROUP BY q.skill_tag`, u.id);
  const g = await gamificationStats(env, u.id);
  const history = (n: number) => rows.slice(0, n).map((r) => { const ten = r.max_score > 0 ? ((r.total_score ?? 0) / r.max_score) * 10 : r.total_score ?? 0;
    return { resultId: r.id, examTitle: r.title ?? 'Đề đã xóa', scorePercent: Math.round(ten * 10) / 10, score: Math.round((r.total_score ?? 0) * 10) / 10, maxScore: r.max_score, submittedAt: javaTime(r.submitted_at) ?? '' }; });
  return {
    summary: {
      enrolledCourses: await count(env, 'SELECT COUNT(*) AS n FROM enrollments WHERE student_id = ?', u.id),
      completedLessons: await count(env, 'SELECT COUNT(*) AS n FROM lesson_progress WHERE student_id = ? AND is_completed = 1', u.id),
      totalExamsTaken: rows.length, averageExamScore: Math.round(pctAvg * 10) / 10, learningStreakDays: streak,
      radarSkills: skills.length ? skills.map((s) => ({ subject: s.skill, score: s.max > 0 ? Math.round((s.earned / s.max) * 100) : 0, fullMark: 100 }))
        : ['GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING', 'WRITING'].map((s) => ({ subject: s, score: 0, fullMark: 100 })),
      examHistory: history(8), totalXp: g.totalXp, currentStreak: g.currentStreak, badges: g.badges,
    },
    history, recent: g.recentActivities,
  };
}
export const analytics = new Hono<AppEnv>();
analytics.use('*', auth());
analytics.get('/admin', auth('ADMIN', 'OFFICE'), async (c) => raw(c, {
  totalUsers: await count(c.env, 'SELECT COUNT(*) AS n FROM users'), totalTeachers: await count(c.env, "SELECT COUNT(*) AS n FROM users WHERE role = 'TEACHER'"),
  totalStudents: await count(c.env, "SELECT COUNT(*) AS n FROM users WHERE role = 'STUDENT'"), totalCourses: await count(c.env, 'SELECT COUNT(*) AS n FROM courses'),
  totalClasses: await count(c.env, 'SELECT COUNT(*) AS n FROM classrooms'), totalExams: await count(c.env, 'SELECT COUNT(*) AS n FROM exams'),
  newUsersByMonth: await byMonth(c.env, "SELECT substr(created_at,1,7) AS month, COUNT(*) AS count FROM users WHERE created_at >= ? GROUP BY month ORDER BY month", months12()),
}));
analytics.get('/teacher', async (c) => {
  const me = c.get('user');
  return raw(c, {
    totalCourses: await count(c.env, 'SELECT COUNT(*) AS n FROM courses WHERE teacher_id = ?', me.id), totalExams: await count(c.env, 'SELECT COUNT(*) AS n FROM exams WHERE teacher_id = ?', me.id),
    // Java chỉ đếm học viên khóa học; trường học dùng lớp nên đếm cả học sinh trong các lớp mình dạy
    totalStudents: await count(c.env, `SELECT COUNT(DISTINCT id) AS n FROM (SELECT e.student_id AS id FROM enrollments e JOIN courses co ON co.id = e.course_id WHERE co.teacher_id = ?
       UNION SELECT m.user_id FROM class_members m JOIN classrooms cl ON cl.id = m.classroom_id WHERE m.role = 'STUDENT' AND (cl.teacher_id = ? OR cl.id IN (SELECT classroom_id FROM class_members WHERE user_id = ? AND role IN ('TEACHER','TA'))))`, me.id, me.id, me.id),
    totalDecks: await count(c.env, 'SELECT COUNT(*) AS n FROM flashcard_decks WHERE owner_id = ?', me.id),
    enrollmentsByMonth: await byMonth(c.env, 'SELECT substr(e.enrolled_at,1,7) AS month, COUNT(*) AS count FROM enrollments e JOIN courses co ON co.id = e.course_id WHERE co.teacher_id = ? GROUP BY month ORDER BY month', me.id),
  });
});
analytics.get('/student', async (c) => raw(c, (await studentStats(c.env, c.get('user'))).summary));
analytics.get('/progress-report', async (c) => {
  const s = await studentStats(c.env, c.get('user'));
  return raw(c, { summary: s.summary, examHistory: s.history(10), recentActivities: s.recent });
});

/* ===================== Lịch ===================== */
/** CalendarService: hạn bài tập & đề của các lớp mình là thành viên (+ đề của giáo viên có giờ kết thúc) */
export const calendar = new Hono<AppEnv>();
calendar.use('*', auth());
calendar.get('/events', async (c) => {
  const me = c.get('user');
  const from = utcTime(`${c.req.query('from')}T00:00:00`), toD = c.req.query('to');
  if (!from || !toD) throw bad('Thiếu khoảng ngày.');
  const to = new Date(Date.parse(utcTime(`${toD}T00:00:00`)!) + 86_400_000).toISOString();
  const cls = `SELECT classroom_id FROM class_members WHERE user_id = ? UNION SELECT id FROM classrooms WHERE teacher_id = ?`;
  const a = await all<any>(c.env, `SELECT a.id, a.title, a.due_date AS start, cl.name FROM assignments a JOIN classrooms cl ON cl.id = a.classroom_id WHERE a.classroom_id IN (${cls}) AND a.due_date >= ? AND a.due_date < ?`, me.id, me.id, from, to);
  const e = await all<any>(c.env, `SELECT e.id, e.title, ce.close_time AS start, cl.name FROM class_exams ce JOIN exams e ON e.id = ce.exam_id JOIN classrooms cl ON cl.id = ce.classroom_id WHERE ce.classroom_id IN (${cls}) AND ce.close_time >= ? AND ce.close_time < ?`, me.id, me.id, from, to);
  const own = me.role === 'TEACHER' ? await all<any>(c.env, 'SELECT id, title, end_time AS start FROM exams WHERE teacher_id = ? AND end_time >= ? AND end_time < ?', me.id, from, to) : [];
  const ev = [
    ...a.map((x) => ({ id: x.id, title: x.title, type: 'ASSIGNMENT', start: javaTime(x.start), classroomName: x.name, link: `/assignments/${x.id}/take` })),
    ...e.map((x) => ({ id: x.id, title: x.title, type: 'EXAM', start: javaTime(x.start), classroomName: x.name, link: `/exams/take/${x.id}` })),
    ...own.map((x) => ({ id: x.id, title: x.title, type: 'EXAM', start: javaTime(x.start), classroomName: 'Đề thi của bạn', link: '/exams' })),
  ].sort((x, y) => String(x.start).localeCompare(String(y.start)));
  return raw(c, ev);
});
/** CalendarEventController (/api/v1/calendar, frontend gọi /api/calendar): sự kiện của khóa học + sự kiện chung */
const evDto = (x: any) => ({ id: x.id, courseId: x.course_id, courseName: x.course_title, title: x.title, description: x.description, eventType: x.event_type, startTime: javaTime(x.start_time), endTime: javaTime(x.end_time), meetingLink: x.meeting_link });
const listCalendarEvents = async (c: any) => {
  const me = c.get('user');
  const start = utcTime(c.req.query('start')) ?? new Date(0).toISOString(), end = utcTime(c.req.query('end')) ?? '9999';
  const courses = isStaff(me) ? 'SELECT id FROM courses WHERE teacher_id = ?' : 'SELECT course_id FROM enrollments WHERE student_id = ?';
  const rows = await all(c.env, `SELECT ev.*, co.title AS course_title FROM calendar_events ev LEFT JOIN courses co ON co.id = ev.course_id WHERE (ev.course_id IS NULL OR ev.course_id IN (${courses})) AND ev.start_time < ? AND (ev.end_time IS NULL OR ev.end_time >= ?) ORDER BY ev.start_time`, me.id, end, start);
  return raw(c, rows.map(evDto));
};
const createCalendarEvent = async (c: any) => {
  const me = c.get('user');
  if (!isStaff(me)) throw bad('Chỉ giáo viên được tạo sự kiện.');
  const b = await body(c);
  if (b.courseId && !(await one(c.env, 'SELECT 1 AS x FROM courses WHERE id = ?', String(b.courseId)))) throw notFound('Không tìm thấy khóa học.');
  const id = uuid();
  await run(c.env, 'INSERT INTO calendar_events (id, course_id, title, description, event_type, start_time, end_time, meeting_link, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    id, b.courseId ?? null, str(b.title, 'Tiêu đề', 255), b.description ?? null, ['DEADLINE', 'LIVE_SESSION', 'EXAM', 'OTHER'].includes(b.eventType) ? b.eventType : 'OTHER', utcTime(b.startTime), utcTime(b.endTime), b.meetingLink ?? null, nowISO(), nowISO());
  return raw(c, evDto(await one(c.env, 'SELECT ev.*, co.title AS course_title FROM calendar_events ev LEFT JOIN courses co ON co.id = ev.course_id WHERE ev.id = ?', id)));
};
calendar.get('/', listCalendarEvents);
calendar.post('/', createCalendarEvent);
export const calendarV1 = new Hono<AppEnv>();
calendarV1.use('*', auth());
calendarV1.get('/', listCalendarEvents);
calendarV1.post('/', createCalendarEvent);

/* ===================== Nhật ký hệ thống ===================== */
/** Ghi nhật ký thao tác quản trị (AuditLogService.logAction) — không chặn request nếu lỗi */
export async function audit(env: Bindings, u: UserRow | null, action: 'CREATE' | 'UPDATE' | 'DELETE', entity: string, entityId: string, prev: unknown, next: unknown, ip: string | null) {
  await run(env, 'INSERT INTO audit_logs (id, user_id, action, entity_name, entity_id, previous_state, new_state, ip_address, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    uuid(), u?.id ?? null, action, entity, entityId, prev == null ? null : JSON.stringify(prev), next == null ? null : JSON.stringify(next), ip, nowISO()).catch(() => {});
}
export const auditLogs = new Hono<AppEnv>();
auditLogs.get('/', auth('ADMIN'), async (c) => {
  const { page, size, offset } = pageParams(c, 20, 200);
  const rows = await all<any>(c.env, 'SELECT l.*, u.email FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id ORDER BY l.created_at DESC LIMIT ? OFFSET ?', size, offset);
  const parse = (s: string | null) => { try { return s ? JSON.parse(s) : null; } catch { return s; } };
  return raw(c, springPage(rows.map((l) => ({ id: l.id, userId: l.user_id, userEmail: l.email, action: l.action, entityName: l.entity_name, entityId: l.entity_id, previousState: parse(l.previous_state), newState: parse(l.new_state), ipAddress: l.ip_address, createdAt: javaTime(l.created_at) })),
    await count(c.env, 'SELECT COUNT(*) AS n FROM audit_logs'), page, size));
});

/* ===================== Tìm kiếm ===================== */
export const search = new Hono<AppEnv>();
search.get('/', auth(), async (c) => {
  const me = c.get('user');
  const q = (c.req.query('q') || '').trim();
  if (q.length < 2) return raw(c, []);
  const like = `%${q.toLowerCase()}%`;
  const out: any[] = [];
  const add = (x: any) => { if (!out.some((y) => y.type === x.type && y.id === x.id)) out.push(x); };
  const staff = isStaff(me);
  for (const co of await all<any>(c.env, `SELECT id, title, status FROM courses WHERE lower(title) LIKE ? AND (status = 'PUBLISHED'${staff ? ' OR teacher_id = ?' : ''}) LIMIT 10`, like, ...(staff ? [me.id] : [])))
    add({ type: 'COURSE', id: co.id, title: co.title, subtitle: co.status ?? 'Khóa học', link: `/courses/${co.id}` });
  for (const e of await all<any>(c.env, `SELECT id, title, is_published FROM exams WHERE lower(title) LIKE ? AND (is_published = 1${staff ? ' OR teacher_id = ?' : ''}) LIMIT 10`, like, ...(staff ? [me.id] : [])))
    add({ type: 'EXAM', id: e.id, title: e.title, subtitle: e.is_published ? 'Đề thi' : 'Bản nháp', link: `/exams/take/${e.id}` });
  for (const d of await all<any>(c.env, "SELECT id, title, visibility FROM flashcard_decks WHERE lower(title) LIKE ? AND (visibility = 'PUBLIC' OR owner_id = ?) LIMIT 10", like, me.id))
    add({ type: 'DECK', id: d.id, title: d.title, subtitle: d.visibility === 'PUBLIC' ? 'Quizcard công khai' : 'Quizcard của bạn', link: `/quizcards/${d.id}/study` });
  for (const cl of await all<any>(c.env, 'SELECT c.id, c.name, c.subject FROM classrooms c JOIN class_members m ON m.classroom_id = c.id WHERE m.user_id = ? AND lower(c.name) LIKE ? LIMIT 5', me.id, like))
    add({ type: 'CLASS', id: cl.id, title: cl.name, subtitle: cl.subject ?? 'Lớp học', link: `/classes/${cl.id}` });
  return raw(c, out.sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' })).slice(0, 20));
});

/* ===================== Thư mục nội dung của giáo viên ===================== */
const fDto = async (env: Bindings, f: any) => ({ id: f.id, name: f.name, description: f.description, color: f.color, createdAt: javaTime(f.created_at),
  examCount: await count(env, 'SELECT COUNT(*) AS n FROM exams WHERE folder_id = ?', f.id), deckCount: await count(env, 'SELECT COUNT(*) AS n FROM flashcard_decks WHERE folder_id = ?', f.id) });
export const folders = new Hono<AppEnv>();
folders.use('*', auth());
folders.get('/', async (c) => {
  const me = c.get('user');
  const { page, size, offset } = pageParams(c, 20, 200);
  const rows = await all(c.env, 'SELECT * FROM content_folders WHERE owner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', me.id, size, offset);
  return raw(c, springPage(await Promise.all(rows.map((f) => fDto(c.env, f))), await count(c.env, 'SELECT COUNT(*) AS n FROM content_folders WHERE owner_id = ?', me.id), page, size));
});
folders.post('/', async (c) => {
  const b = await body(c);
  const id = uuid();
  await run(c.env, 'INSERT INTO content_folders (id, name, description, color, owner_id, created_at) VALUES (?,?,?,?,?,?)', id, str(b.name, 'Tên folder', 255), b.description ?? null, b.color || 'cam', c.get('user').id, nowISO());
  return raw(c, await fDto(c.env, await one(c.env, 'SELECT * FROM content_folders WHERE id = ?', id)));
});
folders.delete('/:id', async (c) => {
  const f = await one<any>(c.env, 'SELECT * FROM content_folders WHERE id = ?', c.req.param('id'));
  if (!f) throw notFound('Không tìm thấy folder.');
  if (f.owner_id !== c.get('user').id) throw bad('Bạn không có quyền truy cập folder này.');
  await run(c.env, 'UPDATE exams SET folder_id = NULL WHERE folder_id = ?', f.id);
  await run(c.env, 'UPDATE flashcard_decks SET folder_id = NULL WHERE folder_id = ?', f.id);
  await run(c.env, 'DELETE FROM content_folders WHERE id = ?', f.id);
  return c.body(null, 204);
});
