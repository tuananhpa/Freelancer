import { it, expect } from 'vitest';
import { api, BASE, login, makeUser } from './helpers';

/** Client STOMP tối giản: CONNECT, SUBSCRIBE rồi gom MESSAGE */
async function stomp(headers: Record<string, string>, dests: string[]) {
  const ws: any = new WebSocket(`${BASE.replace(/^http/, 'ws')}/ws`); // WebSocket của Node, không phải kiểu Workers
  const msgs: { dest: string; body: any }[] = [];
  let connected = false;
  ws.onmessage = (e: { data: unknown }) => {
    for (const f of String(e.data).split('\0').filter((x) => x.trim())) {
      const [head, body] = f.split('\n\n');
      if (head.startsWith('CONNECTED')) connected = true;
      if (head.startsWith('MESSAGE')) msgs.push({ dest: head.match(/destination:(.*)/)![1], body: JSON.parse(body) });
    }
  };
  await new Promise((r) => (ws.onopen = r));
  const hs = Object.entries(headers).map(([k, v]) => `${k}:${v}`).join('\n');
  ws.send(`CONNECT\naccept-version:1.2\n${hs}\n\n\0`);
  dests.forEach((d, i) => ws.send(`SUBSCRIBE\nid:sub-${i}\ndestination:${d}\n\n\0`));
  await new Promise((r) => setTimeout(r, 400));
  return { ws, msgs, connected: () => connected };
}
const wait = () => new Promise((r) => setTimeout(r, 600));

it('WebSocket STOMP: thông báo tức thời, chat hỗ trợ khách ↔ nhân viên, chặn người lạ', async () => {
  const admin = await login('Admin', 'admin123@');
  const t = await makeUser(admin, 'TEACHER');
  const s = await makeUser(admin, 'STUDENT');
  const office = await makeUser(admin, 'OFFICE');

  const bad = await stomp({ Authorization: 'Bearer sai' }, []);
  expect(bad.connected()).toBe(false);

  const tc = await stomp({ Authorization: `Bearer ${t.token}` }, ['/user/queue/notifications']);
  const sc = await stomp({ Authorization: `Bearer ${s.token}` }, ['/user/queue/notifications', '/topic/support.agents.messages']);
  expect(tc.connected()).toBe(true);
  const cls = await api('POST', '/classes', { name: 'Lớp WS', teacherId: t.id }, admin);
  await api('POST', '/classes/join', { inviteCode: cls.data.inviteCode }, s.token);
  await wait();
  expect(tc.msgs.some((m) => m.dest === '/user/queue/notifications' && typeof m.body.title === 'string')).toBe(true);

  const g = await api('POST', '/support/guest-session', { guestName: 'Khách WS', guestContact: '0900000000' });
  const gc = await stomp({ 'X-Guest-Token': g.data.guestToken }, ['/user/queue/support', '/user/queue/support.typing']);
  const oc = await stomp({ Authorization: `Bearer ${office.token}` }, ['/topic/support.agents', '/topic/support.agents.messages']);
  const cid = g.data.conversation.id;
  await fetch(`${BASE}/api/support/conversations/${cid}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Guest-Token': g.data.guestToken }, body: JSON.stringify({ content: 'Xin chào' }) });
  await api('POST', `/support/conversations/${cid}/messages`, { content: 'Chào bạn' }, office.token);
  oc.ws.send(`SEND\ndestination:/app/support.typing\ncontent-type:application/json\n\n${JSON.stringify({ conversationId: cid, isTyping: true })}\0`);
  await wait();
  expect(oc.msgs.filter((m) => m.dest === '/topic/support.agents.messages').map((m) => m.body.content)).toEqual(['Xin chào', 'Chào bạn']);
  expect(oc.msgs.some((m) => m.dest === '/topic/support.agents' && m.body.id === cid)).toBe(true);
  expect(gc.msgs.filter((m) => m.dest === '/user/queue/support').map((m) => m.body.content)).toEqual(['Xin chào', 'Chào bạn']);
  expect(gc.msgs.some((m) => m.dest === '/user/queue/support.typing' && m.body.senderRole === 'AGENT')).toBe(true);
  expect(sc.msgs.some((m) => m.dest.startsWith('/topic/support'))).toBe(false); // học sinh không nghe được hộp thư nhân viên
  [tc, sc, gc, oc].forEach((x) => x.ws.close());
});
