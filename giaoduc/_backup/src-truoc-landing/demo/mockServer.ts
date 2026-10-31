// Backend giả lập chạy trong trình duyệt cho bản demo gửi khách (VITE_DEMO=true).
// shortcut: dữ liệu chỉ nằm trong bộ nhớ, tải lại trang là về dữ liệu mẫu — thay bằng API thật khi backend lên Cloudflare.
import { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import * as XLSX from 'xlsx';
import {
  users, userById, classes, exams, decks, resources, essaySamples, day, rnd,
  type DemoExam, type DemoQuestion, type AssessType,
} from './seed';

class HttpError extends Error {
  constructor(public status: number, message: string, public errorCode = 'DEMO_ERROR') { super(message); }
}
type Ctx = { q: URLSearchParams; body: any; me: (typeof users)[number] | undefined };
type Handler = (p: Record<string, string>, c: Ctx) => unknown;
const routes: { method: string; re: RegExp; keys: string[]; h: Handler }[] = [];
const on = (method: string, path: string, h: Handler) => {
  const keys: string[] = [];
  const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$');
  routes.push({ method, re, keys, h });
};
/** Đánh dấu kết quả trả thẳng (blob, số...) không bọc ApiResponse */
const RAW = Symbol('raw');
const raw = (v: unknown) => ({ [RAW]: v });

const page = <T,>(all: T[], q: URLSearchParams, defSize = 20) => {
  const p = Number(q.get('page') || 0), size = Number(q.get('size') || defSize);
  const content = all.slice(p * size, p * size + size);
  return { content, totalElements: all.length, totalPages: Math.max(1, Math.ceil(all.length / size)), number: p, size, last: (p + 1) * size >= all.length, pageable: { pageNumber: p, pageSize: size } };
};
const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase().trim();
const strip = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const round = (n: number, step = 0.25) => Math.round(n / step) * step;
const publicUser = ({ password: _pw, ability: _a, ...u }: (typeof users)[number]) => u;
const need = <T,>(v: T | undefined, what = 'dữ liệu'): T => { if (!v) throw new HttpError(404, `Không tìm thấy ${what}`); return v; };

/* ======================= Trạng thái ======================= */
interface Result {
  resultId: string; examId: string; studentId: string; answers: Record<string, string>;
  graded: Record<string, { earned: number; ai?: number; feedback?: string; reviewed: boolean; correct: boolean }>;
  startedAt: string; submittedAt: string; timeTakenSeconds: number; cheatWarningCount: number; cheatDetails?: string;
  published: boolean; isPassed?: boolean;
}
const results: Result[] = [];
const ongoing: Record<string, { startedAt: number; answers: Record<string, string> }> = {};

const examTeacher = (e: DemoExam) => userById(e.teacherId)!;
const maxOf = (e: DemoExam) => e.questions.reduce((a, q) => a + q.points, 0);

/** Thang điểm câu đúng/sai nhiều ý theo cấu trúc đề tốt nghiệp: 1 ý 10%, 2 ý 25%, 3 ý 50%, 4 ý 100% */
const TF_SCALE = [0, 0.1, 0.25, 0.5, 1];

/** "AI" chấm tự luận theo đáp án mẫu của giáo viên: phủ ý (từ khóa) + độ dài. Thay bằng Gemini/ChatGPT ở backend thật. */
export function aiGrade(text: string, q: DemoQuestion) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  if (!words) return { score: 0, feedback: 'Học sinh chưa làm câu này.' };
  const kw = q.keywords || [];
  const hit = kw.filter((k) => norm(text).includes(norm(k)));
  const miss = kw.filter((k) => !hit.includes(k));
  const ratio = Math.min(1, 0.2 + 0.6 * (kw.length ? hit.length / kw.length : 1) + 0.2 * Math.min(1, words / 90));
  const score = Math.min(q.points, round(q.points * ratio));
  const feedback = [
    `Điểm gợi ý: ${score}/${q.points}.`,
    hit.length ? `Đã nêu được: ${hit.join(', ')}.` : 'Chưa bám được ý chính trong đáp án.',
    miss.length ? `Còn thiếu: ${miss.join(', ')}.` : 'Đủ các ý trong đáp án.',
    words < 60 ? 'Bài viết còn ngắn, cần triển khai lí lẽ và dẫn chứng.' : 'Diễn đạt mạch lạc, có liên kết giữa các ý.',
  ].join(' ');
  return { score, feedback };
}
console.assert(aiGrade('', { points: 2, keywords: ['a'] } as DemoQuestion).score === 0, 'aiGrade: bài trống = 0');
console.assert(aiGrade(essaySamples[0], exams[1].questions[4]).score >= 1.5, 'aiGrade: bài tốt ≥ 1.5/2');

function gradeAnswers(e: DemoExam, answers: Record<string, string>) {
  const graded: Result['graded'] = {};
  for (const q of e.questions) {
    const a = answers[q.id] || '';
    if (q.questionType === 'MULTIPLE_CHOICE') {
      const ok = q.options.find((o) => o.isCorrect)?.id === a;
      graded[q.id] = { earned: ok ? q.points : 0, reviewed: true, correct: ok };
    } else if (q.questionType === 'TRUE_FALSE') {
      let map: Record<string, boolean> = {};
      try { map = JSON.parse(a || '{}'); } catch { /* bài trống */ }
      const right = q.options.filter((o) => map[o.id] === o.isCorrect).length;
      const earned = round(q.points * TF_SCALE[Math.min(4, right)], 0.05);
      graded[q.id] = { earned, reviewed: true, correct: right === q.options.length };
    } else if (q.questionType === 'SHORT_ANSWER') {
      const ok = norm(a) === norm(q.correctText || '');
      graded[q.id] = { earned: ok ? q.points : 0, reviewed: true, correct: ok };
    } else {
      const g = aiGrade(a, q);
      graded[q.id] = { earned: g.score, ai: g.score, feedback: g.feedback, reviewed: false, correct: g.score >= q.points * 0.5 };
    }
  }
  return graded;
}
const scoreOf = (r: Result) => Object.values(r.graded).reduce((a, g) => a + g.earned, 0);

/* Sổ điểm: các cột theo hệ số (TX = 15 phút, GK = 1 tiết, CK = cuối kì) */
interface Col { id: string; title: string; type: 'EXAM' | 'ASSIGNMENT'; maxScore: number; dueDate: string | null; assessmentType: AssessType; examId?: string }
const gradeCols: Record<string, Col[]> = {};
const gradeCells: Record<string, Record<string, Record<string, { score: number | null; status: string }>>> = {};
const mk = (n: number) => Math.max(2, Math.min(10, Math.round(n * 4) / 4));

for (const c of classes) {
  const cols: Col[] = c.subject === 'Tiếng Anh'
    ? [{ id: `${c.id}-tx1`, title: 'Speaking check 1', type: 'ASSIGNMENT', maxScore: 10, dueDate: day(-14), assessmentType: 'TX' }]
    : [
      { id: `${c.id}-tx1`, title: '15 phút #1 – Đọc hiểu thơ', type: 'EXAM', maxScore: 10, dueDate: day(-21), assessmentType: 'TX' },
      { id: `${c.id}-a1`, title: 'Bài viết số 1 – Nghị luận về lòng biết ơn', type: 'ASSIGNMENT', maxScore: 10, dueDate: day(-9), assessmentType: 'TX' },
      { id: `${c.id}-15p`, title: 'Kiểm tra 15 phút – Nghị luận xã hội', type: 'EXAM', maxScore: 10, dueDate: day(2, 21), assessmentType: 'TX', examId: 'e-15p' },
      { id: `${c.id}-gk`, title: 'Giữa kì I (1 tiết)', type: 'EXAM', maxScore: 10, dueDate: day(-6), assessmentType: 'GK', examId: 'e-gk' },
      { id: `${c.id}-ck`, title: 'Cuối kì I', type: 'EXAM', maxScore: 10, dueDate: day(45), assessmentType: 'CK', examId: 'e-ck' },
    ];
  gradeCols[c.id] = cols;
  gradeCells[c.id] = {};
  for (const sid of c.memberIds) {
    const ab = userById(sid)?.ability ?? 0.7;
    const row: Record<string, { score: number | null; status: string }> = {};
    for (const col of cols) {
      const past = new Date(col.dueDate!) < new Date();
      if (col.assessmentType === 'CK') row[col.id] = { score: null, status: 'ASSIGNED' };
      else if (col.examId === 'e-15p') row[col.id] = sid !== 'u-student' && rnd() < 0.6 ? { score: mk(ab * 10 + (rnd() - 0.5) * 2), status: 'GRADED' } : { score: null, status: 'ASSIGNED' };
      else if (past) row[col.id] = rnd() < 0.04 ? { score: null, status: 'MISSING' } : { score: mk(ab * 10 + (rnd() - 0.5) * 2.5), status: 'GRADED' };
      else row[col.id] = { score: null, status: 'ASSIGNED' };
    }
    gradeCells[c.id][sid] = row;
  }
}

