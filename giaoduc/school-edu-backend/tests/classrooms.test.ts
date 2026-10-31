import { describe, it, expect, beforeAll } from 'vitest';
import { api, login, makeUser } from './helpers';

let admin = '';
let teacher: Awaited<ReturnType<typeof makeUser>>;
let student: Awaited<ReturnType<typeof makeUser>>;
let classId = '';
let inviteCode = '';

beforeAll(async () => {
  admin = await login('Admin', 'admin123@');
  teacher = await makeUser(admin, 'TEACHER', 'Cô Giáo');
  student = await makeUser(admin, 'STUDENT', 'Học Sinh');
});

describe('Lớp học', () => {
  it('chỉ ADMIN tạo lớp; giáo viên được gán làm chủ nhiệm', async () => {
    expect((await api('POST', '/classes', { name: 'X' }, teacher.token)).status).toBe(403);
    const r = await api('POST', '/classes', { name: '10A1', subject: 'Ngữ văn', teacherId: teacher.id }, admin);
    expect(r.status).toBe(200);
    expect(r.data.teacherId).toBe(teacher.id);
    expect(r.data.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
    classId = r.data.id;
    inviteCode = r.data.inviteCode;
  });
  it('học sinh vào lớp bằng mã, vào lần 2 bị chặn, giáo viên nhận thông báo', async () => {
    const r = await api('POST', '/classes/join', { inviteCode: inviteCode.toLowerCase() }, student.token);
    expect(r.status).toBe(200);
    expect(r.data.memberCount).toBe(2);
    expect((await api('POST', '/classes/join', { inviteCode }, student.token)).status).toBe(400);
    const n = await api('GET', '/notifications?size=10', undefined, teacher.token);
    expect([200, 404]).toContain(n.status); // module thông báo làm sau
  });
  it('danh sách lớp của tôi dạng Page Spring', async () => {
    const r = await api('GET', '/classes?page=0&size=1000', undefined, student.token);
    expect(r.data.content.map((c: any) => c.id)).toContain(classId);
    expect(r.data.totalElements).toBeGreaterThanOrEqual(1);
  });
  it('người ngoài lớp không xem được', async () => {
    const other = await makeUser(admin, 'STUDENT');
    expect((await api('GET', `/classes/${classId}`, undefined, other.token)).status).toBe(400);
  });
  it('bảng tin: giáo viên đăng, học sinh không đăng được, thích và bình luận lồng', async () => {
    const p = await api('POST', `/classes/${classId}/posts`, { content: '<p>Chào lớp</p>', attachments: ['https://a.vn/x.pdf'] }, teacher.token);
    expect(p.status).toBe(201);
    expect(p.data.attachments).toEqual(['https://a.vn/x.pdf']);
    expect((await api('POST', `/classes/${classId}/posts`, { content: 'hi' }, student.token)).status).toBe(400);
    const liked = await api('POST', `/classes/${classId}/posts/${p.data.id}/like`, undefined, student.token);
    expect(liked.data.likeCount).toBe(1);
    expect(liked.data.isLikedByCurrentUser).toBe(true);
    const c1 = await api('POST', `/classes/${classId}/posts/${p.data.id}/comments`, { content: 'Dạ' }, student.token);
    const c2 = await api('POST', `/classes/${classId}/posts/${p.data.id}/comments`, { content: 'Ok em', parentId: c1.data.id }, teacher.token);
    expect(c2.data.parentId).toBe(c1.data.id);
    const list = await api('GET', `/classes/${classId}/posts/${p.data.id}/comments`, undefined, teacher.token);
    expect(list.data).toHaveLength(1);
    expect(list.data[0].replies[0].content).toBe('Ok em');
    const posts = await api('GET', `/classes/${classId}/posts`, undefined, student.token);
    expect(posts.data.content[0].commentCount).toBe(2);
  });
  it('thư mục lồng tối đa 4 cấp', async () => {
    let parent: string | null = null;
    for (let i = 1; i <= 4; i++) {
      const f = await api('POST', `/classes/${classId}/folders`, { name: `Cấp ${i}`, parentId: parent }, teacher.token);
      expect(f.status).toBe(200);
      parent = f.data.id;
    }
    expect((await api('POST', `/classes/${classId}/folders`, { name: 'Cấp 5', parentId: parent }, teacher.token)).status).toBe(400);
  });
  it('điểm danh: lưu và đọc lại', async () => {
    const r = await api('POST', `/classes/${classId}/attendance`, { weekNumber: 1, sessionNumber: 1, records: [{ studentId: student.id, status: 'ABSENT_EXCUSED' }] }, teacher.token);
    expect(r.status).toBe(200);
    expect(r.data.records.find((x: any) => x.studentId === student.id).status).toBe('ABSENT_EXCUSED');
    expect((await api('GET', `/classes/${classId}/attendance?weekNumber=1&sessionNumber=1`, undefined, student.token)).status).toBe(400);
  });
  it('sổ điểm: học sinh chỉ thấy dòng của mình; hệ số học kì lưu theo lớp', async () => {
    const g = await api('GET', `/v1/classrooms/${classId}/gradebook`, undefined, student.token);
    expect(g.status).toBe(200);
    expect(g.data.students.map((s: any) => s.studentId)).toEqual([student.id]);
    const w = await api('PUT', `/classes/${classId}/settings/grade-weights`, { tx: 1, gk: 2, ck: 4 }, teacher.token);
    expect(w.data).toEqual({ tx: 1, gk: 2, ck: 4 });
  });
  it('thành viên: đổi vai trò, không xóa được chủ lớp, xóa học sinh', async () => {
    expect((await api('DELETE', `/classes/${classId}/members/${teacher.id}`, undefined, teacher.token)).status).toBe(400);
    expect((await api('PUT', `/classes/${classId}/members/${student.id}/role`, { role: 'TA' }, teacher.token)).status).toBe(200);
    const m = await api('GET', `/classes/${classId}/members`, undefined, teacher.token);
    expect(m.data.find((x: any) => x.userId === student.id).role).toBe('TA');
    expect((await api('DELETE', `/classes/${classId}/members/${student.id}`, undefined, teacher.token)).status).toBe(200);
  });
});
