import { it, expect } from 'vitest';
import { api, login, makeUser } from './helpers';

it('xóa lớp/người dùng đang có dữ liệu không bị lỗi khóa ngoại', async () => {
  const admin = await login('Admin', 'admin123@');
  const t = await makeUser(admin, 'TEACHER');
  const s = await makeUser(admin, 'STUDENT');
  const cls = (await api('POST', '/classes', { name: 'Lớp xóa', teacherId: t.id }, admin)).data;
  await api('POST', '/classes/join', { inviteCode: cls.inviteCode }, s.token);
  const post = await api('POST', `/classes/${cls.id}/posts`, { content: 'Chào lớp' }, t.token);
  expect(post.status).toBe(201);
  await api('POST', `/classes/${cls.id}/posts/${post.data.id}/comments`, { content: 'Dạ' }, s.token);
  const a = (await api('POST', '/v1/assignments', { title: 'BT', classroomId: cls.id, maxScore: 10 }, t.token)).data;
  await api('POST', `/v1/assignments/${a.id}/submit`, { content: 'bài làm' }, s.token);
  expect((await api('DELETE', `/classes/admin/groups/${cls.id}`, undefined, admin)).status).toBeLessThan(300);
  expect((await api('GET', `/classes/${cls.id}`, undefined, admin)).status).toBe(404);
  // học sinh đã nộp bài, bình luận, có thông báo → xóa tài khoản vẫn được
  expect((await api('DELETE', `/admin/users/${s.id}`, undefined, admin)).status).toBeLessThan(300);
  expect((await api('DELETE', `/admin/users/${t.id}`, undefined, admin)).status).toBeLessThan(300);
});