/** Ghi điểm bài kiểm tra vào sổ điểm mọi lớp có cột gắn đề này — "tự động lưu kết quả, tổng hợp điểm học kì" */
function recordToGradebook(r: Result) {
  const e = exams.find((x) => x.id === r.examId)!;
  const ten = Math.round((scoreOf(r) / maxOf(e)) * 100) / 10;
  for (const c of classes) {
    if (!c.memberIds.includes(r.studentId)) continue;
    for (const col of gradeCols[c.id]) if (col.examId === e.id) gradeCells[c.id][r.studentId][col.id] = { score: ten, status: 'GRADED' };
  }
}

// Kết quả cũ của học sinh demo (để có lịch sử, biểu đồ và hàng chờ AI)
function seedResult(examId: string, studentId: string, dayOffset: number, pick: (q: DemoQuestion, i: number) => string) {
  const e = exams.find((x) => x.id === examId)!;
  const answers: Record<string, string> = {};
  e.questions.forEach((q, i) => { answers[q.id] = pick(q, i); });
  const r: Result = { resultId: uid('res'), examId, studentId, answers, graded: gradeAnswers(e, answers), startedAt: day(dayOffset, 9), submittedAt: day(dayOffset, 9, Math.min(55, e.durationMinutes - 2)), timeTakenSeconds: (e.durationMinutes - 3) * 60, cheatWarningCount: 0, published: true };
  results.push(r);
  return r;
}
const goodPick = (ok: number) => (q: DemoQuestion, i: number) =>
  q.questionType === 'MULTIPLE_CHOICE' ? (rnd() < ok ? q.options.find((o) => o.isCorrect)!.id : q.options[(i + 1) % q.options.length].id)
    : q.questionType === 'TRUE_FALSE' ? JSON.stringify(Object.fromEntries(q.options.map((o) => [o.id, rnd() < ok ? o.isCorrect : !o.isCorrect])))
    : q.questionType === 'SHORT_ANSWER' ? (rnd() < ok ? q.correctText! : 'cảm ơn')
    : essaySamples[i % 2 === 0 ? 0 : 3];
seedResult('e-eng', 'u-student', -10, goodPick(0.8));
seedResult('e-toan', 'u-student', -7, goodPick(0.75));
seedResult('e-gk', 'u-student', -6, goodPick(0.85));
classes[0].memberIds.slice(1, 13).forEach((sid, k) => seedResult('e-gk', sid, -6, (q, i) => q.questionType === 'ESSAY' ? essaySamples[(k + i) % essaySamples.length] : goodPick(userById(sid)!.ability!)(q, i)));

/* Bảng tin, bài tập, thông báo... */
const posts: Record<string, any[]> = {};
const comments: Record<string, any[]> = {};
const postSeed = [
  ['u-teacher', '<p>📌 Thứ Sáu này lớp làm <strong>bài kiểm tra 15 phút</strong> trên hệ thống. Các em nhớ đăng nhập trước giờ học 5 phút nhé!</p>', -1, 18, 6],
  ['u-teacher', '<p>Cô đã chấm xong bài giữa kì. AI đã gợi ý điểm phần viết, cô duyệt lại từng bài. Em nào thắc mắc thì nhắn riêng cô.</p>', -4, 24, 9],
  ['u-student', '<p>Cô ơi cho em hỏi bài viết số 2 có giới hạn số chữ không ạ?</p>', -5, 3, 2],
  ['u-teacher', '<p>Tài liệu ôn tập chương 1 đã có trong mục <em>Bài tập trên lớp → Ôn tập giữa kì</em>.</p>', -9, 31, 4],
];
for (const c of classes) {
  posts[c.id] = postSeed.map(([a, content, d, likes, cm], i) => ({ id: `${c.id}-p${i}`, content, attachments: [], authorId: a, likeCount: likes, commentCount: cm, isLikedByCurrentUser: false, createdAt: day(d as number, 7 + i) }));
  posts[c.id].forEach((p, i) => { comments[p.id] = Array.from({ length: Math.min(3, p.commentCount) }, (_, k) => ({ id: `${p.id}-c${k}`, postId: p.id, authorId: c.memberIds[(i * 3 + k + 1) % c.memberIds.length], content: ['Dạ em cảm ơn cô ạ!', 'Em đã xem rồi ạ.', 'Cô ơi bài này có tính vào điểm 15 phút không ạ?'][k], createdAt: day(-1, 20, k * 7), likeCount: k, isLikedByCurrentUser: false, replies: [] })); });
}
const withAuthor = (o: any) => { const u = userById(o.authorId); return { ...o, authorName: u?.fullName || 'Ẩn danh', authorAvatar: u?.avatarUrl || null }; };

const assignments = classes.filter((c) => c.subject === 'Ngữ văn').flatMap((c) => [
  { id: `${c.id}-a1`, title: 'Bài viết số 1 – Nghị luận về lòng biết ơn', description: '<p>Viết đoạn văn 150 chữ.</p>', assignmentType: 'ESSAY', dueDate: day(-9, 23), maxScore: 10, classroomId: c.id, classroomName: c.name, teacherName: 'Cô Lê Hạnh', createdAt: day(-16), minWordCount: 120, maxWordCount: 200, expectedAnswer: 'Giải thích – ý nghĩa – phê phán vô ơn – liên hệ bản thân.', folderId: `${c.id}-f1` },
  { id: `${c.id}-a2`, title: 'Bài viết số 2 – Phân tích nhân vật Huấn Cao', description: '<p>Bài văn 500–700 chữ. AI sẽ gợi ý điểm theo rubric, cô duyệt lại.</p>', assignmentType: 'ESSAY', dueDate: day(3, 23), maxScore: 10, classroomId: c.id, classroomName: c.name, teacherName: 'Cô Lê Hạnh', createdAt: day(-2), minWordCount: 500, maxWordCount: 700, expectedAnswer: 'Tài hoa – khí phách – thiên lương; nghệ thuật tương phản.', rubricConfig: JSON.stringify([{ name: 'Nội dung', weight: 5 }, { name: 'Lập luận', weight: 3 }, { name: 'Diễn đạt', weight: 2 }]), folderId: `${c.id}-f2` },
]);
const submissions: any[] = classes[0].memberIds.slice(1, 15).map((sid, k) => ({ id: `sub-${k}`, assignmentId: 'c-10a1-a2', studentId: sid, studentName: userById(sid)!.fullName, content: essaySamples[3] + (k % 2 ? ' ' + essaySamples[2] : ''), fileUrl: null, score: null, feedback: null, status: 'SUBMITTED', submittedAt: day(-1, 20, k) }));
const assessments: Record<string, any> = {};

const folders: Record<string, any[]> = Object.fromEntries(classes.map((c) => [c.id, [
  { id: `${c.id}-f1`, name: 'Chương 1 – Văn bản nghị luận', classroomId: c.id, parentId: null, createdAt: day(-30) },
  { id: `${c.id}-f2`, name: 'Ôn tập giữa kì I', classroomId: c.id, parentId: null, createdAt: day(-15) },
]]));
const ceDto = (ce: any) => { const e = exams.find((x) => x.id === ce.examId)!; return { ...ce, examTitle: e.title, durationMinutes: e.durationMinutes, questionCount: e.questions.length, examType: 'STANDARD', createdAt: e.createdAt }; };
const classExams: Record<string, any[]> = Object.fromEntries(classes.map((c) => [c.id, (c.subject === 'Tiếng Anh'
  ? [{ id: `${c.id}-ce-eng`, classroomId: c.id, examId: 'e-eng', openTime: day(-20), closeTime: day(10, 23), folderId: null }]
  : [
    { id: `${c.id}-ce1`, classroomId: c.id, examId: 'e-15p', openTime: day(-1), closeTime: day(2, 21), folderId: `${c.id}-f1` },
    { id: `${c.id}-ce2`, classroomId: c.id, examId: 'e-gk', openTime: day(-7), closeTime: day(-6, 11), folderId: `${c.id}-f2` },
    { id: `${c.id}-ce3`, classroomId: c.id, examId: 'e-ck', openTime: day(44), closeTime: day(45, 11), folderId: null },
  ]).map(ceDto)]));

const notifications = [
  ['Có 12 bài viết chờ duyệt', 'AI đã gợi ý điểm cho bài “Phân tích nhân vật Huấn Cao” lớp 10A1.', '/assignments/c-10a1-a2/grade', 0, 'ASSIGNMENT'],
  ['Bài kiểm tra 15 phút đã mở', 'Lớp 10A1 · hạn nộp tối thứ Bảy.', '/classes/c-10a1/classwork', -1, 'EXAM'],
  ['Trần Minh Anh đã nộp bài', 'Kiểm tra giữa kì I – Ngữ văn 10.', '/exams/e-gk/analytics', -6, 'SUBMISSION'],
  ['Nhắc lịch: họp tổ chuyên môn', 'Thứ Hai, 14:00 tại phòng giáo viên.', '/calendar', -2, 'SYSTEM'],
  ['Sổ điểm 10A3 đã cập nhật', 'Điểm giữa kì đã được tổng hợp vào điểm học kì.', '/classes/c-10a3/grades', -5, 'GRADE'],
].map(([title, message, link, d, type], i) => ({ id: `n${i}`, title, message, link, type, isRead: i > 1, read: i > 1, createdAt: day(d as number, 9 + i) }));

