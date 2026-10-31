import { describe, it, expect, beforeAll } from 'vitest';
import { api, login, makeUser } from './helpers';

let admin = '';
let teacher: Awaited<ReturnType<typeof makeUser>>;
let student: Awaited<ReturnType<typeof makeUser>>;
let classId = '';
let assignmentId = '';
let submissionId = '';

beforeAll(async () => {
  admin = await login('Admin', 'admin123@');
  teacher = await makeUser(admin, 'TEACHER');
  student = await makeUser(admin, 'STUDENT');
  const cls = await api('POST', '/classes', { name: '11B1', teacherId: teacher.id }, admin);
  classId = cls.data.id;
  await api('POST', '/classes/join', { inviteCode: cls.data.inviteCode }, student.token);
});

describe('Bài tập', () => {
  it('giáo viên tạo bài tập cho lớp; học sinh không tạo được', async () => {
    expect((await api('POST', '/v1/assignments', { title: 'X', classroomId: classId }, student.token)).status).toBe(400);
    const r = await api('POST', '/v1/assignments', { title: 'Bài viết số 1', classroomId: classId, maxScore: 10, dueDate: '2099-01-01T07:00', minWordCount: 50, expectedAnswer: 'biết ơn' }, teacher.token);
    expect(r.status).toBe(200);
    expect(r.data.dueDate).toBe('2099-01-01T07:00:00.000');
    assignmentId = r.data.id;
    const list = await api('GET', `/v1/assignments/classroom/${classId}`, undefined, student.token);
    expect(list.data.content[0].id).toBe(assignmentId);
  });
  it('học sinh nộp, nộp lại cập nhật cùng bài; giáo viên thấy danh sách', async () => {
    const s1 = await api('POST', `/v1/assignments/${assignmentId}/submit`, { content: '<p>Lần 1</p>' }, student.token);
    const s2 = await api('POST', `/v1/assignments/${assignmentId}/submit`, { content: '<p>Lòng biết ơn rất quan trọng</p>' }, student.token);
    expect(s2.data.id).toBe(s1.data.id);
    submissionId = s2.data.id;
    const list = await api('GET', `/v1/assignments/${assignmentId}/submissions`, undefined, teacher.token);
    expect(list.data.totalElements).toBe(1);
    expect((await api('GET', `/v1/assignments/${assignmentId}/submissions`, undefined, student.token)).status).toBe(400);
  });
  it('chấm tay: không vượt điểm tối đa; sổ điểm hiện điểm', async () => {
    expect((await api('POST', `/v1/assignments/submissions/${submissionId}/grade`, { score: 11 }, teacher.token)).status).toBe(400);
    const g = await api('POST', `/v1/assignments/submissions/${submissionId}/grade`, { score: 8.5, feedback: 'Tốt' }, teacher.token);
    expect(g.data.status).toBe('GRADED');
    const gb = await api('GET', `/v1/classrooms/${classId}/gradebook`, undefined, teacher.token);
    expect(gb.data.students[0].grades[assignmentId]).toEqual({ score: 8.5, status: 'GRADED' });
  });
  it('AI chấm khi chưa có khóa: báo lỗi rõ, trạng thái FAILED', async () => {
    const r = await api('POST', `/v1/assignments/submissions/${submissionId}/ai-grade`, undefined, teacher.token);
    expect(r.status).toBe(400);
    const st = await api('GET', `/v1/assignments/submissions/${submissionId}/ai-grading`, undefined, teacher.token);
    expect(st.data.status).toBe('FAILED');
  });
});

describe('Cài đặt AI dùng chung & thương hiệu', () => {
  it('giáo viên xem, không sửa được; admin lưu khóa, không bao giờ trả khóa', async () => {
    expect((await api('GET', '/users/me/ai-settings', undefined, teacher.token)).data.editable).toBe(false);
    expect((await api('PUT', '/users/me/ai-settings', { provider: 'GEMINI', apiKey: 'AIzaTestKey1234567890' }, teacher.token)).status).toBe(403);
    const put = await api('PUT', '/users/me/ai-settings', { provider: 'GEMINI', model: 'gemini-2.5-flash', apiKey: 'AIzaTestKey1234567890', strictness: 'STRICT' }, admin);
    expect(put.data.hasKey).toBe(true);
    expect(put.data.keyLast4).toBe('7890');
    expect(put.raw).not.toContain('AIzaTestKey');
    expect((await api('GET', '/users/me/ai-settings', undefined, teacher.token)).data.strictness).toBe('STRICT');
  });
  it('kiểm tra khóa giả -> 400 INVALID_KEY (gọi thật Gemini)', async () => {
    const t = await api('POST', '/users/me/ai-settings/test', {}, admin);
    expect(t.status).toBe(400);
    expect(t.json.errorCode).toBe('INVALID_KEY');
  });
  it('thương hiệu: công khai đọc, chỉ admin sửa', async () => {
    expect((await api('PUT', '/admin/settings/branding', { brandName: 'X' }, teacher.token)).status).toBe(403);
    const r = await api('PUT', '/admin/settings/branding', { brandName: 'Trường THPT Demo', contactPhone: '0900 000 000' }, admin);
    expect(r.data.brandName).toBe('Trường THPT Demo');
    expect((await api('GET', '/public/settings')).data.contactPhone).toBe('0900 000 000');
    await api('PUT', '/admin/settings/branding', { brandName: 'Điểm Sáng' }, admin);
  });
});
