import { Hono } from 'hono';
import type { AppEnv, Bindings, UserRow } from '../types';
import { ApiError, bad, body, forbidden, notFound, raw, uuid } from '../lib/http';
import { auth, optionalAuth } from '../lib/auth';
import { all, count, inList, one, run } from '../db';
import { javaTime, nowISO } from '../lib/time';
import { notify } from '../lib/notify';
import { saveUpload } from './resources';
import { push, type Push } from '../realtime';

type Env = Bindings;
const C_SELECT = `SELECT c.*, r.full_name AS requester_name, r.avatar_url AS requester_avatar, a.full_name AS assignee_name FROM support_conversations c LEFT JOIN users r ON r.id = c.requester_id LEFT JOIN users a ON a.id = c.assignee_id`;
const has = (s: unknown): s is string => typeof s === 'string' && s.trim() !== '';
const preview = (s: string) => { const f = s.replace(/\s+/g, ' ').trim(); return f.length > 120 ? `${f.slice(0, 120)}…` : f; };
const displayName = (c: any) => c.requester_id ? c.requester_name : has(c.guest_name) ? c.guest_name : 'Khach vang lai';
const isAgent = (u: UserRow | null) => !!u && (u.role === 'OFFICE' || u.role === 'ADMIN');
const unread = (env: Env, id: string) => count(env, "SELECT COUNT(*) AS n FROM support_messages WHERE conversation_id = ? AND sender_role = 'REQUESTER' AND read_at IS NULL", id);
function cDto(c: any, unreadN: number, last: any | null) {
  return {
    id: c.id, status: c.status, subject: c.subject, displayName: displayName(c), requesterId: c.requester_id, requesterAvatar: c.requester_avatar ?? null, guestContact: c.guest_contact,
    assigneeId: c.assignee_id, assigneeName: c.assignee_name ?? null, createdAt: javaTime(c.created_at), lastMessageAt: javaTime(c.last_message_at), unreadFromRequester: unreadN,
    lastMessagePreview: last ? (has(last.content) ? preview(last.content) : last.image_url ? '[Hình ảnh]' : '') : null, lastMessageFromAgent: last ? last.sender_role === 'AGENT' : null, hasMessages: !!c.last_message_at,
  };
}
const mDto = (m: any) => ({ id: m.id, conversationId: m.conversation_id, content: m.content, imageUrl: m.image_url, senderRole: m.sender_role, senderId: m.sender_id, senderName: m.sender_name ?? null, senderAvatar: m.sender_avatar ?? null, sentAt: javaTime(m.sent_at), readAt: javaTime(m.read_at) });
const loadConv = async (env: Env, id: string) => {
  const c = await one<any>(env, `${C_SELECT} WHERE c.id = ?`, id);
  if (!c) throw notFound('Không tìm thấy hội thoại.');
  return c;
};
const dtoOf = async (env: Env, id: string) => { const c = await loadConv(env, id); return cDto(c, await unread(env, c.id), null); };
/** So sánh thời gian hằng định để không dò được guest token */
function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function isRequester(c: any, u: UserRow | null, guestToken: string | undefined) {
  if (u && c.requester_id) return c.requester_id === u.id;
  return has(guestToken) && has(c.guest_token) && safeEq(guestToken, c.guest_token);
}
async function accessible(env: Env, id: string, u: UserRow | null, guestToken: string | undefined) {
  const c = await loadConv(env, id);
  if (isRequester(c, u, guestToken) || isAgent(u)) return c;
  throw forbidden('Bạn không có quyền xem hội thoại này.');
}
const trimSubject = (s: unknown) => (has(s) ? s.trim().slice(0, 255) : null);
function guestToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
/** enforceGuestQuota: tối đa 10 hội thoại khách / IP / giờ (KV; không có KV thì bỏ qua) */
async function guestQuota(env: Env, ip: string) {
  if (!env.SESSIONS) return; // shortcut: chưa gắn KV thì không giới hạn, gắn SESSIONS khi deploy
  const key = `support:new_conv:${ip}`;
  const n = Number((await env.SESSIONS.get(key)) || 0) + 1;
  await env.SESSIONS.put(key, String(n), { expirationTtl: 3600 });
  if (n > 10) throw new ApiError(429, 'SUPPORT_RATE_LIMITED', 'Bạn đã mở quá nhiều hội thoại. Vui lòng thử lại sau.');
}
/** notifyStaffOfNewMessage: lượt mới (≤1 tin chưa đọc) hoặc quá 10 phút từ lần báo trước */
async function notifyStaff(env: Env, c: any, content: string) {
  const startsNewRound = (await unread(env, c.id)) <= 1;
  let withinQuota = true;
  if (env.SESSIONS) {
    const k = `support:notified:${c.id}`;
    withinQuota = !(await env.SESSIONS.get(k));
    if (withinQuota) await env.SESSIONS.put(k, '1', { expirationTtl: 600 });
  }
  if (!startsNewRound && !withinQuota) return;
  const to = c.assignee_id ? [{ id: c.assignee_id }] : await all<{ id: string }>(env, "SELECT id FROM users WHERE role IN ('OFFICE','ADMIN') AND status = 'ACTIVE'");
  for (const r of to) await notify(env, r.id, 'Tin nhắn hỗ trợ mới', `${displayName(c)}: ${preview(content)}`, `/support/inbox?c=${c.id}`, 'SUPPORT', null, 'SUPPORT_CONVERSATION', c.id);
}