const events = [
  ['Kiểm tra 15 phút – 10A1', 'EXAM', 2, 7, 45], ['Hạn nộp bài viết số 2', 'DEADLINE', 3, 23, 0], ['Họp tổ chuyên môn', 'OTHER', 4, 14, 0],
  ['Dạy trực tuyến 12C1', 'LIVE_SESSION', 1, 19, 30], ['Kiểm tra cuối kì I', 'EXAM', 45, 7, 30], ['CLB Tiếng Anh', 'LIVE_SESSION', 0, 15, 0],
].map(([title, eventType, d, h, m], i) => ({ id: `ev${i}`, courseId: null, courseName: null, title, description: '', eventType, startTime: day(d as number, h as number, m as number), endTime: day(d as number, (h as number) + 1, m as number), meetingLink: eventType === 'LIVE_SESSION' ? 'https://meet.google.com/demo' : null }));

const attendance: Record<string, Record<string, string | null>> = {};
const vault: any[] = [
  { id: 'mv1', itemType: 'QUESTION', content: 'Biện pháp tu từ trong “Lòng biết ơn là ký ức của trái tim”?', correctAnswer: 'Ẩn dụ', wrongAnswer: 'So sánh', skillTag: 'doc-hieu', sourceTitle: 'Kiểm tra 15 phút', wrongCount: 2, repetitions: 0, intervalDays: 1, nextReviewDate: day(0) },
  { id: 'mv2', itemType: 'VOCAB', content: 'composer', correctAnswer: 'nhà soạn nhạc', wrongAnswer: 'nhạc trưởng', skillTag: 'vocabulary', sourceTitle: 'Unit 3 – Music', wrongCount: 1, repetitions: 1, intervalDays: 2, nextReviewDate: day(0) },
  { id: 'mv3', itemType: 'QUESTION', content: 'Số tập con của tập có 3 phần tử?', correctAnswer: '8', wrongAnswer: '6', skillTag: 'tap-hop', sourceTitle: 'Toán 10', wrongCount: 1, repetitions: 2, intervalDays: 4, nextReviewDate: day(2) },
];

/* ======================= Chuyển đổi hiển thị ======================= */
const classDto = (c: (typeof classes)[number], me?: Ctx['me']) => {
  const t = userById(c.teacherId)!;
  const ce = (classExams[c.id] || []).filter((x) => new Date(x.closeTime) > new Date()).sort((a, b) => +new Date(a.closeTime) - +new Date(b.closeTime))[0];
  const pending = me?.role === 'STUDENT'
    ? Object.values(gradeCells[c.id][me.id] || {}).filter((g) => g.status === 'ASSIGNED').length - 1
    : (classExams[c.id] || []).filter((x) => new Date(x.closeTime) > new Date()).length;
  return { id: c.id, name: c.name, subject: c.subject, section: c.section, room: c.room, description: c.description, inviteCode: c.inviteCode, teacherId: t.id, teacherName: t.fullName, teacherAvatar: t.avatarUrl, leaderboardEnabled: c.leaderboardEnabled, meetingLink: c.meetingLink, thumbnail: c.thumbnail, memberCount: c.memberIds.length, createdAt: c.createdAt, pendingCount: Math.max(0, pending), nearestDeadline: ce?.closeTime, nearestTaskTitle: ce?.examTitle, nearestTaskType: ce ? 'EXAM' : undefined };
};
const visibleClasses = (me: Ctx['me']) => !me ? [] : me.role === 'ADMIN' || me.role === 'OFFICE' ? classes
  : classes.filter((c) => c.teacherId === me.id || c.memberIds.includes(me.id) || c.taIds.includes(me.id));
const examCard = (e: DemoExam, me?: Ctx['me']) => {
  const t = examTeacher(e);
  return { id: e.id, title: e.title, examCode: e.examCode, durationMinutes: e.durationMinutes, isPublished: e.isPublished, visibility: e.visibility, questionCount: e.questions.length, createdAt: e.createdAt, subject: e.subject, grade: e.grade, teacherId: t.id, teacherName: t.fullName, teacherAvatar: t.avatarUrl, isFavorited: !!me && e.favoritedBy.includes(me.id), accessLevel: 'FULL', locked: false, assessmentType: e.assessmentType, description: e.description, folderId: null, folderName: null };
};
const examFull = (e: DemoExam, me?: Ctx['me']) => {
  const owner = me && (me.id === e.teacherId || me.role === 'ADMIN');
  const mine = results.filter((r) => r.examId === e.id && r.studentId === me?.id);
  return { ...examCard(e, me), examType: 'STANDARD', maxAttempts: 0, userAttemptCount: mine.length, latestResultId: mine[mine.length - 1]?.resultId, showAnswers: true, passingScore: 50,
    questions: e.questions.map((q, i) => ({ id: q.id, content: q.content, points: q.points, questionType: q.questionType, orderIndex: i, skillTag: q.skillTag, explanation: owner ? q.explanation : undefined, correctAnswer: owner ? q.correctText : undefined, expectedAnswer: owner ? q.expectedAnswer : undefined,
      options: q.options.map((o) => ({ id: o.id, content: o.content, ...(owner ? { isCorrect: o.isCorrect } : {}) })) })) };
};
const resultDetail = (r: Result) => {
  const e = exams.find((x) => x.id === r.examId)!;
  const total = scoreOf(r), max = maxOf(e);
  const pending = Object.values(r.graded).some((g) => !g.reviewed);
  let tf: Record<string, boolean> = {};
  return {
    resultId: r.resultId, examId: e.id, examTitle: e.title, examCode: e.examCode, totalScore: Math.round(total * 100) / 100, maxScore: max,
    scorePercentage: Math.round((total / max) * 1000) / 10, isPassed: r.isPassed ?? total / max >= 0.5, timeTakenSeconds: r.timeTakenSeconds,
    correctCount: Object.values(r.graded).filter((g) => g.correct).length, totalCount: e.questions.length,
    reviewMessage: pending ? 'Phần tự luận đã có điểm AI gợi ý, đang chờ giáo viên duyệt.' : null, pendingTeacherReview: pending,
    cheatWarningCount: r.cheatWarningCount, cheatDetails: r.cheatDetails, submittedAt: r.submittedAt, startedAt: r.startedAt,
    questions: e.questions.map((q) => {
      const g = r.graded[q.id], a = r.answers[q.id] || '';
      if (q.questionType === 'TRUE_FALSE') { try { tf = JSON.parse(a || '{}'); } catch { tf = {}; } }
      return { questionId: q.id, answerId: `${r.resultId}:${q.id}`, questionContent: q.content, questionType: q.questionType, points: q.points, pointsEarned: g.earned,
        aiSuggestedScore: g.ai, isCorrect: g.correct, textResponse: a, aiFeedback: g.feedback, reviewed: g.reviewed, essayStatus: q.questionType === 'ESSAY' ? (g.reviewed ? 'REVIEWED' : 'AI_GRADED') : undefined,
        explanation: q.explanation, correctAnswer: q.correctText, skillTag: q.skillTag,
        options: q.options.map((o) => ({ id: o.id, content: o.content, isCorrect: o.isCorrect, isSelected: q.questionType === 'TRUE_FALSE' ? tf[o.id] === true : a === o.id })) };
    }),
  };
};
const historyRow = (r: Result) => { const d = resultDetail(r); return { resultId: r.resultId, examId: d.examId, examTitle: d.examTitle, examCode: d.examCode, teacherName: examTeacher(exams.find((e) => e.id === r.examId)!).fullName, totalScore: d.totalScore, maxScore: d.maxScore, scorePercentage: d.scorePercentage, isPassed: d.isPassed, startedAt: r.startedAt, submittedAt: r.submittedAt, timeTakenSeconds: r.timeTakenSeconds, pendingTeacherReview: d.pendingTeacherReview }; };
const deckDto = (d: (typeof decks)[number], withCards = true) => {
  const o = userById(d.ownerId)!;
  return { ...d, ownerName: o.fullName, ownerAvatar: o.avatarUrl, accessLevel: 'FULL', locked: false, sharesCount: 4,
    cards: withCards ? d.cards.map((c, i) => ({ id: `${d.id}-k${i}`, frontContent: c[0], backContent: c[1], phonetic: c[2] || null, wordType: c[3] || null, example: c[4] || null, definitionVi: d.deckType === 'VOCAB' ? c[1] : null })) : undefined, cardCount: d.cards.length };
};
const resDto = (r: (typeof resources)[number]) => { const u = userById(r.uploaderId)!; return { ...r, authorName: u.fullName, uploaderName: u.fullName, uploaderAvatar: u.avatarUrl, uploaderRole: u.role, updatedAt: r.createdAt, isLiked: false, isBookmarked: false }; };

