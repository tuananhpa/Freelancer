import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../types';
import { bad, body, notFound, pageParams, raw, springPage, str, uuid } from '../lib/http';
import { auth } from '../lib/auth';
import { all, count, one, parseJson, run } from '../db';
import { javaTime, nowISO } from '../lib/time';

type Env = Bindings;
const CATS = ['NEWS', 'EVENT', 'ACHIEVEMENT'];
const STATUSES = ['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED'];
/** ActivityService.slugify: bỏ dấu, đ→d, khoảng trắng → '-', chỉ giữ [\w-] */
export const slugify = (s: string) => s.replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '').replace(/(^-+|-+$)/g, '').toLowerCase().slice(0, 200);
console.assert(slugify('  Lễ khai giảng Đầu năm 2026! ') === 'le-khai-giang-dau-nam-2026', 'slugify');
async function uniqueSlug(env: Env, title: string) {
  const base = slugify(title) || 'hoat-dong';
  let slug = base;
  while (await one(env, 'SELECT 1 AS x FROM activities WHERE slug = ?', slug)) slug = `${base}-${uuid().slice(0, 6)}`;
  return slug;
}
const A_SELECT = 'SELECT a.*, u.full_name AS author_name FROM activities a LEFT JOIN users u ON u.id = a.author_id';
const pub = (a: any) => ({ id: a.id, title: a.title, slug: a.slug, summary: a.summary, content: a.content, coverImageUrl: a.cover_image_url, images: parseJson<string[]>(a.images, []), category: a.category, pinned: !!a.pinned, authorName: a.author_name, publishedAt: javaTime(a.published_at), viewCount: a.view_count ?? 0 });
const dto = (a: any) => ({ ...pub(a), status: a.status, reviewNote: a.review_note, createdAt: javaTime(a.created_at), updatedAt: javaTime(a.updated_at) });
async function find(env: Env, id: string) {
  const a = await one<any>(env, `${A_SELECT} WHERE a.id = ?`, id);
  if (!a) throw notFound('Không tìm thấy hoạt động');
  return a;
}
function fields(b: any) {
  const title = str(b.title, 'Tiêu đề', 255)!.trim();
  if (b.summary && String(b.summary).length > 500) throw bad('Mô tả ngắn tối đa 500 ký tự');
  if (!b.content || !String(b.content).trim()) throw bad('Nội dung không được để trống');
  if (b.category != null && !CATS.includes(b.category)) throw bad('Danh mục không hợp lệ.');
  const images = Array.isArray(b.images) ? b.images.map(String).slice(0, 50) : [];
  return { title, summary: b.summary ?? null, content: String(b.content), cover: b.coverImageUrl ?? null, images: JSON.stringify(images), category: b.category as string | undefined, pinned: b.pinned as boolean | undefined };
}

