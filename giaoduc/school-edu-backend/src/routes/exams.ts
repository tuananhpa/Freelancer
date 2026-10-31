import { Hono } from 'hono';
import * as XLSX from 'xlsx';
import type { AppEnv, Bindings, UserRow } from '../types';
import { STAFF } from '../types';
import { ApiError, bad, body, forbidden, notFound, ok, pageParams, raw, springPage, uuid } from '../lib/http';
import { auth, optionalAuth, isStaff } from '../lib/auth';
import { all, batch, count, inList, one, parseJson, run } from '../db';
import { javaTime, nowISO, utcTime } from '../lib/time';
import { notify } from '../lib/notify';
import { canManage } from './classrooms';
import { recordActivity } from './gamification';
import { syncMistakes } from './mistakeVault';
import { aiSettings, gradeEssay, type EssayGradeResult } from '../lib/ai';

type Env = Bindings;
type ExamRow = Record<string, any> & { id: string; teacher_id: string; visibility: string | null; access_code: string | null; passing_score: number | null };
type Opt = { id: string; content: string; is_correct: number; question_id: string };
type Q = Record<string, any> & { id: string; question_type: string | null; points: number; options: Opt[] };

/* ===================== Chấm điểm thuần (có self-check) ===================== */
/** ExamService.normalizeShortAnswer */
export function normalizeShortAnswer(raw: string | null | undefined) {
  if (raw == null) return '';
  let s = raw.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/ /g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
  s = s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
  s = s.replace(/^[.,!?;:"'()[\]…\s]+|[.,!?;:"'()[\]…\s]+$/g, '');
  return s.replace(/\s+([.,!?;:])/g, '$1');
}
/** ExamService.computeTrueFalseRatio: mặc định sai 0/1/2/3 ý -> 100%/50%/25%/10%, sai hết -> 0 */
export function trueFalseRatio(scoringConfig: string | null | undefined, wrong: number) {
  if (wrong === 0) return 1;
  const fallback = wrong === 1 ? 0.5 : wrong === 2 ? 0.25 : wrong === 3 ? 0.1 : 0;
  if (!scoringConfig || scoringConfig === 'null') return fallback;
  try {
    let root = JSON.parse(scoringConfig);
    if (typeof root === 'string') root = JSON.parse(root);
    const type = root?.type ?? 'ALL_OR_NOTHING';
    if (type === 'ALL_OR_NOTHING') return 0;
    if (Array.isArray(root?.thresholds)) {
      let ratio = 0, best = Infinity;
      for (const t of root.thresholds) {
        const wc = Number(t.wrongCount);
        if (wc === wrong) return Number(t.ratio) || 0;
        if (wc < wrong && wrong - wc < best) { best = wrong - wc; ratio = Number(t.ratio) || 0; }
      }
      return ratio;
    }
  } catch { /* cấu hình hỏng: dùng mặc định */ }
  return fallback;
}
console.assert(trueFalseRatio(null, 1) === 0.5 && trueFalseRatio(null, 4) === 0 && trueFalseRatio('{"type":"ALL_OR_NOTHING"}', 1) === 0, 'trueFalseRatio');
console.assert(normalizeShortAnswer('<p> Tri  Ân. </p>') === 'tri ân', 'normalizeShortAnswer');

type SnapQ = { questionId: string; content: string; imageUrl: string | null; questionType: string; skillTag: string | null; points: number; orderIndex: number; explanation: string | null; sheetAnswerType: string | null; groupId: string | null; scoringConfig: string | null; options: { optionId: string; content: string; isCorrect: boolean | null }[] };
type Snapshot = { examId: string; examTitle: string; examCode: string; durationMinutes: number; passingScore: number | null; maxScore: number; examType: string | null; pdfUrl: string | null; audioUrl: string | null; audioTracks: unknown[]; groups: any[]; questions: SnapQ[] };

/** Chấm một câu không phải tự luận theo ảnh chụp đề; trả null cho câu tự luận */
export function gradeObjective(q: SnapQ, ans: string | undefined | null): { points: number; correct: boolean; selectedOptionId: string | null } | null {
  const type = q.questionType || 'MULTIPLE_CHOICE';
  if (type === 'ESSAY') return null;
  const a = ans ?? null;
  if (type === 'TRUE_FALSE' && a && a.trim().startsWith('{')) {
    try {
      const map = JSON.parse(a) as Record<string, boolean>;
      const wrong = q.options.filter((o) => map[o.optionId] == null || map[o.optionId] !== !!o.isCorrect).length;
      return { points: q.points * trueFalseRatio(q.scoringConfig, wrong), correct: wrong === 0, selectedOptionId: null };
    } catch { return { points: 0, correct: false, selectedOptionId: null }; }
  }
  if (type === 'SHORT_ANSWER' || type === 'FILL_BLANK') {
    if (!a || !a.trim()) return { points: 0, correct: false, selectedOptionId: null };
    const s = normalizeShortAnswer(a);
    const ok_ = q.options.some((o) => o.isCorrect && o.content != null && normalizeShortAnswer(o.content) === s);
    return { points: ok_ ? q.points : 0, correct: ok_, selectedOptionId: null };
  }
  const opt = a ? q.options.find((o) => o.optionId === a) : null;
  return { points: opt?.isCorrect ? q.points : 0, correct: !!opt?.isCorrect, selectedOptionId: opt?.optionId ?? null };
}
const tfq: SnapQ = { questionId: 'q', content: '', imageUrl: null, questionType: 'TRUE_FALSE', skillTag: null, points: 1, orderIndex: 0, explanation: null, sheetAnswerType: null, groupId: null, scoringConfig: null,
  options: ['a', 'b', 'c', 'd'].map((id, i) => ({ optionId: id, content: id, isCorrect: i % 2 === 0 })) };
console.assert(gradeObjective(tfq, JSON.stringify({ a: true, b: false, c: true, d: true }))!.points === 0.5, 'đúng/sai: sai 1 ý = 50%');

/* ===================== Truy vấn ===================== */
export async function getExam(env: Env, id: string) {
  const e = await one<ExamRow>(env, 'SELECT * FROM exams WHERE id = ?', id);
  if (!e) throw notFound('Không tìm thấy đề thi.');
  return e;
}
async function questionsOf(env: Env, examId: string): Promise<Q[]> {
  const qs = await all<Q>(env, 'SELECT * FROM questions WHERE exam_id = ? ORDER BY order_index', examId);
  if (!qs.length) return [];
  const opts = await all<Opt>(env, `SELECT * FROM question_options WHERE question_id IN ${inList(qs.length)} ORDER BY rowid`, ...qs.map((q) => q.id));
  return qs.map((q) => ({ ...q, options: opts.filter((o) => o.question_id === q.id) }));
}
const groupsOf = (env: Env, examId: string) => all<any>(env, 'SELECT * FROM question_groups WHERE exam_id = ? ORDER BY order_index', examId);

function snapshotOf(e: ExamRow, qs: Q[], groups: any[]): Snapshot {
  return {
    examId: e.id, examTitle: e.title, examCode: e.exam_code, durationMinutes: e.duration_minutes, passingScore: e.passing_score, maxScore: qs.reduce((s, q) => s + (q.points ?? 0), 0),
    examType: e.exam_type, pdfUrl: e.pdf_url, audioUrl: e.audio_url, audioTracks: parseJson(e.audio_tracks, []),
    groups: groups.map((g) => ({ groupId: g.id, groupTitle: g.group_title, passageText: g.passage_text, audioUrl: g.audio_url, orderIndex: g.order_index })),
    questions: qs.map((q) => ({ questionId: q.id, content: q.content, imageUrl: q.image_url, questionType: q.question_type || 'MULTIPLE_CHOICE', skillTag: q.skill_tag, points: q.points ?? 0, orderIndex: q.order_index,
      explanation: q.explanation, sheetAnswerType: q.sheet_answer_type, groupId: q.group_id, scoringConfig: q.scoring_config,
      options: q.options.map((o) => ({ optionId: o.id, content: o.content, isCorrect: !!o.is_correct })) })),
  };
}
const hideAnswers = (s: Snapshot): Snapshot => ({ ...s, questions: s.questions.map((q) => ({ ...q, explanation: null, options: q.options.map((o) => ({ ...o, isCorrect: null })) })) });

/** ExamAccessControlService.hasEditPermission */
export async function hasEditPermission(env: Env, e: ExamRow, u: UserRow | null) {
  if (!u) return false;
  if (u.role === 'ADMIN' || u.role === 'OFFICE' || e.teacher_id === u.id) return true;
  const cls = await all<any>(env, `SELECT DISTINCT c.* FROM classrooms c WHERE c.id IN (SELECT classroom_id FROM class_resources WHERE resource_id = ? UNION SELECT classroom_id FROM class_exams WHERE exam_id = ?)`, e.id, e.id);
  for (const c of cls) if (await canManage(env, c, u)) return true;
  return false;
}
const assignedToUserClass = async (env: Env, examId: string, userId: string) =>
  !!(await one(env, `SELECT 1 AS x FROM class_members m WHERE m.user_id = ? AND m.classroom_id IN (SELECT classroom_id FROM class_exams WHERE exam_id = ? UNION SELECT classroom_id FROM class_resources WHERE resource_id = ?) LIMIT 1`, userId, examId, examId));

/** StudentResourceAccessService.decideSingle + mở khóa khi đề giao cho lớp của học sinh hoặc qua học liệu công khai */
async function accessDecision(env: Env, e: ExamRow, u: UserRow | null, libraryResourceId?: string | null) {
  const full = { accessLevel: 'FULL', locked: false, previewRank: null as number | null, unlockHint: null as string | null };
  const locked = { accessLevel: 'PREVIEW', locked: true, previewRank: null, unlockHint: 'Đăng ký học với giáo viên này để mở toàn bộ đề / từ vựng / flashcard.' };
  if (u && (isStaff(u) || e.teacher_id === u.id)) return full;
  if (e.visibility !== 'CLASSROOM') return full;
  if (u && (await assignedToUserClass(env, e.id, u.id))) return full;
  if (libraryResourceId && (await one(env, 'SELECT 1 AS x FROM content_resources WHERE id = ? AND attached_exam_id = ? AND is_public = 1', libraryResourceId, e.id))) return full;
  return locked;
}

/** ExamAccessControlService.isPureLibraryExam: đề gắn học liệu và không giao lớp nào -> luyện tập, xem đáp án */
const isPureLibraryExam = async (env: Env, examId: string, libraryResourceId?: string | null) => {
  if (!libraryResourceId) return false;
  if (!(await one(env, 'SELECT 1 AS x FROM content_resources WHERE id = ? AND attached_exam_id = ?', libraryResourceId, examId))) return false;
  return !(await one(env, 'SELECT 1 AS x FROM class_exams WHERE exam_id = ? UNION SELECT 1 FROM class_resources WHERE resource_id = ? LIMIT 1', examId, examId));
};

function requireAccessCode(e: ExamRow, code: string | undefined | null) {
  if (e.visibility !== 'HIDDEN' || !e.access_code) return;
  if (!code) throw new ApiError(400, 'ACCESS_CODE_REQUIRED', 'Đề thi này yêu cầu mã truy cập.');
  if (code !== e.access_code) throw new ApiError(400, 'INVALID_ACCESS_CODE', 'Mã truy cập không chính xác.');
}

/** ExamService.toResponse */
async function examDto(env: Env, e: ExamRow, forStudent: boolean, u: UserRow | null, reveal = !forStudent, withQuestions = true) {
  const canSee = !(forStudent && e.start_time && e.start_time > nowISO());
  const qs = withQuestions && canSee ? await questionsOf(env, e.id) : [];
  const groups = withQuestions && canSee ? await groupsOf(env, e.id) : null;
  const teacher = await one<any>(env, 'SELECT full_name, avatar_url FROM users WHERE id = ?', e.teacher_id);
  const folder = e.folder_id ? await one<any>(env, 'SELECT name FROM content_folders WHERE id = ?', e.folder_id) : null;
  let attempts: number | null = null, latest: string | null = null;
  if (forStudent && u) {
    attempts = await count(env, 'SELECT COUNT(*) AS n FROM student_exam_results WHERE student_id = ? AND exam_id = ? AND submitted_at IS NOT NULL', u.id, e.id);
    latest = (await one<any>(env, 'SELECT id FROM student_exam_results WHERE student_id = ? AND exam_id = ? AND submitted_at IS NOT NULL ORDER BY submitted_at DESC LIMIT 1', u.id, e.id))?.id ?? null;
  }
  return {
    id: e.id, title: e.title, description: e.description, subject: e.subject, grade: e.grade, durationMinutes: e.duration_minutes, passingScore: e.passing_score,
    isPublished: !!e.is_published, visibility: e.visibility, shuffleQuestions: !!e.shuffle_questions,
    questionCount: withQuestions ? (canSee ? qs.length : 0) : await count(env, 'SELECT COUNT(*) AS n FROM questions WHERE exam_id = ?', e.id),
    teacherName: teacher?.full_name ?? null, teacherAvatar: teacher?.avatar_url ?? null, teacherId: e.teacher_id, createdAt: javaTime(e.created_at),
    startTime: javaTime(e.start_time), endTime: javaTime(e.end_time), reviewPolicy: e.review_policy, maxAttempts: e.max_attempts, userAttemptCount: attempts, latestResultId: latest,
    examCode: e.exam_code, folderId: e.folder_id, folderName: folder?.name ?? null,
    isFavorited: u ? !!(await one(env, 'SELECT 1 AS x FROM user_favorite_exams WHERE user_id = ? AND exam_id = ?', u.id, e.id)) : null,
    examType: e.exam_type, pdfUrl: e.pdf_url, audioUrl: e.audio_url, audioTracks: parseJson(e.audio_tracks, []), hasPassword: !!e.access_code, accessCode: forStudent ? null : e.access_code,
    assessmentType: e.assessment_type ?? null,
    accessLevel: 'FULL', locked: false, previewRank: null as number | null, unlockHint: null as string | null,
    questions: qs.map((q) => ({ id: q.id, content: q.content, imageUrl: q.image_url, questionType: q.question_type, skillTag: q.skill_tag, orderIndex: q.order_index, points: q.points,
      explanation: reveal ? q.explanation : null, groupId: q.group_id, sheetAnswerType: q.sheet_answer_type, scoringConfig: reveal ? q.scoring_config : undefined,
      options: q.options.map((o) => ({ id: o.id, content: o.content, isCorrect: reveal ? !!o.is_correct : null })) })),
    questionGroups: groups ? groups.map((g) => ({ id: g.id, groupTitle: g.group_title, passageText: g.passage_text, audioUrl: g.audio_url, orderIndex: g.order_index })) : null,
  };
}
const applyAccess = (dto: any, d: any) => { Object.assign(dto, d); if (d.locked) { dto.questions = []; dto.questionGroups = null; } return dto; };

/* ===================== Lưu đề (tạo/sửa) ===================== */
const genCode = async (env: Env) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (;;) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => chars[b % chars.length]).join('');
    if (!(await one(env, 'SELECT 1 AS x FROM exams WHERE exam_code = ?', code))) return code;
  }
};
const VIS = ['PUBLIC', 'HIDDEN', 'CLASSROOM'];
const ASSESS = ['TX', 'GK', 'CK'];
function examFields(b: any) {
  if (!b.title || !String(b.title).trim()) throw bad('Tiêu đề đề thi không được để trống');
  const dur = Number(b.durationMinutes);
  if (!Number.isInteger(dur) || dur <= 0 || dur > 1440) throw bad('Thời gian làm bài phải lớn hơn 0');
  if (b.isPublished === true && !(Array.isArray(b.questions) && b.questions.length)) throw bad('Đề thi phải có ít nhất một câu hỏi');
  if (b.visibility && !VIS.includes(b.visibility)) throw bad('Chế độ hiển thị không hợp lệ.');
  if (b.assessmentType && !ASSESS.includes(b.assessmentType)) throw bad('Loại bài kiểm tra không hợp lệ.');
  return {
    title: String(b.title).trim().slice(0, 500), description: b.description ?? null, subject: b.subject ?? null, grade: b.grade ?? null, duration_minutes: dur,
    passing_score: b.passingScore != null ? Number(b.passingScore) : 50, shuffle_questions: b.shuffleQuestions ? 1 : 0, is_published: b.isPublished ? 1 : 0, visibility: b.visibility || 'PUBLIC',
    start_time: utcTime(b.startTime), end_time: utcTime(b.endTime), review_policy: b.reviewPolicy || 'IMMEDIATELY', max_attempts: b.maxAttempts != null ? Number(b.maxAttempts) : 1,
    exam_type: b.examType || 'DETAILED', pdf_url: b.pdfUrl ?? null, audio_url: b.audioUrl ?? null, audio_tracks: JSON.stringify(Array.isArray(b.audioTracks) ? b.audioTracks : []),
    access_code: b.accessCode || null, assessment_type: b.assessmentType || null,
  };
}
async function resolveFolder(env: Env, folderId: unknown, owner: UserRow) {
  if (!folderId) return null;
  const f = await one<any>(env, 'SELECT id, owner_id FROM content_folders WHERE id = ?', String(folderId));
  if (!f) throw notFound('Không tìm thấy thư mục.');
  if (f.owner_id !== owner.id && owner.role !== 'ADMIN') throw forbidden('Bạn không có quyền dùng thư mục này.');
  return f.id;
}