/* ======================= Định tuyến ======================= */
on('POST', '/auth/login', (_, { body }) => {
  const u = users.find((x) => (x.email === body.email || x.studentCode === body.studentCode || x.email === body.username) && x.password === body.password);
  if (!u) throw new HttpError(400, 'Sai email hoặc mật khẩu. Bản demo: bấm một tài khoản mẫu bên dưới.', 'BAD_CREDENTIALS');
  if (u.status !== 'ACTIVE') throw new HttpError(403, 'Tài khoản đang bị khóa.', 'ACCOUNT_LOCKED');
  return { accessToken: `demo-${u.id}`, user: publicUser(u) };
});
on('POST', '/auth/register', () => { throw new HttpError(400, 'Bản demo không tạo tài khoản mới. Hãy dùng tài khoản mẫu.', 'DEMO_ONLY'); });
on('POST', '/auth/google', () => { throw new HttpError(400, 'Đăng nhập Google chưa bật trong bản demo.', 'DEMO_ONLY'); });
on('GET', '/users/me', (_, { me }) => raw(publicUser(me!)));
on('PUT', '/users/me', (_, { me, body }) => { Object.assign(me!, { fullName: body.fullName ?? me!.fullName, phone: body.phone ?? me!.phone, avatarUrl: body.avatarUrl ?? me!.avatarUrl }); return publicUser(me!); });

on('GET', '/analytics/teacher', (_, { me }) => {
  const mine = classes.filter((c) => c.teacherId === me!.id);
  return { totalStudents: new Set(mine.flatMap((c) => c.memberIds)).size, totalExams: exams.filter((e) => e.teacherId === me!.id).length, totalDecks: decks.filter((d) => d.ownerId === me!.id).length + 3,
    enrollmentsByMonth: ['T5', 'T6', 'T7', 'T8', 'T9', 'T10'].map((month, i) => ({ month, count: [12, 18, 9, 34, 61, 48][i] })) };
});
on('GET', '/analytics/student', (_, { me }) => {
  const mine = results.filter((r) => r.studentId === me!.id).map(resultDetail);
  return { totalExamsTaken: mine.length, averageExamScore: mine.length ? Math.round(mine.reduce((a, r) => a + r.scorePercentage, 0) / mine.length) : 0,
    badges: ['Chăm chỉ 7 ngày', 'Điểm 10 đầu tiên', 'Nộp bài sớm'], currentStreak: 6, totalXp: 1840,
    examHistory: [...mine].reverse().map((r) => ({ examTitle: r.examTitle, scorePercent: r.scorePercentage, submittedAt: r.submittedAt })) };
});
on('GET', '/analytics/admin', () => ({ totalUsers: users.length, totalTeachers: users.filter((u) => u.role === 'TEACHER').length, totalStudents: users.filter((u) => u.role === 'STUDENT').length, totalClasses: classes.length, totalCourses: 6,
  newUsersByMonth: ['T5', 'T6', 'T7', 'T8', 'T9', 'T10'].map((month, i) => ({ month, count: [8, 14, 6, 41, 52, 17][i] })) }));
on('GET', '/analytics/progress-report', () => ({ skills: [] }));

on('GET', '/gamification', () => ({ totalXp: 1840, diamonds: 126, currentStreak: 6, longestStreak: 14, badges: ['STREAK_7', 'FIRST_PERFECT'], uranianLevel: 7, uranianHealth: 92, uranianMood: 'HAPPY', uranianTitle: 'Nhà thám hiểm',
  lastActivityDate: day(0), recentActivities: Array.from({ length: 28 }, (_, i) => ({ activityType: 'EXAM', xpEarned: Math.round(rnd() * 60), activityDate: day(-i) })) }));
on('POST', '/gamification/activity', () => ({ currentStreak: 6, totalXp: 1850 }));
on('GET', '/gamification/leaderboard', (_, { me }) => classes[0].memberIds.slice(0, 10).map((id, i) => { const u = userById(id)!; return { rank: i + 1, userId: id, fullName: u.fullName, username: u.studentCode, avatarUrl: null, level: 9 - Math.floor(i / 2), totalXp: 2400 - i * 160, studyMinutes: 610 - i * 40, currentStreak: 12 - i, isCurrentUser: id === me?.id }; }));
on('GET', '/v1/classrooms/:id/leaderboard', ({ id }) => {
  const c = need(classes.find((x) => x.id === id), 'lớp');
  return c.memberIds.map((sid) => { const row = Object.values(gradeCells[id][sid]).filter((g) => g.score != null); return { studentId: sid, studentName: userById(sid)!.fullName, averageScore: row.length ? row.reduce((a, g) => a + g.score!, 0) / row.length : 0, completedCount: row.length }; })
    .sort((a, b) => b.averageScore - a.averageScore).slice(0, 10).map((e, i) => ({ ...e, rank: i + 1 }));
});

/* Lớp học */
on('GET', '/classes', (_, { me, q }) => page(visibleClasses(me).map((c) => classDto(c, me)), q, 1000));
on('GET', '/classes/admin/all', (_, { me }) => classes.map((c) => classDto(c, me)));
on('GET', '/classes/admin/groups', (_, { me }) => classes.map((c) => classDto(c, me)));
on('POST', '/classes', (_, { me, body }) => { const c = { id: uid('c'), name: body.name, subject: body.subject || '', section: body.section || '', room: body.room || '', description: body.description || '', inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(), teacherId: body.teacherId || me!.id, leaderboardEnabled: true, createdAt: new Date().toISOString(), memberIds: [], taIds: [] }; classes.push(c); gradeCols[c.id] = []; gradeCells[c.id] = {}; posts[c.id] = []; folders[c.id] = []; classExams[c.id] = []; return classDto(c, me); });
on('POST', '/classes/join', (_, { me, body }) => { const c = classes.find((x) => x.inviteCode.toUpperCase() === String(body.inviteCode || '').trim().toUpperCase()); if (!c) throw new HttpError(404, 'Mã lớp không đúng. Thử mã VAN10C.', 'CLASS_NOT_FOUND'); if (!c.memberIds.includes(me!.id)) { c.memberIds.push(me!.id); gradeCells[c.id][me!.id] = Object.fromEntries(gradeCols[c.id].map((col) => [col.id, { score: null, status: 'ASSIGNED' }])); } return classDto(c, me); });
on('GET', '/classes/:id', ({ id }, { me }) => classDto(need(classes.find((x) => x.id === id), 'lớp'), me));
on('PUT', '/classes/:id/settings/info', ({ id }, { me, body }) => { const c = need(classes.find((x) => x.id === id)); Object.assign(c, body); return classDto(c, me); });
on('PUT', '/classes/:id/settings/meeting-link', ({ id }, { me, body }) => { const c = need(classes.find((x) => x.id === id)); c.meetingLink = body.meetingLink ?? body.link; return classDto(c, me); });
on('PUT', '/classes/:id/settings/thumbnail', ({ id }, { me, body }) => { const c = need(classes.find((x) => x.id === id)); c.thumbnail = body.thumbnail; return classDto(c, me); });
on('PUT', '/classes/:id/settings/leaderboard', ({ id }, { me, body }) => { const c = need(classes.find((x) => x.id === id)); c.leaderboardEnabled = body.enabled ?? !c.leaderboardEnabled; return classDto(c, me); });
on('GET', '/classes/:id/members', ({ id }) => {
  const c = need(classes.find((x) => x.id === id), 'lớp');
  const row = (uidv: string, role: string) => { const u = userById(uidv)!; return { id: `${id}:${uidv}`, userId: uidv, fullName: u.fullName, email: u.email, role, avatarUrl: u.avatarUrl, joinedAt: c.createdAt, lastActiveAt: day(-Math.floor(rnd() * 5)), studentCode: u.studentCode || null, phone: u.phone || null }; };
  return [row(c.teacherId, 'TEACHER'), ...c.taIds.map((t) => row(t, 'TA')), ...c.memberIds.map((m) => row(m, 'STUDENT'))];
});
on('DELETE', '/classes/:id/members/:mid', ({ id, mid }) => { const c = need(classes.find((x) => x.id === id)); const sid = mid.includes(':') ? mid.split(':')[1] : mid; c.memberIds = c.memberIds.filter((m) => m !== sid); return {}; });
on('POST', '/classes/:id/members', ({ id }, { body }) => { const c = need(classes.find((x) => x.id === id)); const u = users.find((x) => x.email === body.email || x.studentCode === body.studentCode); if (!u) throw new HttpError(404, 'Không tìm thấy học sinh với email này.', 'USER_NOT_FOUND'); if (!c.memberIds.includes(u.id)) c.memberIds.push(u.id); return {}; });
on('GET', '/classes/:id/posts', ({ id }, { q }) => page((posts[id] || []).map(withAuthor), q, 10));
on('POST', '/classes/:id/posts', ({ id }, { me, body }) => { const p = { id: uid('p'), content: body.content, attachments: body.attachments || [], authorId: me!.id, likeCount: 0, commentCount: 0, isLikedByCurrentUser: false, createdAt: new Date().toISOString() }; posts[id].unshift(p); comments[p.id] = []; return withAuthor(p); });
on('PUT', '/classes/:id/posts/:pid', ({ id, pid }, { body }) => { const p = need(posts[id].find((x) => x.id === pid)); p.content = body.content; return withAuthor(p); });
on('DELETE', '/classes/:id/posts/:pid', ({ id, pid }) => { posts[id] = posts[id].filter((x) => x.id !== pid); return {}; });
on('POST', '/classes/:id/posts/:pid/like', ({ id, pid }) => { const p = need(posts[id].find((x) => x.id === pid)); p.isLikedByCurrentUser = !p.isLikedByCurrentUser; p.likeCount += p.isLikedByCurrentUser ? 1 : -1; return withAuthor(p); });
on('GET', '/classes/:id/posts/:pid/comments', ({ pid }) => (comments[pid] || []).map(withAuthor));
on('POST', '/classes/:id/posts/:pid/comments', ({ id, pid }, { me, body }) => { const cm = { id: uid('cm'), postId: pid, parentId: body.parentId, authorId: me!.id, content: body.content, createdAt: new Date().toISOString(), likeCount: 0, isLikedByCurrentUser: false, replies: [] }; (comments[pid] ||= []).push(cm); const p = posts[id].find((x) => x.id === pid); if (p) p.commentCount++; return withAuthor(cm); });
on('POST', '/classes/:id/posts/:pid/comments/:cid/like', ({ pid, cid }) => { const cm = need((comments[pid] || []).find((x) => x.id === cid)); cm.isLikedByCurrentUser = !cm.isLikedByCurrentUser; cm.likeCount += cm.isLikedByCurrentUser ? 1 : -1; return withAuthor(cm); });
on('DELETE', '/classes/:id/posts/:pid/comments/:cid', ({ pid, cid }) => { comments[pid] = (comments[pid] || []).filter((x) => x.id !== cid); return {}; });
on('GET', '/classes/:id/folders', ({ id }) => folders[id] || []);
on('POST', '/classes/:id/folders', ({ id }, { body }) => { const f = { id: uid('f'), name: body.name, classroomId: id, parentId: body.parentId ?? null, createdAt: new Date().toISOString() }; folders[id].push(f); return f; });
on('DELETE', '/classes/:id/folders/:fid', ({ id, fid }) => { folders[id] = folders[id].filter((f) => f.id !== fid); return {}; });
on('GET', '/classes/:id/resources', () => []);
on('GET', '/classes/:id/courses', () => []);
on('POST', '/classes/:id/remind-deadline', () => ({ sent: 12 }));
on('GET', '/classes/:id/attendance', ({ id }, { q }) => {
  const c = need(classes.find((x) => x.id === id)); const key = `${id}:${q.get('weekNumber')}:${q.get('sessionNumber')}`;
  const saved = attendance[key];
  return { weekNumber: Number(q.get('weekNumber') || 1), sessionNumber: Number(q.get('sessionNumber') || 1),
    records: c.memberIds.map((sid, i) => ({ studentId: sid, studentName: userById(sid)!.fullName, avatarUrl: null, status: saved ? saved[sid] ?? null : (i % 17 === 5 ? 'ABSENT_EXCUSED' : i % 23 === 9 ? 'ABSENT_UNEXCUSED' : 'PRESENT') })) };
});
on('POST', '/classes/:id/attendance', ({ id }, { body }) => { attendance[`${id}:${body.weekNumber}:${body.sessionNumber}`] = Object.fromEntries(body.records.map((r: any) => [r.studentId, r.status])); return {}; });

