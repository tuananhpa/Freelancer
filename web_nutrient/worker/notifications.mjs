import webpush from "web-push";
import { all, one, run, backupUser } from "./db.mjs";
import { dayKey } from "./domain.mjs";
const schedule = [
  [
    "breakfast",
    "07:15",
    "Đến giờ ăn sáng",
    "Bắt đầu ngày mới với một bữa sáng phù hợp với bạn.",
  ],
  [
    "lunch",
    "11:45",
    "Nghỉ tay ăn trưa nhé",
    "Ghi lại bữa trưa và dành thời gian nghỉ ngơi.",
  ],
  [
    "snack",
    "15:30",
    "Đến giờ bữa phụ",
    "Bạn có thể chọn trái cây hoặc món nhẹ yêu thích.",
  ],
  [
    "dinner",
    "18:45",
    "Đến giờ ăn tối",
    "Thưởng thức bữa tối và ghi nhật ký khi tiện.",
  ],
  [
    "checkin",
    "16:30",
    "Hôm nay bạn thấy thế nào?",
    "NuTri luôn sẵn sàng lắng nghe.",
  ],
  [
    "streak",
    "20:30",
    "Một phút nhìn lại hôm nay",
    "Ghi lại thói quen hôm nay và chuẩn bị nghỉ ngơi.",
  ],
];
export const notificationPayload = (title, body, settings = {}) => ({
  title,
  body,
  url: "/",
  silent: !settings.sound,
});
export async function pushUser(env, userId, title, body) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY)
    throw new Error("Chưa cấu hình Web Push");
  const [subs, row] = await Promise.all([
    all(env, "SELECT * FROM push_subscriptions WHERE user_id=?", userId),
    one(env, "SELECT data FROM settings WHERE user_id=?", userId),
  ]);
  const settings = row ? JSON.parse(row.data) : {};
  let sent = 0;
  for (const sub of subs) {
    try {
      const detail = webpush.generateRequestDetails(
        JSON.parse(sub.data),
        JSON.stringify(notificationPayload(title, body, settings)),
        {
          vapidDetails: {
            subject: env.VAPID_SUBJECT,
            publicKey: env.VAPID_PUBLIC_KEY,
            privateKey: env.VAPID_PRIVATE_KEY,
          },
          TTL: 1800,
        },
      );
      const res = await fetch(detail.endpoint, {
        method: detail.method,
        headers: detail.headers,
        body: detail.body,
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) sent++;
      else if ([404, 410].includes(res.status))
        await run(env, "DELETE FROM push_subscriptions WHERE id=?", sub.id);
    } catch {
      /* An invalid subscription cannot abort remaining subscribers. */
    }
  }
  return sent;
}
export async function scheduledTasks(env) {
  const today = dayKey(),
    local = new Date(Date.now() + 7 * 3600000),
    mins = local.getUTCHours() * 60 + local.getUTCMinutes();
  const rows = await all(env, "SELECT * FROM settings");
  for (const row of rows) {
    try {
      const s = JSON.parse(row.data);
      if (s.autoBackup && mins < 5) {
        const start = new Date(
          Date.parse(today + "T00:00:00Z") - 7 * 3600000,
        ).toISOString();
        const b = await one(
          env,
          "SELECT id FROM backups WHERE user_id=? AND created_at>=?",
          row.user_id,
          start,
        );
        if (!b) await backupUser(env, row.user_id);
      }
      if (!s.pushEnabled || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY)
        continue;
      const tasks = [...schedule];
      if (mins >= 8 * 60 && mins <= 20 * 60)
        tasks.push([
          "water-" + Math.floor(mins / 120),
          String(Math.floor(mins / 120) * 2).padStart(2, "0") + ":00",
          "Uống một chút nước nhé",
          "Chọn lượng nước phù hợp và ghi lại trong NuTri.",
        ]);
      for (const [id, time, title, body] of tasks) {
        if (s.disabled?.includes(id.split("-")[0])) continue;
        const [h, m] = time.split(":").map(Number),
          target = h * 60 + m;
        if (mins < target || mins >= target + 5) continue;
        const inserted = await run(
          env,
          "INSERT OR IGNORE INTO notification_deliveries(user_id,slot,date) VALUES(?,?,?)",
          row.user_id,
          id,
          today,
        );
        if (inserted.meta.changes) {
          const sent = await pushUser(env, row.user_id, title, body);
          if (!sent)
            await run(
              env,
              "DELETE FROM notification_deliveries WHERE user_id=? AND slot=? AND date=?",
              row.user_id,
              id,
              today,
            );
        }
      }
    } catch {
      /* Each user is isolated; a failure must not stop other backups or cleanup. */
    }
  }
  await run(env, "DELETE FROM sessions WHERE expires_at<?", Date.now());
  await run(env, "DELETE FROM rate_limits WHERE expires_at<?", Date.now());
}