/**
 * Ghi nhóm câu hỏi + câu hỏi + đáp án. Giữ id cũ khi client gửi id thật (khớp updateExam: theo id, rồi theo vị trí)
 * để bài làm cũ vẫn trỏ đúng câu.
 */
async function writeQuestions(env: Env, examId: string, b: any, isUpdate: boolean) {
  const stmts: [string, ...unknown[]][] = [];
  const oldGroups = isUpdate ? await groupsOf(env, examId) : [];
  const oldQs = isUpdate ? await questionsOf(env, examId) : [];
  const tempToGroup = new Map<string, string>();
  const keptGroups = new Set<string>();
  (Array.isArray(b.questionGroups) ? b.questionGroups : []).forEach((g: any, i: number) => {
    const existing = g.id && oldGroups.find((x) => x.id === g.id);
    const id = existing ? existing.id : uuid();
    if (g.id) tempToGroup.set(String(g.id), id);
    keptGroups.add(id);
    stmts.push(existing
      ? ['UPDATE question_groups SET group_title = ?, passage_text = ?, audio_url = ?, order_index = ? WHERE id = ?', g.groupTitle ?? null, g.passageText ?? null, g.audioUrl ?? null, i, id]
      : ['INSERT INTO question_groups (id, exam_id, group_title, passage_text, audio_url, order_index, created_at) VALUES (?,?,?,?,?,?,?)', id, examId, g.groupTitle ?? null, g.passageText ?? null, g.audioUrl ?? null, i, nowISO()]);
  });
  const remainingQ = new Map(oldQs.map((q) => [q.id, q]));
  const keptQ = new Set<string>();
  (Array.isArray(b.questions) ? b.questions : []).forEach((dto: any, i: number) => {
    let q: Q | undefined = dto.id && String(dto.id).length >= 36 ? remainingQ.get(String(dto.id)) : undefined;
    if (!q && i < oldQs.length && remainingQ.has(oldQs[i].id)) q = oldQs[i];
    if (q) remainingQ.delete(q.id);
    const qid = q?.id ?? uuid();
    keptQ.add(qid);
    const gid = dto.groupId ? tempToGroup.get(String(dto.groupId)) ?? (oldGroups.some((g) => g.id === dto.groupId) ? String(dto.groupId) : null) : null;
    const vals = [dto.content ?? '', dto.imageUrl ?? null, dto.questionType || 'MULTIPLE_CHOICE', gid, dto.explanation ?? null, dto.sheetAnswerType ?? null, i, dto.points != null ? Number(dto.points) : 1, dto.skillTag || 'GENERAL', dto.scoringConfig ?? null];
    stmts.push(q
      ? ['UPDATE questions SET content = ?, image_url = ?, question_type = ?, group_id = ?, explanation = ?, sheet_answer_type = ?, order_index = ?, points = ?, skill_tag = ?, scoring_config = ? WHERE id = ?', ...vals, qid]
      : ['INSERT INTO questions (content, image_url, question_type, group_id, explanation, sheet_answer_type, order_index, points, skill_tag, scoring_config, id, exam_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', ...vals, qid, examId]);
    const oldOpts = q?.options ?? [];
    const remainingO = new Map(oldOpts.map((o) => [o.id, o]));
    const keptO: string[] = [];
    (Array.isArray(dto.options) ? dto.options : []).forEach((o: any, j: number) => {
      let old: Opt | undefined = o.id && String(o.id).length >= 36 ? remainingO.get(String(o.id)) : undefined;
      if (!old && j < oldOpts.length && remainingO.has(oldOpts[j].id)) old = oldOpts[j];
      if (old) remainingO.delete(old.id);
      const oid = old?.id ?? uuid();
      keptO.push(oid);
      stmts.push(old ? ['UPDATE question_options SET content = ?, is_correct = ? WHERE id = ?', o.content ?? '', o.isCorrect ? 1 : 0, oid]
        : ['INSERT INTO question_options (id, content, is_correct, question_id) VALUES (?,?,?,?)', oid, o.content ?? '', o.isCorrect ? 1 : 0, qid]);
    });
    if (q) stmts.push([`DELETE FROM question_options WHERE question_id = ? AND id NOT IN ${inList(keptO.length)}`, qid, ...keptO]);
  });
  if (isUpdate) {
    // Câu bị xóa: khóa ngoại SET NULL giữ bài làm cũ, CASCADE xóa đáp án và bản nháp
    const dropQ = [...remainingQ.keys()];
    if (dropQ.length) stmts.push([`DELETE FROM questions WHERE id IN ${inList(dropQ.length)}`, ...dropQ]);
    const dropG = oldGroups.map((g) => g.id).filter((id) => !keptGroups.has(id));
    if (dropG.length) stmts.push([`DELETE FROM question_groups WHERE id IN ${inList(dropG.length)}`, ...dropG]);
  }
  if (stmts.length) await batch(env, stmts);
}