on('GET', '/v1/classrooms/:id/gradebook', ({ id }, { me }) => {
  const c = need(classes.find((x) => x.id === id), 'lớp');
  const ids = me?.role === 'STUDENT' ? [me.id] : c.memberIds;
  return { classworks: gradeCols[id].map(({ examId: _e, ...col }) => col),
    students: ids.map((sid) => ({ studentId: sid, studentName: userById(sid)!.fullName, avatarUrl: null, studentCode: userById(sid)!.studentCode, grades: gradeCells[id][sid] || {} })) };
});
on('PUT', '/v1/classrooms/:id/gradebook/:sid/:cw', ({ id, sid, cw }, { body }) => { gradeCells[id][sid][cw] = { score: body.score, status: body.score == null ? 'ASSIGNED' : 'GRADED' }; return {}; });
on('GET', '/v1/class-exams/classroom/:id', ({ id }) => classExams[id] || []);
on('GET', '/v1/class-exams/exam/:id', ({ id }) => Object.values(classExams).flat().filter((x) => x.examId === id));
on('POST', '/v1/class-exams', (_, { body }) => { const e = need(exams.find((x) => x.id === body.examId), 'đề'); const ce = { id: uid('ce'), classroomId: body.classroomId, examId: e.id, examTitle: e.title, durationMinutes: e.durationMinutes, questionCount: e.questions.length, openTime: body.openTime || new Date().toISOString(), closeTime: body.closeTime || day(7), folderId: body.folderId || null, createdAt: new Date().toISOString() }; (classExams[body.classroomId] ||= []).push(ce); return ce; });
on('POST', '/v1/class-exams/exam/:id/batch-sync', ({ id }, { body }) => { for (const cid of body.classroomIds || []) { if (!(classExams[cid] || []).some((x) => x.examId === id)) { const e = exams.find((x) => x.id === id)!; (classExams[cid] ||= []).push({ id: uid('ce'), classroomId: cid, examId: id, examTitle: e.title, durationMinutes: e.durationMinutes, questionCount: e.questions.length, openTime: body.openTime || new Date().toISOString(), closeTime: body.closeTime || day(7), folderId: null, createdAt: new Date().toISOString() }); } } return {}; });

/* Bài tập & AI chấm bài viết */
on('GET', '/v1/assignments/classroom/:id', ({ id }, { q }) => page(assignments.filter((a) => a.classroomId === id), q, 50));
on('GET', '/v1/assignments/:id', ({ id }) => need(assignments.find((a) => a.id === id), 'bài tập'));
on('POST', '/v1/assignments', (_, { body }) => { const c = classes.find((x) => x.id === body.classroomId); const a = { ...body, id: uid('a'), classroomName: c?.name, teacherName: 'Cô Lê Hạnh', createdAt: new Date().toISOString() }; assignments.push(a); return a; });
on('GET', '/v1/assignments/:id/submissions', ({ id }, { q }) => page(submissions.filter((s) => s.assignmentId === id), q, 50));
on('GET', '/v1/assignments/:id/submissions/my', ({ id }, { me }) => submissions.find((s) => s.assignmentId === id && s.studentId === me!.id) || null);
on('POST', '/v1/assignments/:id/submit', ({ id }, { me, body }) => { const s = { id: uid('sub'), assignmentId: id, studentId: me!.id, studentName: me!.fullName, content: body.content || '', fileUrl: body.fileUrl || null, score: null, feedback: null, status: 'SUBMITTED', submittedAt: new Date().toISOString() }; submissions.push(s); return s; });
on('POST', '/v1/assignments/submissions/:sid/grade', ({ sid }, { body }) => { const s = need(submissions.find((x) => x.id === sid)); Object.assign(s, { score: body.score, feedback: body.feedback, status: 'GRADED', gradedAt: new Date().toISOString() }); return s; });
const assess = (sid: string) => {
  const s = need(submissions.find((x) => x.id === sid), 'bài nộp');
  const q = exams[1].questions[5];
  const g = aiGrade(s.content, { ...q, points: 10 });
  const crit = (name: string, w: number) => ({ score: round(g.score * w / 10, 0.25), maxScore: w, feedback: `${name}: ${g.feedback.split('. ')[1] || ''}`, strengths: ['Bám đúng yêu cầu đề'], weaknesses: g.score < 7 ? ['Dẫn chứng chưa đủ'] : [] });
  const result = { version: '1', gradingStatus: 'COMPLETED', overall: { score: g.score, maxScore: 10, percentage: g.score * 10 },
    criteria: { taskAchievement: crit('Nội dung', 5), coherenceAndCohesion: crit('Lập luận', 3), lexicalResource: crit('Diễn đạt', 1), grammaticalRangeAndAccuracy: crit('Chính tả, ngữ pháp', 1) },
    errors: [{ id: 'er1', category: 'spelling', severity: 'minor', original: 'hiên ngang', correction: 'hiên ngang,', explanation: 'Thiếu dấu phẩy ngắt ý.' }],
    strengths: [{ category: 'task', description: 'Nêu đúng ba vẻ đẹp của nhân vật.' }], improvements: [{ priority: 'high', category: 'task', description: 'Phân tích sâu chi tiết “cảnh cho chữ”.', action: 'Thêm 1–2 dẫn chứng trực tiếp.' }],
    teacherSummary: { overallComment: g.feedback, mainStrength: 'Bố cục rõ', mainWeakness: 'Thiếu dẫn chứng', recommendedFocus: 'Kĩ năng phân tích chi tiết' }, studentFeedback: { positive: 'Em đã nắm được ý chính.', nextStep: 'Bổ sung dẫn chứng và lời bình.' } };
  return (assessments[sid] = { id: `as-${sid}`, submissionId: sid, assignmentId: s.assignmentId, studentId: s.studentId, studentName: s.studentName, status: 'COMPLETED', overallScore: g.score, maxScore: 10, percentage: g.score * 10, wordCount: s.content.split(/\s+/).length, requiredMinWords: 500, requiredMaxWords: 700, result, originalAiResult: result, version: 1, aiModel: 'gemini-2.5-flash (demo)', createdAt: new Date().toISOString(), completedAt: new Date().toISOString(), versions: [{ id: 'v1', version: 1, source: 'AI', overallScore: g.score, createdAt: new Date().toISOString() }] });
};
on('GET', '/v1/assignments/submissions/:sid/ai-grading', ({ sid }) => assessments[sid] || { submissionId: sid, status: 'NOT_GRADED' });
on('POST', '/v1/assignments/submissions/:sid/ai-grade', ({ sid }) => assess(sid));
on('POST', '/v1/assignments/submissions/:sid/ai-grading/regrade', ({ sid }) => assess(sid));
on('PATCH', '/v1/assignments/submissions/:sid/ai-grading', ({ sid }, { body }) => { const a = assessments[sid] || assess(sid); Object.assign(a, { status: 'TEACHER_EDITED', overallScore: body.overallScore ?? a.overallScore, lastEditedAt: new Date().toISOString(), lastEditedByName: 'Cô Lê Hạnh' }); return a; });
on('POST', '/v1/assignments/:id/ai-grade', ({ id }) => { const list = submissions.filter((s) => s.assignmentId === id); list.forEach((s) => assess(s.id)); return { batchId: 'b1', assignmentId: id, total: list.length, completed: list.length, failed: 0, status: 'COMPLETED', items: list.map((s) => ({ submissionId: s.id, studentName: s.studentName, status: 'COMPLETED', score: assessments[s.id].overallScore })) }; });
on('POST', '/v1/assignments/ai-grading/batch', (_, { q, body }) => { (body.submissionIds || []).forEach((sid: string) => assess(sid)); return { batchId: 'b2', assignmentId: q.get('assignmentId'), total: body.submissionIds.length, completed: body.submissionIds.length, failed: 0, status: 'COMPLETED', items: [] }; });
on('GET', '/v1/assignments/:id/ai-grading/batch-status/:bid', ({ id, bid }) => ({ batchId: bid, assignmentId: id, status: 'COMPLETED', total: 0, completed: 0, failed: 0, items: [] }));

