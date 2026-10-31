import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../types';
import { body, notFound, raw, uuid } from '../lib/http';
import { auth } from '../lib/auth';
import { all, count, one, run } from '../db';
import { nowISO, todayVN } from '../lib/time';
import { recordActivity } from './gamification';

const stripHtml = (h: string | null) => (h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const dto = (i: any) => ({ id: i.id, itemType: i.item_type, content: i.content, correctAnswer: i.correct_answer, wrongAnswer: i.wrong_answer, skillTag: i.skill_tag, sourceTitle: i.source_title, wrongCount: i.wrong_count, repetitions: i.repetitions, intervalDays: i.interval_days, nextReviewDate: i.next_review_date });

/** MistakeVaultService.syncFromExamResult: câu sai sau khi nộp vào sổ lỗi, ôn lại từ hôm nay */
export async function syncMistakes(env: Bindings, studentId: string, examTitle: string, wrong: { questionId: string; content: string; correct: string; wrong: string | null; skillTag: string | null }[]) {
  const today = todayVN();
  for (const w of wrong) {
    const ex = await one<{ id: string }>(env, 'SELECT id FROM mistake_vault_items WHERE student_id = ? AND question_id = ?', studentId, w.questionId);
    if (ex) await run(env, 'UPDATE mistake_vault_items SET wrong_count = wrong_count + 1, wrong_answer = ?, repetitions = 0, interval_days = 1, next_review_date = ?, updated_at = ? WHERE id = ?', w.wrong, today, nowISO(), ex.id);
    else await run(env, `INSERT INTO mistake_vault_items (id, student_id, item_type, question_id, content, correct_answer, wrong_answer, skill_tag, source_title, wrong_count, repetitions, interval_days, ease_factor, next_review_date, created_at, updated_at)
      VALUES (?,?,'EXAM',?,?,?,?,?,?,1,0,1,2.5,?,?,?)`, uuid(), studentId, w.questionId, stripHtml(w.content), stripHtml(w.correct), w.wrong != null ? stripHtml(w.wrong) : null, w.skillTag, examTitle, today, nowISO(), nowISO());
  }
}

const r = new Hono<AppEnv>();
r.use('*', auth());
r.get('/', async (c) => {
  const me = c.get('user');
  const due = await all(c.env, 'SELECT * FROM mistake_vault_items WHERE student_id = ? AND next_review_date <= ? ORDER BY next_review_date', me.id, todayVN());
  return raw(c, { totalItems: await count(c.env, 'SELECT COUNT(*) AS n FROM mistake_vault_items WHERE student_id = ?', me.id), dueToday: due.length, dueItems: due.map(dto) });
});
r.post('/vocab', async (c) => {
  const me = c.get('user');
  const b = await body(c);
  if (!b.flashcardId || !b.frontContent) return c.body(null, 200);
  const today = todayVN();
  const ex = await one<{ id: string }>(c.env, 'SELECT id FROM mistake_vault_items WHERE student_id = ? AND flashcard_id = ?', me.id, String(b.flashcardId));
  if (ex) await run(c.env, 'UPDATE mistake_vault_items SET wrong_count = wrong_count + 1, repetitions = 0, interval_days = 1, next_review_date = ?, updated_at = ? WHERE id = ?', today, nowISO(), ex.id);
  else await run(c.env, `INSERT INTO mistake_vault_items (id, student_id, item_type, flashcard_id, content, correct_answer, skill_tag, source_title, wrong_count, repetitions, interval_days, ease_factor, next_review_date, created_at, updated_at)
    VALUES (?,?,'VOCAB',?,?,?,'VOCABULARY',?,1,0,1,2.5,?,?,?)`, uuid(), me.id, String(b.flashcardId), String(b.frontContent).trim(), String(b.backContent ?? '').trim(), b.sourceTitle ?? null, today, nowISO(), nowISO());
  return c.body(null, 200);
});
// Lặp lại ngắt quãng kiểu SM-2: nhớ -> 1, 3, rồi × ease; quên -> về 1 ngày
r.post('/:id/review', async (c) => {
  const me = c.get('user');
  const it = await one<any>(c.env, 'SELECT * FROM mistake_vault_items WHERE id = ? AND student_id = ?', c.req.param('id'), me.id);
  if (!it) throw notFound('Không tìm thấy mục ôn tập');
  const remembered = (await body(c)).remembered === true;
  let { repetitions: rep, interval_days: iv, ease_factor: ease, wrong_count: wc } = it;
  ease = ease ?? 2.5;
  if (remembered) { rep += 1; iv = rep === 1 ? 1 : rep === 2 ? 3 : Math.max(1, Math.round(iv * ease)); ease = Math.min(3, ease + 0.1); }
  else { rep = 0; iv = 1; ease = Math.max(1.3, ease - 0.2); wc += 1; }
  const next = addDays(todayVN(), iv);
  await run(c.env, 'UPDATE mistake_vault_items SET repetitions = ?, interval_days = ?, ease_factor = ?, wrong_count = ?, next_review_date = ?, last_reviewed_at = ?, updated_at = ? WHERE id = ?', rep, iv, ease, wc, next, nowISO(), nowISO(), it.id);
  await recordActivity(c.env, me, 'MISTAKE_REVIEW');
  return raw(c, dto({ ...it, repetitions: rep, interval_days: iv, wrong_count: wc, next_review_date: next }));
});
export default r;