/** ExamService.autoRegradeExamResults: sửa đề thì chấm lại câu khách quan của các bài đã nộp */
async function autoRegrade(env: Env, e: ExamRow) {
  const results = await all<any>(env, 'SELECT id FROM student_exam_results WHERE exam_id = ? AND submitted_at IS NOT NULL', e.id);
  if (!results.length) return;
  const snap = snapshotOf(e, await questionsOf(env, e.id), await groupsOf(env, e.id));
  for (const r of results) {
    const answers = await all<any>(env, 'SELECT * FROM student_answers WHERE result_id = ?', r.id);
    if (!answers.length) continue;
    const stmts: [string, ...unknown[]][] = [];
    let total = 0;
    for (const a of answers) {
      const q = snap.questions.find((x) => x.questionId === a.question_id);
      if (!q || q.questionType === 'ESSAY') { total += a.points_earned ?? 0; continue; }
      const g = gradeObjective(q, q.questionType === 'MULTIPLE_CHOICE' || !q.questionType ? (a.selected_option_id ?? a.text_response) : a.text_response)!;
      stmts.push(['UPDATE student_answers SET is_correct = ?, points_earned = ?, selected_option_id = ? WHERE id = ?', g.correct ? 1 : 0, g.points, g.selectedOptionId ?? a.selected_option_id, a.id]);
      total += g.points;
    }
    const pct = snap.maxScore > 0 ? (total / snap.maxScore) * 100 : 0;
    stmts.push(['UPDATE student_exam_results SET total_score = ?, is_passed = ?, exam_snapshot = ? WHERE id = ?', total, e.passing_score == null || pct >= e.passing_score ? 1 : 0, JSON.stringify(snap), r.id]);
    await batch(env, stmts);
  }
}

/* ===================== Kết quả ===================== */
const AI_FAIL = /quá tải|lỗi xảy ra|Không thể chấm|chấm tay sau|Chưa cấu hình AI/;
const essayStatus = (a: any) => !a || !a.text_response || !String(a.text_response).trim() ? 'NOT_SUBMITTED' : a.reviewed ? 'TEACHER_REVIEWED' : a.ai_feedback && AI_FAIL.test(a.ai_feedback) ? 'AI_FAILED' : a.ai_suggested_score != null ? 'AI_SCORED' : 'PENDING_AI';
const secondsBetween = (a: string | null, b: string | null) => (a && b ? Math.floor((Date.parse(b) - Date.parse(a)) / 1000) : 0);

async function loadResult(env: Env, id: string) {
  const r = await one<any>(env, 'SELECT * FROM student_exam_results WHERE id = ?', id);
  if (!r) throw notFound('Không tìm thấy kết quả');
  return r;
}
async function snapOfResult(env: Env, r: any, e: ExamRow): Promise<Snapshot> {
  return parseJson<Snapshot | null>(r.exam_snapshot, null) ?? snapshotOf(e, await questionsOf(env, e.id), await groupsOf(env, e.id));
}
const pendingEssay = async (env: Env, resultId: string) =>
  !!(await one(env, "SELECT 1 AS x FROM student_answers a JOIN questions q ON q.id = a.question_id WHERE a.result_id = ? AND q.question_type = 'ESSAY' AND (a.reviewed IS NULL OR a.reviewed = 0) LIMIT 1", resultId));

