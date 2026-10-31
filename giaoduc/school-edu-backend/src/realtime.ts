/**
 * Thay cho STOMP của Spring (/ws): một Durable Object nói giao thức STOMP tối thiểu
 * (CONNECT/SUBSCRIBE/UNSUBSCRIBE/SEND/DISCONNECT → CONNECTED/MESSAGE/RECEIPT/ERROR) để @stomp/stompjs ở frontend dùng nguyên.
 * Danh tính: "u:<userId>" (JWT) hoặc "g:<guestToken>" (khách hỗ trợ) — giống convertAndSendToUser của Java.
 */
import type { Bindings } from './types';
import { userFromToken } from './lib/auth';
import { one } from './db';

type Att = { p: string | null; role: string | null; subs: Record<string, string> };
export type Push = { to?: string; dest: string; body: unknown };

export function parseFrames(data: string) {
  const out: { cmd: string; headers: Record<string, string>; body: string }[] = [];
  for (const raw of data.split('\0')) {
    const f = raw.replace(/^[\r\n]+/, ''); // bỏ nhịp tim (dòng trống)
    if (!f) continue;
    const sep = f.search(/\r?\n\r?\n/);
    const head = (sep < 0 ? f : f.slice(0, sep)).split(/\r?\n/);
    const headers: Record<string, string> = {};
    for (const l of head.slice(1)) { const i = l.indexOf(':'); if (i > 0 && !(l.slice(0, i) in headers)) headers[l.slice(0, i)] = l.slice(i + 1); }
    out.push({ cmd: head[0].trim(), headers, body: sep < 0 ? '' : f.slice(sep).replace(/^\r?\n\r?\n/, '') });
  }
  return out;
}
const frame = (cmd: string, headers: Record<string, string>, body = '') => `${cmd}\n${Object.entries(headers).map(([k, v]) => `${k}:${v.replace(/[\r\n:]/g, ' ')}`).join('\n')}\n\n${body}\0`;
{
  const f = parseFrames('\nCONNECT\naccept-version:1.2\nAuthorization:Bearer a:b\n\n\0SUBSCRIBE\nid:sub-0\ndestination:/user/queue/x\n\n\0\n');
  console.assert(f.length === 2 && f[0].headers.Authorization === 'Bearer a:b' && f[1].headers.destination === '/user/queue/x', 'parseFrames');
}
const AGENT_TOPIC = /^\/topic\/support\.agents(\.messages|\.read|\.typing)?$/;
const USER_QUEUE = /^\/user\/queue\/(notifications|support|support\.read|support\.typing)$/;

const send = (ws: WebSocket, data: string) => { try { ws.send(data); } catch { /* socket đã đóng */ } };

export class RealtimeHub {
  private seq = 0;
  // Sự kiện của một socket có thể chạy chen nhau khi đang chờ D1 (SUBSCRIBE tới lúc CONNECT chưa xong) → xếp hàng theo socket
  private queues = new WeakMap<WebSocket, Promise<void>>();
  constructor(private state: DurableObjectState, private env: Bindings) {}

