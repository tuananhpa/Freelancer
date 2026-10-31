import { Hono } from 'hono';
import type { AppEnv, Bindings, UserRow } from '../types';
import { bad, body, forbidden, notFound, pageParams, raw, springPage, str, uuid } from '../lib/http';
import { auth } from '../lib/auth';
import { all, batch, count, inList, one, parseJson, run } from '../db';
import { javaTime, nowISO } from '../lib/time';
import { notify } from '../lib/notify';

type Env = Bindings;
const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const CONTENT_TYPES = ['VIDEO', 'PDF', 'TEXT', 'YOUTUBE'];
const lessonDto = (l: any) => ({ id: l.id, title: l.title, content: l.content, resourceUrl: l.resource_url, contentType: l.content_type ?? 'TEXT', durationMinutes: l.duration_minutes, orderIndex: l.order_index, isFree: !!l.is_free });
const courseBase = (c: any) => ({ id: c.id, title: c.title, description: c.description, thumbnailUrl: c.thumbnail_url, status: c.status, createdAt: javaTime(c.created_at), updatedAt: javaTime(c.updated_at) });
/** Course entity được Jackson trả cả cây sections → lessons */
async function courseDtos(env: Env, rows: any[]) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const secs = await all<any>(env, `SELECT * FROM sections WHERE course_id IN ${inList(ids.length)} ORDER BY order_index`, ...ids);
  const lessons = secs.length ? await all<any>(env, `SELECT * FROM lessons WHERE section_id IN ${inList(secs.length)} ORDER BY order_index`, ...secs.map((s) => s.id)) : [];
  return rows.map((c) => ({ ...courseBase(c), sections: secs.filter((s) => s.course_id === c.id).map((s) => ({ id: s.id, title: s.title, orderIndex: s.order_index, lessons: lessons.filter((l) => l.section_id === s.id).map(lessonDto) })) }));
}
const courseDto = async (env: Env, c: any) => (await courseDtos(env, [c]))[0];
async function getCourse(env: Env, id: string) {
  const c = await one<any>(env, 'SELECT * FROM courses WHERE id = ?', id);
  if (!c) throw notFound('Không tìm thấy khóa học.');
  return c;
}
// Java không kiểm tra chủ khóa học khi sửa/xóa; ở đây chỉ giáo viên tạo hoặc ADMIN
function assertOwner(c: any, u: UserRow) {
  if (u.role !== 'ADMIN' && c.teacher_id !== u.id) throw forbidden('Bạn không có quyền chỉnh sửa khóa học này.');
}
const courseOfSection = async (env: Env, sid: string) => {
  const s = await one<any>(env, 'SELECT s.*, c.teacher_id FROM sections s JOIN courses c ON c.id = s.course_id WHERE s.id = ?', sid);
  if (!s) throw notFound('Không tìm thấy chương.');
  return s;
};
const courseOfLesson = async (env: Env, lid: string) => {
  const l = await one<any>(env, 'SELECT l.*, s.course_id, c.teacher_id, c.title AS course_title FROM lessons l JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE l.id = ?', lid);
  if (!l) throw notFound('Không tìm thấy bài học.');
  return l;
};
const lessonDeletes = (where: string, ...p: unknown[]): [string, ...unknown[]][] => [
  [`DELETE FROM lesson_progress WHERE lesson_id IN (SELECT id FROM lessons WHERE ${where})`, ...p],
  [`DELETE FROM lesson_comments WHERE parent_id IS NOT NULL AND lesson_id IN (SELECT id FROM lessons WHERE ${where})`, ...p],
  [`DELETE FROM lesson_comments WHERE lesson_id IN (SELECT id FROM lessons WHERE ${where})`, ...p],
  [`DELETE FROM lessons WHERE ${where}`, ...p],
];

const co = new Hono<AppEnv>();
co.use('*', auth());
const staff = auth('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN');