/** ExamService.getResultDetail */
async function resultDetail(env: Env, resultId: string, u: UserRow) {
  const r = await loadResult(env, resultId);
  const e = await getExam(env, r.exam_id);
  const canEdit = await hasEditPermission(env, e, u);
  if (r.student_id !== u.id && !canEdit) throw bad('Bạn không có quyền xem kết quả này');
  const snap = await snapOfResult(env, r, e);
  const answers = await all<any>(env, 'SELECT * FROM student_answers WHERE result_id = ?', r.id);
  const student = await one<any>(env, 'SELECT full_name FROM users WHERE id = ?', r.student_id);
  const isOwner = u.id === r.student_id;
  const staffPriv = canEdit || isStaff(u);
  const pendingReview = isOwner && !staffPriv && (await pendingEssay(env, r.id));
  let canReview = staffPriv, reviewMessage: string | null = null;
  if (!canReview) {
    if (e.review_policy === 'NEVER') reviewMessage = 'Giáo viên không cho phép xem lại chi tiết bài thi.';
    else if (e.review_policy === 'AFTER_ALL_SUBMITTED') { if (e.end_time && e.end_time < nowISO()) canReview = true; else reviewMessage = 'Chỉ có thể xem kết quả chi tiết sau khi thời gian thi kết thúc.'; }
    else canReview = true;
  }
  if (!canReview && pendingReview) canReview = true;
  const total = r.total_score ?? 0;
  const out: any = {
    resultId: r.id, examId: e.id, examTitle: e.title, examCode: e.exam_code, studentName: student?.full_name ?? null, totalScore: r.total_score, maxScore: snap.maxScore,
    scorePercentage: snap.maxScore > 0 ? (total / snap.maxScore) * 100 : 0, isPassed: r.is_passed == null ? null : !!r.is_passed,
    startedAt: javaTime(r.started_at), submittedAt: javaTime(r.submitted_at), timeTakenSeconds: secondsBetween(r.started_at, r.submitted_at),
    correctCount: answers.filter((a) => a.is_correct).length, totalCount: snap.questions.length, cheatWarningCount: r.cheat_warning_count, cheatDetails: r.cheat_details,
    pendingTeacherReview: pendingReview, reviewMessage: pendingReview ? 'Bài làm có câu tự luận đang chờ giáo viên chấm & duyệt điểm. Bạn có thể xem lại bài viết bên dưới. Nhận xét chi tiết sẽ hiển thị sau khi giáo viên duyệt.' : canReview ? null : reviewMessage,
  };
  if (canReview) {
    out.questions = snap.questions.map((q) => {
      const a = answers.find((x) => x.question_id === q.questionId);
      const essay = q.questionType === 'ESSAY';
      const hide = pendingReview && essay && !a?.reviewed;
      return {
        questionId: q.questionId, answerId: a?.id ?? null, reviewed: a ? !!a.reviewed : null, essayStatus: essay ? essayStatus(a) : null, questionContent: q.content, explanation: q.explanation,
        questionType: q.questionType, sheetAnswerType: q.sheetAnswerType, orderIndex: q.orderIndex, points: q.points, pointsEarned: hide ? null : a?.points_earned ?? 0,
        isCorrect: hide ? null : !!a?.is_correct, textResponse: a?.text_response ?? null, aiFeedback: hide ? null : a?.ai_feedback ?? null,
        options: q.options.map((o) => ({ id: o.optionId, content: o.content, isCorrect: o.isCorrect, isSelected: !!a && a.selected_option_id === o.optionId })),
      };
    });
  }
  return out;
}

async function recomputeTotal(env: Env, r: any, e: ExamRow, opts: { lenient?: boolean; forcePass?: boolean } = {}) {
  const snap = await snapOfResult(env, r, e);
  const total = Math.round(Number((await one<any>(env, 'SELECT COALESCE(SUM(points_earned),0) AS s FROM student_answers WHERE result_id = ?', r.id))?.s ?? 0) * 100) / 100;
  const max = snap.maxScore || 10;
  const pct = max > 0 ? (total / max) * 100 : 0;
  let pass = e.passing_score ?? 50;
  if (opts.lenient && pass <= 10 && max > 0) pass = (pass / max) * 100; // Java: điểm đạt ≤ 10 hiểu là thang điểm
  const isPassed = opts.forcePass || pct >= pass || (opts.lenient === true && pct >= 50);
  await run(env, 'UPDATE student_exam_results SET total_score = ?, is_passed = ? WHERE id = ?', total, isPassed ? 1 : 0, r.id);
  return { total, max, pct, isPassed };
}
const fmt1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const answerWithResult = async (env: Env, answerId: string) => {
  const a = await one<any>(env, "SELECT a.*, q.question_type, q.points AS q_points, q.content AS q_content, q.explanation AS q_expected FROM student_answers a LEFT JOIN questions q ON q.id = a.question_id WHERE a.id = ?", answerId);
  if (!a) throw notFound('Không tìm thấy câu trả lời');
  return a;
};
const essayItem = async (env: Env, answerId: string) => {
  const a = await one<any>(env, `SELECT a.*, r.submitted_at, r.id AS rid, u.full_name, u.email, q.content AS q_content, q.points AS q_points FROM student_answers a JOIN student_exam_results r ON r.id = a.result_id
     JOIN users u ON u.id = r.student_id LEFT JOIN questions q ON q.id = a.question_id WHERE a.id = ?`, answerId);
  return { answerId: a.id, resultId: a.rid, studentName: a.full_name, studentEmail: a.email, questionContent: a.q_content, studentAnswer: a.text_response, maxPoints: a.q_points,
    aiSuggestedScore: a.ai_suggested_score, aiFeedback: a.ai_feedback, submittedAt: javaTime(a.submitted_at) };
};

/** ExamService.regradeEssayWithAI */
async function regradeEssay(env: Env, answerId: string, u: UserRow | null) {
  const a = await answerWithResult(env, answerId);
  if (a.question_type !== 'ESSAY') throw bad('Câu trả lời này không phải câu tự luận');
  const r = await loadResult(env, a.result_id);
  if (u && !isStaff(u) && r.student_id !== u.id) throw forbidden('Bạn không có quyền yêu cầu chấm lại bài làm này.');
  const e = await getExam(env, r.exam_id);
  const g = await gradeEssay(env, { content: a.q_content, expected: a.q_expected }, a.text_response, a.q_points ?? 0, e.subject);
  await run(env, 'UPDATE student_answers SET ai_suggested_score = ?, ai_feedback = ?, points_earned = ?, is_correct = ?, reviewed = 0 WHERE id = ?', g.score, JSON.stringify(g), g.score, g.score >= (a.q_points ?? 0) / 2 ? 1 : 0, a.id);
  await recomputeTotal(env, r, e, { lenient: true });
  return essayItem(env, a.id);
}

/** ExamService.reviewEssayAnswer: giáo viên chốt điểm câu tự luận (kẹp 0..điểm tối đa) */
async function reviewEssay(env: Env, answerId: string, b: any, u: UserRow) {
  const a = await answerWithResult(env, answerId);
  if (a.question_type !== 'ESSAY') throw bad('Câu trả lời này không phải câu tự luận cần duyệt');
  const r = await loadResult(env, a.result_id);
  const e = await getExam(env, r.exam_id);
  if (!(await hasEditPermission(env, e, u))) throw forbidden('Bạn không có quyền chấm bài này.');
  const max = a.q_points ?? 0;
  const score = b.score != null ? Math.max(0, Math.min(Number(b.score), max)) : a.points_earned ?? 0;
  await run(env, 'UPDATE student_answers SET points_earned = ?, is_correct = ?, ai_feedback = COALESCE(?, ai_feedback), reviewed = 1 WHERE id = ?', score, score >= max / 2 ? 1 : 0, b.feedback ?? null, a.id);
  const t = await recomputeTotal(env, r, e, { lenient: true, forcePass: b.isPassed === true });
  if (!(await pendingEssay(env, r.id))) await notify(env, r.student_id, `Kết quả bài thi: ${e.title}`, `Giáo viên đã chấm xong bài thi. Điểm số: ${fmt1(t.total)}/${fmt1(t.max)} (${t.isPassed ? 'Đạt' : 'Chưa đạt'}).`, `/exams/${e.id}/results/${r.id}`, 'EXAM', null, 'EXAM_SUBMISSION', r.id);
  return `Đã duyệt điểm: ${score}/${max}`;
}
const answerOfQuestion = async (env: Env, resultId: string, questionId: string) => {
  const a = await one<{ id: string }>(env, 'SELECT id FROM student_answers WHERE result_id = ? AND question_id = ?', resultId, questionId);
  if (!a) throw notFound('Không tìm thấy câu trả lời của câu hỏi này');
  return a.id;
};

/* ===================== Routes ===================== */
const exams = new Hono<AppEnv>();
const staff = auth(...STAFF);

const listExams = async (c: any, base: string, params: unknown[], forStudent: boolean) => {
  const { page, size, offset } = pageParams(c, 9, 200);
  const where = [base];
  const p = [...params];
  const s = c.req.query('search')?.trim().toLowerCase();
  if (s) { where.push('lower(e.title) LIKE ?'); p.push(`%${s}%`); }
  const folder = c.req.query('folderId');
  if (folder === 'none') where.push('e.folder_id IS NULL');
  else if (folder && /^[0-9a-f-]{36}$/i.test(folder)) { where.push('e.folder_id = ?'); p.push(folder); }
  const subject = c.req.query('subject')?.trim().toLowerCase();
  if (subject) { where.push('lower(e.subject) LIKE ?'); p.push(`%${subject}%`); }
  const grade = c.req.query('grade');
  if (grade) { where.push('e.grade = ?'); p.push(grade); }
  const w = where.join(' AND ');
  const rows = await all<ExamRow>(c.env, `SELECT e.* FROM exams e WHERE ${w} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`, ...p, size, offset);
  const u = c.get('user') ?? null;
  const content = await Promise.all(rows.map(async (e) => {
    const d = await examDto(c.env, e, forStudent, u, !forStudent, false);
    return forStudent ? applyAccess(d, await accessDecision(c.env, e, u)) : d;
  }));
  return springPage(content, await count(c.env, `SELECT COUNT(*) AS n FROM exams e WHERE ${w}`, ...p), page, size);
};