  async fetch(req: Request) {
    if (new URL(req.url).pathname === '/publish') {
      for (const m of (await req.json()) as Push[]) this.deliver(m);
      return new Response(null, { status: 204 });
    }
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 });
    const [client, server] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ p: null, role: null, subs: {} } satisfies Att);
    return new Response(null, { status: 101, webSocket: client });
  }

  private deliver(m: Push) {
    const body = JSON.stringify(m.body);
    for (const ws of this.state.getWebSockets()) {
      const a = ws.deserializeAttachment() as Att;
      if (!a?.p || (m.to && a.p !== m.to)) continue;
      for (const [id, dest] of Object.entries(a.subs)) if (dest === m.dest) {
        send(ws, frame('MESSAGE', { subscription: id, 'message-id': String(++this.seq), destination: dest, 'content-type': 'application/json' }, body));
      }
    }
  }

  webSocketMessage(ws: WebSocket, data: string | ArrayBuffer) {
    const next = (this.queues.get(ws) ?? Promise.resolve()).then(() => this.handle(ws, data)).catch(() => {});
    this.queues.set(ws, next);
    return next;
  }

  private async handle(ws: WebSocket, data: string | ArrayBuffer) {
    const a = ws.deserializeAttachment() as Att;
    if (!a) return;
    for (const f of parseFrames(typeof data === 'string' ? data : new TextDecoder().decode(data))) {
      if (f.cmd === 'CONNECT' || f.cmd === 'STOMP') {
        const bearer = f.headers.Authorization || f.headers.authorization || '';
        const guest = f.headers['X-Guest-Token'] || f.headers['x-guest-token'] || '';
        const u = bearer.startsWith('Bearer ') ? await userFromToken(this.env, bearer.slice(7)) : null;
        if (u) { a.p = `u:${u.id}`; a.role = u.role; }
        else if (guest && (await one(this.env, 'SELECT 1 AS x FROM support_conversations WHERE guest_token = ?', guest))) { a.p = `g:${guest}`; a.role = null; }
        else { send(ws, frame('ERROR', { message: 'Unauthorized' })); ws.close(1008, 'Unauthorized'); return; }
        ws.serializeAttachment(a);
        send(ws, frame('CONNECTED', { version: '1.2', 'heart-beat': '0,0' }));
        continue;
      }
      if (!a.p) { send(ws, frame('ERROR', { message: 'Chưa CONNECT' })); ws.close(1008, 'Unauthorized'); return; }
      if (f.cmd === 'SUBSCRIBE') {
        const dest = f.headers.destination || '';
        const allowed = USER_QUEUE.test(dest) || (AGENT_TOPIC.test(dest) && (a.role === 'OFFICE' || a.role === 'ADMIN'));
        if (allowed && f.headers.id && Object.keys(a.subs).length < 20) { a.subs[f.headers.id] = dest; ws.serializeAttachment(a); }
      } else if (f.cmd === 'UNSUBSCRIBE') {
        delete a.subs[f.headers.id];
        ws.serializeAttachment(a);
      } else if (f.cmd === 'SEND' && f.headers.destination === '/app/support.typing') {
        try {
          const b = JSON.parse(f.body || '{}');
          const { handleTyping } = await import('./routes/support');
          const user = a.p.startsWith('u:') ? await one<any>(this.env, 'SELECT * FROM users WHERE id = ?', a.p.slice(2)) : null;
          const pushes = await handleTyping(this.env, String(b.conversationId || ''), user, a.p.startsWith('g:') ? a.p.slice(2) : undefined, b.isTyping === true);
          pushes.forEach((m) => this.deliver(m));
        } catch { /* bỏ qua gói gõ phím lỗi */ }
      } else if (f.cmd === 'DISCONNECT') {
        if (f.headers.receipt) send(ws, frame('RECEIPT', { 'receipt-id': f.headers.receipt }));
        ws.close(1000, 'bye');
        return;
      }
    }
  }
  webSocketClose(ws: WebSocket, code: number) { try { ws.close(code === 1005 ? 1000 : code, 'closed'); } catch { /* đã đóng */ } }
  webSocketError() { /* hub tự dọn socket lỗi */ }
}

/** Gửi sự kiện realtime; không có binding (test/local cũ) hoặc lỗi thì bỏ qua — dữ liệu đã nằm trong DB */
export async function push(env: Bindings, msgs: Push[]) {
  if (!env.REALTIME || !msgs.length) return;
  try {
    const hub = env.REALTIME.get(env.REALTIME.idFromName('hub'));
    await hub.fetch('https://hub/publish', { method: 'POST', body: JSON.stringify(msgs) });
  } catch (e) { console.error('[realtime]', e instanceof Error ? e.message : e); }
}
