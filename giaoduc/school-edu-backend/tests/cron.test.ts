import { describe, it, expect } from 'vitest';
import { api, BASE, login, makeUser } from './helpers';

const runCron = () => fetch(`${BASE}/cdn-cgi/handler/scheduled?cron=*/30+*+*+*+*`);
const iso = (h: number) => new Date(Date.now() + h * 3_600_000 + 7 * 3_600_000).toISOString().slice(0, 16); // giờ VN, không múi

describe('Cron nhắc hạn', () => {
  it('nhắc học sinh chưa nộp (mốc 24h và khẩn), báo giáo viên, không gửi trùng', async () => {
    const admin = await login('Admin', 'admin123@');
    const t = await makeUser(admin, 'TEACHER');
    const s = await makeUser(admin, 'STUDENT');
    const cls = await api('POST', '/classes', { name: `Cron ${Date.now()}`, teacherId: t.id }, admin);
    await api('POST', '/classes/join', { inviteCode: cls.data.inviteCode }, s.token);
    await api('POST', '/v1/assignments', { title: 'Bài xa', classroomId: cls.data.id, maxScore: 10, dueDate: iso(20) }, t.token);
    await api('POST', '/v1/assignments', { title: 'Bài gấp', classroomId: cls.data.id, maxScore: 10, dueDate: iso(3) }, t.token);
    await api('PUT', '/notifications/read-all', undefined, s.token);
    await api('PUT', '/notifications/read-all', undefined, t.token);
    await runCron();
    await runCron();
    const titles = (await api('GET', '/notifications?page=0&size=20', undefined, s.token)).data.content.filter((n: any) => !n.isRead).map((n: any) => n.title);
    expect(titles.sort()).toEqual(['⏰ Nhắc nhở hạn chót: Bài xa', '🔥 KHẨN CẤP: Bài tập Bài gấp sắp hết hạn!']);
    const tn = (await api('GET', '/notifications?page=0&size=20', undefined, t.token)).data.content.filter((n: any) => !n.isRead);
    expect(tn.map((n: any) => n.title)).toEqual(['📊 Tiến độ bài tập: Bài gấp']);
    expect(tn[0].message).toContain('còn 1 học viên');
  });
});