/* ---- Realtime (thay messagingTemplate của Java) ---- */
const requesterKey = (c: any) => (c.requester_id ? `u:${c.requester_id}` : c.guest_token ? `g:${c.guest_token}` : null);
/** notifyAgents: bản tóm tắt hội thoại cho hộp thư nhân viên */
async function agentsPush(env: Env, convId: string, last: any | null = null): Promise<Push> {
  const c = await loadConv(env, convId);
  return { dest: '/topic/support.agents', body: cDto(c, await unread(env, c.id), last) };
}
/** handleTyping: khách gõ → báo nhân viên; nhân viên gõ → báo khách. Java không kiểm tra quyền ở đây; ta chỉ nhận từ người trong hội thoại */
export async function handleTyping(env: Env, id: string, u: UserRow | null, guestToken: string | undefined, isTyping: boolean): Promise<Push[]> {
  const c = await one<any>(env, `${C_SELECT} WHERE c.id = ?`, id);
  if (!c) return [];
  const fromRequester = isRequester(c, u, guestToken);
  if (!fromRequester && !isAgent(u)) return [];
  const ev = { conversationId: c.id, senderRole: fromRequester ? 'REQUESTER' : 'AGENT', senderName: u ? u.full_name : c.requester_name ?? 'Khách', isTyping };
  if (fromRequester) return [{ dest: '/topic/support.agents.typing', body: ev }];
  const to = requesterKey(c);
  return to ? [{ to, dest: '/user/queue/support.typing', body: ev }] : [];
}

const sup = new Hono<AppEnv>();
const gt = (c: any) => c.req.header('X-Guest-Token') as string | undefined;

sup.post('/guest-session', async (c) => {
  const b = await body(c);
  if (!has(b.guestName) || !has(b.guestContact)) throw bad('Vui lòng cho biết tên và một cách liên hệ (email hoặc số điện thoại).');
  await guestQuota(c.env, c.req.header('CF-Connecting-IP') || 'local');
  const id = uuid(), token = guestToken();
  await run(c.env, "INSERT INTO support_conversations (id, guest_token, guest_name, guest_contact, status, subject, created_at) VALUES (?,?,?,?, 'OPEN', ?, ?)", id, token, String(b.guestName).trim().slice(0, 150), String(b.guestContact).trim().slice(0, 150), trimSubject(b.subject), nowISO());
  return raw(c, { guestToken: token, conversation: await dtoOf(c.env, id) });
});
sup.post('/conversations', auth(), async (c) => {
  const me = c.get('user');
  const ex = await one<{ id: string }>(c.env, "SELECT id FROM support_conversations WHERE requester_id = ? AND status <> 'CLOSED' ORDER BY created_at DESC LIMIT 1", me.id);
  if (ex) return raw(c, await dtoOf(c.env, ex.id));
  let b: any = {};
  try { b = await c.req.json(); } catch { /* body tùy chọn */ }
  const id = uuid();
  await run(c.env, "INSERT INTO support_conversations (id, requester_id, status, subject, created_at) VALUES (?,?, 'OPEN', ?, ?)", id, me.id, trimSubject(b?.subject), nowISO());
  return raw(c, await dtoOf(c.env, id));
});
sup.post('/conversations/claim', auth(), async (c) => {
  const token = (await body(c)).guestToken;
  const conv = has(token) ? await one<{ id: string }>(c.env, 'SELECT id FROM support_conversations WHERE guest_token = ?', token) : null;
  if (!conv) throw notFound('Không tìm thấy hội thoại.');
  await run(c.env, 'UPDATE support_conversations SET requester_id = ?, guest_token = NULL WHERE id = ?', c.get('user').id, conv.id);
  return raw(c, await dtoOf(c.env, conv.id));
});