exams.get('/subjects', async (c) => {
  const rows = await all<{ subject: string }>(c.env, "SELECT DISTINCT subject FROM exams WHERE subject IS NOT NULL AND subject <> ''");
  return raw(c, [...new Set(rows.flatMap((r) => r.subject.split(',').map((s) => s.trim()).filter(Boolean)))].sort());
});
exams.get('/public', optionalAuth, async (c) => raw(c, await listExams(c, "e.is_published = 1 AND e.visibility = 'PUBLIC'", [], true)));
exams.get('/teacher', auth(), async (c) => raw(c, await listExams(c, 'e.teacher_id = ?', [c.get('user').id], false)));
exams.get('/favorites', auth(), async (c) => raw(c, await listExams(c, 'e.id IN (SELECT exam_id FROM user_favorite_exams WHERE user_id = ?)', [c.get('user').id], true)));
exams.get('/code/:code', optionalAuth, async (c) => {
  const e = await one<ExamRow>(c.env, 'SELECT * FROM exams WHERE upper(exam_code) = upper(?) AND is_published = 1', c.req.param('code'));
  if (!e) throw notFound(`Không tìm thấy đề thi với mã: ${c.req.param('code')}`);
  return raw(c, await examDto(c.env, e, true, c.get('user') ?? null, false, false));
});

