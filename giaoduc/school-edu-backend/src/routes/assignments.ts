import { Hono } from 'hono';
import type { AppEnv, Bindings, UserRow } from '../types';
import { bad, body, notFound, ok, pageParams, springPage, str, uuid } from '../lib/http';
import { auth, isStaff } from '../lib/auth';
import { all, count, one, run } from '../db';
import { javaTime, nowISO, utcTime } from '../lib/time';
import { notify } from '../lib/notify';
import { canManage } from './classrooms';
import { recordActivity } from './gamification';
import { aiSettings, callJsonAI } from '../lib/ai';

type Env = Bindings;
const A_SELECT = `SELECT a.*, c.name AS classroom_name, c.teacher_id AS class_teacher, co.title AS course_name, co.teacher_id AS course_teacher, u.full_name AS teacher_name
  FROM assignments a LEFT JOIN classrooms c ON c.id = a.classroom_id LEFT JOIN courses co ON co.id = a.course_id LEFT JOIN users u ON u.id = a.teacher_id`;
const aDto = (a: any) => ({ id: a.id, title: a.title, description: a.description, attachmentUrl: a.attachment_url, dueDate: javaTime(a.due_date), maxScore: a.max_score, courseId: a.course_id, courseName: a.course_name,
  classroomId: a.classroom_id, classroomName: a.classroom_name, teacherName: a.teacher_name, assignmentType: a.assignment_type, instructions: a.instructions, minWordCount: a.min_word_count, maxWordCount: a.max_word_count,
  expectedAnswer: a.expected_answer, languageLevel: a.language_level, rubricConfig: a.rubric_config, createdAt: javaTime(a.created_at), folderId: a.folder_id ?? null });
const S_SELECT = 'SELECT s.*, u.full_name AS student_name FROM assignment_submissions s JOIN users u ON u.id = s.student_id';
const sDto = (s: any) => ({ id: s.id, assignmentId: s.assignment_id, studentId: s.student_id, studentName: s.student_name, content: s.content, fileUrl: s.file_url, score: s.score, feedback: s.feedback, status: s.status, submittedAt: javaTime(s.submitted_at), gradedAt: javaTime(s.graded_at) });

async function getAssignment(env: Env, id: string) {
  const a = await one<any>(env, `${A_SELECT} WHERE a.id = ?`, id);
  if (!a) throw notFound('Không tìm thấy bài tập.');
  return a;
}
/** AssignmentService.canManageAssignment */
async function canManageAssignment(env: Env, a: any, u: UserRow) {
  if (u.role === 'ADMIN' || a.teacher_id === u.id || a.class_teacher === u.id || a.course_teacher === u.id) return true;
  if (a.classroom_id) { const c = await one<any>(env, 'SELECT * FROM classrooms WHERE id = ?', a.classroom_id); if (c && (await canManage(env, c, u))) return true; }
  return false;
}
const getSubmission = async (env: Env, id: string) => {
  const s = await one<any>(env, `${S_SELECT} WHERE s.id = ?`, id);
  if (!s) throw notFound('Không tìm thấy bài nộp.');
  return s;
};

