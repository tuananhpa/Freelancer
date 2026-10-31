import { Hono } from 'hono';
import type { AppEnv, Bindings, UserRow } from '../types';
import { STAFF } from '../types';
import { ApiError, bad, body, forbidden, notFound, pageParams, raw, springPage, str, uuid } from '../lib/http';
import { auth, optionalAuth, isStaff } from '../lib/auth';
import { all, batch, count, one, run } from '../db';
import { javaTime, nowISO, todayVN } from '../lib/time';
import { notify } from '../lib/notify';
import { canManage } from './classrooms';
import { aiSettings, callJsonAI } from '../lib/ai';

type Env = Bindings;
const CARD_COLS = ['front_content', 'back_content', 'image_url', 'audio_url', 'word_type', 'definition_en', 'definition_vi', 'example', 'phonetic', 'example_translation'] as const;
const cardDto = (c: any) => ({ id: c.id, frontContent: c.front_content, backContent: c.back_content, imageUrl: c.image_url, audioUrl: c.audio_url, wordType: c.word_type, definitionEn: c.definition_en,
  definitionVi: c.definition_vi, example: c.example, phonetic: c.phonetic, exampleTranslation: c.example_translation, createdAt: javaTime(c.created_at) });
const addDays = (n: number) => new Date(Date.parse(`${todayVN()}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

type Access = { accessLevel: string; locked: boolean; previewRank: number | null; unlockHint: string | null };
const LOCKED: Access = { accessLevel: 'PREVIEW', locked: true, previewRank: null, unlockHint: 'Đăng ký học với giáo viên này để mở toàn bộ đề / từ vựng / flashcard.' };
const FULL: Access = { accessLevel: 'FULL', locked: false, previewRank: null, unlockHint: null };
/** StudentResourceAccessService.decideSingle cho bộ thẻ: CLASSROOM chỉ mở với thành viên lớp được gắn */
async function decide(env: Env, d: any, u: UserRow | null): Promise<Access> {
  if (u && (isStaff(u) || u.role === 'OFFICE' || d.owner_id === u.id)) return FULL;
  if (d.visibility !== 'CLASSROOM') return FULL;
  if (u && (await one(env, 'SELECT 1 AS x FROM class_resources r JOIN class_members m ON m.classroom_id = r.classroom_id WHERE r.resource_id = ? AND m.user_id = ? LIMIT 1', d.id, u.id))) return FULL;
  return LOCKED;
}
async function deckDto(env: Env, d: any, withCards: boolean, u: UserRow | null, access = FULL) {
  const owner = d.owner_id ? await one<any>(env, 'SELECT full_name, avatar_url FROM users WHERE id = ?', d.owner_id) : null;
  const folder = d.folder_id ? await one<any>(env, 'SELECT name FROM content_folders WHERE id = ?', d.folder_id) : null;
  const cards = withCards && !access.locked ? (await all(env, 'SELECT * FROM flashcards WHERE deck_id = ? ORDER BY rowid', d.id)).map(cardDto) : [];
  const myRating = u ? (await one<any>(env, 'SELECT rating FROM deck_ratings WHERE deck_id = ? AND student_id = ?', d.id, u.id))?.rating ?? null : null;
  return {
    id: d.id, title: d.title, description: d.description, visibility: d.visibility, accessCode: u && (u.id === d.owner_id || u.role === 'ADMIN') ? d.access_code : null, cards,
    cardCount: await count(env, 'SELECT COUNT(*) AS n FROM flashcards WHERE deck_id = ?', d.id), createdAt: javaTime(d.created_at), tags: d.tags, deckType: d.deck_type, subject: d.subject,
    viewsCount: d.views_count ?? 0, savesCount: d.saves_count ?? 0, sharesCount: d.shares_count ?? 0, imageUrl: d.image_url, folderId: d.folder_id, folderName: folder?.name ?? null,
    learnerCount: await count(env, 'SELECT COUNT(*) AS n FROM student_favorite_decks WHERE deck_id = ?', d.id), averageRating: d.average_rating ?? 0, ratingCount: d.rating_count ?? 0, myRating,
    ownerId: d.owner_id, ownerName: owner?.full_name ?? null, ownerAvatar: owner?.avatar_url ?? null, ...access,
  };
}
async function getDeck(env: Env, id: string) {
  const d = await one<any>(env, 'SELECT * FROM flashcard_decks WHERE id = ?', id);
  if (!d) throw notFound('Không tìm thấy bộ thẻ.');
  return d;
}
async function canEditDeck(env: Env, d: any, u: UserRow) {
  if (d.owner_id === u.id || u.role === 'ADMIN' || u.role === 'OFFICE') return true;
  if (u.role !== 'TEACHER' && u.role !== 'TEACHING_ASSISTANT') return false;
  for (const c of await all<any>(env, 'SELECT c.* FROM class_resources r JOIN classrooms c ON c.id = r.classroom_id WHERE r.resource_id = ?', d.id)) if (await canManage(env, c, u)) return true;
  return false;
}

/** Danh sách bộ thẻ có lọc tìm kiếm / loại / thư mục */
async function listDecks(c: any, base: string, params: unknown[], applyAccess: boolean) {
  const { page, size, offset } = pageParams(c, 10, 200);
  const where = [base];
  const p = [...params];
  const s = c.req.query('search')?.trim().toLowerCase();
  if (s) { where.push('(lower(d.title) LIKE ? OR lower(d.description) LIKE ? OR lower(d.tags) LIKE ? OR lower(d.subject) LIKE ?)'); p.push(...Array(4).fill(`%${s}%`)); }
  const t = c.req.query('deckType');
  if (t) { where.push('d.deck_type = ?'); p.push(t); }
  const f = c.req.query('folderId');
  if (f === 'none') where.push('d.folder_id IS NULL');
  else if (f && /^[0-9a-f-]{36}$/i.test(f)) { where.push('d.folder_id = ?'); p.push(f); }
  const w = where.join(' AND ');
  const rows = await all<any>(c.env, `SELECT d.* FROM flashcard_decks d WHERE ${w} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`, ...p, size, offset);
  const u = c.get('user') ?? null;
  const content = await Promise.all(rows.map(async (d) => deckDto(c.env, d, true, u, applyAccess ? await decide(c.env, d, u) : FULL)));
  return springPage(content, await count(c.env, `SELECT COUNT(*) AS n FROM flashcard_decks d WHERE ${w}`, ...p), page, size);
}

function deckFields(b: any) {
  const vis = ['PUBLIC', 'HIDDEN', 'CLASSROOM'].includes(b.visibility) ? b.visibility : 'PUBLIC';
  const tags = Array.isArray(b.tags) && b.tags.length ? b.tags.map(String).join(',') : b.subject ? String(b.subject).trim() : null;
  return { title: str(b.title, 'Tiêu đề', 500), description: b.description ?? null, visibility: vis, access_code: b.accessCode || null, tags, image_url: b.imageUrl ?? null, deck_type: b.deckType || 'FLASHCARD', subject: b.subject ?? null };
}
const cardStmts = (deckId: string, cards: unknown): [string, ...unknown[]][] => (Array.isArray(cards) ? cards : []).slice(0, 2000).map((c: any) =>
  [`INSERT INTO flashcards (id, deck_id, created_at, ${CARD_COLS.join(', ')}) VALUES (?,?,?,${CARD_COLS.map(() => '?').join(',')})`, uuid(), deckId, nowISO(),
    String(c.frontContent ?? '').slice(0, 5000), String(c.backContent ?? '').slice(0, 5000), c.imageUrl ?? null, c.audioUrl ?? null, c.wordType ?? null, c.definitionEn ?? null, c.definitionVi ?? null, c.example ?? null, c.phonetic ?? null, c.exampleTranslation ?? null]);
/** Gắn bộ thẻ CLASSROOM vào các lớp (class_resources) — chỉ lớp người tạo quản lý */
async function assignToClasses(env: Env, deckId: string, b: any, deckType: string, u: UserRow) {
  if (b.visibility !== 'CLASSROOM' || !Array.isArray(b.assignedClassIds)) return;
  const type = String(deckType).toUpperCase() === 'VOCABULARY' || deckType === 'VOCAB' ? 'VOCAB' : 'FLASHCARD';
  for (const cid of b.assignedClassIds) {
    const cls = await one<any>(env, 'SELECT * FROM classrooms WHERE id = ?', String(cid));
    if (!cls || !(await canManage(env, cls, u))) continue;
    const folder = b.assignedClassFolders?.[cid] ?? b.classFolderId ?? null;
    const ex = await one<{ id: string }>(env, 'SELECT id FROM class_resources WHERE classroom_id = ? AND resource_id = ?', cls.id, deckId);
    if (ex) await run(env, 'UPDATE class_resources SET folder_id = ?, resource_type = ? WHERE id = ?', folder, type, ex.id);
    else await run(env, 'INSERT INTO class_resources (id, classroom_id, folder_id, resource_type, resource_id, created_at) VALUES (?,?,?,?,?,?)', uuid(), cls.id, folder, type, deckId, nowISO());
  }
}
async function resolveFolder(env: Env, folderId: unknown, u: UserRow) {
  if (!folderId) return null;
  const f = await one<any>(env, 'SELECT owner_id FROM content_folders WHERE id = ?', String(folderId));
  if (!f) throw notFound('Không tìm thấy folder.');
  if (f.owner_id !== u.id) throw bad('Bạn không có quyền truy cập folder này.');
  return String(folderId);
}
export async function createDeck(env: Env, b: any, u: UserRow) {
  const f = deckFields(b);
  const id = uuid();
  await batch(env, [[`INSERT INTO flashcard_decks (id, owner_id, folder_id, created_at, views_count, saves_count, shares_count, average_rating, rating_count, ${Object.keys(f).join(', ')}) VALUES (?,?,?,?,0,0,0,0,0,${Object.keys(f).map(() => '?').join(',')})`,
    id, u.id, await resolveFolder(env, b.folderId, u), nowISO(), ...Object.values(f)], ...cardStmts(id, b.cards)]);
  await assignToClasses(env, id, b, f.deck_type, u);
  return id;
}

const r = new Hono<AppEnv>();
r.get('/public', optionalAuth, async (c) => {
  const u = c.get('user') ?? null;
  return raw(c, await listDecks(c, u?.role === 'ADMIN' ? '1=1' : "d.visibility = 'PUBLIC'", [], true));
});
r.get('/my-decks', auth(), async (c) => { const u = c.get('user'); return raw(c, await listDecks(c, u.role === 'ADMIN' ? '1=1' : 'd.owner_id = ?', u.role === 'ADMIN' ? [] : [u.id], false)); });
r.get('/favorites', auth(), async (c) => raw(c, await listDecks(c, 'd.id IN (SELECT deck_id FROM student_favorite_decks WHERE student_id = ?)', [c.get('user').id], true)));

r.get('/decks/:id', optionalAuth, async (c) => {
  const d = await getDeck(c.env, c.req.param('id'));
  const u = c.get('user') ?? null;
  const acc = await decide(c.env, d, u);
  if (acc.locked) throw forbidden(acc.unlockHint ?? undefined);
  return raw(c, await deckDto(c.env, d, true, u, acc));
});
r.post('/decks/:id/view', async (c) => { await run(c.env, 'UPDATE flashcard_decks SET views_count = COALESCE(views_count,0) + 1 WHERE id = ?', c.req.param('id')); return c.body(null, 200); });
r.post('/decks/:id/share', async (c) => { await run(c.env, 'UPDATE flashcard_decks SET shares_count = COALESCE(shares_count,0) + 1 WHERE id = ?', c.req.param('id')); return c.body(null, 200); });
r.put('/decks/:id/rating', auth(), async (c) => {
  const me = c.get('user');
  const d = await getDeck(c.env, c.req.param('id'));
  if ((await decide(c.env, d, me)).locked) throw bad('Bạn không có quyền đánh giá bộ thẻ này.');
  const rating = Number((await body(c)).rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw bad('Điểm đánh giá phải từ 1 đến 5.');
  const ex = await one<{ id: string }>(c.env, 'SELECT id FROM deck_ratings WHERE deck_id = ? AND student_id = ?', d.id, me.id);
  if (ex) await run(c.env, 'UPDATE deck_ratings SET rating = ?, updated_at = ? WHERE id = ?', rating, nowISO(), ex.id);
  else await run(c.env, 'INSERT INTO deck_ratings (id, deck_id, student_id, rating, created_at, updated_at) VALUES (?,?,?,?,?,?)', uuid(), d.id, me.id, rating, nowISO(), nowISO());
  await run(c.env, 'UPDATE flashcard_decks SET rating_count = (SELECT COUNT(*) FROM deck_ratings WHERE deck_id = ?), average_rating = (SELECT AVG(rating) FROM deck_ratings WHERE deck_id = ?) WHERE id = ?', d.id, d.id, d.id);
  if (d.owner_id && d.owner_id !== me.id) await notify(c.env, d.owner_id, 'Đánh giá mới cho bộ thẻ', `${me.full_name} đã đánh giá ${rating}⭐ cho bộ thẻ '${d.title}' của bạn.`, `/flashcards/${d.id}`, 'FLASHCARD', me, 'FLASHCARD_DECK', d.id);
  return c.body(null, 200);
});
r.get('/decks/:id/suggested', optionalAuth, async (c) => {
  const d = await getDeck(c.env, c.req.param('id'));
  const rows = await all(c.env, "SELECT * FROM flashcard_decks WHERE visibility = 'PUBLIC' AND id <> ? AND deck_type = ? ORDER BY views_count DESC LIMIT 5", d.id, d.deck_type);
  return raw(c, await Promise.all(rows.map((x) => deckDto(c.env, x, false, c.get('user') ?? null))));
});
r.post('/decks', auth(...STAFF), async (c) => {
  const id = await createDeck(c.env, await body(c), c.get('user'));
  return raw(c, await deckDto(c.env, await getDeck(c.env, id), true, c.get('user')));
});
r.put('/decks/:id', auth(), async (c) => {
  const me = c.get('user');
  const d = await getDeck(c.env, c.req.param('id'));
  if (!(await canEditDeck(c.env, d, me))) throw bad('Bạn không có quyền sửa bộ thẻ này.');
  const b = await body(c);
  const f = deckFields({ ...b, deckType: b.deckType ?? d.deck_type, subject: b.subject ?? d.subject, visibility: b.visibility ?? d.visibility });
  // Như Java: thay toàn bộ thẻ, tiến độ học của bộ này bị đặt lại
  await batch(c.env, [
    [`UPDATE flashcard_decks SET ${Object.keys(f).map((k) => `${k} = ?`).join(', ')}, folder_id = ? WHERE id = ?`, ...Object.values(f), await resolveFolder(c.env, b.folderId, me), d.id],
    ['DELETE FROM student_card_progress WHERE card_id IN (SELECT id FROM flashcards WHERE deck_id = ?)', d.id],
    ['UPDATE mistake_vault_items SET flashcard_id = NULL WHERE flashcard_id IN (SELECT id FROM flashcards WHERE deck_id = ?)', d.id],
    ['DELETE FROM flashcards WHERE deck_id = ?', d.id], ...cardStmts(d.id, b.cards),
  ]);
  await assignToClasses(c.env, d.id, { ...b, visibility: f.visibility }, f.deck_type, me);
  return raw(c, await deckDto(c.env, await getDeck(c.env, d.id), true, me));
});
r.delete('/decks/:id', auth(), async (c) => {
  const me = c.get('user');
  const d = await getDeck(c.env, c.req.param('id'));
  if (d.owner_id !== me.id && me.role !== 'ADMIN') throw bad('Bạn không có quyền xóa bộ từ vựng này.');
  await batch(c.env, [
    ['DELETE FROM student_favorite_decks WHERE deck_id = ?', d.id], ['DELETE FROM deck_ratings WHERE deck_id = ?', d.id],
    ['DELETE FROM student_card_progress WHERE card_id IN (SELECT id FROM flashcards WHERE deck_id = ?)', d.id],
    ['UPDATE mistake_vault_items SET flashcard_id = NULL WHERE flashcard_id IN (SELECT id FROM flashcards WHERE deck_id = ?)', d.id],
    ['DELETE FROM class_resources WHERE resource_id = ?', d.id], ['DELETE FROM flashcards WHERE deck_id = ?', d.id], ['DELETE FROM flashcard_decks WHERE id = ?', d.id],
  ]);
  return c.body(null, 204);
});

/* ---- Tiến độ học (hộp Leitner 0..5: 1/3/7/14/30 ngày) ---- */
const progressRows = (env: Env, deckId: string, userId: string) => all<any>(env, 'SELECT p.*, f.front_content, f.back_content FROM student_card_progress p JOIN flashcards f ON f.id = p.card_id WHERE f.deck_id = ? AND p.student_id = ?', deckId, userId);
const progressDto = (p: any) => ({ id: p.id, boxLevel: p.box_level, nextReviewDate: p.next_review_date, timesReviewed: p.times_reviewed, isMastered: !!p.is_mastered, cardId: p.card_id });
r.get('/decks/:id/progress', auth(), async (c) => { const d = await getDeck(c.env, c.req.param('id')); return raw(c, (await progressRows(c.env, d.id, c.get('user').id)).map(progressDto)); });
r.get('/decks/:id/statistics', auth(), async (c) => {
  const d = await getDeck(c.env, c.req.param('id'));
  const cards = await all<any>(c.env, 'SELECT id, front_content, back_content FROM flashcards WHERE deck_id = ?', d.id);
  const prog = new Map((await progressRows(c.env, d.id, c.get('user').id)).map((p) => [p.card_id, p]));
  let mastered = 0, learning = 0, fresh = 0;
  const problem: any[] = [];
  for (const card of cards) {
    const p = prog.get(card.id);
    if (!p || p.box_level === 0) fresh++;
    else if (p.box_level === 5) mastered++;
    else { learning++; if (p.times_reviewed >= 3) problem.push({ cardId: card.id, frontContent: card.front_content, backContent: card.back_content, timesReviewed: p.times_reviewed, boxLevel: p.box_level }); }
  }
  problem.sort((a, b) => b.timesReviewed - a.timesReviewed);
  return raw(c, { totalCards: cards.length, masteredCards: mastered, learningCards: learning, newCards: fresh, problematicCards: problem.slice(0, 5) });
});
r.get('/decks/:id/due', auth(), async (c) => {
  const d = await getDeck(c.env, c.req.param('id'));
  if ((await decide(c.env, d, c.get('user'))).locked) throw forbidden(LOCKED.unlockHint ?? undefined);
  const today = todayVN();
  const prog = new Map((await progressRows(c.env, d.id, c.get('user').id)).map((p) => [p.card_id, p]));
  const cards = await all<any>(c.env, 'SELECT * FROM flashcards WHERE deck_id = ? ORDER BY rowid', d.id);
  return raw(c, cards.filter((card) => { const p = prog.get(card.id); return !p || (!p.is_mastered && !(p.next_review_date && p.next_review_date > today)); }).map(cardDto));
});
r.put('/progress/:cardId', auth(), async (c) => {
  const me = c.get('user');
  const card = await one<any>(c.env, 'SELECT id FROM flashcards WHERE id = ?', c.req.param('cardId'));
  if (!card) throw notFound('Không tìm thấy thẻ.');
  const correct = (await body(c)).isCorrect === true;
  const p = await one<any>(c.env, 'SELECT * FROM student_card_progress WHERE student_id = ? AND card_id = ?', me.id, card.id);
  const box = correct ? Math.min((p?.box_level ?? 0) + 1, 5) : 1;
  const next = addDays(correct ? ([0, 1, 3, 7, 14, 30][box] ?? 1) : 1);
  const times = (p?.times_reviewed ?? 0) + 1;
  if (p) await run(c.env, 'UPDATE student_card_progress SET box_level = ?, next_review_date = ?, times_reviewed = ?, is_mastered = ? WHERE id = ?', box, next, times, box === 5 ? 1 : 0, p.id);
  else await run(c.env, 'INSERT INTO student_card_progress (id, student_id, card_id, box_level, next_review_date, times_reviewed, is_mastered) VALUES (?,?,?,?,?,?,?)', uuid(), me.id, card.id, box, next, times, box === 5 ? 1 : 0);
  return raw(c, progressDto(await one(c.env, 'SELECT * FROM student_card_progress WHERE student_id = ? AND card_id = ?', me.id, card.id)));
});
r.post('/decks/:id/favorite', auth(), async (c) => {
  const me = c.get('user');
  const d = await getDeck(c.env, c.req.param('id'));
  const f = await one<{ id: string }>(c.env, 'SELECT id FROM student_favorite_decks WHERE student_id = ? AND deck_id = ?', me.id, d.id);
  if (f) await batch(c.env, [['DELETE FROM student_favorite_decks WHERE id = ?', f.id], ['UPDATE flashcard_decks SET saves_count = MAX(0, COALESCE(saves_count,0) - 1) WHERE id = ?', d.id]]);
  else await batch(c.env, [['INSERT INTO student_favorite_decks (id, student_id, deck_id, created_at) VALUES (?,?,?,?)', uuid(), me.id, d.id, nowISO()], ['UPDATE flashcard_decks SET saves_count = COALESCE(saves_count,0) + 1 WHERE id = ?', d.id]]);
  return raw(c, { favorited: !f });
});
r.get('/decks/:id/favorite', auth(), async (c) => raw(c, { favorited: !!(await one(c.env, 'SELECT 1 AS x FROM student_favorite_decks WHERE student_id = ? AND deck_id = ?', c.get('user').id, c.req.param('id'))) }));

/* ===================== Chia sẻ & sao chép ===================== */
export const share = new Hono<AppEnv>();
share.post('/', auth(), async (c) => {
  const b = await body(c);
  if (!b.resourceId) throw bad('Thiếu resourceId.');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const token = Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => chars[x % chars.length]).join('');
  const type = String(b.resourceType || 'DECK').toUpperCase().slice(0, 20);
  const exp = new Date(Date.now() + 30 * 86_400_000).toISOString();
  await run(c.env, 'INSERT INTO content_shares (id, resource_type, resource_id, share_token, created_by, expires_at, created_at) VALUES (?,?,?,?,?,?,?)', uuid(), type, String(b.resourceId), token, c.get('user').id, exp, nowISO());
  return raw(c, { shareToken: token, shareUrl: `/share/${token}`, resourceType: type, resourceId: b.resourceId, expiresAt: javaTime(exp) });
});
share.get('/:token', async (c) => {
  const s = await one<any>(c.env, 'SELECT * FROM content_shares WHERE share_token = ?', c.req.param('token'));
  if (!s) throw notFound('Không tìm thấy link chia sẻ.');
  if (s.expires_at && s.expires_at < nowISO()) throw bad('Link chia sẻ đã hết hạn');
  return raw(c, { shareToken: s.share_token, resourceType: s.resource_type, resourceId: s.resource_id });
});
share.post('/clone/deck/:deckId', auth(), async (c) => {
  const me = c.get('user');
  const d = await getDeck(c.env, c.req.param('deckId'));
  // Java cho sao chép mọi bộ thẻ, kể cả bộ bị khóa theo lớp: chặn lại
  if ((await decide(c.env, d, me)).locked) throw forbidden('Bạn không có quyền sao chép bộ thẻ này.');
  const cards = (await all<any>(c.env, 'SELECT * FROM flashcards WHERE deck_id = ? ORDER BY rowid', d.id)).map(cardDto);
  const id = await createDeck(c.env, { title: `${d.title} (Bản sao)`, description: d.description, visibility: 'HIDDEN', deckType: d.deck_type, subject: d.subject, cards }, me);
  return raw(c, await deckDto(c.env, await getDeck(c.env, id), true, me));
});

/* ===================== AI điền thông tin từ vựng ===================== */
export const vocabAi = new Hono<AppEnv>();
vocabAi.post('/auto-fill', auth(...STAFF), async (c) => {
  const word = String((await body(c)).word ?? '').trim();
  if (!word) throw bad('Thiếu từ cần tra.');
  if (word.length > 80) throw bad('Từ quá dài.');
  const s = await aiSettings(c.env);
  if (!s.apiKey) throw new ApiError(400, 'AI_NOT_CONFIGURED', 'Chưa cấu hình khóa AI cho trường.');
  try {
    const r = await callJsonAI(s, `Provide vocabulary information for the English word "${word}". Return ONLY a JSON object with keys: phonetic (IPA, e.g. /kəmˈpjuː.tər/), wordType (part of speech in Vietnamese: Danh từ, Động từ, Tính từ, Trạng từ...), definitionEn, definitionVi, example (English sentence), exampleTranslation (Vietnamese), backContent (Vietnamese meaning).`);
    const pick = (k: string) => (r?.[k] == null ? null : String(r[k]).slice(0, 1000));
    return raw(c, { phonetic: pick('phonetic'), wordType: pick('wordType'), definitionEn: pick('definitionEn'), definitionVi: pick('definitionVi'), example: pick('example'), exampleTranslation: pick('exampleTranslation'), backContent: pick('backContent') });
  } catch {
    throw bad('Lỗi khi phân tích từ vựng bằng AI. Vui lòng thử lại sau.', 'AI_FAILED');
  }
});

export default r;