exams.get('/history', auth(), async (c) => {
  const me = c.get('user');
  const { page, size, offset } = pageParams(c, 10, 100);
  const where = ['r.student_id = ?', 'r.submitted_at IS NOT NULL'];
  const p: unknown[] = [me.id];
  const s = c.req.query('search')?.trim().toLowerCase();
  if (s) { where.push('lower(e.title) LIKE ?'); p.push(`%${s}%`); }
  const st = c.req.query('status')?.toLowerCase();
  if (st === 'passed') where.push('r.is_passed = 1'); else if (st === 'failed') where.push('r.is_passed = 0');
  const from = c.req.query('fromDate'), to = c.req.query('toDate');
  if (from) { where.push('r.submitted_at >= ?'); p.push(utcTime(`${from}T00:00:00`)); }
  if (to) { where.push('r.submitted_at <= ?'); p.push(utcTime(`${to}T23:59:59`)); }
  const w = where.join(' AND ');
  const rows = await all<any>(c.env, `SELECT r.*, e.title, e.exam_code, e.max_attempts, u.full_name AS teacher_name, (SELECT COALESCE(SUM(points),0) FROM questions q WHERE q.exam_id = e.id) AS max_score
     FROM student_exam_results r JOIN exams e ON e.id = r.exam_id LEFT JOIN users u ON u.id = e.teacher_id WHERE ${w} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, ...p, size, offset);
  const content = await Promise.all(rows.map(async (r) => {
    const pending = await pendingEssay(c.env, r.id);
    const base: any = { resultId: r.id, examId: r.exam_id, examTitle: r.title, examCode: r.exam_code, teacherName: r.teacher_name, startedAt: javaTime(r.started_at), submittedAt: javaTime(r.submitted_at),
      timeTakenSeconds: secondsBetween(r.started_at, r.submitted_at), attemptNumber: 1, totalAttempts: r.max_attempts, cheatWarningCount: r.cheat_warning_count, pendingTeacherReview: pending };
    if (pending) base.reviewMessage = 'Giáo viên đang chấm bài, kết quả sẽ có sau khi được duyệt.';
    else Object.assign(base, { totalScore: r.total_score, maxScore: r.max_score, scorePercentage: r.max_score > 0 ? ((r.total_score ?? 0) / r.max_score) * 100 : 0, isPassed: !!r.is_passed });
    return base;
  }));
  return raw(c, springPage(content, await count(c.env, `SELECT COUNT(*) AS n FROM student_exam_results r JOIN exams e ON e.id = r.exam_id WHERE ${w}`, ...p), page, size));
});

exams.get('/results/:resultId', auth(), async (c) => raw(c, await resultDetail(c.env, c.req.param('resultId'), c.get('user'))));
exams.get('/results/:resultId/review', auth(), async (c) => raw(c, await resultDetail(c.env, c.req.param('resultId'), c.get('user'))));

exams.get('/:id', optionalAuth, async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  const u = c.get('user') ?? null;
  const lib = c.req.query('libraryResourceId');
  const forStudent = !(await hasEditPermission(c.env, e, u));
  if (forStudent) requireAccessCode(e, c.req.query('accessCode'));
  const dto: any = await examDto(c.env, e, forStudent, u, !forStudent || (await isPureLibraryExam(c.env, e.id, lib)));
  if (forStudent) applyAccess(dto, await accessDecision(c.env, e, u, lib));
  if (lib) dto.maxAttempts = 0;
  return raw(c, dto);
});

exams.post('/', staff, async (c) => {
  const me = c.get('user');
  const b = await body(c);
  const f = examFields(b);
  const id = uuid();
  const cols = Object.keys(f);
  await run(c.env, `INSERT INTO exams (id, exam_code, teacher_id, folder_id, created_at, ${cols.join(', ')}) VALUES (?,?,?,?,?,${cols.map(() => '?').join(',')})`,
    id, await genCode(c.env), me.id, await resolveFolder(c.env, b.folderId, me), nowISO(), ...Object.values(f));
  await writeQuestions(c.env, id, b, false);
  if (f.visibility === 'CLASSROOM' && Array.isArray(b.assignedClassIds))
    for (const cid of b.assignedClassIds) if (await one(c.env, 'SELECT 1 AS x FROM classrooms WHERE id = ?', cid))
      await run(c.env, "INSERT INTO class_resources (id, classroom_id, folder_id, resource_type, resource_id, created_at) SELECT ?, ?, NULL, 'EXAM', ?, ? WHERE NOT EXISTS (SELECT 1 FROM class_resources WHERE classroom_id = ? AND resource_id = ?)", uuid(), cid, id, nowISO(), cid, id);
  return raw(c, await examDto(c.env, await getExam(c.env, id), false, me));
});

exams.put('/:id', staff, async (c) => {
  const me = c.get('user');
  const e = await getExam(c.env, c.req.param('id'));
  if (!(await hasEditPermission(c.env, e, me))) throw bad('Bạn không có quyền chỉnh sửa đề thi này.');
  const b = await body(c);
  const f = examFields(b);
  await run(c.env, `UPDATE exams SET ${Object.keys(f).map((k) => `${k} = ?`).join(', ')}, folder_id = ? WHERE id = ?`, ...Object.values(f), await resolveFolder(c.env, b.folderId, me), e.id);
  await run(c.env, 'DELETE FROM draft_answers WHERE result_id IN (SELECT id FROM student_exam_results WHERE exam_id = ?)', e.id);
  await writeQuestions(c.env, e.id, b, true);
  const fresh = await getExam(c.env, e.id);
  await autoRegrade(c.env, fresh);
  return raw(c, await examDto(c.env, fresh, false, me));
});
exams.patch('/:id/publish', staff, async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  if (!(await hasEditPermission(c.env, e, c.get('user')))) throw bad('Bạn không có quyền chỉnh sửa đề thi này.');
  if (!e.is_published && !(await count(c.env, 'SELECT COUNT(*) AS n FROM questions WHERE exam_id = ?', e.id))) throw bad('Đề thi phải có ít nhất một câu hỏi');
  await run(c.env, 'UPDATE exams SET is_published = ? WHERE id = ?', e.is_published ? 0 : 1, e.id);
  return raw(c, await examDto(c.env, await getExam(c.env, e.id), false, c.get('user')));
});
exams.delete('/:id', staff, async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  if (!(await hasEditPermission(c.env, e, c.get('user')))) throw bad('Bạn không có quyền chỉnh sửa đề thi này.');
  const rs = (await all<{ id: string }>(c.env, 'SELECT id FROM student_exam_results WHERE exam_id = ?', e.id)).map((r) => r.id);
  await batch(c.env, [
    ...(rs.length ? [[`DELETE FROM student_answers WHERE result_id IN ${inList(rs.length)}`, ...rs] as [string, ...unknown[]], [`DELETE FROM draft_answers WHERE result_id IN ${inList(rs.length)}`, ...rs] as [string, ...unknown[]]] : []),
    ['DELETE FROM student_exam_results WHERE exam_id = ?', e.id], ['DELETE FROM user_favorite_exams WHERE exam_id = ?', e.id], ['DELETE FROM class_exams WHERE exam_id = ?', e.id],
    ['DELETE FROM class_resources WHERE resource_id = ?', e.id], ['UPDATE mistake_vault_items SET question_id = NULL WHERE question_id IN (SELECT id FROM questions WHERE exam_id = ?)', e.id],
    ['UPDATE content_resources SET attached_exam_id = NULL WHERE attached_exam_id = ?', e.id],
    ['DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE exam_id = ?)', e.id], ['DELETE FROM questions WHERE exam_id = ?', e.id],
    ['DELETE FROM question_groups WHERE exam_id = ?', e.id], ['DELETE FROM exams WHERE id = ?', e.id],
  ]);
  return ok(c, null);
});

exams.post('/:id/favorite', auth(), async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  const me = c.get('user');
  const f = await one<{ id: string }>(c.env, 'SELECT id FROM user_favorite_exams WHERE user_id = ? AND exam_id = ?', me.id, e.id);
  if (f) await run(c.env, 'DELETE FROM user_favorite_exams WHERE id = ?', f.id);
  else await run(c.env, 'INSERT INTO user_favorite_exams (id, user_id, exam_id, created_at) VALUES (?,?,?,?)', uuid(), me.id, e.id, nowISO());
  return raw(c, { favorited: !f });
});
exams.get('/:id/favorite', auth(), async (c) => {
  await getExam(c.env, c.req.param('id'));
  return raw(c, { favorited: !!(await one(c.env, 'SELECT 1 AS x FROM user_favorite_exams WHERE user_id = ? AND exam_id = ?', c.get('user').id, c.req.param('id'))) });
});
exams.post('/:id/verify-password', async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  return raw(c, { valid: !e.access_code || String((await body(c)).password ?? '') === e.access_code });
});

/* ---- Làm bài ---- */
const draftsMap = async (env: Env, resultId: string) => {
  const d = await all<any>(env, 'SELECT question_id, selected_option_id, text_response FROM draft_answers WHERE result_id = ?', resultId);
  return Object.fromEntries(d.filter((x) => x.question_id).map((x) => [x.question_id, x.selected_option_id ?? x.text_response]).filter(([, v]) => v != null));
};
exams.post('/:id/start', auth(), async (c) => {
  const me = c.get('user');
  const e = await getExam(c.env, c.req.param('id'));
  const lib = c.req.query('libraryResourceId');
  requireAccessCode(e, c.req.query('accessCode'));
  const d = await accessDecision(c.env, e, me, lib);
  if (d.locked) throw forbidden(d.unlockHint || 'Bạn cần đăng ký học để làm đề thi này.');
  const now = nowISO();
  if (e.start_time && now < e.start_time) throw new ApiError(400, 'EXAM_NOT_OPENED', 'Đề thi chưa đến giờ mở.');
  if (e.end_time && now > e.end_time) throw new ApiError(400, 'EXAM_CLOSED', 'Đề thi đã đóng.');
  const ongoing = await one<any>(c.env, 'SELECT * FROM student_exam_results WHERE student_id = ? AND exam_id = ? AND submitted_at IS NULL ORDER BY started_at DESC LIMIT 1', me.id, e.id);
  if (ongoing) {
    const snap = await snapOfResult(c.env, ongoing, e);
    return ok(c, { resultId: ongoing.id, answers: await draftsMap(c.env, ongoing.id), cheatWarningCount: ongoing.cheat_warning_count ?? 0, cheatDetails: ongoing.cheat_details ?? '[]',
      elapsedSeconds: secondsBetween(ongoing.started_at, now), examSnapshot: hideAnswers(snap) });
  }
  if (!(lib || (await isPureLibraryExam(c.env, e.id, lib)))) {
    const n = await count(c.env, 'SELECT COUNT(*) AS n FROM student_exam_results WHERE student_id = ? AND exam_id = ? AND submitted_at IS NOT NULL', me.id, e.id);
    if (e.max_attempts && e.max_attempts > 0 && n >= e.max_attempts) throw new ApiError(400, 'OUT_OF_ATTEMPTS', 'Bạn đã hết số lần làm bài cho phép.');
  }
  const snap = snapshotOf(e, await questionsOf(c.env, e.id), await groupsOf(c.env, e.id));
  const id = uuid();
  await run(c.env, 'INSERT INTO student_exam_results (id, version, student_id, exam_id, started_at, cheat_warning_count, cheat_details, exam_snapshot, created_at) VALUES (?,0,?,?,?,0,?,?,?)', id, me.id, e.id, now, '[]', JSON.stringify(snap), now);
  return ok(c, { resultId: id, answers: {}, cheatWarningCount: 0, cheatDetails: '[]', elapsedSeconds: 0, examSnapshot: hideAnswers(snap) });
});

exams.post('/:id/draft', auth(), async (c) => {
  const me = c.get('user');
  const e = await getExam(c.env, c.req.param('id'));
  const r = await one<any>(c.env, 'SELECT * FROM student_exam_results WHERE student_id = ? AND exam_id = ? AND submitted_at IS NULL ORDER BY started_at DESC LIMIT 1', me.id, e.id);
  if (!r) throw bad('Không tìm thấy bài thi đang làm hợp lệ.');
  const b = await body(c);
  const stmts: [string, ...unknown[]][] = [['UPDATE student_exam_results SET cheat_warning_count = COALESCE(?, cheat_warning_count), cheat_details = COALESCE(?, cheat_details) WHERE id = ?', b.cheatWarningCount ?? null, b.cheatDetails ?? null, r.id]];
  const snap = await snapOfResult(c.env, r, e);
  for (const [qid, val] of Object.entries((b.answers ?? {}) as Record<string, string>)) {
    const q = snap.questions.find((x) => x.questionId === qid);
    if (!q) continue;
    const text = ['ESSAY', 'SHORT_ANSWER', 'FILL_BLANK'].includes(q.questionType) || (q.questionType === 'TRUE_FALSE' && String(val).trim().startsWith('{'));
    const opt = !text && q.options.some((o) => o.optionId === val) ? val : null;
    const tr = text && val ? String(val).slice(0, 50_000) : null;
    const ex = await one<{ id: string }>(c.env, 'SELECT id FROM draft_answers WHERE result_id = ? AND question_id = ?', r.id, qid);
    stmts.push(ex ? ['UPDATE draft_answers SET selected_option_id = ?, text_response = ?, saved_at = ? WHERE id = ?', opt, tr, nowISO(), ex.id]
      : ['INSERT INTO draft_answers (id, result_id, question_id, selected_option_id, text_response, saved_at) VALUES (?,?,?,?,?,?)', uuid(), r.id, qid, opt, tr, nowISO()]);
  }
  await batch(c.env, stmts);
  return ok(c, null);
});

exams.post('/:id/submit', auth(), async (c) => {
  const me = c.get('user');
  const e = await getExam(c.env, c.req.param('id'));
  const r = await one<any>(c.env, 'SELECT * FROM student_exam_results WHERE student_id = ? AND exam_id = ? AND submitted_at IS NULL ORDER BY started_at DESC LIMIT 1', me.id, e.id);
  if (!r) throw bad('Không tìm thấy bài thi đang làm hợp lệ.');
  const b = await body(c);
  let answers = (b.answers && typeof b.answers === 'object' ? b.answers : {}) as Record<string, string>;
  if (!Object.keys(answers).length) answers = await draftsMap(c.env, r.id);
  const snap = await snapOfResult(c.env, r, e);
  const exists = new Set((await all<{ id: string }>(c.env, 'SELECT id FROM questions WHERE exam_id = ?', e.id)).map((x) => x.id));
  const ai = await aiSettings(c.env);
  const stmts: [string, ...unknown[]][] = [];
  const wrong: Parameters<typeof syncMistakes>[3] = [];
  let total = 0;
  for (const q of snap.questions) {
    const a = answers[q.questionId];
    const qid = exists.has(q.questionId) ? q.questionId : null;
    let pts = 0, correct = false, sel: string | null = null, feedback: string | null = null, aiScore: number | null = null;
    const g = gradeObjective(q, a);
    if (g) ({ points: pts, correct, selectedOptionId: sel } = g);
    else {
      // Tự luận: AI chấm nháp ngay khi nộp nếu bật; giáo viên duyệt sau
      const res: EssayGradeResult = ai.autoGradeOnSubmit ? await gradeEssay(c.env, { content: q.content, expected: q.explanation }, a ?? null, q.points, e.subject)
        : { score: 0, summary: 'Bài sẽ được giáo viên chấm.', strengths: [], errors: [], vocabularySuggestions: [] };
      pts = res.score; aiScore = ai.autoGradeOnSubmit ? res.score : null; feedback = JSON.stringify(res); correct = res.score >= q.points / 2;
    }
    total += pts;
    stmts.push(['INSERT INTO student_answers (id, result_id, question_id, selected_option_id, is_correct, points_earned, text_response, ai_feedback, ai_suggested_score, reviewed) VALUES (?,?,?,?,?,?,?,?,?,?)',
      uuid(), r.id, qid, qid ? sel : null, correct ? 1 : 0, pts, a != null ? String(a).slice(0, 50_000) : null, feedback, aiScore, g ? 1 : 0]);
    if (!correct && qid && g) wrong.push({ questionId: qid, content: q.content, correct: q.options.find((o) => o.isCorrect)?.content ?? '—', wrong: sel ? q.options.find((o) => o.optionId === sel)?.content ?? null : a ?? null, skillTag: q.skillTag });
  }
  const pct = snap.maxScore > 0 ? (total / snap.maxScore) * 100 : 0;
  const passed = pct >= (e.passing_score ?? 0);
  const now = nowISO();
  stmts.push(['UPDATE student_exam_results SET submitted_at = ?, total_score = ?, is_passed = ?, cheat_warning_count = COALESCE(?, cheat_warning_count), cheat_details = COALESCE(?, cheat_details), notify_email = ? WHERE id = ?',
    now, total, passed ? 1 : 0, b.cheatWarningCount ?? null, b.cheatDetails ?? null, b.notifyEmail ?? null, r.id], ['DELETE FROM draft_answers WHERE result_id = ?', r.id]);
  await batch(c.env, stmts);
  await syncMistakes(c.env, me.id, e.title, wrong);
  await recordActivity(c.env, me, 'EXAM_COMPLETE');
  const pending = snap.questions.some((q) => q.questionType === 'ESSAY');
  const link = `/exams/${e.id}/results/${r.id}`;
  await notify(c.env, me.id, `Đã nộp bài thi: ${e.title}`, pending ? 'Bạn đã nộp bài thi thành công. Giáo viên đang chấm bài, kết quả sẽ có sau khi được duyệt.'
    : `Bạn đã nộp bài thi thành công. Điểm số: ${fmt1(total)}/${fmt1(snap.maxScore)} (${passed ? 'Đạt' : 'Chưa đạt'}).`, link, 'EXAM', null, 'EXAM_SUBMISSION', r.id);
  if (e.teacher_id !== me.id) await notify(c.env, e.teacher_id, 'Học sinh đã nộp bài thi', pending ? `${me.full_name} đã nộp bài thi '${e.title}' — có câu tự luận cần bạn duyệt điểm.`
    : `${me.full_name} đã hoàn thành bài thi '${e.title}' với kết quả ${fmt1(total)}/${fmt1(snap.maxScore)}`, link, 'EXAM', me, 'EXAM_SUBMISSION', r.id);
  return ok(c, r.id);
});

/* ---- Giám sát, thống kê, xuất Excel ---- */
const requireEdit = async (env: Env, e: ExamRow, u: UserRow, msg: string) => { if (!(await hasEditPermission(env, e, u))) throw bad(msg); };
exams.get('/:id/proctoring', staff, async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  await requireEdit(c.env, e, c.get('user'), 'Bạn không có quyền giám sát đề thi này.');
  const total = await count(c.env, 'SELECT COUNT(*) AS n FROM questions WHERE exam_id = ?', e.id);
  const rows = await all<any>(c.env, 'SELECT r.*, u.full_name, u.email, (SELECT COUNT(*) FROM draft_answers d WHERE d.result_id = r.id) AS answered FROM student_exam_results r JOIN users u ON u.id = r.student_id WHERE r.exam_id = ? AND r.submitted_at IS NULL', e.id);
  return raw(c, { examId: e.id, examTitle: e.title, totalQuestions: total, activeAttempts: rows.map((r) => ({ resultId: r.id, studentId: r.student_id, studentName: r.full_name, studentEmail: r.email, startedAt: javaTime(r.started_at),
    answeredCount: r.answered, totalQuestions: total, cheatWarningCount: r.cheat_warning_count ?? 0, cheatDetails: r.cheat_details, submitted: false, submittedAt: null, totalScore: null })) });
});

const SKILL: Record<string, string> = { GENERAL: 'Chung', GRAMMAR: 'Ngữ pháp', VOCABULARY: 'Từ vựng', READING: 'Đọc hiểu', LISTENING: 'Nghe', WRITING: 'Viết' };
async function analytics(env: Env, e: ExamRow) {
  const qs = await questionsOf(env, e.id);
  const results = await all<any>(env, 'SELECT r.*, u.full_name, u.email FROM student_exam_results r JOIN users u ON u.id = r.student_id WHERE r.exam_id = ? AND r.submitted_at IS NOT NULL ORDER BY r.started_at', e.id);
  const answers = results.length ? await all<any>(env, `SELECT * FROM student_answers WHERE result_id IN ${inList(results.length)}`, ...results.map((r) => r.id)) : [];
  const maxP = qs.reduce((s, q) => s + (q.points ?? 0), 0);
  const scores = results.map((r) => r.total_score ?? 0);
  const total = results.length, pass = results.filter((r) => r.is_passed).length;
  const avg = total ? scores.reduce((a, b) => a + b, 0) / total : 0;
  const buckets = Array(10).fill(0);
  for (const s of scores) buckets[Math.min(Math.floor((maxP > 0 ? (s / maxP) * 100 : 0) / 10), 9)]++;
  const strip = (h: string) => (h || '').replace(/<[^>]+>/g, '');
  const qa = qs.map((q) => {
    const as = answers.filter((a) => a.question_id === q.id);
    const correct = as.filter((a) => a.is_correct).length;
    return { questionId: q.id, orderIndex: q.order_index, questionContent: strip(q.content), skillTag: q.skill_tag, points: q.points, correctCount: correct, totalAnswered: as.length, correctRate: as.length ? (correct * 100) / as.length : 0,
      optionStats: q.options.map((o) => { const n = as.filter((a) => a.selected_option_id === o.id).length; return { optionId: o.id, content: strip(o.content), isCorrect: !!o.is_correct, selectedCount: n, selectedRate: as.length ? (n * 100) / as.length : 0 }; }) };
  });
  const bySkill = new Map<string, typeof qa>();
  qa.forEach((q) => { const k = q.skillTag || 'GENERAL'; bySkill.set(k, [...(bySkill.get(k) ?? []), q]); });
  const attempt = new Map<string, number>();
  return {
    examId: e.id, examTitle: e.title, examCode: e.exam_code, totalSubmissions: total, averageScore: Math.round(avg * 100) / 100, averagePercentage: Math.round((maxP > 0 ? (avg / maxP) * 100 : 0) * 100) / 100,
    maxScore: total ? Math.max(...scores) : 0, minScore: total ? Math.min(...scores) : 0, passCount: pass, failCount: total - pass, passRate: total ? (pass * 100) / total : 0, maxPossibleScore: maxP,
    scoreDistribution: buckets.map((n, i) => ({ label: `${i * 10}-${i * 10 + 10}%`, count: n, percentage: total ? (n * 100) / total : 0 })),
    questionAnalytics: qa,
    skillAnalytics: [...bySkill].map(([k, v]) => ({ skillTag: k, skillLabel: SKILL[k] ?? k, totalQuestions: v.length, averageCorrectRate: v.reduce((s, x) => s + x.correctRate, 0) / v.length })),
    studentScores: results.map((r) => { const n = (attempt.get(r.student_id) ?? 0) + 1; attempt.set(r.student_id, n);
      return { resultId: r.id, studentId: r.student_id, studentName: r.full_name, studentEmail: r.email, totalScore: r.total_score ?? 0, maxScore: maxP, scorePercentage: maxP > 0 ? ((r.total_score ?? 0) / maxP) * 100 : 0,
        isPassed: !!r.is_passed, timeTakenSeconds: secondsBetween(r.started_at, r.submitted_at), cheatWarningCount: r.cheat_warning_count ?? 0, cheatDetails: r.cheat_details, submittedAt: javaTime(r.submitted_at), attemptNumber: n }; }),
  };
}
exams.get('/:id/analytics', staff, async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  await requireEdit(c.env, e, c.get('user'), 'Bạn không có quyền xem báo cáo đề thi này.');
  return raw(c, await analytics(c.env, e));
});
exams.get('/:id/export-excel', staff, async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  await requireEdit(c.env, e, c.get('user'), 'Bạn không có quyền xem báo cáo đề thi này.');
  const a = await analytics(c.env, e);
  const aoa: unknown[][] = [[`Đề thi: ${a.examTitle}`], [`Mã đề: ${a.examCode}  |  Số học sinh: ${a.totalSubmissions}  |  Điểm TB: ${a.averageScore.toFixed(2)}  |  Tỉ lệ đạt: ${a.passRate.toFixed(1)}%`], [],
    ['STT', 'Họ và tên', 'Email', 'Điểm', 'Điểm tối đa', 'Điểm hệ 10', 'Phần trăm (%)', 'Kết quả', 'Thời gian làm (giây)', 'Cảnh báo gian lận', 'Lần làm', 'Nộp lúc'],
    ...a.studentScores.map((s, i) => [i + 1, s.studentName, s.studentEmail, s.totalScore, s.maxScore, s.maxScore > 0 ? Math.round((s.totalScore / s.maxScore) * 100) / 10 : 0, Math.round(s.scorePercentage * 10) / 10,
      s.isPassed ? 'Đạt' : 'Chưa đạt', s.timeTakenSeconds, s.cheatWarningCount, s.attemptNumber, s.submittedAt?.replace('T', ' ').slice(0, 19) ?? ''])];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 28 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bảng điểm');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Response(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="bangdiem_${a.examCode}.xlsx"` } });
});
exams.delete('/:id/results/:resultId', staff, async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  await requireEdit(c.env, e, c.get('user'), 'Bạn không có quyền xóa kết quả của đề thi này.');
  const r = await loadResult(c.env, c.req.param('resultId'));
  if (r.exam_id !== e.id) throw bad('Kết quả thi không thuộc về đề thi này.');
  await batch(c.env, [['DELETE FROM student_answers WHERE result_id = ?', r.id], ['DELETE FROM draft_answers WHERE result_id = ?', r.id], ['DELETE FROM student_exam_results WHERE id = ?', r.id]]);
  return ok(c, null);
});