co.get('/', async (c) => {
  const { page, size, offset } = pageParams(c, 10, 100);
  const rows = await all(c.env, "SELECT * FROM courses WHERE status = 'PUBLISHED' ORDER BY created_at DESC LIMIT ? OFFSET ?", size, offset);
  return raw(c, springPage(await courseDtos(c.env, rows), await count(c.env, "SELECT COUNT(*) AS n FROM courses WHERE status = 'PUBLISHED'"), page, size));
});
co.get('/teacher', async (c) => {
  const { page, size, offset } = pageParams(c, 10, 100);
  const me = c.get('user');
  const rows = await all(c.env, 'SELECT * FROM courses WHERE teacher_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', me.id, size, offset);
  return raw(c, springPage(await courseDtos(c.env, rows), await count(c.env, 'SELECT COUNT(*) AS n FROM courses WHERE teacher_id = ?', me.id), page, size));
});
co.get('/my-enrollments', async (c) => {
  const { page, size, offset } = pageParams(c, 10, 100);
  const me = c.get('user');
  const rows = await all<any>(c.env, 'SELECT e.id AS eid, e.enrolled_at, c.* FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.student_id = ? ORDER BY e.enrolled_at DESC LIMIT ? OFFSET ?', me.id, size, offset);
  return raw(c, springPage(rows.map((r) => ({ id: r.eid, enrolledAt: javaTime(r.enrolled_at), course: { id: r.id, title: r.title, description: r.description, thumbnailUrl: r.thumbnail_url, status: r.status } })), await count(c.env, 'SELECT COUNT(*) AS n FROM enrollments WHERE student_id = ?', me.id), page, size));
});
co.get('/:id', async (c) => {
  const course = await getCourse(c.env, c.req.param('id'));
  const me = c.get('user');
  if (course.status !== 'PUBLISHED' && me.role !== 'ADMIN' && course.teacher_id !== me.id && !(await one(c.env, 'SELECT 1 AS x FROM enrollments WHERE course_id = ? AND student_id = ?', course.id, me.id))) throw notFound('Không tìm thấy khóa học.');
  return raw(c, await courseDto(c.env, course));
});
const courseFields = (b: any, create: boolean) => {
  if (create || b.title != null) str(b.title, 'Tiêu đề', 255);
  if (b.status != null && !STATUSES.includes(b.status)) throw bad('Trạng thái không hợp lệ.');
  return b;
};
co.post('/', staff, async (c) => {
  const b = courseFields(await body(c), true);
  const id = uuid();
  await run(c.env, 'INSERT INTO courses (id, title, description, thumbnail_url, teacher_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)', id, b.title.trim(), b.description ?? null, b.thumbnailUrl ?? null, c.get('user').id, b.status ?? 'DRAFT', nowISO(), nowISO());
  return raw(c, await courseDto(c.env, await getCourse(c.env, id)));
});
co.put('/:id', staff, async (c) => {
  const course = await getCourse(c.env, c.req.param('id'));
  assertOwner(course, c.get('user'));
  const b = courseFields(await body(c), false);
  await run(c.env, 'UPDATE courses SET title = COALESCE(?, title), description = COALESCE(?, description), thumbnail_url = COALESCE(?, thumbnail_url), status = COALESCE(?, status), updated_at = ? WHERE id = ?', b.title?.trim() ?? null, b.description ?? null, b.thumbnailUrl ?? null, b.status ?? null, nowISO(), course.id);
  return raw(c, await courseDto(c.env, await getCourse(c.env, course.id)));
});
co.delete('/:id', staff, async (c) => {
  const course = await getCourse(c.env, c.req.param('id'));
  assertOwner(course, c.get('user'));
  const id = course.id;
  const inSections = 'section_id IN (SELECT id FROM sections WHERE course_id = ?)';
  await batch(c.env, [
    ...lessonDeletes(inSections, id),
    ['DELETE FROM sections WHERE course_id = ?', id],
    ['DELETE FROM discussion_replies WHERE discussion_id IN (SELECT id FROM discussions WHERE course_id = ?)', id],
    ['DELETE FROM discussions WHERE course_id = ?', id],
    ['DELETE FROM certificates WHERE course_id = ?', id],
    ['DELETE FROM enrollments WHERE course_id = ?', id],
    ['DELETE FROM classroom_courses WHERE course_id = ?', id],
    ['UPDATE assignments SET course_id = NULL WHERE course_id = ?', id],
    ['DELETE FROM courses WHERE id = ?', id],
  ]);
  return c.body(null, 200);
});
co.post('/:id/enroll', async (c) => {
  const course = await getCourse(c.env, c.req.param('id'));
  const me = c.get('user');
  if (course.status !== 'PUBLISHED' && course.teacher_id !== me.id) throw bad('Khóa học chưa được mở.');
  if (await one(c.env, 'SELECT 1 AS x FROM enrollments WHERE student_id = ? AND course_id = ?', me.id, course.id)) throw bad('Bạn đã tham gia khóa học này rồi.');
  const id = uuid(), at = nowISO();
  await run(c.env, 'INSERT INTO enrollments (id, student_id, course_id, enrolled_at) VALUES (?,?,?,?)', id, me.id, course.id, at);
  if (course.teacher_id !== me.id) await notify(c.env, course.teacher_id, 'Học viên mới đăng ký khóa học', `${me.full_name} đã đăng ký tham gia khóa học '${course.title}'`, `/courses/${course.id}`, 'COURSE', me, 'COURSE_ENROLLMENT', id);
  return raw(c, { id, course: courseBase(course), enrolledAt: javaTime(at) });
});
const progressDto = (p: any) => ({ id: p.id, completed: !!p.is_completed, isCompleted: !!p.is_completed, completedAt: javaTime(p.completed_at), lessonId: p.lesson_id });
co.post('/lessons/:lid/complete', async (c) => {
  const l = await courseOfLesson(c.env, c.req.param('lid'));
  const me = c.get('user');
  await run(c.env, 'INSERT INTO lesson_progress (id, student_id, lesson_id, is_completed, completed_at) VALUES (?,?,?,1,?) ON CONFLICT (student_id, lesson_id) DO UPDATE SET is_completed = 1, completed_at = excluded.completed_at', uuid(), me.id, l.id, nowISO());
  return raw(c, progressDto(await one(c.env, 'SELECT * FROM lesson_progress WHERE student_id = ? AND lesson_id = ?', me.id, l.id)));
});
co.get('/:id/progress', async (c) => {
  const course = await getCourse(c.env, c.req.param('id'));
  const rows = await all(c.env, 'SELECT p.* FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = ? AND p.student_id = ?', course.id, c.get('user').id);
  return raw(c, rows.map(progressDto));
});
co.post('/:id/sections', staff, async (c) => {
  const course = await getCourse(c.env, c.req.param('id'));
  assertOwner(course, c.get('user'));
  const title = str((await body(c)).title, 'Tên chương', 255)!.trim();
  const id = uuid(), idx = await count(c.env, 'SELECT COUNT(*) AS n FROM sections WHERE course_id = ?', course.id);
  await run(c.env, 'INSERT INTO sections (id, title, order_index, course_id) VALUES (?,?,?,?)', id, title, idx, course.id);
  return raw(c, { id, title, orderIndex: idx, lessons: [] });
});
co.put('/sections/:sid', staff, async (c) => {
  const s = await courseOfSection(c.env, c.req.param('sid'));
  assertOwner(s, c.get('user'));
  const b = await body(c);
  await run(c.env, 'UPDATE sections SET title = ?, order_index = COALESCE(?, order_index) WHERE id = ?', str(b.title, 'Tên chương', 255)!.trim(), b.orderIndex ?? null, s.id);
  const lessons = await all(c.env, 'SELECT * FROM lessons WHERE section_id = ? ORDER BY order_index', s.id);
  const n = await one<any>(c.env, 'SELECT * FROM sections WHERE id = ?', s.id);
  return raw(c, { id: n.id, title: n.title, orderIndex: n.order_index, lessons: lessons.map(lessonDto) });
});
co.delete('/sections/:sid', staff, async (c) => {
  const s = await courseOfSection(c.env, c.req.param('sid'));
  assertOwner(s, c.get('user'));
  await batch(c.env, [...lessonDeletes('section_id = ?', s.id), ['DELETE FROM sections WHERE id = ?', s.id]]);
  return c.body(null, 200);
});
const lessonFields = (b: any) => {
  if (b.contentType != null && !CONTENT_TYPES.includes(b.contentType)) throw bad('Loại nội dung không hợp lệ.');
  if (b.resourceUrl && !/^https?:\/\//i.test(b.resourceUrl)) throw bad('Đường dẫn tài nguyên không hợp lệ.');
  return b;
};
co.post('/sections/:sid/lessons', staff, async (c) => {
  const s = await courseOfSection(c.env, c.req.param('sid'));
  assertOwner(s, c.get('user'));
  const b = lessonFields(await body(c));
  const id = uuid(), idx = await count(c.env, 'SELECT COUNT(*) AS n FROM lessons WHERE section_id = ?', s.id);
  // Java addLesson chỉ lấy title/content/resourceUrl; giữ thêm contentType/duration/isFree vì form có gửi
  await run(c.env, 'INSERT INTO lessons (id, title, content, resource_url, content_type, duration_minutes, order_index, is_free, section_id) VALUES (?,?,?,?,?,?,?,?,?)', id, str(b.title, 'Tên bài học', 255)!.trim(), b.content ?? null, b.resourceUrl ?? null, b.contentType ?? 'TEXT', b.durationMinutes ?? null, idx, b.isFree ? 1 : 0, s.id);
  return raw(c, lessonDto(await one(c.env, 'SELECT * FROM lessons WHERE id = ?', id)));
});
co.put('/lessons/:lid', staff, async (c) => {
  const l = await courseOfLesson(c.env, c.req.param('lid'));
  assertOwner(l, c.get('user'));
  const b = lessonFields(await body(c));
  let sectionId = l.section_id;
  const target = b.section?.id ?? b.sectionId;
  if (target && target !== l.section_id) {
    const ns = await courseOfSection(c.env, String(target));
    if (ns.course_id !== l.course_id) throw bad('Chỉ chuyển bài học trong cùng khóa học.');
    sectionId = ns.id;
  }
  await run(c.env, 'UPDATE lessons SET title = COALESCE(?, title), content = COALESCE(?, content), resource_url = COALESCE(?, resource_url), order_index = COALESCE(?, order_index), content_type = COALESCE(?, content_type), duration_minutes = COALESCE(?, duration_minutes), is_free = COALESCE(?, is_free), section_id = ? WHERE id = ?',
    b.title ?? null, b.content ?? null, b.resourceUrl ?? null, b.orderIndex ?? null, b.contentType ?? null, b.durationMinutes ?? null, b.isFree == null ? null : b.isFree ? 1 : 0, sectionId, l.id);
  return raw(c, lessonDto(await one(c.env, 'SELECT * FROM lessons WHERE id = ?', l.id)));
});
co.delete('/lessons/:lid', staff, async (c) => {
  const l = await courseOfLesson(c.env, c.req.param('lid'));
  assertOwner(l, c.get('user'));
  await batch(c.env, lessonDeletes('id = ?', l.id));
  return c.body(null, 200);
});

/* ---------------- Bình luận bài học ---------------- */
export const lessonComments = new Hono<AppEnv>();
lessonComments.use('*', auth());
const CM_SELECT = 'SELECT m.*, u.full_name, u.role FROM lesson_comments m JOIN users u ON u.id = m.user_id';
const cmDto = (m: any, replies?: any[]): Record<string, unknown> => ({ id: m.id, content: m.content, authorName: m.full_name, authorRole: m.role, createdAt: javaTime(m.created_at), parentId: m.parent_id, ...(replies ? { replies: replies.map((r) => cmDto(r)) } : { replies: null }) });
lessonComments.get('/', async (c) => {
  const lid = c.req.param('lessonId')!;
  const { page, size, offset } = pageParams(c, 20, 100);
  const top = await all<any>(c.env, `${CM_SELECT} WHERE m.lesson_id = ? AND m.parent_id IS NULL ORDER BY m.created_at DESC LIMIT ? OFFSET ?`, lid, size, offset);
  const reps = top.length ? await all<any>(c.env, `${CM_SELECT} WHERE m.parent_id IN ${inList(top.length)} ORDER BY m.created_at ASC`, ...top.map((t) => t.id)) : [];
  return raw(c, springPage(top.map((t) => cmDto(t, reps.filter((r) => r.parent_id === t.id))), await count(c.env, 'SELECT COUNT(*) AS n FROM lesson_comments WHERE lesson_id = ? AND parent_id IS NULL', lid), page, size));
});
lessonComments.post('/', async (c) => {
  const l = await courseOfLesson(c.env, c.req.param('lessonId')!);
  const me = c.get('user');
  const b = await body(c);
  const content = str(b.content, 'Bình luận', 1000)!.trim();
  // shortcut như Java: một cấp trả lời; trả lời vào reply thì gắn về bình luận gốc
  const parent = b.parentId ? await one<any>(c.env, 'SELECT * FROM lesson_comments WHERE id = ? AND lesson_id = ?', String(b.parentId), l.id) : null;
  const pid = parent ? parent.parent_id ?? parent.id : null;
  const id = uuid();
  await run(c.env, 'INSERT INTO lesson_comments (id, content, lesson_id, user_id, parent_id, created_at) VALUES (?,?,?,?,?,?)', id, content, l.id, me.id, pid, nowISO());
  const link = `/courses/${l.course_id}`;
  if (parent && parent.user_id !== me.id) await notify(c.env, parent.user_id, `Phản hồi bình luận trong bài học ${l.title}`, `${me.full_name} đã trả lời bình luận của bạn.`, link, 'COMMENT', me, 'LESSON_COMMENT', id);
  else if (!parent && l.teacher_id !== me.id) await notify(c.env, l.teacher_id, `Bình luận mới trong bài học ${l.title}`, `${me.full_name} đã để lại bình luận trong bài học của bạn.`, link, 'COMMENT', me, 'LESSON_COMMENT', id);
  return raw(c, cmDto(await one(c.env, `${CM_SELECT} WHERE m.id = ?`, id), []));
});

/* ---------------- Thảo luận khóa học ---------------- */
export const discussions = new Hono<AppEnv>();
discussions.use('*', auth());
const D_SELECT = 'SELECT d.*, u.full_name, u.avatar_url, (SELECT COUNT(*) FROM discussion_replies r WHERE r.discussion_id = d.id) AS reply_count FROM discussions d JOIN users u ON u.id = d.author_id';
const dDto = (d: any) => ({ id: d.id, courseId: d.course_id, authorId: d.author_id, authorName: d.full_name, authorAvatar: d.avatar_url, title: d.title, content: d.content, pinned: !!d.is_pinned, isPinned: !!d.is_pinned, resolved: !!d.is_resolved, isResolved: !!d.is_resolved, createdAt: javaTime(d.created_at), updatedAt: javaTime(d.updated_at), replyCount: d.reply_count ?? 0, replies: null as unknown });
const rDto = (r: any) => ({ id: r.id, discussionId: r.discussion_id, authorId: r.author_id, authorName: r.full_name, authorAvatar: r.avatar_url, content: r.content, acceptedAnswer: !!r.is_accepted_answer, isAcceptedAnswer: !!r.is_accepted_answer, createdAt: javaTime(r.created_at), updatedAt: javaTime(r.updated_at) });
discussions.get('/course/:cid', async (c) => {
  const { page, size, offset } = pageParams(c, 20, 100);
  const cid = c.req.param('cid');
  const rows = await all(c.env, `${D_SELECT} WHERE d.course_id = ? ORDER BY d.is_pinned DESC, d.created_at DESC LIMIT ? OFFSET ?`, cid, size, offset);
  return raw(c, springPage(rows.map(dDto), await count(c.env, 'SELECT COUNT(*) AS n FROM discussions WHERE course_id = ?', cid), page, size));
});
discussions.get('/:id', async (c) => {
  const d = await one<any>(c.env, `${D_SELECT} WHERE d.id = ?`, c.req.param('id'));
  if (!d) throw notFound('Không tìm thấy chủ đề thảo luận.');
  const reps = await all(c.env, 'SELECT r.*, u.full_name, u.avatar_url FROM discussion_replies r JOIN users u ON u.id = r.author_id WHERE r.discussion_id = ? ORDER BY r.created_at ASC', d.id);
  return raw(c, { ...dDto(d), replies: reps.map(rDto) });
});
discussions.post('/course/:cid', async (c) => {
  const course = await getCourse(c.env, c.req.param('cid'));
  const b = await body(c);
  const id = uuid();
  await run(c.env, 'INSERT INTO discussions (id, course_id, author_id, title, content, is_pinned, is_resolved, created_at, updated_at) VALUES (?,?,?,?,?,0,0,?,?)', id, course.id, c.get('user').id, str(b.title, 'Tiêu đề', 255)!.trim(), str(b.content, 'Nội dung', 20000), nowISO(), nowISO());
  return raw(c, dDto(await one(c.env, `${D_SELECT} WHERE d.id = ?`, id)));
});
discussions.post('/:id/replies', async (c) => {
  const d = await one<any>(c.env, 'SELECT * FROM discussions WHERE id = ?', c.req.param('id'));
  if (!d) throw notFound('Không tìm thấy chủ đề thảo luận.');
  const me = c.get('user');
  const id = uuid();
  await run(c.env, 'INSERT INTO discussion_replies (id, discussion_id, author_id, content, is_accepted_answer, created_at, updated_at) VALUES (?,?,?,?,0,?,?)', id, d.id, me.id, str((await body(c)).content, 'Nội dung', 20000), nowISO(), nowISO());
  if (d.author_id !== me.id) await notify(c.env, d.author_id, 'Phản hồi trong chủ đề thảo luận', `${me.full_name} đã trả lời chủ đề '${d.title}' của bạn.`, `/courses/${d.course_id}/discussions/${d.id}`, 'COMMENT', me, 'DISCUSSION_REPLY', id);
  return raw(c, rDto(await one(c.env, 'SELECT r.*, u.full_name, u.avatar_url FROM discussion_replies r JOIN users u ON u.id = r.author_id WHERE r.id = ?', id)));
});

/* ---------------- Chứng chỉ ---------------- */
export const certificates = new Hono<AppEnv>();
const CERT_SELECT = 'SELECT t.*, u.full_name, c.title FROM certificates t JOIN users u ON u.id = t.user_id JOIN courses c ON c.id = t.course_id';
const certDto = (t: any) => ({ id: t.id, userId: t.user_id, userName: t.full_name, courseId: t.course_id, courseName: t.title, issueDate: javaTime(t.issue_date), uniqueCode: t.unique_code, pdfUrl: t.pdf_url });
certificates.post('/issue/:cid/:sid', auth(), async (c) => {
  const me = c.get('user');
  if (me.id !== c.req.param('sid')) throw forbidden('Bạn chỉ có thể tự cấp chứng chỉ cho chính mình.');
  const course = await getCourse(c.env, c.req.param('cid'));
  if (await one(c.env, 'SELECT 1 AS x FROM certificates WHERE user_id = ? AND course_id = ?', me.id, course.id)) throw bad('Chứng chỉ cho khóa học này đã được cấp trước đó.');
  if (!(await one(c.env, 'SELECT 1 AS x FROM enrollments WHERE student_id = ? AND course_id = ?', me.id, course.id))) throw bad('Bạn cần tham gia khóa học trước khi nhận chứng chỉ.');
  const total = await count(c.env, 'SELECT COUNT(*) AS n FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = ?', course.id);
  const done = await count(c.env, 'SELECT COUNT(*) AS n FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = ? AND p.student_id = ? AND p.is_completed = 1', course.id, me.id);
  if (total === 0 || done < total) throw bad('Bạn cần hoàn thành tất cả bài học trước khi nhận chứng chỉ.');
  const id = uuid(), code = `CERT-${uuid().slice(0, 8).toUpperCase()}-${new Date().getUTCFullYear()}`;
  await run(c.env, 'INSERT INTO certificates (id, user_id, course_id, issue_date, unique_code) VALUES (?,?,?,?,?)', id, me.id, course.id, nowISO(), code);
  await notify(c.env, me.id, 'Chứng chỉ khóa học mới', `Chúc mừng bạn đã hoàn thành khóa học '${course.title}' và nhận được chứng chỉ (Mã: ${code})`, `/certificates/${code}`, 'CERTIFICATE', null, 'CERTIFICATE', id);
  return raw(c, certDto(await one(c.env, `${CERT_SELECT} WHERE t.id = ?`, id)));
});
certificates.get('/verify/:code', async (c) => {
  const t = await one(c.env, `${CERT_SELECT} WHERE t.unique_code = ?`, c.req.param('code'));
  if (!t) throw notFound('Không tìm thấy chứng chỉ.');
  return raw(c, certDto(t));
});
certificates.get('/my', auth(), async (c) => {
  const { page, size, offset } = pageParams(c, 10, 100);
  const me = c.get('user');
  const rows = await all(c.env, `${CERT_SELECT} WHERE t.user_id = ? ORDER BY t.issue_date DESC LIMIT ? OFFSET ?`, me.id, size, offset);
  return raw(c, springPage(rows.map(certDto), await count(c.env, 'SELECT COUNT(*) AS n FROM certificates WHERE user_id = ?', me.id), page, size));
});

/* ---------------- Lộ trình học (bài xếp trình độ) ---------------- */
type Q = [id: string, skill: string, content: string, options: Record<string, string>, correct: string];
const PLACEMENT: Q[] = [
  ['g1', 'GRAMMAR', 'Choose the correct form: She ___ to school every day.', { a: 'go', b: 'goes', c: 'going', d: 'gone' }, 'b'],
  ['g2', 'GRAMMAR', 'Which sentence is correct?', { a: "He don't like coffee.", b: "He doesn't likes coffee.", c: "He doesn't like coffee.", d: 'He not like coffee.' }, 'c'],
  ['g3', 'GRAMMAR', 'Fill in: If I ___ rich, I would travel the world.', { a: 'am', b: 'was', c: 'were', d: 'be' }, 'c'],
  ['v1', 'VOCABULARY', "What is the meaning of 'generous'?", { a: 'Angry', b: 'Willing to give', c: 'Lazy', d: 'Quiet' }, 'b'],
  ['v2', 'VOCABULARY', "Choose the synonym of 'rapid':", { a: 'Slow', b: 'Quick', c: 'Heavy', d: 'Late' }, 'b'],
  ['v3', 'VOCABULARY', 'A person who treats patients is a:', { a: 'Teacher', b: 'Engineer', c: 'Doctor', d: 'Artist' }, 'c'],
  ['r1', 'READING', "Read: 'Tom wakes up at 6 AM and jogs before breakfast.' When does Tom jog?", { a: 'After dinner', b: 'Before breakfast', c: 'At noon', d: 'At midnight' }, 'b'],
  ['r2', 'READING', "Read: 'The library closes at 8 PM on weekdays.' When does it close on weekdays?", { a: '6 PM', b: '7 PM', c: '8 PM', d: '9 PM' }, 'c'],
  ['r3', 'READING', "Read: 'Maria moved to Hanoi last year for her new job.' Why did Maria move?", { a: 'For vacation', b: 'For her new job', c: 'For school', d: 'For family' }, 'b'],
  ['l1', 'LISTENING', "Script: 'Please turn to page 42.' What should students do?", { a: 'Close the book', b: 'Open page 42', c: 'Leave the room', d: 'Write an essay' }, 'b'],
  ['l2', 'LISTENING', "Script: 'The meeting starts at 3:30 in Room B.' When does the meeting start?", { a: '3:00', b: '3:15', c: '3:30', d: '4:30' }, 'c'],
  ['l3', 'LISTENING', "Script: 'Could you speak more slowly, please?' What does the speaker want?", { a: 'Louder voice', b: 'Faster speech', c: 'Slower speech', d: 'Written notes' }, 'c'],
  ['w1', 'WRITING', 'Choose the best sentence for a formal email opening:', { a: "Hey!!! What's up?", b: 'Dear Mr. Smith, I am writing to inquire about...', c: 'Yo bro,', d: 'Urgent!!! Read this!!!' }, 'b'],
  ['w2', 'WRITING', 'Which connector best shows contrast?', { a: 'Therefore', b: 'Moreover', c: 'However', d: 'Firstly' }, 'c'],
  ['w3', 'WRITING', 'Choose the correct punctuation:', { a: 'its raining', b: 'Its raining', c: "It's raining", d: "Its' raining" }, 'c'],
];
/** PlacementTestData.scoreAnswers: điểm 1..5 = round(1 + 4·đúng/tổng) cho từng kỹ năng */
export function scorePlacement(answers: Record<string, string>) {
  const out: Record<string, number> = {};
  for (const skill of ['GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING', 'WRITING']) {
    const qs = PLACEMENT.filter((q) => q[1] === skill);
    const ok = qs.filter((q) => answers[q[0]] === q[4]).length;
    out[skill] = qs.length ? Math.max(1, Math.min(5, Math.round(1 + (4 * ok) / qs.length))) : 3;
  }
  return out;
}
/** submitPlacement: (int) trung bình → mức */
export const levelOf = (scores: Record<string, number>) => {
  const v = Object.values(scores);
  const avg = v.length ? Math.trunc(v.reduce((a, b) => a + b, 0) / v.length) : 3;
  return avg <= 2 ? 'BEGINNER' : avg <= 3 ? 'INTERMEDIATE' : avg <= 4 ? 'UPPER_INTERMEDIATE' : 'ADVANCED';
};
console.assert(JSON.stringify(scorePlacement({ g1: 'b', g2: 'c', g3: 'c', v1: 'a' })) === '{"GRAMMAR":5,"VOCABULARY":1,"READING":1,"LISTENING":1,"WRITING":1}' && levelOf({ a: 5, b: 1, c: 1, d: 1, e: 1 }) === 'BEGINNER' && levelOf({ a: 4, b: 5 }) === 'UPPER_INTERMEDIATE', 'placement');

export const learningPath = new Hono<AppEnv>();
learningPath.use('*', auth());
async function savePlacement(env: Env, userId: string, scores: Record<string, number>) {
  const level = levelOf(scores);
  await run(env, 'INSERT INTO placement_results (id, user_id, skill_scores, recommended_level, completed_at) VALUES (?,?,?,?,?) ON CONFLICT (user_id) DO UPDATE SET skill_scores = excluded.skill_scores, recommended_level = excluded.recommended_level', uuid(), userId, JSON.stringify(scores), level, nowISO());
  return { completed: true, recommendedLevel: level, skillScores: scores };
}
learningPath.get('/status', async (c) => {
  const r = await one<any>(c.env, 'SELECT * FROM placement_results WHERE user_id = ?', c.get('user').id);
  return raw(c, r ? { completed: true, recommendedLevel: r.recommended_level, skillScores: parseJson(r.skill_scores, {}) } : { completed: false, recommendedLevel: null, skillScores: null });
});
learningPath.get('/placement-test', (c) => raw(c, { questions: PLACEMENT.map(([id, skillTag, content, options]) => ({ id, skillTag, content, options: Object.entries(options).map(([oid, text]) => ({ id: oid, content: text })) })) }));
learningPath.post('/placement-test/submit', async (c) => {
  const b = await body(c);
  return raw(c, await savePlacement(c.env, c.get('user').id, scorePlacement(b && typeof b === 'object' ? b : {})));
});
learningPath.post('/placement', async (c) => {
  const b = await body(c);
  const scores: Record<string, number> = {};
  for (const [k, v] of Object.entries(b ?? {})) { const n = Number(v); if (!Number.isInteger(n) || n < 1 || n > 5) throw bad('Điểm kỹ năng phải từ 1 đến 5.'); scores[k.slice(0, 30)] = n; }
  return raw(c, await savePlacement(c.env, c.get('user').id, scores));
});
learningPath.get('/recommendations', async (c) => {
  const r = await one<any>(c.env, 'SELECT skill_scores FROM placement_results WHERE user_id = ?', c.get('user').id);
  const scores: Record<string, number> = r ? parseJson(r.skill_scores, {}) : { GRAMMAR: 3, VOCABULARY: 3, READING: 3 };
  const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]?.[0] ?? 'VOCABULARY';
  const courses = await all<any>(c.env, "SELECT id, title FROM courses WHERE status = 'PUBLISHED' ORDER BY created_at DESC LIMIT 3");
  const decks = await all<any>(c.env, "SELECT id, title FROM flashcard_decks WHERE visibility = 'PUBLIC' ORDER BY created_at DESC LIMIT 3");
  return raw(c, { weakestSkill: weakest, items: [
    ...courses.map((x) => ({ type: 'COURSE', id: x.id, title: x.title, reason: `Gợi ý cải thiện kỹ năng ${weakest}`, link: `/courses/${x.id}` })),
    ...decks.map((x) => ({ type: 'DECK', id: x.id, title: x.title, reason: `Ôn từ vựng cho ${weakest}`, link: `/quizcards/${x.id}/study` })),
  ] });
});

export default co;