export const stripHtml = (h: string | null) => (h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-zA-Z0-9#]+;/g, ' ').trim();
/** AiWritingGradingService.countWords: đếm token có chữ hoặc số */
export const countWords = (t: string | null) => stripHtml(t).split(/\s+/).filter((x) => /[\p{L}\p{N}]/u.test(x)).length;
console.assert(countWords('<p>Xin chào, các em! -- 2026</p>') === 5, 'countWords');

/* ---- Chấm bài viết bằng AI (4 tiêu chí, thang 10) ---- */
const CRITERIA = ['taskAchievement', 'coherenceAndCohesion', 'lexicalResource', 'grammaticalRangeAndAccuracy'] as const;
/** validateAndNormalizeResult: đủ 4 tiêu chí, kẹp 0..10, điểm tổng = trung bình */
export function normalizeWriting(r: any) {
  if (!r || typeof r !== 'object' || !r.criteria) throw bad('Thiếu dữ liệu tiêu chí đánh giá criteria');
  for (const k of CRITERIA) if (!r.criteria[k]) throw bad('Bắt buộc phải có đủ 4 tiêu chí đánh giá');
  for (const k of CRITERIA) {
    const c = r.criteria[k];
    c.score = Math.max(0, Math.min(10, Math.round((Number(c.score) || 0) * 10) / 10));
    c.maxScore = 10; c.strengths ||= []; c.weaknesses ||= []; c.feedback ??= '';
  }
  const avg = Math.round((CRITERIA.reduce((s, k) => s + r.criteria[k].score, 0) / 4) * 10) / 10;
  r.overall = { score: avg, maxScore: 10, percentage: Math.round(avg * 100) / 10 };
  r.errors ||= []; r.strengths ||= []; r.improvements ||= []; r.version ||= '1.0'; r.gradingStatus ||= 'COMPLETED';
  return r;
}
console.assert(normalizeWriting({ criteria: { taskAchievement: { score: 8 }, coherenceAndCohesion: { score: 7 }, lexicalResource: { score: 12 }, grammaticalRangeAndAccuracy: { score: 6 } } }).overall.score === 7.8, 'normalizeWriting');

function writingPrompt(a: any, text: string, words: number) {
  const level = a.language_level || 'B1';
  const wordReq = a.min_word_count != null || a.max_word_count != null ? `Yêu cầu số từ: tối thiểu ${a.min_word_count ?? 'không giới hạn'}, tối đa ${a.max_word_count ?? 'không giới hạn'} từ.` : '';
  return `Bạn là giám khảo khảo thí ngôn ngữ giàu kinh nghiệm và là giáo viên tâm huyết. Chấm bài viết khách quan theo khung CEFR, nhận xét chi tiết, mang tính xây dựng.
=== BỐI CẢNH ===
- Đề bài: ${a.title}
- Hướng dẫn: ${stripHtml(a.instructions || a.description) || 'Không có hướng dẫn cụ thể'}
- ${wordReq}
- Số từ học sinh viết (hệ thống đếm): ${words}
- Trình độ kỳ vọng: ${level} | Lớp: ${a.classroom_name ?? 'Không xác định'}
- ${a.rubric_config ? `Rubric riêng của giáo viên: ${a.rubric_config}` : 'Dùng 4 tiêu chí mặc định (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy).'}
- ${a.expected_answer ? `Bài mẫu / ý cần có của giáo viên (chấm bám theo): ${a.expected_answer}` : ''}
=== BÀI LÀM ===
"""
${text}
"""
=== QUY TẮC ===
1. Đánh giá so với trình độ kỳ vọng ${level}, không so với người bản xứ.
2. Không bịa lỗi: không đánh sai các cách viết hợp lệ (Anh-Anh/Anh-Mỹ, văn phong thông dụng).
3. Mỗi tiêu chí 0.0–10.0: taskAchievement, coherenceAndCohesion, lexicalResource, grammaticalRangeAndAccuracy (mỗi tiêu chí 25%).
4. overall.score = trung bình 4 tiêu chí, maxScore 10, percentage = score*10.
5. strengths kèm evidence trích từ bài; improvements có action và priority high|medium|low.
6. Nhận xét bằng tiếng Việt; giữ nguyên văn ở errors.original và errors.correction.
7. Chỉ trả về 1 JSON object theo schema:
{"version":"1.0","gradingStatus":"COMPLETED","overall":{"score":0,"maxScore":10,"percentage":0},"levelAssessment":{"expectedLevel":"${level}","estimatedPerformanceLevel":"A2|B1|B2|C1","levelComment":""},
"criteria":{"taskAchievement":{"score":0,"maxScore":10,"strengths":[],"weaknesses":[],"feedback":""},"coherenceAndCohesion":{...},"lexicalResource":{...},"grammaticalRangeAndAccuracy":{...}},
"errors":[{"id":"err-1","category":"grammar|vocabulary|spelling|punctuation|coherence|task|style|word_choice","severity":"minor|major","original":"","correction":"","explanation":""}],
"strengths":[{"category":"","description":"","evidence":""}],"improvements":[{"priority":"high","category":"","description":"","action":""}],
"teacherSummary":{"overallComment":"","mainStrength":"","mainWeakness":"","recommendedFocus":""},"studentFeedback":{"positive":"","nextStep":""}}`;
}

async function saveVersion(env: Env, assessmentId: string, version: number, source: string, json: string | null, score: number | null, by: string | null, note: string) {
  await run(env, 'INSERT INTO writing_assessment_versions (id, assessment_id, version, source, result_json, overall_score, created_at, created_by, note) VALUES (?,?,?,?,?,?,?,?,?)', uuid(), assessmentId, version, source, json ?? '', score, nowISO(), by, note);
}

/** AiWritingGradingService.gradeSubmissionSync */
export async function gradeSubmission(env: Env, submissionId: string, isRegrade: boolean, by: UserRow | null) {
  const s = await getSubmission(env, submissionId);
  const a = await getAssignment(env, s.assignment_id);
  const text = stripHtml(s.content);
  if (!text) throw bad('Bài nộp không có nội dung văn bản để AI chấm.');
  const words = countWords(s.content);
  const ai = await aiSettings(env);
  let w = await one<any>(env, 'SELECT * FROM writing_assessments WHERE submission_id = ?', submissionId);
  if (!w) {
    const id = uuid();
    await run(env, "INSERT INTO writing_assessments (id, submission_id, assignment_id, student_id, status, max_score, ai_model, version, created_at) VALUES (?,?,?,?, 'QUEUED', ?, ?, 1, ?)", id, s.id, a.id, s.student_id, a.max_score, ai.model, nowISO());
    w = await one<any>(env, 'SELECT * FROM writing_assessments WHERE id = ?', id);
  }
  if (!isRegrade && w.status === 'COMPLETED' && w.current_result_json) return assessmentDto(env, w.id, true);
  let version = w.version ?? 1;
  if (isRegrade && w.current_result_json) { await saveVersion(env, w.id, version, 'AI', w.current_result_json, w.overall_score, by?.id ?? null, 'Lưu trước khi AI chấm lại phiên bản mới'); version++; }
  await run(env, "UPDATE writing_assessments SET status = 'GRADING', word_count = ?, error_message = NULL, version = ?, ai_model = ? WHERE id = ?", words, version, ai.model, w.id);
  const fail = async (msg: string) => { await run(env, "UPDATE writing_assessments SET status = 'FAILED', error_message = ? WHERE id = ?", msg, w.id); throw bad(msg, 'AI_GRADING_FAILED'); };
  if (!ai.apiKey) await fail('Chưa cấu hình khóa AI cho trường. Vui lòng liên hệ quản trị viên.');
  let result: any = null, last = '';
  for (let i = 0; i < 2 && !result; i++) {
    try { result = normalizeWriting(await callJsonAI(ai, writingPrompt(a, text, words))); } catch (e) { last = e instanceof Error ? e.message : 'Không rõ'; }
  }
  if (!result) await fail(`AI không thể trả về kết quả hợp lệ: ${last}`);
  const json = JSON.stringify(result);
  await run(env, "UPDATE writing_assessments SET status = 'COMPLETED', original_ai_result_json = ?, current_result_json = ?, overall_score = ?, max_score = ?, expected_level = ?, estimated_level = ?, completed_at = ?, error_message = NULL WHERE id = ?",
    json, json, result.overall.score, a.max_score, result.levelAssessment?.expectedLevel ?? null, result.levelAssessment?.estimatedPerformanceLevel ?? null, nowISO(), w.id);
  await saveVersion(env, w.id, version, 'AI', json, result.overall.score, by?.id ?? null, `AI chấm bài tự động (Phiên bản ${version})`);
  // Điểm AI quy về thang của bài tập, là điểm nháp (chưa GRADED) cho tới khi giáo viên duyệt
  await run(env, 'UPDATE assignment_submissions SET score = ?, feedback = COALESCE(?, feedback) WHERE id = ?', Math.round((result.overall.score / 10) * (a.max_score ?? 10) * 10) / 10, result.studentFeedback?.positive ?? null, s.id);
  return assessmentDto(env, w.id, true);
}

async function assessmentDto(env: Env, id: string, isTeacher: boolean) {
  const w = await one<any>(env, `SELECT w.*, u.full_name, u.email, a.min_word_count, a.max_word_count, e.full_name AS editor FROM writing_assessments w JOIN users u ON u.id = w.student_id
     JOIN assignments a ON a.id = w.assignment_id LEFT JOIN users e ON e.id = w.last_edited_by WHERE w.id = ?`, id);
  const parse = (s: string | null) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
  const cur = parse(w.current_result_json);
  if (!isTeacher && cur) cur.teacherSummary = null;
  const versions = isTeacher ? await all<any>(env, 'SELECT v.*, u.full_name FROM writing_assessment_versions v LEFT JOIN users u ON u.id = v.created_by WHERE v.assessment_id = ? ORDER BY v.version DESC', id) : [];
  return {
    id: w.id, submissionId: w.submission_id, assignmentId: w.assignment_id, studentId: w.student_id, studentName: w.full_name, studentEmail: w.email, status: w.status, overallScore: w.overall_score, maxScore: w.max_score,
    percentage: w.overall_score != null ? w.overall_score * 10 : null, wordCount: w.word_count, requiredMinWords: w.min_word_count, requiredMaxWords: w.max_word_count, expectedLevel: w.expected_level, estimatedLevel: w.estimated_level,
    result: cur, originalAiResult: isTeacher ? parse(w.original_ai_result_json) : null, version: w.version, aiModel: w.ai_model, errorMessage: isTeacher ? w.error_message : w.error_message ? 'Không thể hoàn thành chấm bài.' : null,
    createdAt: javaTime(w.created_at), completedAt: javaTime(w.completed_at), lastEditedAt: javaTime(w.last_edited_at), lastEditedByName: w.editor,
    versions: versions.map((v) => ({ id: v.id, version: v.version, source: v.source, overallScore: v.overall_score, createdAt: javaTime(v.created_at), createdByName: v.full_name ?? 'Hệ thống', note: v.note })),
  };
}

/* ===================== /api/v1/assignments ===================== */
const r = new Hono<AppEnv>();
r.use('*', auth());

const listBy = (col: 'course_id' | 'classroom_id') => async (c: any) => {
  const { page, size, offset } = pageParams(c, 20, 200);
  const id = c.req.param('id');
  const rows = await all(c.env, `${A_SELECT} WHERE a.${col} = ? ORDER BY a.created_at DESC LIMIT ? OFFSET ?`, id, size, offset);
  return ok(c, springPage(rows.map(aDto), await count(c.env, `SELECT COUNT(*) AS n FROM assignments WHERE ${col} = ?`, id), page, size));
};
r.get('/course/:id', listBy('course_id'));
r.get('/classroom/:id', listBy('classroom_id'));
r.get('/:id', async (c) => ok(c, aDto(await getAssignment(c.env, c.req.param('id')))));

const fields = (b: any) => ({
  title: str(b.title, 'Tiêu đề', 500), description: b.description ?? null, attachment_url: b.attachmentUrl ?? null, due_date: utcTime(b.dueDate), max_score: b.maxScore != null ? Number(b.maxScore) : 100,
  assignment_type: b.assignmentType || 'WRITING', instructions: b.instructions ?? null, min_word_count: b.minWordCount ?? null, max_word_count: b.maxWordCount ?? null,
  expected_answer: b.expectedAnswer ?? null, language_level: b.languageLevel ?? null, rubric_config: b.rubricConfig ?? null,
});
r.post('/', async (c) => {
  const me = c.get('user');
  if (!isStaff(me)) throw bad('Bạn không có quyền tạo bài tập');
  const b = await body(c);
  let classroom: any = null;
  if (b.courseId) {
    const co = await one<any>(c.env, 'SELECT teacher_id FROM courses WHERE id = ?', String(b.courseId));
    if (!co) throw notFound('Không tìm thấy khóa học.');
    if (me.role !== 'ADMIN' && co.teacher_id !== me.id) throw bad('Bạn không có quyền tạo bài tập trong khóa học này');
  } else if (b.classroomId) {
    classroom = await one<any>(c.env, 'SELECT * FROM classrooms WHERE id = ?', String(b.classroomId));
    if (!classroom) throw notFound('Không tìm thấy lớp học.');
    if (!(await canManage(c.env, classroom, me))) throw bad('Bạn không có quyền tạo bài tập trong lớp học này');
  } else throw bad('Phải cung cấp courseId hoặc classroomId');
  const f = fields(b);
  if (f.max_score <= 0) throw bad('Điểm tối đa phải lớn hơn 0');
  const id = uuid();
  await run(c.env, `INSERT INTO assignments (id, ${Object.keys(f).join(', ')}, course_id, classroom_id, teacher_id, created_at) VALUES (?,${Object.keys(f).map(() => '?').join(',')},?,?,?,?)`,
    id, ...Object.values(f), b.courseId ?? null, b.classroomId ?? null, me.id, nowISO());
  if (classroom) {
    const due = f.due_date ? javaTime(f.due_date)! : null;
    const dueStr = due ? `${due.slice(11, 16)} ${due.slice(8, 10)}/${due.slice(5, 7)}/${due.slice(0, 4)}` : 'Không giới hạn';
    for (const m of await all<{ user_id: string }>(c.env, "SELECT user_id FROM class_members WHERE classroom_id = ? AND role = 'STUDENT'", classroom.id))
      await notify(c.env, m.user_id, `Bài tập mới: ${f.title}`, `Lớp ${classroom.name} có bài tập mới. Hạn nộp: ${dueStr}`, `/classes/${classroom.id}/classwork/assignments/${id}`, 'ASSIGNMENT', me, 'ASSIGNMENT', id);
  }
  return ok(c, aDto(await getAssignment(c.env, id)));
});
r.put('/:id', async (c) => {
  const a = await getAssignment(c.env, c.req.param('id'));
  if (!(await canManageAssignment(c.env, a, c.get('user')))) throw bad('Bạn không có quyền chỉnh sửa bài tập này');
  const b = await body(c);
  const f = fields({ ...b, maxScore: b.maxScore ?? a.max_score, assignmentType: b.assignmentType ?? a.assignment_type });
  for (const k of ['instructions', 'min_word_count', 'max_word_count', 'expected_answer', 'language_level', 'rubric_config'] as const) if ((f as any)[k] == null) (f as any)[k] = a[k];
  await run(c.env, `UPDATE assignments SET ${Object.keys(f).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, ...Object.values(f), a.id);
  return ok(c, aDto(await getAssignment(c.env, a.id)));
});
r.delete('/:id', async (c) => {
  const a = await getAssignment(c.env, c.req.param('id'));
  if (!(await canManageAssignment(c.env, a, c.get('user')))) throw bad('Bạn không có quyền xóa bài tập này');
  const subs = await all<{ id: string }>(c.env, 'SELECT id FROM assignment_submissions WHERE assignment_id = ?', a.id);
  for (const s of subs) await run(c.env, 'DELETE FROM writing_assessment_versions WHERE assessment_id IN (SELECT id FROM writing_assessments WHERE submission_id = ?)', s.id);
  await run(c.env, 'DELETE FROM writing_assessments WHERE assignment_id = ?', a.id);
  await run(c.env, 'DELETE FROM assignment_submissions WHERE assignment_id = ?', a.id);
  await run(c.env, 'DELETE FROM assignments WHERE id = ?', a.id);
  return ok(c, null);
});

r.post('/:id/submit', async (c) => {
  const me = c.get('user');
  const a = await getAssignment(c.env, c.req.param('id'));
  if (a.classroom_id && !(await one(c.env, 'SELECT 1 AS x FROM class_members WHERE classroom_id = ? AND user_id = ?', a.classroom_id, me.id))) throw bad('Bạn không phải thành viên lớp của bài tập này.');
  const b = await body(c);
  const content = b.content != null ? String(b.content).slice(0, 200_000) : null;
  const ex = await one<{ id: string }>(c.env, 'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?', a.id, me.id);
  const id = ex?.id ?? uuid();
  if (ex) await run(c.env, "UPDATE assignment_submissions SET content = ?, file_url = ?, status = 'PENDING', submitted_at = ? WHERE id = ?", content, b.fileUrl ?? null, nowISO(), id);
  else await run(c.env, "INSERT INTO assignment_submissions (id, assignment_id, student_id, content, file_url, status, submitted_at) VALUES (?,?,?,?,?, 'PENDING', ?)", id, a.id, me.id, content, b.fileUrl ?? null, nowISO());
  await recordActivity(c.env, me, 'ASSIGNMENT_SUBMIT');
  // AI chấm nền (nếu bật), không bắt học sinh chờ
  if (content && countWords(content) > 0 && (await aiSettings(c.env)).autoGradeOnSubmit) c.executionCtx.waitUntil(gradeSubmission(c.env, id, false, me).catch(() => {}));
  const link = a.course_id ? `/courses/${a.course_id}` : `/classes/${a.classroom_id}/classwork`;
  await notify(c.env, a.teacher_id, 'Học sinh đã nộp bài tập', `${me.full_name} đã nộp bài tập '${a.title}'`, `${link}/assignments/${a.id}/submissions`, 'ASSIGNMENT', me, 'ASSIGNMENT_SUBMISSION', id);
  return ok(c, sDto(await getSubmission(c.env, id)));
});
r.get('/:id/submissions/my', async (c) => {
  const s = await one<any>(c.env, `${S_SELECT} WHERE s.assignment_id = ? AND s.student_id = ?`, c.req.param('id'), c.get('user').id);
  if (!s) throw notFound('Chưa nộp bài.');
  return ok(c, sDto(s));
});
r.get('/:id/submissions', async (c) => {
  const a = await getAssignment(c.env, c.req.param('id'));
  if (!(await canManageAssignment(c.env, a, c.get('user')))) throw bad('Bạn không có quyền xem danh sách nộp bài này');
  const { page, size, offset } = pageParams(c, 20, 500);
  const rows = await all(c.env, `${S_SELECT} WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC LIMIT ? OFFSET ?`, a.id, size, offset);
  return ok(c, springPage(rows.map(sDto), await count(c.env, 'SELECT COUNT(*) AS n FROM assignment_submissions WHERE assignment_id = ?', a.id), page, size));
});
r.post('/submissions/:sid/grade', async (c) => {
  const me = c.get('user');
  const s = await getSubmission(c.env, c.req.param('sid'));
  const a = await getAssignment(c.env, s.assignment_id);
  if (!(await canManageAssignment(c.env, a, me))) throw bad('Bạn không có quyền chấm bài này');
  const b = await body(c);
  const score = Number(b.score);
  if (!Number.isFinite(score) || score < 0) throw bad('Điểm không hợp lệ');
  if (score > a.max_score) throw bad(`Điểm không được vượt quá điểm tối đa: ${a.max_score}`);
  await run(c.env, "UPDATE assignment_submissions SET score = ?, feedback = ?, status = 'GRADED', graded_at = ? WHERE id = ?", score, b.feedback ?? null, nowISO(), s.id);
  const fb = b.feedback && String(b.feedback).trim() ? ` · Nhận xét: "${String(b.feedback).length > 50 ? `${String(b.feedback).slice(0, 50)}...` : b.feedback}"` : '';
  const link = a.course_id ? `/courses/${a.course_id}` : `/classes/${a.classroom_id}/classwork`;
  await notify(c.env, s.student_id, 'Bài tập đã được chấm điểm', `Bài tập '${a.title}' đã được chấm điểm: ${score}/${a.max_score}${fb}`, `${link}/assignments/${a.id}`, 'ASSIGNMENT', me, 'ASSIGNMENT_GRADE', s.id);
  return ok(c, sDto(await getSubmission(c.env, s.id)));
});

/* ---- AI chấm bài viết ---- */
const requireManageSub = async (env: Env, sid: string, u: UserRow) => {
  const s = await getSubmission(env, sid);
  const a = await getAssignment(env, s.assignment_id);
  if (!(await canManageAssignment(env, a, u))) throw bad('Bạn không có quyền quản lý hoặc chấm bài tập này.');
  return { s, a };
};
r.post('/submissions/:sid/ai-grade', async (c) => {
  const me = c.get('user');
  const s = await getSubmission(c.env, c.req.param('sid'));
  if (s.student_id !== me.id) await requireManageSub(c.env, s.id, me);
  return ok(c, await gradeSubmission(c.env, s.id, false, me));
});
r.post('/submissions/:sid/ai-grading/regrade', async (c) => {
  await requireManageSub(c.env, c.req.param('sid'), c.get('user'));
  return ok(c, await gradeSubmission(c.env, c.req.param('sid'), true, c.get('user')));
});
r.get('/submissions/:sid/ai-grading', async (c) => {
  const me = c.get('user');
  const s = await getSubmission(c.env, c.req.param('sid'));
  const a = await getAssignment(c.env, s.assignment_id);
  const teacher = await canManageAssignment(c.env, a, me);
  if (s.student_id !== me.id && !teacher) throw bad('Bạn không có quyền xem bài nộp này');
  const w = await one<{ id: string }>(c.env, 'SELECT id FROM writing_assessments WHERE submission_id = ?', s.id);
  if (!w) return ok(c, { submissionId: s.id, assignmentId: a.id, studentId: s.student_id, studentName: s.student_name, status: 'NOT_GRADED', wordCount: countWords(s.content), maxScore: a.max_score });
  return ok(c, await assessmentDto(c.env, w.id, teacher));
});
r.patch('/submissions/:sid/ai-grading', async (c) => {
  const me = c.get('user');
  const { s, a } = await requireManageSub(c.env, c.req.param('sid'), me);
  const w = await one<any>(c.env, 'SELECT * FROM writing_assessments WHERE submission_id = ?', s.id);
  if (!w) throw notFound('Chưa có bản chấm AI cho bài nộp này');
  const b = await body(c);
  if (!b.result) throw bad('Nội dung kết quả chấm không được để trống');
  const res = normalizeWriting(b.result);
  let final = b.finalScore != null ? Number(b.finalScore) : (res.overall.score / 10) * a.max_score;
  if (b.finalScore != null && (final < 0 || final > a.max_score)) throw bad(`Điểm không được vượt quá 0 - ${a.max_score}`);
  final = Math.round(final * 10) / 10;
  const version = (w.version ?? 1) + 1;
  const json = JSON.stringify(res);
  await run(c.env, "UPDATE writing_assessments SET current_result_json = ?, status = 'TEACHER_EDITED', overall_score = ?, version = ?, last_edited_at = ?, last_edited_by = ? WHERE id = ?", json, res.overall.score, version, nowISO(), me.id, w.id);
  await saveVersion(c.env, w.id, version, 'TEACHER', json, res.overall.score, me.id, b.note || 'Giáo viên duyệt và chỉnh sửa đánh giá');
  if (b.publishToStudent !== false) {
    await run(c.env, "UPDATE assignment_submissions SET score = ?, status = 'GRADED', graded_at = ?, feedback = ? WHERE id = ?", final, nowISO(), res.teacherSummary?.overallComment || res.studentFeedback?.positive || '', s.id);
    const link = a.course_id ? `/courses/${a.course_id}/assignments/${a.id}` : `/classes/${a.classroom_id ?? ''}/classwork`;
    await notify(c.env, s.student_id, `Đã có điểm bài tập: ${a.title}`, `Giáo viên đã chấm bài viết của bạn. Điểm số: ${final}/${a.max_score}đ.`, link, 'ASSIGNMENT', me, 'ASSIGNMENT_GRADED', s.id);
  }
  return ok(c, await assessmentDto(c.env, w.id, true));
});

/** Chấm hàng loạt. shortcut: chấm tuần tự ngay trong request (tối đa 25 bài/lần) — chuyển sang Cloudflare Queues khi lớp đông */
async function runBatch(env: Env, assignmentId: string, ids: string[], me: UserRow) {
  const items: any[] = [];
  for (const sid of ids.slice(0, 25)) {
    const s = await one<any>(env, `${S_SELECT} WHERE s.id = ? AND s.assignment_id = ?`, sid, assignmentId);
    if (!s) continue;
    try { const res = await gradeSubmission(env, sid, false, me); items.push({ submissionId: sid, studentName: s.student_name, status: 'COMPLETED', score: res.overallScore, errorMessage: null }); }
    catch (e) { items.push({ submissionId: sid, studentName: s.student_name, status: 'FAILED', score: null, errorMessage: e instanceof Error ? e.message : 'Lỗi' }); }
  }
  return batchStatus(env, assignmentId, `${assignmentId}`, items);
}
async function batchStatus(env: Env, assignmentId: string, batchId: string, items?: any[]) {
  items ??= (await all<any>(env, `SELECT s.id, u.full_name, w.status, w.overall_score, w.error_message FROM assignment_submissions s JOIN users u ON u.id = s.student_id LEFT JOIN writing_assessments w ON w.submission_id = s.id WHERE s.assignment_id = ?`, assignmentId))
    .map((x) => ({ submissionId: x.id, studentName: x.full_name, status: x.status ?? 'QUEUED', score: x.overall_score, errorMessage: x.error_message }));
  const done = items.filter((i) => i.status === 'COMPLETED' || i.status === 'TEACHER_EDITED').length, failed = items.filter((i) => i.status === 'FAILED').length;
  return { batchId, assignmentId, total: items.length, completed: done + failed, successful: done, failed, inProgress: items.length - done - failed, isDone: items.length === done + failed, done: items.length === done + failed, items };
}
r.post('/:assignmentId/ai-grade', async (c) => {
  const me = c.get('user');
  const a = await getAssignment(c.env, c.req.param('assignmentId'));
  if (!(await canManageAssignment(c.env, a, me))) throw bad('Bạn không có quyền quản lý hoặc chấm bài tập này.');
  const ids = (await all<{ id: string }>(c.env, "SELECT id FROM assignment_submissions WHERE assignment_id = ? AND (status IS NULL OR status <> 'GRADED') ORDER BY submitted_at DESC", a.id)).map((x) => x.id);
  return ok(c, await runBatch(c.env, a.id, ids, me));
});
r.post('/ai-grading/batch', async (c) => {
  const me = c.get('user');
  const a = await getAssignment(c.env, c.req.query('assignmentId') || '');
  if (!(await canManageAssignment(c.env, a, me))) throw bad('Bạn không có quyền quản lý hoặc chấm bài tập này.');
  const b = await body(c);
  const ids: string[] = Array.isArray(b.submissionIds) && b.submissionIds.length ? b.submissionIds.map(String)
    : (await all<{ id: string }>(c.env, "SELECT id FROM assignment_submissions WHERE assignment_id = ? AND (status IS NULL OR status <> 'GRADED')", a.id)).map((x) => x.id);
  return ok(c, await runBatch(c.env, a.id, ids, me));
});
r.get('/:assignmentId/ai-grading/batch-status/:batchId', async (c) => {
  const a = await getAssignment(c.env, c.req.param('assignmentId'));
  if (!(await canManageAssignment(c.env, a, c.get('user')))) throw bad('Bạn không có quyền quản lý hoặc chấm bài tập này.');
  return ok(c, await batchStatus(c.env, a.id, c.req.param('batchId')));
});

export default r;