/* Đề thi */
const examList = (list: DemoExam[], c: Ctx) => {
  const qs = norm(c.q.get('search') || ''), sub = c.q.get('subject'), gr = c.q.get('grade');
  return page(list.filter((e) => (!qs || norm(e.title).includes(qs)) && (!sub || e.subject === sub) && (!gr || e.grade === gr)).map((e) => examCard(e, c.me)), c.q, 9);
};
on('GET', '/exams/subjects', () => [...new Set(exams.map((e) => e.subject))]);
on('GET', '/exams/public', (_, c) => examList(exams.filter((e) => e.isPublished && (e.visibility !== 'HIDDEN')), c));
on('GET', '/exams/teacher', (_, c) => examList(exams.filter((e) => e.teacherId === c.me!.id || c.me!.role === 'ADMIN'), c));
on('GET', '/exams/favorites', (_, c) => examList(exams.filter((e) => e.favoritedBy.includes(c.me!.id)), c));
on('GET', '/exams/history', (_, { me, q }) => page(results.filter((r) => r.studentId === me!.id).reverse().map(historyRow), q, 10));
on('GET', '/exams/code/:code', ({ code }) => { const e = exams.find((x) => x.examCode.toUpperCase() === code.toUpperCase()); if (!e) throw new HttpError(404, 'Không tìm thấy mã đề. Thử NV15A1.', 'EXAM_NOT_FOUND'); return examCard(e); });
on('GET', '/exams/:id', ({ id }, { me }) => examFull(need(exams.find((x) => x.id === id), 'đề thi'), me));
on('POST', '/exams', (_, { me, body }) => {
  const e: DemoExam = { id: uid('e'), title: body.title || 'Đề mới', examCode: Math.random().toString(36).slice(2, 8).toUpperCase(), durationMinutes: body.durationMinutes || 15, isPublished: !!body.isPublished, visibility: body.visibility || 'HIDDEN', subject: body.subject || 'Ngữ văn', grade: body.grade || '10', teacherId: me!.id, createdAt: new Date().toISOString(), assessmentType: body.assessmentType, favoritedBy: [],
    questions: (body.questions || []).map((q: any, i: number) => ({ id: uid('q'), content: q.content || `Câu ${i + 1}`, questionType: q.questionType || 'MULTIPLE_CHOICE', points: Number(q.points) || 1, expectedAnswer: q.expectedAnswer || q.sampleAnswer, keywords: String(q.expectedAnswer || q.sampleAnswer || '').split(/[,;.–-]/).map((x: string) => x.trim()).filter(Boolean).slice(0, 6), correctText: q.correctAnswer, options: (q.options || []).map((o: any) => ({ id: uid('o'), content: o.content, isCorrect: !!o.isCorrect })) })) };
  exams.unshift(e); return examFull(e, me);
});
on('PUT', '/exams/:id', ({ id }, c) => { const e = need(exams.find((x) => x.id === id)); Object.assign(e, { title: c.body.title ?? e.title, durationMinutes: c.body.durationMinutes ?? e.durationMinutes, isPublished: c.body.isPublished ?? e.isPublished }); return examFull(e, c.me); });
on('POST', '/exams/:id/draft', () => ({}));
on('PUT', '/exams/:id/draft', () => ({}));
on('POST', '/exams/:id/publish', ({ id }) => { const e = need(exams.find((x) => x.id === id)); e.isPublished = true; return examCard(e); });
on('PUT', '/exams/:id/publish', ({ id }) => { const e = need(exams.find((x) => x.id === id)); e.isPublished = !e.isPublished; return examCard(e); });
on('DELETE', '/exams/:id', ({ id }) => { const i = exams.findIndex((x) => x.id === id); if (i >= 0) exams.splice(i, 1); return {}; });
on('POST', '/exams/:id/favorite', ({ id }, { me }) => { const e = need(exams.find((x) => x.id === id)); const has = e.favoritedBy.includes(me!.id); e.favoritedBy = has ? e.favoritedBy.filter((x) => x !== me!.id) : [...e.favoritedBy, me!.id]; return { favorited: !has }; });
on('POST', '/exams/:id/start', ({ id }, { me }) => {
  const e = need(exams.find((x) => x.id === id), 'đề thi');
  const key = `${id}:${me!.id}`; ongoing[key] ||= { startedAt: Date.now(), answers: {} };
  const left = Math.max(0, e.durationMinutes * 60 - Math.floor((Date.now() - ongoing[key].startedAt) / 1000));
  return { resultId: key, remainingSeconds: left, timeLeftSeconds: left, startedAt: new Date(ongoing[key].startedAt).toISOString(), answers: ongoing[key].answers, cheatWarningCount: 0,
    examSnapshot: { examId: e.id, examTitle: e.title, durationMinutes: e.durationMinutes, examType: 'STANDARD', groups: [], audioTracks: [],
      questions: e.questions.map((q) => ({ questionId: q.id, content: q.content, points: q.points, questionType: q.questionType, options: q.options.map((o) => ({ optionId: o.id, content: o.content })) })) } };
});
on('POST', '/exams/:id/submit', ({ id }, { me, body }) => {
  const e = need(exams.find((x) => x.id === id), 'đề thi');
  const key = `${id}:${me!.id}`; const started = ongoing[key]?.startedAt || Date.now(); delete ongoing[key];
  const r: Result = { resultId: uid('res'), examId: id, studentId: me!.id, answers: body.answers || {}, graded: gradeAnswers(e, body.answers || {}), startedAt: new Date(started).toISOString(), submittedAt: new Date().toISOString(), timeTakenSeconds: Math.max(1, Math.round((Date.now() - started) / 1000)), cheatWarningCount: body.cheatWarningCount || 0, cheatDetails: body.cheatDetails, published: true };
  results.push(r); recordToGradebook(r);
  notifications.unshift({ id: uid('n'), title: `${me!.fullName} đã nộp bài`, message: e.title, link: `/exams/${id}/analytics`, type: 'SUBMISSION', isRead: false, read: false, createdAt: new Date().toISOString() });
  return raw(r.resultId);
});
on('GET', '/exams/results/:rid', ({ rid }) => resultDetail(need(results.find((r) => r.resultId === rid), 'kết quả')));
on('PATCH', '/exams/results/:rid/pass-status', ({ rid }, { body }) => { const r = need(results.find((x) => x.resultId === rid)); r.isPassed = body.isPassed; return resultDetail(r); });
on('POST', '/exams/results/:rid/publish-grade', ({ rid }) => { const r = need(results.find((x) => x.resultId === rid)); Object.values(r.graded).forEach((g) => (g.reviewed = true)); recordToGradebook(r); return resultDetail(r); });
on('POST', '/exams/results/:rid/regrade-all-essays', ({ rid }) => { const r = need(results.find((x) => x.resultId === rid)); r.graded = { ...gradeAnswers(exams.find((e) => e.id === r.examId)!, r.answers) }; return resultDetail(r); });
on('DELETE', '/exams/results/:rid', ({ rid }) => { const i = results.findIndex((r) => r.resultId === rid); if (i >= 0) results.splice(i, 1); return {}; });
const answerRef = (aid: string) => { const [rid, qid] = aid.split(':'); const r = need(results.find((x) => x.resultId === rid), 'bài làm'); return { r, qid, q: exams.find((e) => e.id === r.examId)!.questions.find((x) => x.id === qid)! }; };
on('POST', '/exams/answers/:aid/regrade-ai', ({ aid }) => { const { r, q, qid } = answerRef(decodeURIComponent(aid)); const g = aiGrade(r.answers[qid] || '', q); r.graded[qid] = { ...r.graded[qid], ai: g.score, earned: g.score, feedback: g.feedback, reviewed: false }; return { aiSuggestedScore: g.score, aiFeedback: g.feedback, score: g.score }; });
on('PUT', '/exams/answers/:aid/review', ({ aid }, { body }) => { const { r, qid } = answerRef(decodeURIComponent(aid)); r.graded[qid] = { ...r.graded[qid], earned: Number(body.score), feedback: body.feedback ?? r.graded[qid].feedback, reviewed: true }; if (Object.values(r.graded).every((g) => g.reviewed)) recordToGradebook(r); return resultDetail(r); });
on('POST', '/exams/answers/:aid/review', ({ aid }, c) => routes.find((x) => x.method === 'PUT' && x.re.test('/exams/answers/x/review'))!.h({ aid }, c));
on('GET', '/exams/:id/pending-essay-reviews', ({ id }) => results.filter((r) => r.examId === id).flatMap((r) => exams.find((e) => e.id === id)!.questions.filter((q) => q.questionType === 'ESSAY' && !r.graded[q.id].reviewed).map((q) => { const u = userById(r.studentId)!; return { answerId: `${r.resultId}:${q.id}`, resultId: r.resultId, studentName: u.fullName, studentEmail: u.email, questionContent: q.content, studentAnswer: r.answers[q.id] || '', maxPoints: q.points, aiSuggestedScore: r.graded[q.id].ai ?? null, aiFeedback: r.graded[q.id].feedback ?? null, submittedAt: r.submittedAt }; })));
on('POST', '/exams/:id/regrade-all-essays', ({ id }) => { results.filter((r) => r.examId === id).forEach((r) => { const e = exams.find((x) => x.id === id)!; for (const q of e.questions) if (q.questionType === 'ESSAY' && !r.graded[q.id].reviewed) { const g = aiGrade(r.answers[q.id] || '', q); r.graded[q.id] = { ...r.graded[q.id], ai: g.score, earned: g.score, feedback: g.feedback }; } }); return { regraded: true }; });
on('POST', '/exams/:id/regrade-short-answers', () => ({ regraded: 0 }));
on('GET', '/exams/:id/proctoring', () => []);
const analytics = (id: string) => {
  const e = need(exams.find((x) => x.id === id), 'đề thi'); const rs = results.filter((r) => r.examId === id); const max = maxOf(e);
  const pct = rs.map((r) => (scoreOf(r) / max) * 100);
  const buckets = ['0–2', '2–4', '4–6', '6–8', '8–10'].map((label, i) => { const count = pct.filter((p) => p >= i * 20 && (p < (i + 1) * 20 || (i === 4 && p <= 100))).length; return { label, count, percentage: rs.length ? Math.round((count / rs.length) * 100) : 0 }; });
  return { examId: e.id, examTitle: e.title, examCode: e.examCode, totalSubmissions: rs.length, averageScore: rs.length ? Math.round((rs.reduce((a, r) => a + scoreOf(r), 0) / rs.length) * 100) / 100 : 0,
    averagePercentage: rs.length ? Math.round(pct.reduce((a, b) => a + b, 0) / rs.length) : 0, maxScore: rs.length ? Math.max(...rs.map(scoreOf)) : 0, minScore: rs.length ? Math.min(...rs.map(scoreOf)) : 0,
    passCount: pct.filter((p) => p >= 50).length, failCount: pct.filter((p) => p < 50).length, passRate: rs.length ? Math.round((pct.filter((p) => p >= 50).length / rs.length) * 100) : 0, maxPossibleScore: max, scoreDistribution: buckets,
    questionAnalytics: e.questions.map((q, i) => { const ans = rs.filter((r) => r.answers[q.id]); const ok = rs.filter((r) => r.graded[q.id]?.correct).length; return { questionId: q.id, orderIndex: i, questionContent: q.content, skillTag: q.skillTag || '', points: q.points, correctRate: rs.length ? Math.round((ok / rs.length) * 100) : 0, correctCount: ok, totalAnswered: ans.length,
      optionStats: q.questionType === 'MULTIPLE_CHOICE' ? q.options.map((o) => { const n = rs.filter((r) => r.answers[q.id] === o.id).length; return { optionId: o.id, content: o.content, isCorrect: o.isCorrect, selectedCount: n, selectedRate: rs.length ? Math.round((n / rs.length) * 100) : 0 }; }) : [] }; }),
    skillAnalytics: [...new Set(e.questions.map((q) => q.skillTag || 'khac'))].map((tag) => { const qs = e.questions.filter((q) => (q.skillTag || 'khac') === tag); const rate = rs.length ? Math.round(qs.reduce((a, q) => a + rs.filter((r) => r.graded[q.id]?.correct).length / rs.length, 0) / qs.length * 100) : 0; return { skillTag: tag, skillLabel: ({ 'doc-hieu': 'Đọc hiểu', 'lap-luan': 'Lập luận', 'tieng-viet': 'Tiếng Việt', viet: 'Viết', 'tac-pham': 'Tác phẩm' } as Record<string, string>)[tag] || tag, averageCorrectRate: rate, totalQuestions: qs.length }; }),
    studentScores: rs.map((r) => { const u = userById(r.studentId)!; const total = scoreOf(r); return { resultId: r.resultId, studentId: u.id, studentName: u.fullName, studentEmail: u.email, totalScore: total, maxScore: max, scorePercentage: Math.round((total / max) * 1000) / 10, isPassed: total / max >= 0.5, timeTakenSeconds: r.timeTakenSeconds, cheatWarningCount: r.cheatWarningCount, submittedAt: r.submittedAt, attemptNumber: 1 }; }) };
};
on('GET', '/exams/:id/analytics', ({ id }) => analytics(id));
on('GET', '/exams/:id/results/:rid', ({ rid }) => resultDetail(need(results.find((r) => r.resultId === rid))));
/** Xuất bảng điểm Excel thật (file .xlsx tạo ngay trong trình duyệt) */
on('GET', '/exams/:id/export-excel', ({ id }) => {
  const a = analytics(id);
  const ws = XLSX.utils.json_to_sheet(a.studentScores.map((s, i) => ({ STT: i + 1, 'Họ và tên': s.studentName, Email: s.studentEmail, 'Điểm': s.totalScore, 'Thang điểm': s.maxScore, 'Điểm hệ 10': Math.round((s.totalScore / s.maxScore) * 100) / 10, 'Thời gian (phút)': Math.round(s.timeTakenSeconds / 60), 'Nộp lúc': new Date(s.submittedAt).toLocaleString('vi-VN') })));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Bảng điểm');
  return raw(new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
});

/* Thẻ ghi nhớ, học liệu, lịch, thông báo, quản trị */
const deckList = (list: typeof decks, c: Ctx) => { const qs = norm(c.q.get('search') || ''); const t = c.q.get('deckType'); return page(list.filter((d) => (!qs || norm(d.title).includes(qs)) && (!t || d.deckType === t)).map((d) => deckDto(d)), c.q, 12); };
on('GET', '/flashcards/public', (_, c) => deckList(decks.filter((d) => d.visibility === 'PUBLIC'), c));
on('GET', '/flashcards/my-decks', (_, c) => deckList(decks.filter((d) => d.ownerId === c.me!.id || c.me!.role === 'STUDENT'), c));
on('GET', '/flashcards/favorites', (_, c) => deckList(decks.slice(1, 3), c));
on('GET', '/flashcards/decks/:id', ({ id }) => deckDto(need(decks.find((d) => d.id === id), 'bộ thẻ')));
on('GET', '/flashcards/decks/:id/due', ({ id }) => deckDto(need(decks.find((d) => d.id === id))).cards);
on('GET', '/flashcards/decks/:id/suggested', ({ id }) => decks.filter((d) => d.id !== id).slice(0, 3).map((d) => deckDto(d, false)));
on('GET', '/flashcards/decks/:id/statistics', ({ id }) => { const d = need(decks.find((x) => x.id === id)); return { totalCards: d.cards.length, masteredCards: Math.floor(d.cards.length / 2), learningCards: 2, newCards: d.cards.length - Math.floor(d.cards.length / 2) - 2, accuracy: 78, studySessions: 9, learnerCount: d.learnerCount }; });
on('GET', '/flashcards/decks/:id/favorite', () => ({ favorited: false }));
on('POST', '/flashcards/decks/:id/favorite', () => ({ favorited: true }));
on('POST', '/flashcards/decks', (_, { me, body }) => { const d = { id: uid('d'), title: body.title, description: body.description || '', visibility: body.visibility || 'PUBLIC', deckType: body.deckType || 'FLASHCARD', subject: body.subject || '', tags: (body.tags || []).join(','), ownerId: me!.id, createdAt: new Date().toISOString(), viewsCount: 0, savesCount: 0, learnerCount: 0, averageRating: 0, ratingCount: 0, cards: (body.cards || []).map((c: any) => [c.frontContent, c.backContent, c.phonetic, c.wordType, c.example]) }; decks.unshift(d as any); return deckDto(d as any); });
on('PUT', '/flashcards/decks/:id', ({ id }, { body }) => { const d = need(decks.find((x) => x.id === id)); Object.assign(d, { title: body.title, description: body.description, cards: (body.cards || []).map((c: any) => [c.frontContent, c.backContent, c.phonetic, c.wordType, c.example]) }); return deckDto(d); });

on('GET', '/resources', (_, { q }) => { const qs = norm(q.get('search') || q.get('keyword') || ''); const t = q.get('resourceType') || q.get('type'); const sub = q.get('subject'); return page(resources.filter((r) => (!qs || norm(r.title).includes(qs)) && (!t || r.resourceType === t) && (!sub || r.subject === sub)).map(resDto), q, 12); });
on('GET', '/resources/my-bookmarks', (_, { q }) => page(resources.slice(0, 2).map(resDto), q));
on('GET', '/resources/my-uploads', (_, { me, q }) => page(resources.filter((r) => r.uploaderId === me!.id).map(resDto), q));
on('GET', '/resources/:id', ({ id }) => resDto(need(resources.find((r) => r.id === id), 'học liệu')));
on('POST', '/resources', (_, { me, body }) => { const r = { ...body, id: uid('r'), uploaderId: me!.id, viewCount: 0, likeCount: 0, bookmarkCount: 0, isPublic: body.isPublic ?? true, createdAt: new Date().toISOString() }; resources.unshift(r); return resDto(r); });
on('POST', '/resources/:id/like', () => ({ liked: true }));
on('POST', '/resources/:id/bookmark', () => ({ bookmarked: true }));
on('POST', '/v1/files/upload', (_, { body }) => ({ url: 'https://example.com/demo-upload', fileUrl: 'https://example.com/demo-upload', fileName: body?.get?.('file')?.name || 'tep-demo.pdf' }));
on('POST', '/media/upload', () => ({ url: 'https://example.com/demo-upload' }));

on('GET', '/folders', (_, { q }) => page([{ id: 'fd1', name: 'Đề kiểm tra Học kì I', itemCount: 4, createdAt: day(-20) }, { id: 'fd2', name: 'Ôn thi tốt nghiệp', itemCount: 7, createdAt: day(-12) }], q));
on('GET', '/calendar', () => events);
on('GET', '/calendar/events', () => events);
on('POST', '/calendar', (_, { body }) => { const ev = { ...body, id: uid('ev'), courseName: null }; events.push(ev); return ev; });
on('GET', '/notifications', (_, { q }) => page(notifications, q, 10));
on('GET', '/notifications/unread-count', () => raw(notifications.filter((n) => !n.isRead).length));
on('PUT', '/notifications/:id/read', ({ id }) => { const n = notifications.find((x) => x.id === id); if (n) { n.isRead = n.read = true; } return {}; });
on('PUT', '/notifications/read-all', () => { notifications.forEach((n) => { n.isRead = n.read = true; }); return {}; });
on('GET', '/mistake-vault', () => ({ totalItems: vault.length, dueToday: vault.filter((v) => new Date(v.nextReviewDate) <= new Date()).length, dueItems: vault }));
on('POST', '/mistake-vault/:id/review', ({ id }, { body }) => { const v = need(vault.find((x) => x.id === id)); if (body.correct ?? body.isCorrect) { v.repetitions++; v.intervalDays *= 2; } return v; });
on('GET', '/search', (_, { q }) => { const s = norm(q.get('q') || ''); return { exams: exams.filter((e) => norm(e.title).includes(s)).map((e) => examCard(e)), classes: classes.filter((c) => norm(c.name).includes(s)).map((c) => classDto(c)), decks: decks.filter((d) => norm(d.title).includes(s)).map((d) => deckDto(d, false)), resources: resources.filter((r) => norm(r.title).includes(s)).map(resDto) }; });
on('GET', '/support/inbox/unread-count', () => raw(2));

on('GET', '/admin/users', (_, { q }) => { const s = norm(q.get('search') || ''), role = q.get('role'), st = q.get('status'); return page(users.filter((u) => (!s || norm(u.fullName + u.email + (u.studentCode || '')).includes(s)) && (!role || u.role === role) && (!st || u.status === st)).map(publicUser), q, 10); });
on('GET', '/admin/users/:id', ({ id }) => publicUser(need(userById(id), 'người dùng')));
on('PUT', '/admin/users/:id', ({ id }, { body }) => { const u = need(userById(id)); Object.assign(u, { fullName: body.fullName ?? u.fullName, role: body.role ?? u.role, status: body.status ?? u.status }); return publicUser(u); });
on('PATCH', '/admin/users/:id/status', ({ id }, { body }) => { const u = need(userById(id)); u.status = body.status; return publicUser(u); });
on('GET', '/admin/users/:id/classrooms', ({ id }) => classes.filter((c) => c.memberIds.includes(id) || c.teacherId === id).map((c) => c.id));
on('GET', '/v1/students', (_, { q }) => page(users.filter((u) => u.role === 'STUDENT').map((u) => ({ id: u.id, userId: u.id, fullName: u.fullName, studentCode: u.studentCode, email: u.email, status: u.status, classroomNames: classes.filter((c) => c.memberIds.includes(u.id)).map((c) => c.name) })), q, 20));
on('GET', '/v1/students/by-classroom/:id', ({ id }) => (classes.find((c) => c.id === id)?.memberIds || []).map((sid) => { const u = userById(sid)!; return { id: sid, fullName: u.fullName, studentCode: u.studentCode, email: u.email }; }));
on('GET', '/audit-logs', (_, { q }) => page(['Đăng nhập', 'Tạo đề thi', 'Khóa tài khoản', 'Nhập 32 học sinh từ Excel', 'Cập nhật sổ điểm'].map((action, i) => ({ id: `al${i}`, action, actorName: i % 2 ? 'Quản trị trường' : 'Cô Lê Hạnh', entityType: 'SYSTEM', details: action, ipAddress: '10.0.0.' + (i + 2), createdAt: day(-i, 10 + i) })), q));
on('GET', '/admin/audit-logs', (_, c) => routes.find((x) => x.re.test('/audit-logs'))!.h({}, c));

/* ======================= Gắn vào axios + fetch ======================= */
function handle(method: string, url: string, body: any, auth?: string | null) {
  const [path, qs = ''] = url.replace(/^.*?\/api(?=\/)/, '').split('?');
  const me = users.find((u) => auth === `Bearer demo-${u.id}`);
  const q = new URLSearchParams(qs);
  const route = routes.find((r) => r.method === method && r.re.test(path));
  const isPublic = path.startsWith('/auth/');
  if (!isPublic && !me) return { status: 401, body: { status: 401, message: 'Phiên đăng nhập đã hết hạn' } };
  try {
    if (!route) {
      // Endpoint chưa giả lập: GET trả danh sách rỗng (vừa là mảng vừa có .content), ghi trả object rỗng
      if (method === 'GET') return { status: 200, body: { status: 200, message: 'OK', data: Object.assign([], { content: [], totalElements: 0, totalPages: 0 }) } };
      return { status: 200, body: { status: 200, message: 'OK (demo)', data: {} } };
    }
    const m = path.match(route.re)!;
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const out = route.h(params, { q, body, me }) as any;
    if (out && typeof out === 'object' && RAW in out) return { status: 200, body: out[RAW] };
    return { status: 200, body: { status: 200, message: 'OK', data: out } };
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: { status: e.status, errorCode: e.errorCode, message: e.message } };
    console.error('[demo api]', method, path, e);
    return { status: 500, body: { status: 500, errorCode: 'DEMO_BUG', message: 'Lỗi bản demo' } };
  }
}

