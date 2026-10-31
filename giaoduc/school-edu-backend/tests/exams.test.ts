import { describe, it, expect, beforeAll } from 'vitest';
import * as XLSX from 'xlsx';
import { api, BASE, login, makeUser } from './helpers';

let admin = '';
let teacher: Awaited<ReturnType<typeof makeUser>>;
let student: Awaited<ReturnType<typeof makeUser>>;
let classId = '';
let examId = '';
let resultId = '';
let exam: any;

beforeAll(async () => {
  admin = await login('Admin', 'admin123@');
  teacher = await makeUser(admin, 'TEACHER');
  student = await makeUser(admin, 'STUDENT');
  const cls = await api('POST', '/classes', { name: '10A2', teacherId: teacher.id }, admin);
  classId = cls.data.id;
  await api('POST', '/classes/join', { inviteCode: cls.data.inviteCode }, student.token);
});

const examBody = {
  title: 'Kiểm tra 15 phút', durationMinutes: 15, subject: 'Ngữ văn', grade: '10', visibility: 'CLASSROOM', isPublished: true, passingScore: 50, maxAttempts: 2, assessmentType: 'TX',
  questions: [
    { content: 'Ẩn dụ là gì?', questionType: 'MULTIPLE_CHOICE', points: 1, options: [{ content: 'A', isCorrect: false }, { content: 'B', isCorrect: true }] },
    { content: 'Đúng/sai', questionType: 'TRUE_FALSE', points: 2, options: [{ content: 'a', isCorrect: true }, { content: 'b', isCorrect: false }, { content: 'c', isCorrect: true }, { content: 'd', isCorrect: false }] },
    { content: 'Từ Hán Việt của biết ơn', questionType: 'SHORT_ANSWER', points: 1, options: [{ content: 'Tri ân', isCorrect: true }] },
    { content: 'Viết đoạn văn', questionType: 'ESSAY', points: 6, explanation: 'biết ơn, trân trọng', options: [] },
  ],
};