const agent = auth('OFFICE', 'ADMIN');
sup.get('/inbox', agent, async (c) => {
  const status = c.req.query('status');
  if (status && !['OPEN', 'ASSIGNED', 'CLOSED'].includes(status)) throw bad('Trạng thái không hợp lệ.');
  const includeEmpty = c.req.query('includeEmpty') === 'true';
  const where = [includeEmpty ? '1=1' : 'c.last_message_at IS NOT NULL'];
  if (status) where.push('c.status = ?');
  // shortcut: lấy 300 hội thoại mới nhất, đủ cho một trường; nhiều hơn thì thêm phân trang
  const convs = await all<any>(c.env, `${C_SELECT} WHERE ${where.join(' AND ')} ORDER BY COALESCE(c.last_message_at, c.created_at) DESC LIMIT 300`, ...(status ? [status] : []));
  if (!convs.length) return raw(c, []);
  const ids = convs.map((x) => x.id);
  const un = new Map((await all<any>(c.env, `SELECT conversation_id, COUNT(*) AS n FROM support_messages WHERE conversation_id IN ${inList(ids.length)} AND sender_role = 'REQUESTER' AND read_at IS NULL GROUP BY conversation_id`, ...ids)).map((r) => [r.conversation_id, r.n]));
  const last = new Map<string, any>();
  for (const m of await all<any>(c.env, `SELECT m.* FROM support_messages m WHERE m.conversation_id IN ${inList(ids.length)} AND m.sent_at = (SELECT MAX(m2.sent_at) FROM support_messages m2 WHERE m2.conversation_id = m.conversation_id)`, ...ids)) if (!last.has(m.conversation_id)) last.set(m.conversation_id, m);
  return raw(c, convs.map((x) => cDto(x, un.get(x.id) ?? 0, last.get(x.id) ?? null)));
});
sup.get('/inbox/unread-count', agent, async (c) => raw(c, await count(c.env, "SELECT COUNT(DISTINCT m.conversation_id) AS n FROM support_messages m JOIN support_conversations c ON c.id = m.conversation_id WHERE m.sender_role = 'REQUESTER' AND m.read_at IS NULL AND c.status <> 'CLOSED'")));
sup.post('/conversations/:id/assign', agent, async (c) => {
  const conv = await loadConv(c.env, c.req.param('id'));
  await run(c.env, "UPDATE support_conversations SET assignee_id = ?, status = 'ASSIGNED' WHERE id = ?", c.get('user').id, conv.id);
  await push(c.env, [await agentsPush(c.env, conv.id)]);
  return raw(c, await dtoOf(c.env, conv.id));
});
sup.post('/conversations/:id/close', agent, async (c) => {
  const conv = await loadConv(c.env, c.req.param('id'));
  await run(c.env, "UPDATE support_conversations SET status = 'CLOSED', closed_at = ? WHERE id = ?", nowISO(), conv.id);
  await push(c.env, [await agentsPush(c.env, conv.id)]);
  return raw(c, await dtoOf(c.env, conv.id));
});

