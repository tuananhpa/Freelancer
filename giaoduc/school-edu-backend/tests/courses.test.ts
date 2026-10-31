import { describe, it, expect, beforeAll } from 'vitest';
import { api, login, makeUser } from './helpers';

let admin = '';
let teacher: Awaited<ReturnType<typeof makeUser>>;
let student: Awaited<ReturnType<typeof makeUser>>;
let courseId = '';
const lessons: string[] = [];

beforeAll(async () => {
  admin = await login('Admin', 'admin123@');
  teacher = await makeUser(admin, 'TEACHER');
  student = await makeUser(admin, 'STUDENT');
});

describe('Khóa học', () => {
  it('giáo viên dựng khóa học: chương, bài học; người khác không sửa được; nháp thì học sinh không thấy', async () => {
    const c = await api('POST', '/courses', { title: 'IELTS nền tảng' }, teacher.token);
    courseId = c.data.id;
    expect(c.data).toMatchObject({ status: 'DRAFT', sections: [] });
    expect((await api('POST', '/courses', { title: 'x' }, student.token)).status).toBe(403);
    const s = await api('POST', `/courses/${courseId}/sections`, { title: 'Chương 1' }, teacher.token);
    for (const t of ['Bài 1', 'Bài 2']) lessons.push((await api('POST', `/courses/sections/${s.data.id}/lessons`, { title: t, contentType: 'VIDEO', resourceUrl: 'https://youtu.be/x' }, teacher.token)).data.id);
    expect((await api('PUT', `/courses/${courseId}`, { title: 'hack' }, (await makeUser(admin, 'TEACHER')).token)).status).toBe(403);
    expect((await api('GET', `/courses/${courseId}`, undefined, student.token)).status).toBe(404);
    const pub = await api('PUT', `/courses/${courseId}`, { status: 'PUBLISHED' }, teacher.token);
    expect(pub.data.sections[0].lessons.map((l: any) => [l.title, l.orderIndex])).toEqual([['Bài 1', 0], ['Bài 2', 1]]);
  });
  it('học sinh đăng ký, học hết bài thì nhận chứng chỉ, tra mã công khai', async () => {
    expect((await api('POST', `/courses/${courseId}/enroll`, undefined, student.token)).status).toBe(200);
    expect((await api('POST', `/courses/${courseId}/enroll`, undefined, student.token)).status).toBe(400);
    expect((await api('GET', '/courses/my-enrollments', undefined, student.token)).data.content[0].course.id).toBe(courseId);
    await api('POST', `/courses/lessons/${lessons[0]}/complete`, undefined, student.token);
    expect((await api('POST', `/v1/certificates/issue/${courseId}/${student.id}`, undefined, student.token)).status).toBe(400);
    const p = await api('POST', `/courses/lessons/${lessons[1]}/complete`, undefined, student.token);
    expect(p.data.completed).toBe(true);
    expect((await api('GET', `/courses/${courseId}/progress`, undefined, student.token)).data).toHaveLength(2);
    expect((await api('POST', `/v1/certificates/issue/${courseId}/${teacher.id}`, undefined, student.token)).status).toBe(403);
    const cert = await api('POST', `/v1/certificates/issue/${courseId}/${student.id}`, undefined, student.token);
    expect(cert.data.uniqueCode).toMatch(/^CERT-[0-9A-F]{8}-\d{4}$/);
    expect((await api('GET', `/v1/certificates/verify/${cert.data.uniqueCode}`)).data.courseName).toBe('IELTS nền tảng');
  });
  it('bình luận bài học và thảo luận có trả lời', async () => {
    const top = await api('POST', `/lessons/${lessons[0]}/comments`, { content: 'Thầy ơi cho em hỏi' }, student.token);
    await api('POST', `/lessons/${lessons[0]}/comments`, { content: 'Em hỏi đi', parentId: top.data.id }, teacher.token);
    const list = await api('GET', `/lessons/${lessons[0]}/comments`, undefined, student.token);
    expect(list.data.content[0].replies[0]).toMatchObject({ content: 'Em hỏi đi', authorRole: 'TEACHER' });
    const d = await api('POST', `/v1/discussions/course/${courseId}`, { title: 'Tài liệu thêm?', content: 'Có không ạ' }, student.token);
    await api('POST', `/v1/discussions/${d.data.id}/replies`, { content: 'Có nhé' }, teacher.token);
    const full = await api('GET', `/v1/discussions/${d.data.id}`, undefined, student.token);
    expect(full.data).toMatchObject({ replyCount: 1, isPinned: false, replies: [{ content: 'Có nhé' }] });
  });
  it('bài xếp trình độ chấm theo kỹ năng và gợi ý khóa học', async () => {
    expect((await api('GET', '/learning-path/placement-test', undefined, student.token)).data.questions).toHaveLength(15);
    const r = await api('POST', '/learning-path/placement-test/submit', { g1: 'b', g2: 'c', g3: 'c' }, student.token);
    expect(r.data).toMatchObject({ completed: true, recommendedLevel: 'BEGINNER', skillScores: { GRAMMAR: 5, VOCABULARY: 1 } });
    const rec = await api('GET', '/learning-path/recommendations', undefined, student.token);
    expect(rec.data.weakestSkill).toBe('VOCABULARY');
    expect(rec.data.items.some((i: any) => i.id === courseId)).toBe(true);
  });
  it('xóa khóa học dọn sạch dữ liệu con', async () => {
    expect((await api('DELETE', `/courses/${courseId}`, undefined, teacher.token)).status).toBe(200);
    expect((await api('GET', `/courses/${courseId}`, undefined, teacher.token)).status).toBe(404);
    expect((await api('GET', '/v1/certificates/my', undefined, student.token)).data.totalElements).toBe(0);
  });
});