const parseBody = (d: unknown) => { if (typeof d !== 'string') return d ?? {}; try { return JSON.parse(d); } catch { return d; } };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function installDemoApi(api: AxiosInstance) {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    await wait(120 + Math.random() * 180);
    const params = new URLSearchParams();
    Object.entries(config.params || {}).forEach(([k, v]) => v != null && v !== '' && params.append(k, String(v)));
    const url = (config.url || '') + (params.toString() ? ((config.url || '').includes('?') ? '&' : '?') + params : '');
    const auth = (config.headers as any)?.Authorization ?? (config.headers as any)?.get?.('Authorization');
    const res = handle((config.method || 'get').toUpperCase(), '/api' + url, parseBody(config.data), auth);
    const response = { data: res.body, status: res.status, statusText: String(res.status), headers: {}, config, request: {} };
    if (res.status >= 400) throw new AxiosError(res.body.message, res.status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, {}, response as any);
    return response as any;
  };
  // Vài màn dùng fetch('/api/...') trực tiếp
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!/^(\/|https?:\/\/[^/]+\/)api\//.test(url) || url.includes('dictionaryapi')) return realFetch(input, init);
    await wait(100);
    const headers = new Headers(init?.headers);
    const res = handle((init?.method || 'GET').toUpperCase(), url, parseBody(init?.body as any), headers.get('Authorization'));
    return new Response(JSON.stringify(res.body), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  };
}

export const DEMO_ACCOUNTS = users.slice(0, 3).map((u) => ({ email: u.email, password: u.password, role: u.role, fullName: u.fullName }));