describe('Đề thi', () => {
  it('học sinh không tạo được đề; giáo viên tạo đề TX có mã 6 ký tự', async () => {
    expect((await api('POST', '/exams', examBody, student.token)).status).toBe(403);
    const r = await api('POST', '/exams', examBody, teacher.token);
    expect(r.status).toBe(200);
    expect(r.data.examCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(r.data.assessmentType).toBe('TX');
    expect(r.data.questions).toHaveLength(4);
    expect(r.data.questions[0].options[1].isCorrect).toBe(true);
    examId = r.data.id;
    exam = r.data;
  });
  it('đề CLASSROOM bị khóa với học sinh chưa được giao; giao cho lớp thì mở', async () => {
    const before = await api('GET', `/exams/${examId}`, undefined, student.token);
    expect(before.data.locked).toBe(true);
    expect(before.data.questions).toEqual([]);
    const ce = await api('POST', `/v1/class-exams/classroom/${classId}`, { examId, closeTime: '2099-12-31T23:00' }, teacher.token);
    expect(ce.status).toBe(200);
    const after = await api('GET', `/exams/${examId}`, undefined, student.token);
    expect(after.data.locked).toBe(false);
    expect(after.data.questions[0].options[1].isCorrect).toBeNull(); // không lộ đáp án
  });
  it('bắt đầu, lưu nháp, bắt đầu lại giữ bài đang làm', async () => {
    const s = await api('POST', `/exams/${examId}/start`, undefined, student.token);
    expect(s.status).toBe(200);
    expect(s.data.examSnapshot.questions[0].options[0].isCorrect).toBeNull();
    const q = s.data.examSnapshot.questions;
    await api('POST', `/exams/${examId}/draft`, { answers: { [q[0].questionId]: q[0].options[1].optionId } }, student.token);
    const again = await api('POST', `/exams/${examId}/start`, undefined, student.token);
    expect(again.data.resultId).toBe(s.data.resultId);
    expect(again.data.answers[q[0].questionId]).toBe(q[0].options[1].optionId);
  });
  it('nộp bài: trắc nghiệm đúng 1đ, đúng/sai sai 1 ý = 50% của 2đ, trả lời ngắn chuẩn hóa đúng', async () => {
    const s = await api('POST', `/exams/${examId}/start`, undefined, student.token);
    const q = s.data.examSnapshot.questions;
    const tf = Object.fromEntries(q[1].options.map((o: any, i: number) => [o.optionId, i === 3 ? true : i % 2 === 0]));
    const r = await api('POST', `/exams/${examId}/submit`, { answers: { [q[0].questionId]: q[0].options[1].optionId, [q[1].questionId]: JSON.stringify(tf), [q[2].questionId]: '  tri ÂN. ', [q[3].questionId]: 'Em biết ơn thầy cô.' } }, student.token);
    expect(r.status).toBe(200);
    resultId = r.data;
    const d = await api('GET', `/exams/results/${resultId}`, undefined, student.token);
    expect(d.data.pendingTeacherReview).toBe(true); // còn câu tự luận chưa duyệt
    const byQ = Object.fromEntries(d.data.questions.map((x: any) => [x.questionContent, x]));
    expect(byQ['Ẩn dụ là gì?'].pointsEarned).toBe(1);
    expect(byQ['Đúng/sai'].pointsEarned).toBe(1);
    expect(byQ['Từ Hán Việt của biết ơn'].isCorrect).toBe(true);
    expect(byQ['Viết đoạn văn'].pointsEarned).toBeNull(); // ẩn điểm tự luận khi chờ duyệt
  });
  it('sổ điểm lớp có điểm hệ 10 ở cột TX', async () => {
    const g = await api('GET', `/v1/classrooms/${classId}/gradebook`, undefined, teacher.token);
    const col = g.data.classworks.find((x: any) => x.id === examId);
    expect(col.assessmentType).toBe('TX');
    const cell = g.data.students.find((s: any) => s.studentId === student.id).grades[examId];
    expect(cell.status).toBe('GRADED');
    expect(cell.score).toBe(3); // 3/10 điểm -> hệ 10 = 3.0 (tự luận chưa có khóa AI = 0)
  });
  it('giáo viên duyệt tự luận 5/6 -> tổng 8/10, học sinh thấy điểm', async () => {
    const pending = await api('GET', `/exams/${examId}/pending-essay-reviews`, undefined, teacher.token);
    expect(pending.data).toHaveLength(1);
    expect((await api('PATCH', `/exams/answers/${pending.data[0].answerId}/review`, { score: 5 }, student.token)).status).toBe(403);
    expect((await api('PATCH', `/exams/answers/${pending.data[0].answerId}/review`, { score: 9 }, teacher.token)).status).toBe(200);
    const d = await api('GET', `/exams/results/${resultId}`, undefined, student.token);
    expect(d.data.totalScore).toBe(9); // kẹp về tối đa 6 -> 3 + 6
    expect(d.data.pendingTeacherReview).toBe(false);
  });
  it('thống kê, xuất Excel, lịch sử, sổ lỗi sai', async () => {
    const a = await api('GET', `/exams/${examId}/analytics`, undefined, teacher.token);
    expect(a.data.totalSubmissions).toBe(1);
    expect(a.data.scoreDistribution).toHaveLength(10);
    const x = await fetch(`${BASE}/api/exams/${examId}/export-excel`, { headers: { Authorization: `Bearer ${teacher.token}` } });
    expect(x.headers.get('content-type')).toContain('spreadsheetml');
    const wb = XLSX.read(new Uint8Array(await x.arrayBuffer()));
    const rows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['Bảng điểm'], { header: 1 });
    expect(String(rows[4][1]).toLowerCase()).toContain(student.username.slice(0, 7));
    const h = await api('GET', '/exams/history?page=0&size=10', undefined, student.token);
    expect(h.data.content[0].resultId).toBe(resultId);
    const mv = await api('GET', '/mistake-vault', undefined, student.token);
    expect(mv.data.totalItems).toBe(1); // câu đúng/sai sai 1 ý
  });
  it('sửa đề (đổi đáp án đúng) tự chấm lại bài đã nộp; hết lượt làm', async () => {
    const full = await api('GET', `/exams/${examId}`, undefined, teacher.token);
    const qs = full.data.questions.map((q: any, i: number) => ({ ...q, options: q.options.map((o: any, j: number) => ({ ...o, isCorrect: i === 0 ? j === 0 : o.isCorrect })) }));
    expect((await api('PUT', `/exams/${examId}`, { ...examBody, questions: qs }, teacher.token)).status).toBe(200);
    const d = await api('GET', `/exams/results/${resultId}`, undefined, teacher.token);
    expect(d.data.totalScore).toBe(8); // câu 1 giờ sai
    await api('POST', `/exams/${examId}/start`, undefined, student.token);
    await api('POST', `/exams/${examId}/submit`, { answers: {} }, student.token);
    expect((await api('POST', `/exams/${examId}/start`, undefined, student.token)).json.errorCode).toBe('OUT_OF_ATTEMPTS');
  });
});
