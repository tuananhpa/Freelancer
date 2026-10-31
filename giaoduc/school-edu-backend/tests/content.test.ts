import { describe, it, expect, beforeAll } from 'vitest';
import { api, login, makeUser } from './helpers';

let admin = '';
let teacher: Awaited<ReturnType<typeof makeUser>>;
let student: Awaited<ReturnType<typeof makeUser>>;
let outsider: Awaited<ReturnType<typeof makeUser>>;
let classId = '';
let deckId = '';

beforeAll(async () => {
  admin = await login('Admin', 'admin123@');
  teacher = await makeUser(admin, 'TEACHER');
  student = await makeUser(admin, 'STUDENT');
  outsider = await makeUser(admin, 'STUDENT');
  const cls = await api('POST', '/classes', { name: 'CLB Anh', teacherId: teacher.id }, admin);
  classId = cls.data.id;
  await api('POST', '/classes/join', { inviteCode: cls.data.inviteCode }, student.token);
});

describe('Thẻ ghi nhớ', () => {
  it('bộ thẻ CLASSROOM: thành viên lớp học được, người ngoài bị khóa, không sao chép được', async () => {
    const r = await api('POST', '/flashcards/decks', { title: 'Unit 3', visibility: 'CLASSROOM', deckType: 'VOCAB', assignedClassIds: [classId], cards: [{ frontContent: 'composer', backContent: 'nhà soạn nhạc' }, { frontContent: 'audience', backContent: 'khán giả' }] }, teacher.token);
    expect(r.status).toBe(200);
    deckId = r.data.id;
    expect((await api('GET', `/flashcards/decks/${deckId}`, undefined, student.token)).data.cards).toHaveLength(2);
    expect((await api('GET', `/flashcards/decks/${deckId}`, undefined, outsider.token)).status).toBe(403);
    expect((await api('POST', `/share/clone/deck/${deckId}`, undefined, outsider.token)).status).toBe(403);
    expect((await api('POST', '/flashcards/decks', { title: 'x' }, student.token)).status).toBe(403);
  });
  it('ôn tập Leitner: đúng lên hộp, thẻ đã ôn không còn đến hạn hôm nay', async () => {
    const due = await api('GET', `/flashcards/decks/${deckId}/due`, undefined, student.token);
    expect(due.data).toHaveLength(2);
    const p = await api('PUT', `/flashcards/progress/${due.data[0].id}`, { isCorrect: true }, student.token);
    expect(p.data.boxLevel).toBe(1);
    expect((await api('GET', `/flashcards/decks/${deckId}/due`, undefined, student.token)).data).toHaveLength(1);
    const st = await api('GET', `/flashcards/decks/${deckId}/statistics`, undefined, student.token);
    expect(st.data).toMatchObject({ totalCards: 2, learningCards: 1, newCards: 1 });
  });
  it('yêu thích, đánh giá, sửa bộ thẻ', async () => {
    expect((await api('POST', `/flashcards/decks/${deckId}/favorite`, undefined, student.token)).data.favorited).toBe(true);
    expect((await api('PUT', `/flashcards/decks/${deckId}/rating`, { rating: 6 }, student.token)).status).toBe(400);
    await api('PUT', `/flashcards/decks/${deckId}/rating`, { rating: 4 }, student.token);
    const d = await api('GET', `/flashcards/decks/${deckId}`, undefined, student.token);
    expect(d.data).toMatchObject({ averageRating: 4, ratingCount: 1, myRating: 4, savesCount: 1, learnerCount: 1 });
    expect((await api('GET', '/flashcards/favorites', undefined, student.token)).data.totalElements).toBe(1);
    const u = await api('PUT', `/flashcards/decks/${deckId}`, { title: 'Unit 3 (sửa)', visibility: 'CLASSROOM', cards: [{ frontContent: 'talent', backContent: 'tài năng' }] }, teacher.token);
    expect(u.data.cards).toHaveLength(1);
  });
});

describe('Thông báo, dashboard, lịch, thư mục, tìm kiếm, nhật ký', () => {
  it('thông báo: đếm chưa đọc, đọc hết', async () => {
    const n = await api('GET', '/notifications/unread-count', undefined, teacher.token);
    expect(n.data).toBeGreaterThanOrEqual(1); // học sinh vào lớp
    await api('PUT', '/notifications/read-all', undefined, teacher.token);
    expect((await api('GET', '/notifications/unread-count', undefined, teacher.token)).data).toBe(0);
    const list = await api('GET', '/notifications?page=0&size=5', undefined, teacher.token);
    expect(list.data.content[0].isRead).toBe(true);
  });
  it('dashboard giáo viên đếm học sinh lớp; admin đủ số liệu', async () => {
    const t = await api('GET', '/analytics/teacher', undefined, teacher.token);
    expect(t.data.totalStudents).toBe(1);
    expect(t.data.totalDecks).toBe(1);
    const a = await api('GET', '/analytics/admin', undefined, admin);
    expect(a.data.totalUsers).toBeGreaterThan(3);
    expect((await api('GET', '/analytics/admin', undefined, student.token)).status).toBe(403);
    const s = await api('GET', '/analytics/student', undefined, student.token);
    expect(s.data.radarSkills).toHaveLength(5);
  });
  it('lịch có hạn bài tập của lớp', async () => {
    await api('POST', '/v1/assignments', { title: 'Hạn nộp lịch', classroomId: classId, maxScore: 10, dueDate: '2099-03-10T08:00' }, teacher.token);
    const ev = await api('GET', '/calendar/events?from=2099-03-01&to=2099-03-31', undefined, student.token);
    expect(ev.data.map((e: any) => e.title)).toContain('Hạn nộp lịch');
  });
  it('thư mục: tạo, xóa không xóa nội dung; tìm kiếm; nhật ký admin', async () => {
    const f = await api('POST', '/folders', { name: 'HK1' }, teacher.token);
    expect(f.data.examCount).toBe(0);
    expect((await api('DELETE', `/folders/${f.data.id}`, undefined, student.token)).status).toBe(400);
    expect((await api('DELETE', `/folders/${f.data.id}`, undefined, teacher.token)).status).toBe(204);
    const s = await api('GET', '/search?q=CLB', undefined, student.token);
    expect(s.data.some((x: any) => x.type === 'CLASS')).toBe(true);
    const logs = await api('GET', '/audit-logs', undefined, admin);
    expect(logs.data.content.some((l: any) => l.entityName === 'User' && l.action === 'CREATE')).toBe(true);
    expect(JSON.stringify(logs.data)).not.toContain('pbkdf2'); // không lưu hash mật khẩu
  });
});
