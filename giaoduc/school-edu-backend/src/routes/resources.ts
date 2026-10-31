import { Hono } from 'hono';
import type { AppEnv, Bindings, UserRow } from '../types';
import { bad, body, notFound, ok, pageParams, raw, springPage, str, uuid } from '../lib/http';
import { auth, optionalAuth } from '../lib/auth';
import { all, batch, count, one, run } from '../db';
import { javaTime, nowISO } from '../lib/time';
import { notify } from '../lib/notify';

type Env = Bindings;
const R_SELECT = `SELECT r.*, u.full_name AS uploader_name, u.avatar_url AS uploader_avatar, u.role AS uploader_role, f.name AS folder_name, e.title AS exam_title
  FROM content_resources r LEFT JOIN users u ON u.id = r.uploader_id LEFT JOIN content_folders f ON f.id = r.folder_id LEFT JOIN exams e ON e.id = r.attached_exam_id`;
async function rDto(env: Env, r: any, u: UserRow | null) {
  const liked = u ? !!(await one(env, 'SELECT 1 AS x FROM resource_likes WHERE user_id = ? AND resource_id = ?', u.id, r.id)) : false;
  const saved = u ? !!(await one(env, 'SELECT 1 AS x FROM resource_bookmarks WHERE user_id = ? AND resource_id = ?', u.id, r.id)) : false;
  return {
    id: r.id, title: r.title, description: r.description, resourceType: r.resource_type, grade: r.grade, subject: r.subject, curriculumBook: r.curriculum_book, authorName: r.author_name,
    uploaderId: r.uploader_id, uploaderName: r.uploader_name, uploaderAvatar: r.uploader_avatar, uploaderRole: r.uploader_role, folderId: r.folder_id, folderName: r.folder_name,
    fileUrl: r.file_url, externalUrl: r.external_url, fileName: r.file_name, fileSize: r.file_size, fileFormat: r.file_format, attachedExamId: r.attached_exam_id, attachedExamTitle: r.exam_title,
    audioTranscript: r.audio_transcript, learningOutcomes: r.learning_outcomes, writingPrompt: r.writing_prompt, tags: r.tags, isPublic: !!r.is_public,
    viewCount: r.view_count ?? 0, likeCount: r.like_count ?? 0, bookmarkCount: r.bookmark_count ?? 0, isLiked: liked, isBookmarked: saved, createdAt: javaTime(r.created_at), updatedAt: javaTime(r.updated_at),
  };
}
async function getRes(env: Env, id: string) {
  const r = await one<any>(env, `${R_SELECT} WHERE r.id = ?`, id);
  if (!r) throw notFound('Không tìm thấy tài nguyên.');
  return r;
}
const TYPES = ['DOCUMENT', 'VIDEO', 'EXAM', 'SLIDE', 'AUDIO'];
const isUrl = (v: unknown) => v == null || v === '' || /^https?:\/\//i.test(String(v));
async function fields(env: Env, b: any, u: UserRow, isUpdate: boolean) {
  const type = String(b.resourceType || '').toUpperCase();
  if (!TYPES.includes(type)) throw bad('Loại tài nguyên không hợp lệ.');
  if (!b.grade || !b.subject) throw bad('Cần chọn khối lớp và môn học.');
  if (!isUrl(b.fileUrl) || !isUrl(b.externalUrl)) throw bad('Đường dẫn tệp không hợp lệ.');
  if (b.folderId && !(await one(env, 'SELECT 1 AS x FROM content_folders WHERE id = ?', String(b.folderId)))) throw notFound('Không tìm thấy thư mục.');
  if (b.attachedExamId) {
    const e = await one<any>(env, 'SELECT id, audio_url FROM exams WHERE id = ?', String(b.attachedExamId));
    if (!e) throw notFound('Không tìm thấy đề thi.');
    // backfillExamAudioUrl: học liệu nghe gắn đề chưa có audio thì dùng file này
    if (!e.audio_url && type === 'AUDIO' && b.fileUrl) await run(env, 'UPDATE exams SET audio_url = ? WHERE id = ?', b.fileUrl, e.id);
  }
  const f: Record<string, unknown> = {
    title: str(b.title, 'Tiêu đề', 500), description: b.description ?? null, resource_type: type, grade: String(b.grade).toUpperCase(), subject: String(b.subject).toUpperCase(), curriculum_book: b.curriculumBook ?? null,
    folder_id: b.folderId ?? null, file_url: b.fileUrl ?? null, external_url: b.externalUrl ?? null, file_name: b.fileName ?? null, file_size: b.fileSize ?? null, file_format: b.fileFormat ?? null,
    attached_exam_id: b.attachedExamId ?? null, audio_transcript: b.audioTranscript ?? null, learning_outcomes: b.learningOutcomes ?? null, writing_prompt: b.writingPrompt ?? null, tags: b.tags ?? null,
  };
  if (!isUpdate || (b.authorName && String(b.authorName).trim())) f.author_name = b.authorName && String(b.authorName).trim() ? String(b.authorName).trim() : u.full_name;
  if (!isUpdate || b.isPublic != null) f.is_public = b.isPublic === false ? 0 : 1;
  return f;
}
const canEdit = (r: any, u: UserRow) => u.role === 'ADMIN' || r.uploader_id === u.id;
const canManageSubs = (r: any, u: UserRow) => u.role === 'ADMIN' || u.role === 'OFFICE' || r.uploader_id === u.id;