const act = new Hono<AppEnv>();
act.use('*', auth('ADMIN'));
act.get('/', async (c) => {
  const { page, size, offset } = pageParams(c, 10, 100);
  const where: string[] = [];
  const p: unknown[] = [];
  const s = c.req.query('status'), cat = c.req.query('category');
  if (s) { if (!STATUSES.includes(s)) throw bad('Trạng thái không hợp lệ.'); where.push('a.status = ?'); p.push(s); }
  if (cat) { if (!CATS.includes(cat)) throw bad('Danh mục không hợp lệ.'); where.push('a.category = ?'); p.push(cat); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await all(c.env, `${A_SELECT} ${w} ORDER BY a.pinned DESC, a.created_at DESC LIMIT ? OFFSET ?`, ...p, size, offset);
  return raw(c, springPage(rows.map(dto), await count(c.env, `SELECT COUNT(*) AS n FROM activities a ${w}`, ...p), page, size));
});
act.get('/pending-count', async (c) => raw(c, { count: await count(c.env, "SELECT COUNT(*) AS n FROM activities WHERE status = 'PENDING'") }));
act.get('/:id', async (c) => raw(c, dto(await find(c.env, c.req.param('id')))));
act.post('/', async (c) => {
  const f = fields(await body(c));
  const id = uuid();
  await run(c.env, "INSERT INTO activities (id, title, slug, summary, content, cover_image_url, images, category, status, pinned, author_id, view_count, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?, 'DRAFT', ?, ?, 0, ?, ?)",
    id, f.title, await uniqueSlug(c.env, f.title), f.summary, f.content, f.cover, f.images, f.category ?? 'NEWS', f.pinned ? 1 : 0, c.get('user').id, nowISO(), nowISO());
  return raw(c, dto(await find(c.env, id)));
});
act.put('/:id', async (c) => {
  const a = await find(c.env, c.req.param('id'));
  const f = fields(await body(c));
  const slug = a.title.toLowerCase() !== f.title.toLowerCase() ? await uniqueSlug(c.env, f.title) : a.slug;
  await run(c.env, 'UPDATE activities SET title = ?, slug = ?, summary = ?, content = ?, cover_image_url = ?, images = ?, category = COALESCE(?, category), pinned = COALESCE(?, pinned), updated_at = ? WHERE id = ?',
    f.title, slug, f.summary, f.content, f.cover, f.images, f.category ?? null, f.pinned == null ? null : f.pinned ? 1 : 0, nowISO(), a.id);
  return raw(c, dto(await find(c.env, a.id)));
});
act.post('/:id/submit', async (c) => {
  const a = await find(c.env, c.req.param('id'));
  if (a.status === 'PUBLISHED') throw bad('Bài đã được đăng công khai.');
  await run(c.env, "UPDATE activities SET status = 'PENDING', review_note = NULL, updated_at = ? WHERE id = ?", nowISO(), a.id);
  return raw(c, dto(await find(c.env, a.id)));
});
const note = async (c: any) => { try { return (await c.req.json())?.note ?? null; } catch { return null; } };
act.post('/:id/approve', async (c) => {
  const a = await find(c.env, c.req.param('id'));
  if (a.status === 'PUBLISHED') throw bad('Bài đã được đăng công khai.');
  await run(c.env, "UPDATE activities SET status = 'PUBLISHED', reviewed_by = ?, review_note = ?, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?", c.get('user').id, await note(c), nowISO(), nowISO(), a.id);
  return raw(c, dto(await find(c.env, a.id)));
});
act.post('/:id/reject', async (c) => {
  const a = await find(c.env, c.req.param('id'));
  if (a.status !== 'PENDING') throw bad('Chỉ có thể trả lại bài đang chờ duyệt.');
  await run(c.env, "UPDATE activities SET status = 'DRAFT', reviewed_by = ?, review_note = ?, updated_at = ? WHERE id = ?", c.get('user').id, await note(c), nowISO(), a.id);
  return raw(c, dto(await find(c.env, a.id)));
});
act.post('/:id/archive', async (c) => {
  const a = await find(c.env, c.req.param('id'));
  await run(c.env, "UPDATE activities SET status = 'ARCHIVED', updated_at = ? WHERE id = ?", nowISO(), a.id);
  return raw(c, dto(await find(c.env, a.id)));
});
act.patch('/:id/pin', async (c) => {
  const a = await find(c.env, c.req.param('id'));
  const v = c.req.query('pinned');
  if (v !== 'true' && v !== 'false') throw bad('Thiếu tham số pinned.');
  await run(c.env, 'UPDATE activities SET pinned = ?, updated_at = ? WHERE id = ?', v === 'true' ? 1 : 0, nowISO(), a.id);
  return raw(c, dto(await find(c.env, a.id)));
});
act.delete('/:id', async (c) => {
  await run(c.env, 'DELETE FROM activities WHERE id = ?', (await find(c.env, c.req.param('id'))).id);
  return c.body(null, 204);
});

export const publicActivities = new Hono<AppEnv>();
publicActivities.get('/', async (c) => {
  const { page, size, offset } = pageParams(c, 6, 50);
  const cat = c.req.query('category');
  if (cat && !CATS.includes(cat)) throw bad('Danh mục không hợp lệ.');
  const w = cat ? "WHERE a.status = 'PUBLISHED' AND a.category = ?" : "WHERE a.status = 'PUBLISHED'";
  const p = cat ? [cat] : [];
  const rows = await all(c.env, `${A_SELECT} ${w} ORDER BY a.pinned DESC, a.published_at DESC LIMIT ? OFFSET ?`, ...p, size, offset);
  return raw(c, springPage(rows.map(pub), await count(c.env, `SELECT COUNT(*) AS n FROM activities a ${w}`, ...p), page, size));
});
publicActivities.get('/:slug', async (c) => {
  const a = await one<any>(c.env, `${A_SELECT} WHERE a.slug = ? AND a.status = 'PUBLISHED'`, c.req.param('slug'));
  if (!a) throw notFound('Không tìm thấy hoạt động');
  await run(c.env, 'UPDATE activities SET view_count = view_count + 1 WHERE id = ?', a.id);
  return raw(c, pub({ ...a, view_count: (a.view_count ?? 0) + 1 }));
});

export default act;
