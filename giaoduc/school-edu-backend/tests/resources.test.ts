import { describe, it, expect, beforeAll } from 'vitest';
import { api, BASE, login, makeUser } from './helpers';

let admin = '';
let teacher: Awaited<ReturnType<typeof makeUser>>;
let student: Awaited<ReturnType<typeof makeUser>>;
let resId = '';

beforeAll(async () => {
  admin = await login('Admin', 'admin123@');
  teacher = await makeUser(admin, 'TEACHER');
  student = await makeUser(admin, 'STUDENT');
});

const upload = async (path: string, name: string, bytes: string | Uint8Array, token: string) => {
  const fd = new FormData();
  fd.append('file', new File([bytes], name));
  const r = await fetch(`${BASE}/api${path}`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } });
  return { status: r.status, json: await r.json() as any };
};

describe('Thư viện học liệu', () => {
  it('tải tệp lên Cloudinary, D1 lưu URL; chặn đuôi lạ', async (ctx) => {
    const up = await upload('/v1/files/upload', 'Bài đọc 1.txt', 'noi dung bai doc', teacher.token);
    if (up.json?.errorCode === 'STORAGE_NOT_CONFIGURED') return ctx.skip(); // chưa có CLOUDINARY_* trong .dev.vars
    expect(up.status).toBe(200);
    expect(up.json.data.fileName).toBe('Bài đọc 1.txt');
    expect(up.json.data.fileUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(await (await fetch(up.json.data.fileUrl)).text()).toBe('noi dung bai doc');
    expect((await upload('/v1/files/upload', 'x.exe', 'MZ', teacher.token)).status).toBe(400);
    const png1x1 = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (ch) => ch.charCodeAt(0));
    expect((await upload('/media/upload', 'a.png', png1x1, teacher.token)).json.url).toMatch(/^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\//);
  });
  it('giáo viên tạo học liệu; học sinh không tạo được; lọc và đếm lượt xem', async () => {
    const r = await api('POST', '/resources', { title: 'Viết đoạn văn về gia đình', resourceType: 'document', grade: 'grade_6', subject: 'english', writingPrompt: 'Write about your family' }, teacher.token);
    expect(r.status).toBe(200);
    resId = r.data.id;
    expect(r.data).toMatchObject({ grade: 'GRADE_6', isPublic: true, authorName: expect.stringContaining('Teacher') });
    expect((await api('POST', '/resources', { title: 'x', resourceType: 'DOCUMENT', grade: 'G', subject: 'S' }, student.token)).status).toBe(403);
    const list = await api('GET', '/resources?subject=ENGLISH&grade=ALL&search=gia đình', undefined, student.token);
    expect(list.data.content.some((x: any) => x.id === resId)).toBe(true);
    expect((await api('GET', `/resources/${resId}`, undefined, student.token)).data.viewCount).toBe(1);
  });
  it('thích / lưu bật tắt và báo cho người đăng', async () => {
    expect((await api('POST', `/resources/${resId}/like`, undefined, student.token)).data.liked).toBe(true);
    expect((await api('POST', `/resources/${resId}/bookmark`, undefined, student.token)).data.bookmarked).toBe(true);
    const d = await api('GET', `/resources/${resId}`, undefined, student.token);
    expect(d.data).toMatchObject({ likeCount: 1, bookmarkCount: 1, isLiked: true, isBookmarked: true });
    expect((await api('GET', '/resources/my-bookmarks', undefined, student.token)).data.totalElements).toBe(1);
    expect((await api('POST', `/resources/${resId}/like`, undefined, student.token)).data.liked).toBe(false);
    expect((await api('GET', '/notifications/unread-count', undefined, teacher.token)).data).toBeGreaterThanOrEqual(2);
  });
  it('nộp bài viết, giáo viên chấm, nộp lại thì xóa điểm', async () => {
    const s = await api('POST', `/resources/${resId}/submissions`, { content: 'My family has four people.' }, student.token);
    expect(s.data.status).toBe('PENDING');
    expect((await api('GET', `/resources/${resId}/submissions`, undefined, student.token)).status).toBe(400);
    const g = await api('POST', `/resources/submissions/${s.data.id}/grade`, { score: 8.5, feedback: 'Tốt' }, teacher.token);
    expect(g.data).toMatchObject({ status: 'GRADED', score: 8.5 });
    const again = await api('POST', `/resources/${resId}/submissions`, { content: 'v2' }, student.token);
    expect(again.data).toMatchObject({ id: s.data.id, status: 'PENDING', score: null });
    expect((await api('GET', `/resources/${resId}/submissions/me`, undefined, student.token)).data.content).toBe('v2');
  });
  it('người khác không xóa được; chủ xóa được', async () => {
    const other = await makeUser(admin, 'TEACHER');
    expect((await api('DELETE', `/resources/${resId}`, undefined, other.token)).status).toBe(400);
    expect((await api('DELETE', `/resources/${resId}`, undefined, teacher.token)).status).toBe(204);
    expect((await api('GET', `/resources/${resId}`, undefined, teacher.token)).status).toBe(404);
  });
});