sup.get('/conversations/:id', optionalAuth, async (c) => {
  const conv = await accessible(c.env, c.req.param('id'), c.get('user') ?? null, gt(c));
  return raw(c, cDto(conv, await unread(c.env, conv.id), null));
});
sup.get('/conversations/:id/messages', optionalAuth, async (c) => {
  const u = c.get('user') ?? null;
  const conv = await accessible(c.env, c.req.param('id'), u, gt(c));
  const readerRole = isAgent(u) && !isRequester(conv, u, gt(c)) ? 'AGENT' : 'REQUESTER';
  const readAt = nowISO();
  await run(c.env, 'UPDATE support_messages SET read_at = ? WHERE conversation_id = ? AND sender_role <> ? AND read_at IS NULL', readAt, conv.id, readerRole);
  const receipt = { conversationId: conv.id, readerRole, readAt: javaTime(readAt) };
  const rk = requesterKey(conv);
  await push(c.env, readerRole === 'AGENT' ? (rk ? [{ to: rk, dest: '/user/queue/support.read', body: receipt }] : []) : [{ dest: '/topic/support.agents.read', body: receipt }]);
  const rows = await all(c.env, 'SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_avatar FROM support_messages m LEFT JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = ? ORDER BY m.sent_at ASC', conv.id);
  return raw(c, rows.map(mDto));
});
sup.post('/conversations/:id/messages', optionalAuth, async (c) => {
  const u = c.get('user') ?? null;
  const b = await body(c);
  if (!has(b.content) && !has(b.imageUrl)) throw bad('Nội dung tin nhắn không được để trống.');
  if (has(b.content) && b.content.length > 4000) throw bad('Tin nhắn quá dài.');
  if (has(b.imageUrl) && !/^https:\/\//.test(b.imageUrl)) throw bad('Đường dẫn ảnh không hợp lệ.');
  const conv = await accessible(c.env, c.req.param('id'), u, gt(c));
  if (conv.status === 'CLOSED') throw bad('Hội thoại đã đóng.');
  const fromRequester = isRequester(conv, u, gt(c));
  const id = uuid(), now = nowISO(), content = has(b.content) ? b.content.trim() : '';
  await run(c.env, 'INSERT INTO support_messages (id, conversation_id, sender_id, sender_role, content, image_url, sent_at) VALUES (?,?,?,?,?,?,?)', id, conv.id, u?.id ?? null, fromRequester ? 'REQUESTER' : 'AGENT', content, has(b.imageUrl) ? b.imageUrl.trim() : null, now);
  if (!fromRequester && !conv.assignee_id && u) await run(c.env, "UPDATE support_conversations SET last_message_at = ?, assignee_id = ?, status = 'ASSIGNED' WHERE id = ?", now, u.id, conv.id);
  else await run(c.env, 'UPDATE support_conversations SET last_message_at = ? WHERE id = ?', now, conv.id);
  const msg = { id, conversation_id: conv.id, content, image_url: has(b.imageUrl) ? b.imageUrl.trim() : null, sender_role: fromRequester ? 'REQUESTER' : 'AGENT', sender_id: u?.id ?? null, sender_name: u?.full_name ?? null, sender_avatar: u?.avatar_url ?? null, sent_at: now, read_at: null };
  const dto = mDto(msg), rk = requesterKey(conv);
  await push(c.env, [...(rk ? [{ to: rk, dest: '/user/queue/support', body: dto }] : []), { dest: '/topic/support.agents.messages', body: dto }, await agentsPush(c.env, conv.id, msg)]);
  if (fromRequester) await notifyStaff(c.env, conv, content || '[Hình ảnh]');
  return raw(c, dto);
});
sup.post('/conversations/:id/typing', optionalAuth, async (c) => {
  let b: any = {};
  try { b = await c.req.json(); } catch { /* body tùy chọn */ }
  await push(c.env, await handleTyping(c.env, c.req.param('id'), c.get('user') ?? null, gt(c), b?.isTyping === true));
  return c.body(null, 200);
});
sup.post('/conversations/:id/attachments', optionalAuth, async (c) => {
  const conv = await accessible(c.env, c.req.param('id'), c.get('user') ?? null, gt(c));
  if (conv.status === 'CLOSED') throw bad('Hội thoại đã đóng.');
  const file = (await c.req.formData()).get('file') as File;
  if (!(file instanceof File) || !file.size) throw bad('Chưa chọn tệp.');
  if (!file.type.startsWith('image/') || !/\.(png|jpe?g|gif|webp)$/i.test(file.name)) throw bad('Chỉ hỗ trợ gửi hình ảnh.');
  if (file.size > 5 * 1024 * 1024) throw bad('Ảnh vượt quá 5MB.');
  return raw(c, { url: (await saveUpload(c.env, file, 'support')).url });
});

export default sup;