/* ---- Chấm lại, duyệt tự luận ---- */
exams.post('/:id/regrade-short-answers', staff, async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  await requireEdit(c.env, e, c.get('user'), 'Bạn không có quyền chỉnh sửa đề thi này.');
  const before = await all<any>(c.env, 'SELECT id, total_score FROM student_exam_results WHERE exam_id = ? AND submitted_at IS NOT NULL', e.id);
  await autoRegrade(c.env, e);
  const after = new Map((await all<any>(c.env, 'SELECT id, total_score FROM student_exam_results WHERE exam_id = ? AND submitted_at IS NOT NULL', e.id)).map((r) => [r.id, r.total_score]));
  const changed = before.filter((r) => Math.abs((after.get(r.id) ?? 0) - (r.total_score ?? 0)) > 0.001).length;
  return ok(c, `Đã chấm lại ${changed} bài nộp cho đề thi ${e.title}`);
});
exams.post('/results/:resultId/add-bonus', staff, async (c) => {
  const r = await loadResult(c.env, c.req.param('resultId'));
  const e = await getExam(c.env, r.exam_id);
  await requireEdit(c.env, e, c.get('user'), 'Bạn không có quyền chấm bài này.');
  const bonus = Number((await body(c)).bonusPoints ?? 0);
  if (!Number.isFinite(bonus) || Math.abs(bonus) > 1000) throw bad('Điểm cộng không hợp lệ.');
  const total = (r.total_score ?? 0) + bonus;
  const snap = await snapOfResult(c.env, r, e);
  await run(c.env, 'UPDATE student_exam_results SET total_score = ?, is_passed = ? WHERE id = ?', total, (snap.maxScore > 0 ? (total / snap.maxScore) * 100 : 0) >= (e.passing_score ?? 0) ? 1 : 0, r.id);
  return ok(c, `Đã cộng thêm ${bonus} điểm. Điểm tổng mới: ${total}`);
});
exams.get('/:id/pending-essay-reviews', staff, async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  await requireEdit(c.env, e, c.get('user'), 'Bạn không có quyền chấm bài này.');
  const ids = await all<{ id: string }>(c.env, `SELECT a.id FROM student_answers a JOIN student_exam_results r ON r.id = a.result_id JOIN questions q ON q.id = a.question_id
     WHERE r.exam_id = ? AND r.submitted_at IS NOT NULL AND q.question_type = 'ESSAY' AND (a.reviewed IS NULL OR a.reviewed = 0) ORDER BY r.submitted_at`, e.id);
  return raw(c, await Promise.all(ids.map((x) => essayItem(c.env, x.id))));
});
const studentOrStaff = auth('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT');
exams.patch('/answers/:answerId/review', studentOrStaff, async (c) => ok(c, await reviewEssay(c.env, c.req.param('answerId'), await body(c), c.get('user'))));
exams.post('/answers/:answerId/regrade-ai', studentOrStaff, async (c) => raw(c, await regradeEssay(c.env, c.req.param('answerId'), c.get('user'))));
exams.post('/results/:resultId/questions/:questionId/regrade-ai', studentOrStaff, async (c) => raw(c, await regradeEssay(c.env, await answerOfQuestion(c.env, c.req.param('resultId'), c.req.param('questionId')), c.get('user'))));
exams.patch('/results/:resultId/questions/:questionId/review', studentOrStaff, async (c) => ok(c, await reviewEssay(c.env, await answerOfQuestion(c.env, c.req.param('resultId'), c.req.param('questionId')), await body(c), c.get('user'))));
exams.post('/results/:resultId/regrade-all-essays', studentOrStaff, async (c) => {
  const me = c.get('user');
  const r = await loadResult(c.env, c.req.param('resultId'));
  if (!isStaff(me) && r.student_id !== me.id) throw forbidden('Bạn không có quyền yêu cầu chấm lại bài làm này.');
  for (const a of await all<{ id: string }>(c.env, "SELECT a.id FROM student_answers a JOIN questions q ON q.id = a.question_id WHERE a.result_id = ? AND q.question_type = 'ESSAY'", r.id)) {
    try { await regradeEssay(c.env, a.id, me); } catch { /* một câu lỗi không chặn câu khác */ }
  }
  return raw(c, await resultDetail(c.env, r.id, me));
});
exams.post('/:id/regrade-all-essays', staff, async (c) => {
  const e = await getExam(c.env, c.req.param('id'));
  await requireEdit(c.env, e, c.get('user'), 'Bạn không có quyền chấm bài này.');
  const ids = await all<{ id: string }>(c.env, `SELECT a.id FROM student_answers a JOIN student_exam_results r ON r.id = a.result_id JOIN questions q ON q.id = a.question_id
     WHERE r.exam_id = ? AND q.question_type = 'ESSAY' AND (a.reviewed IS NULL OR a.reviewed = 0)`, e.id);
  let n = 0;
  for (const x of ids) { try { await regradeEssay(c.env, x.id, null); n++; } catch { /* tiếp tục */ } }
  return ok(c, `Đã hoàn tất chấm lại bằng AI cho ${n} câu tự luận.`);
});
exams.post('/results/:resultId/publish-grade', studentOrStaff, async (c) => {
  const me = c.get('user');
  const r = await loadResult(c.env, c.req.param('resultId'));
  const e = await getExam(c.env, r.exam_id);
  await requireEdit(c.env, e, me, 'Bạn không có quyền duyệt bài thi này.');
  // Chốt mọi câu tự luận chưa duyệt bằng điểm hiện có (hoặc điểm AI gợi ý)
  await run(c.env, `UPDATE student_answers SET points_earned = COALESCE(points_earned, ai_suggested_score, 0), reviewed = 1,
      is_correct = CASE WHEN COALESCE(points_earned, ai_suggested_score, 0) >= (SELECT points FROM questions q WHERE q.id = student_answers.question_id) / 2.0 THEN 1 ELSE 0 END
      WHERE result_id = ? AND (reviewed IS NULL OR reviewed = 0) AND question_id IN (SELECT id FROM questions WHERE question_type = 'ESSAY')`, r.id);
  const t = await recomputeTotal(c.env, r, e, { lenient: true });
  await notify(c.env, r.student_id, `Kết quả bài thi: ${e.title}`, `Giáo viên đã duyệt điểm bài thi của bạn. Điểm số: ${fmt1(t.total)}/${fmt1(t.max)} (${t.isPassed ? 'Đạt' : 'Chưa đạt'}).`, `/exams/${e.id}/results/${r.id}`, 'EXAM', null, 'EXAM_SUBMISSION', r.id);
  return raw(c, await resultDetail(c.env, r.id, me));
});
exams.patch('/results/:resultId/pass-status', studentOrStaff, async (c) => {
  const me = c.get('user');
  const r = await loadResult(c.env, c.req.param('resultId'));
  const e = await getExam(c.env, r.exam_id);
  await requireEdit(c.env, e, me, 'Bạn không có quyền cập nhật bài thi này.');
  const b = await body(c);
  const isPassed = 'isPassed' in b ? String(b.isPassed) === 'true' : true;
  if (b.totalScore != null) await run(c.env, 'UPDATE student_exam_results SET total_score = ? WHERE id = ?', Math.max(0, Number(b.totalScore) || 0), r.id);
  await run(c.env, 'UPDATE student_exam_results SET is_passed = ? WHERE id = ?', isPassed ? 1 : 0, r.id);
  if (isPassed) await run(c.env, `UPDATE student_answers SET reviewed = 1 WHERE result_id = ? AND question_id IN (SELECT id FROM questions WHERE question_type = 'ESSAY')`, r.id);
  await notify(c.env, r.student_id, `Cập nhật kết quả bài thi: ${e.title}`, `Bài thi của bạn đã được cập nhật trạng thái: ${isPassed ? 'ĐẠT TIÊU CHUẨN ✅' : 'CHƯA ĐẠT ❌'}.`, `/exams/${e.id}/results/${r.id}`, 'EXAM', null, 'EXAM_SUBMISSION', r.id);
  return raw(c, await resultDetail(c.env, r.id, me));
});

export default exams;
