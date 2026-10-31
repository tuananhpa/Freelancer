import type { Bindings, UserRow } from '../types';
import { one, run } from '../db';
import { javaTime, nowISO } from './time';
import { push } from '../realtime';
import { uuid } from './http';

/** NotificationService.sendNotification: bỏ qua tự gửi cho mình, chống trùng trong 10 giây theo entity */
export async function notify(
  env: Bindings,
  recipientId: string | null | undefined,
  title: string,
  message: string,
  link: string | null,
  type = 'SYSTEM',
  actor: Pick<UserRow, 'id' | 'full_name' | 'avatar_url'> | null = null,
  entityType: string | null = null,
  entityId: string | null = null,
) {
  if (!recipientId) return;
  if (actor && actor.id === recipientId) return;
  if (entityType && entityId) {
    const since = new Date(Date.now() - 10_000).toISOString();
    const dup = await one(env, 'SELECT 1 AS x FROM notifications WHERE user_id = ? AND entity_type = ? AND entity_id = ? AND type = ? AND created_at > ? LIMIT 1', recipientId, entityType, entityId, type, since);
    if (dup) return;
  }
  const row = { id: uuid(), user_id: recipientId, title, message, is_read: 0, link, type, actor_id: actor?.id ?? null, actor_name: actor?.full_name ?? null, actor_avatar: actor?.avatar_url ?? null, entity_type: entityType, entity_id: entityId, created_at: nowISO() };
  await run(env, 'INSERT INTO notifications (id, user_id, title, message, is_read, link, type, actor_id, actor_name, actor_avatar, entity_type, entity_id, created_at) VALUES (?,?,?,?,0,?,?,?,?,?,?,?,?)',
    row.id, recipientId, title, message, link, type, row.actor_id, row.actor_name, row.actor_avatar, entityType, entityId, row.created_at);
  await push(env, [{ to: `u:${recipientId}`, dest: '/user/queue/notifications', body: nDto(row) }]);
}
/** NotificationDto (dùng chung cho API danh sách và realtime) */
export const nDto = (n: any) => ({ id: n.id, title: n.title, message: n.message, link: n.link, isRead: !!n.is_read, read: !!n.is_read, type: n.type || 'SYSTEM', actorId: n.actor_id, actorName: n.actor_name, actorAvatar: n.actor_avatar, entityType: n.entity_type, entityId: n.entity_id, createdAt: javaTime(n.created_at) });
