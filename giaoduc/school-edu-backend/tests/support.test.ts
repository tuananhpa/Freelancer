import { describe, it, expect, beforeAll } from 'vitest';
import { api, BASE, login, makeUser } from './helpers';

let admin = '';
beforeAll(async () => { admin = await login('Admin', 'admin123@'); });
const guest = async (method: string, path: string, token: string, body?: unknown) => {
  const r = await fetch(`${BASE}/api${path}`, { method, headers: { 'Content-Type': 'application/json', 'X-Guest-Token': token }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, data: await r.json().catch(() => null) as any };
};

describe('Tin tức / hoạt động', () => {
  it('nháp → chờ duyệt → trả lại → đăng; chỉ bài đăng mới công khai; slug tiếng Việt', async () => {
    const a = await api('POST', '/activities', { title: `Lễ khai giảng ${Date.now()}`, content: '<p>Nội dung</p>', category: 'EVENT', images: ['https://x/1.jpg'] }, admin);
    expect(a.data).toMatchObject({ status: 'DRAFT', category: 'EVENT', images: ['https://x/1.jpg'] });
    expect(a.data.slug).toMatch(/^le-khai-giang-\d+$/);
    expect((await api('GET', `/public/activities/${a.data.slug}`)).status).toBe(404);
    expect((await api('POST', `/activities/${a.data.id}/submit`, undefined, admin)).data.status).toBe('PENDING');
    expect((await api('GET', '/activities/pending-count', undefined, admin)).data.count).toBeGreaterThanOrEqual(1);
    expect((await api('POST', `/activities/${a.data.id}/reject`, { note: 'Thêm ảnh' }, admin)).data).toMatchObject({ status: 'DRAFT', reviewNote: 'Thêm ảnh' });
    expect((await api('POST', `/activities/${a.data.id}/reject`, {}, admin)).status).toBe(400);
    expect((await api('POST', `/activities/${a.data.id}/approve`, undefined, admin)).data.status).toBe('PUBLISHED');
    const p = await api('GET', `/public/activities/${a.data.slug}`);
    expect(p.data).toMatchObject({ viewCount: 1, title: a.data.title });
    expect(p.data.status).toBeUndefined();
    expect((await api('GET', '/public/activities?category=EVENT')).data.content.some((x: any) => x.id === a.data.id)).toBe(true);
    const t = await makeUser(admin, 'TEACHER');
    expect((await api('GET', '/activities', undefined, t.token)).status).toBe(403);
    expect((await api('DELETE', `/activities/${a.data.id}`, undefined, admin)).status).toBe(204);
  });
});

describe('Hỗ trợ trực tuyến', () => {
  it('khách vãng lai nhắn, nhân viên trả lời và tự nhận hội thoại, người lạ không xem được', async () => {
    const office = await makeUser(admin, 'OFFICE');
    const g = await api('POST', '/support/guest-session', { guestName: 'Phụ huynh A', guestContact: '0901234567', subject: 'Học phí' });
    expect(g.data.guestToken).toHaveLength(43);
    const cid = g.data.conversation.id;
    expect((await guest('POST', `/support/conversations/${cid}/messages`, g.data.guestToken, { content: 'Cho hỏi học phí?' })).data.senderRole).toBe('REQUESTER');
    expect((await guest('GET', `/support/conversations/${cid}`, 'sai-token')).status).toBe(403);
    const n = await api('GET', '/notifications/unread-count', undefined, office.token);
    expect(n.data).toBeGreaterThanOrEqual(1);
    const inbox = await api('GET', '/support/inbox', undefined, office.token);
    expect(inbox.data.find((x: any) => x.id === cid)).toMatchObject({ unreadFromRequester: 1, lastMessagePreview: 'Cho hỏi học phí?', displayName: 'Phụ huynh A' });
    const msgs = await api('GET', `/support/conversations/${cid}/messages`, undefined, office.token);
    expect(msgs.data).toHaveLength(1);
    await api('POST', `/support/conversations/${cid}/messages`, { content: 'Dạ, 2 triệu/tháng ạ' }, office.token);
    const conv = await guest('GET', `/support/conversations/${cid}`, g.data.guestToken);
    expect(conv.data).toMatchObject({ status: 'ASSIGNED', unreadFromRequester: 0 });
    const gm = await guest('GET', `/support/conversations/${cid}/messages`, g.data.guestToken);
    expect(gm.data[1]).toMatchObject({ senderRole: 'AGENT', content: 'Dạ, 2 triệu/tháng ạ' });
    expect((await api('GET', '/support/inbox', undefined, (await makeUser(admin, 'STUDENT')).token)).status).toBe(403);
    await api('POST', `/support/conversations/${cid}/close`, undefined, office.token);
    expect((await guest('POST', `/support/conversations/${cid}/messages`, g.data.guestToken, { content: 'x' })).status).toBe(400);
  });
  it('người dùng mở hội thoại dùng lại hội thoại đang mở; nhận lại hội thoại khách', async () => {
    const s = await makeUser(admin, 'STUDENT');
    const c1 = await api('POST', '/support/conversations', { subject: 'Quên bài' }, s.token);
    expect((await api('POST', '/support/conversations', undefined, s.token)).data.id).toBe(c1.data.id);
    const g = await api('POST', '/support/guest-session', { guestName: 'B', guestContact: 'b@x.vn' });
    const cl = await api('POST', '/support/conversations/claim', { guestToken: g.data.guestToken }, s.token);
    expect(cl.data.requesterId).toBe(s.id);
    expect((await guest('GET', `/support/conversations/${cl.data.id}`, g.data.guestToken)).status).toBe(403);
  });
});
