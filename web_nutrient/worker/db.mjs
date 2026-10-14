import { dayKey } from "./domain.mjs";
export const run = (env, sql, ...values) =>
  env.DB.prepare(sql)
    .bind(...values)
    .run();
export const one = (env, sql, ...values) =>
  env.DB.prepare(sql)
    .bind(...values)
    .first();
export const all = async (env, sql, ...values) =>
  (
    await env.DB.prepare(sql)
      .bind(...values)
      .all()
  ).results;
export async function profileOf(env, id) {
  const row = await one(env, "SELECT data FROM profiles WHERE user_id=?", id);
  return row ? JSON.parse(row.data) : null;
}
export async function award(env, id, kind, item, data = {}, xp = 10) {
  const today = dayKey();
  const result = await run(
    env,
    "INSERT OR IGNORE INTO progress(user_id,kind,item_id,data) VALUES(?,?,?,?)",
    id,
    kind,
    item,
    JSON.stringify(data),
  );
  if (!result.meta.changes) return false;
  await run(
    env,
    "INSERT INTO rewards(user_id,xp,streak,last_day) VALUES(?,?,1,?) ON CONFLICT(user_id) DO UPDATE SET xp=xp+excluded.xp,streak=CASE WHEN last_day=excluded.last_day THEN streak WHEN date(last_day,'+1 day')=excluded.last_day THEN streak+1 ELSE 1 END,last_day=excluded.last_day",
    id,
    xp,
    today,
  );
  return true;
}
export async function backupUser(env, id) {
  const tables = { profile: await profileOf(env, id) };
  for (const table of [
    "meals",
    "water",
    "weights",
    "progress",
    "rewards",
    "settings",
    "plans",
  ])
    tables[table] = await all(
      env,
      "SELECT * FROM " + table + " WHERE user_id=?",
      id,
    );
  const bid = crypto.randomUUID();
  await env.MEDIA.put(
    "backup/" + id + "/" + bid + ".json",
    JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      ...tables,
    }),
    { httpMetadata: { contentType: "application/json" } },
  );
  await run(
    env,
    "INSERT INTO backups(id,user_id,created_at) VALUES(?,?,?)",
    bid,
    id,
    new Date().toISOString(),
  );
  return bid;
}