const res = new Hono<AppEnv>();
const staffUpload = auth('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'OFFICE');

res.get('/', optionalAuth, async (c) => {
  const { page, size, offset } = pageParams(c, 12, 200);
  const where = ['r.is_public = 1'];
  const p: unknown[] = [];
  for (const [q, col] of [['resourceType', 'r.resource_type'], ['grade', 'r.grade'], ['subject', 'r.subject']] as const) {
    const v = c.req.query(q);
    if (v && v.toUpperCase() !== 'ALL') { where.push(`${col} = ?`); p.push(v.toUpperCase()); }
  }
  const s = c.req.query('search')?.trim().toLowerCase();
  if (s) { where.push('(lower(r.title) LIKE ? OR lower(r.description) LIKE ? OR lower(r.author_name) LIKE ? OR lower(r.tags) LIKE ?)'); p.push(...Array(4).fill(`%${s}%`)); }
  const w = where.join(' AND ');
  const sort = (c.req.query('sort') || '').startsWith('viewCount') ? 'r.view_count DESC' : (c.req.query('sort') || '').startsWith('likeCount') ? 'r.like_count DESC' : 'r.created_at DESC';
  const rows = await all(c.env, `${R_SELECT} WHERE ${w} ORDER BY ${sort} LIMIT ? OFFSET ?`, ...p, size, offset);
  const u = c.get('user') ?? null;
  return raw(c, springPage(await Promise.all(rows.map((r) => rDto(c.env, r, u))), await count(c.env, `SELECT COUNT(*) AS n FROM content_resources r WHERE ${w}`, ...p), page, size));
});
res.get('/my-bookmarks', auth(), async (c) => {
  const me = c.get('user');
  const { page, size, offset } = pageParams(c, 12, 200);
  const rows = await all(c.env, `${R_SELECT} JOIN resource_bookmarks b ON b.resource_id = r.id WHERE b.user_id = ? ORDER BY b.saved_at DESC LIMIT ? OFFSET ?`, me.id, size, offset);
  return raw(c, springPage(await Promise.all(rows.map((r) => rDto(c.env, r, me))), await count(c.env, 'SELECT COUNT(*) AS n FROM resource_bookmarks WHERE user_id = ?', me.id), page, size));
});
res.get('/my-uploads', auth(), async (c) => {
  const me = c.get('user');
  const { page, size, offset } = pageParams(c, 12, 200);
  const rows = await all(c.env, `${R_SELECT} WHERE r.uploader_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, me.id, size, offset);
  return raw(c, springPage(await Promise.all(rows.map((r) => rDto(c.env, r, me))), await count(c.env, 'SELECT COUNT(*) AS n FROM content_resources WHERE uploader_id = ?', me.id), page, size));
});
res.get('/:id', optionalAuth, async (c) => {
  const r = await getRes(c.env, c.req.param('id'));
  const u = c.get('user') ?? null;
  if (!r.is_public && !(u && canManageSubs(r, u))) throw notFound('Không tìm thấy tài nguyên.');
  await run(c.env, 'UPDATE content_resources SET view_count = COALESCE(view_count,0) + 1 WHERE id = ?', r.id);
  return raw(c, await rDto(c.env, { ...r, view_count: (r.view_count ?? 0) + 1 }, u));
});
res.post('/', staffUpload, async (c) => {
  const me = c.get('user');
  const f = await fields(c.env, await body(c), me, false);
  const id = uuid();
  await run(c.env, `INSERT INTO content_resources (id, uploader_id, view_count, like_count, bookmark_count, created_at, updated_at, ${Object.keys(f).join(', ')}) VALUES (?,?,0,0,0,?,?,${Object.keys(f).map(() => '?').join(',')})`, id, me.id, nowISO(), nowISO(), ...Object.values(f));
  return raw(c, await rDto(c.env, await getRes(c.env, id), me));
});
res.put('/:id', staffUpload, async (c) => {
  const me = c.get('user');
  const r = await getRes(c.env, c.req.param('id'));
  if (!canEdit(r, me)) throw bad('Bạn không có quyền chỉnh sửa tài nguyên này.');
  const f = await fields(c.env, await body(c), me, true);
  await run(c.env, `UPDATE content_resources SET ${Object.keys(f).map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`, ...Object.values(f), nowISO(), r.id);
  return raw(c, await rDto(c.env, await getRes(c.env, r.id), me));
});
res.delete('/:id', staffUpload, async (c) => {
  const r = await getRes(c.env, c.req.param('id'));
  if (!canEdit(r, c.get('user'))) throw bad('Bạn không có quyền xóa tài nguyên này.');
  await batch(c.env, [['DELETE FROM resource_submissions WHERE resource_id = ?', r.id], ['DELETE FROM resource_likes WHERE resource_id = ?', r.id], ['DELETE FROM resource_bookmarks WHERE resource_id = ?', r.id], ['DELETE FROM content_resources WHERE id = ?', r.id]]);
  return c.body(null, 204);
});
res.post('/:id/like', auth(), async (c) => {
  const me = c.get('user');
  const r = await getRes(c.env, c.req.param('id'));
  const l = await one<{ id: string }>(c.env, 'SELECT id FROM resource_likes WHERE user_id = ? AND resource_id = ?', me.id, r.id);
  if (l) { await batch(c.env, [['DELETE FROM resource_likes WHERE id = ?', l.id], ['UPDATE content_resources SET like_count = MAX(0, COALESCE(like_count,0) - 1) WHERE id = ?', r.id]]); return raw(c, { liked: false }); }
  await batch(c.env, [['INSERT INTO resource_likes (id, user_id, resource_id, created_at) VALUES (?,?,?,?)', uuid(), me.id, r.id, nowISO()], ['UPDATE content_resources SET like_count = COALESCE(like_count,0) + 1 WHERE id = ?', r.id]]);
  if (r.uploader_id !== me.id) await notify(c.env, r.uploader_id, 'Lượt thích mới cho tài liệu', `${me.full_name} đã thích tài liệu '${r.title}' của bạn.`, `/library/resources/${r.id}`, 'RESOURCE', me, 'RESOURCE_LIKE', r.id);
  return raw(c, { liked: true });
});
res.post('/:id/bookmark', auth(), async (c) => {
  const me = c.get('user');
  const r = await getRes(c.env, c.req.param('id'));
  const b = await one<{ id: string }>(c.env, 'SELECT id FROM resource_bookmarks WHERE user_id = ? AND resource_id = ?', me.id, r.id);
  if (b) { await batch(c.env, [['DELETE FROM resource_bookmarks WHERE id = ?', b.id], ['UPDATE content_resources SET bookmark_count = MAX(0, COALESCE(bookmark_count,0) - 1) WHERE id = ?', r.id]]); return raw(c, { bookmarked: false }); }
  const folderId = c.req.query('folderId');
  const folder = folderId ? (await one<any>(c.env, 'SELECT id FROM content_folders WHERE id = ?', folderId))?.id ?? null : null;
  await batch(c.env, [['INSERT INTO resource_bookmarks (id, user_id, resource_id, folder_id, saved_at) VALUES (?,?,?,?,?)', uuid(), me.id, r.id, folder, nowISO()], ['UPDATE content_resources SET bookmark_count = COALESCE(bookmark_count,0) + 1 WHERE id = ?', r.id]]);
  if (r.uploader_id !== me.id) await notify(c.env, r.uploader_id, 'Tài liệu được lưu trữ', `${me.full_name} đã lưu tài liệu '${r.title}' của bạn vào mục lưu trữ.`, `/library/resources/${r.id}`, 'RESOURCE', me, 'RESOURCE_BOOKMARK', r.id);
  return raw(c, { bookmarked: true });
});

/* ---- Bài viết nộp theo đề của học liệu ---- */
const SUB_SELECT = 'SELECT s.*, u.full_name, u.avatar_url, g.full_name AS grader FROM resource_submissions s JOIN users u ON u.id = s.student_id LEFT JOIN users g ON g.id = s.graded_by';
const subDto = (s: any) => s && ({ id: s.id, resourceId: s.resource_id, studentId: s.student_id, studentName: s.full_name, studentAvatar: s.avatar_url, content: s.content, score: s.score, feedback: s.feedback, status: s.status, submittedAt: javaTime(s.submitted_at), gradedAt: javaTime(s.graded_at), gradedByName: s.grader });
res.post('/:id/submissions', auth(), async (c) => {
  const me = c.get('user');
  const r = await getRes(c.env, c.req.param('id'));
  if (!r.writing_prompt || !String(r.writing_prompt).trim()) throw bad('Tài nguyên này không có đề bài viết.');
  const content = str((await body(c)).content, 'Bài viết', 100_000);
  const ex = await one<{ id: string }>(c.env, 'SELECT id FROM resource_submissions WHERE resource_id = ? AND student_id = ?', r.id, me.id);
  const id = ex?.id ?? uuid();
  if (ex) await run(c.env, "UPDATE resource_submissions SET content = ?, status = 'PENDING', submitted_at = ?, score = NULL, feedback = NULL, graded_at = NULL, graded_by = NULL WHERE id = ?", content, nowISO(), id);
  else await run(c.env, "INSERT INTO resource_submissions (id, resource_id, student_id, content, status, submitted_at) VALUES (?,?,?,?, 'PENDING', ?)", id, r.id, me.id, content, nowISO());
  if (r.uploader_id !== me.id) await notify(c.env, r.uploader_id, 'Học sinh đã nộp bài viết', `${me.full_name} đã nộp bài viết cho '${r.title}'`, `/library/resources/${r.id}`, 'RESOURCE', me, 'RESOURCE_SUBMISSION', id);
  return raw(c, subDto(await one(c.env, `${SUB_SELECT} WHERE s.id = ?`, id)));
});
res.get('/:id/submissions/me', auth(), async (c) => raw(c, subDto(await one(c.env, `${SUB_SELECT} WHERE s.resource_id = ? AND s.student_id = ?`, c.req.param('id'), c.get('user').id)) ?? null));
res.get('/:id/submissions', auth(), async (c) => {
  const r = await getRes(c.env, c.req.param('id'));
  if (!canManageSubs(r, c.get('user'))) throw bad('Bạn không có quyền xem danh sách bài nộp này');
  return raw(c, (await all(c.env, `${SUB_SELECT} WHERE s.resource_id = ? ORDER BY s.submitted_at DESC`, r.id)).map(subDto));
});
res.post('/submissions/:sid/grade', auth(), async (c) => {
  const me = c.get('user');
  const s = await one<any>(c.env, 'SELECT * FROM resource_submissions WHERE id = ?', c.req.param('sid'));
  if (!s) throw notFound('Không tìm thấy bài nộp.');
  const r = await getRes(c.env, s.resource_id);
  if (!canManageSubs(r, me)) throw bad('Bạn không có quyền chấm bài này');
  const b = await body(c);
  const score = Number(b.score);
  if (!Number.isFinite(score) || score < 0 || score > 1000) throw bad('Điểm không hợp lệ.');
  await run(c.env, "UPDATE resource_submissions SET score = ?, feedback = ?, status = 'GRADED', graded_at = ?, graded_by = ? WHERE id = ?", score, b.feedback ?? null, nowISO(), me.id, s.id);
  await notify(c.env, s.student_id, 'Bài viết của bạn đã được chấm', `Bài viết '${r.title}' đã có điểm: ${score}`, `/library/resources/${r.id}`, 'RESOURCE', me, 'RESOURCE_SUBMISSION', s.id);
  return raw(c, subDto(await one(c.env, `${SUB_SELECT} WHERE s.id = ?`, s.id)));
});

/* ===================== Tệp tải lên (Cloudinary, D1 chỉ lưu URL) ===================== */
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = /\.(pdf|docx?|xlsx?|csv|pptx?|txt|png|jpe?g|gif|webp|svg|mp3|m4a|wav|ogg|mp4|webm|mov)$/i;
/** Chữ ký Cloudinary: sha1("k1=v1&k2=v2" theo thứ tự chữ cái + api_secret) */
export async function cloudinarySignature(params: Record<string, string>, secret: string) {
  const s = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&') + secret;
  return [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
}
// Ví dụ trong tài liệu Cloudinary (Authentication signatures)
cloudinarySignature({ eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop', public_id: 'sample_image', timestamp: '1315060510' }, 'abcd')
  .then((s) => console.assert(s === 'bfd09f95f331f558cbd1320e67aa8d488770583e', 'cloudinarySignature'));
/** CloudinaryService.uploadFile: resource_type auto, trả secure_url */
export async function saveUpload(env: Env, file: File, folder: string) {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = env;
  if (!cloud || !key || !secret) throw bad('Chưa cấu hình kho lưu tệp.', 'STORAGE_NOT_CONFIGURED');
  if (!(file instanceof File) || !file.name) throw bad('Vui lòng chọn tệp.');
  if (file.size > MAX_BYTES) throw bad('Tệp tối đa 50 MB.');
  if (!ALLOWED.test(file.name)) throw bad('Định dạng tệp không được hỗ trợ.');
  const params = { folder: `school-edu/${folder}`, timestamp: String(Math.floor(Date.now() / 1000)) };
  const fd = new FormData();
  fd.append('file', file);
  Object.entries(params).forEach(([k, v]) => fd.append(k, v));
  fd.append('api_key', key);
  fd.append('signature', await cloudinarySignature(params, secret));
  const r = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/auto/upload`, { method: 'POST', body: fd, signal: AbortSignal.timeout(120_000) });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || !j.secure_url) {
    console.error('[cloudinary]', r.status, j?.error?.message);
    throw bad(r.status === 400 && /size/i.test(j?.error?.message || '') ? 'Tệp vượt giới hạn dung lượng của kho lưu trữ.' : 'Không tải được tệp lên. Vui lòng thử lại.', 'UPLOAD_FAILED');
  }
  return { url: j.secure_url as string, name: file.name };
}
export const files = new Hono<AppEnv>();
files.post('/upload', auth(), async (c) => {
  const form = await c.req.formData();
  const up = await saveUpload(c.env, form.get('file') as File, 'uploads');
  return ok(c, { fileUrl: up.url, fileName: up.name, url: up.url });
});
// Java phục vụ tệp lưu trên đĩa máy chủ; bản Cloudflare chỉ có URL Cloudinary nên đường dẫn cũ không còn tệp
files.get('/download/:key{.+}', () => { throw notFound('Không tìm thấy tệp.'); });
export const media = new Hono<AppEnv>();
media.post('/upload', auth(), async (c) => {
  const form = await c.req.formData();
  const folder = String(form.get('folder') || 'media').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'media';
  const up = await saveUpload(c.env, form.get('file') as File, folder);
  return raw(c, { url: up.url });
});

export default res;
