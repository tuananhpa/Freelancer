import {
  dayKey,
  validDate,
  validateMeal,
  validateProfile,
  mergeProfile,
  num,
  text,
} from "./domain.mjs";
import {
  digest,
  token,
  hashPassword,
  verifyPassword,
  constantEqual,
  encryptSecret,
  publicKeyStatus,
} from "./security.mjs";
import { run, one, all, profileOf, award, backupUser } from "./db.mjs";
import { analyzeMeal, profileAnalysis, generatePlan, gemini } from "./ai.mjs";
import { scheduledTasks, pushUser } from "./notifications.mjs";
import { starterPlan, recipes, experiments } from "../shared/catalog.mjs";
const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extra,
    },
  });
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
async function body(req, max = 30000) {
  if (Number(req.headers.get("content-length") ?? 0) > max)
    fail("Dữ liệu quá lớn", 413);
  const raw = await req.text();
  if (raw.length > max) fail("Dữ liệu quá lớn", 413);
  try {
    return JSON.parse(raw);
  } catch {
    fail("JSON không hợp lệ");
  }
}
async function limit(env, id, max = 40, window = 60000) {
  const bucket = Math.floor(Date.now() / window),
    key = id + ":" + bucket;
  const row = await env.DB.prepare(
    "INSERT INTO rate_limits(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count",
  )
    .bind(key, (bucket + 1) * window)
    .first();
  if (row.count > max) fail("Bạn thao tác hơi nhanh, thử lại sau nhé.", 429);
}
async function session(req, env) {
  const sid = (req.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("nutri_session="))
    ?.slice(14);
  if (!sid) return null;
  return one(
    env,
    "SELECT users.id,users.username,users.role FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.id=? AND expires_at>?",
    await digest(sid),
    Date.now(),
  );
}
async function imageOwned(env, uid, id) {
  if (!id) return;
  const img = await one(
    env,
    "SELECT id FROM media WHERE id=? AND user_id=?",
    id,
    uid,
  );
  if (!img) fail("Không có quyền dùng ảnh này", 403);
}
async function getImage(env, uid, id) {
  const row = await one(
    env,
    "SELECT * FROM media WHERE id=? AND user_id=?",
    id,
    uid,
  );
  if (!row) fail("Không tìm thấy ảnh", 404);
  const obj = await env.MEDIA.get("media/" + uid + "/" + id);
  if (!obj) fail("Không tìm thấy ảnh", 404);
  const bytes = new Uint8Array(await obj.arrayBuffer());
  let str = "";
  for (let i = 0; i < bytes.length; i += 8192)
    str += String.fromCharCode(...bytes.slice(i, i + 8192));
  return { mime: row.mime, data: btoa(str) };
}
async function auth(req, env, path) {
  await limit(
    env,
    "auth:" + (req.headers.get("cf-connecting-ip") ?? "local"),
    20,
    900000,
  );
  const b = await body(req);
  const username = text(b.username, 50)
      .normalize("NFKC")
      .toLocaleLowerCase("vi"),
    password = String(b.password ?? "");
  if (
    !/^[\p{L}\p{N}_.-]{3,40}$/u.test(username) ||
    password.length < 8 ||
    password.length > 128
  )
    fail(
      "Tên đăng nhập 3–40 ký tự (không dấu cách), mật khẩu ít nhất 8 ký tự.",
    );
  let user;
  if (path === "/api/auth/register") {
    if (username === (env.ADMIN_USERNAME ?? "nutri-admin"))
      fail("Tên đăng nhập này không khả dụng.");
    const profile = validateProfile(
      b.profile ?? { name: username, age: 14, height: 155, weight: 46 },
    );
    await imageOwned(
      env,
      "",
      profile.avatar?.startsWith("media:") ? profile.avatar.slice(6) : "",
    );
    const id = crypto.randomUUID(),
      hash = await hashPassword(password);
    try {
      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO users(id,username,password_hash) VALUES(?,?,?)",
        ).bind(id, username, hash),
        env.DB.prepare("INSERT INTO profiles(user_id,data) VALUES(?,?)").bind(
          id,
          JSON.stringify(profile),
        ),
        env.DB.prepare("INSERT INTO rewards(user_id) VALUES(?)").bind(id),
      ]);
    } catch {
      fail("Tên đăng nhập đã có người dùng.", 409);
    }
    user = { id, username, role: "user" };
  } else {
    if (
      username === env.ADMIN_USERNAME &&
      env.ADMIN_PASSWORD &&
      constantEqual(password, env.ADMIN_PASSWORD)
    ) {
      user = await one(
        env,
        "SELECT id,username,role FROM users WHERE username=?",
        username,
      );
      if (!user) {
        const id = crypto.randomUUID();
        await run(
          env,
          "INSERT INTO users(id,username,password_hash,role) VALUES(?,?,?,'admin')",
          id,
          username,
          await hashPassword(password),
        );
        user = { id, username, role: "admin" };
      }
      if (user.role !== "admin") fail("Tài khoản quản trị không hợp lệ", 403);
    } else {
      const row = await one(
        env,
        "SELECT * FROM users WHERE username=?",
        username,
      );
      if (
        !row ||
        row.role === "admin" ||
        !(await verifyPassword(password, row.password_hash))
      )
        fail("Tên đăng nhập hoặc mật khẩu chưa đúng.", 401);
      user = { id: row.id, username: row.username, role: row.role };
    }
  }
  const sid = token();
  await run(
    env,
    "INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)",
    await digest(sid),
    user.id,
    Date.now() + 7 * 86400000,
  );
  const secure =
    new URL(req.url).protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";
  return json({ user }, 200, {
    "set-cookie":
      "nutri_session=" +
      sid +
      "; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800" +
      (secure ? "; Secure" : ""),
  });
}
async function route(req, env, ctx) {
  const url = new URL(req.url),
    path = url.pathname,
    method = req.method;
  if (!path.startsWith("/api/")) {
    const response = await env.ASSETS.fetch(req);
    const h = new Headers(response.headers);
    h.set("X-Content-Type-Options", "nosniff");
    h.set("Referrer-Policy", "same-origin");
    h.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
    h.set("X-Frame-Options", "DENY");
    h.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; media-src 'self' blob:; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    return new Response(response.body, { status: response.status, headers: h });
  }
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = req.headers.get("origin");
    if (
      req.headers.get("x-nutri-request") !== "1" ||
      (origin && origin !== url.origin)
    )
      fail("Yêu cầu không hợp lệ từ nguồn khác.", 403);
  }
  if (method === "POST" && path === "/api/jobs/run") {
    if (
      !env.JOB_TOKEN ||
      !constantEqual(
        req.headers.get("authorization") ?? "",
        "Bearer " + env.JOB_TOKEN,
      )
    )
      fail("Không có quyền chạy lịch.", 403);
    await scheduledTasks(env);
    return json({ ok: true });
  }
  if (method === "GET" && path === "/api/health")
    return json({ ok: true, storage: "cloudflare-d1-r2" });
  if (
    method === "POST" &&
    ["/api/auth/login", "/api/auth/register"].includes(path)
  )
    return auth(req, env, path);
  const user = await session(req, env);
  if (!user) fail("Bạn cần đăng nhập.", 401);
  const uid = user.id;
  await limit(env, "user:" + uid, 160);
  if (path.startsWith("/api/admin/") && user.role !== "admin")
    fail("Chỉ quản trị viên được truy cập.", 403);
  if (method === "POST" && path === "/api/auth/logout") {
    const sid = (req.headers.get("cookie") ?? "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("nutri_session="))
      ?.slice(14);
    if (sid)
      await run(env, "DELETE FROM sessions WHERE id=?", await digest(sid));
    return json({ ok: true }, 200, {
      "set-cookie": "nutri_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
    });
  }
  if (method === "GET" && path === "/api/state") {
    const date = url.searchParams.get("date") ?? dayKey();
    if (!validDate(date)) fail("Ngày không hợp lệ");
    const [
      profile,
      rows,
      water,
      weights,
      progress,
      rewards,
      settings,
      plan,
      integration,
      backup,
    ] = await Promise.all([
      profileOf(env, uid),
      all(env, "SELECT id,data FROM meals WHERE user_id=? ORDER BY date", uid),
      all(env, "SELECT date,ml FROM water WHERE user_id=? ORDER BY date", uid),
      all(
        env,
        "SELECT id,date,kg FROM weights WHERE user_id=? ORDER BY date DESC LIMIT 90",
        uid,
      ),
      all(
        env,
        "SELECT kind,item_id,data,created_at FROM progress WHERE user_id=?",
        uid,
      ),
      one(env, "SELECT xp,streak,last_day FROM rewards WHERE user_id=?", uid),
      one(env, "SELECT data FROM settings WHERE user_id=?", uid),
      one(env, "SELECT data FROM plans WHERE user_id=?", uid),
      one(env, "SELECT id FROM integrations WHERE id='gemini'"),
      one(
        env,
        "SELECT id,created_at FROM backups WHERE user_id=? ORDER BY created_at DESC LIMIT 1",
        uid,
      ),
    ]);
    return json({
      user,
      profile,
      meals: rows.map((r) => ({ ...JSON.parse(r.data), id: r.id })),
      water,
      weights,
      progress: progress.map((p) => ({ ...p, data: JSON.parse(p.data) })),
      rewards: rewards ?? { xp: 0, streak: 0, last_day: null },
      settings: settings
        ? JSON.parse(settings.data)
        : { sound: false, pushEnabled: false, autoBackup: false, disabled: [] },
      plan: plan ? JSON.parse(plan.data) : starterPlan(),
      aiConfigured: !!integration,
      backup,
      date,
      pushConfigured: !!env.VAPID_PUBLIC_KEY,
      pushPublicKey: env.VAPID_PUBLIC_KEY ?? null,
    });
  }
  if (method === "PUT" && path === "/api/profile") {
    const p = mergeProfile(await profileOf(env, uid), await body(req));
    if (p.avatar.startsWith("media:"))
      await imageOwned(env, uid, p.avatar.slice(6));
    await run(
      env,
      "INSERT INTO profiles(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data",
      uid,
      JSON.stringify(p),
    );
    return json({ profile: p });
  }
  if (method === "PUT" && path === "/api/password") {
    const b = await body(req),
      row = await one(env, "SELECT password_hash FROM users WHERE id=?", uid);
    if (user.role === "admin")
      fail("Mật khẩu quản trị được đổi qua cấu hình server.", 400);
    if (!(await verifyPassword(String(b.current ?? ""), row.password_hash)))
      fail("Mật khẩu hiện tại chưa đúng.", 403);
    if (typeof b.next !== "string" || b.next.length < 8 || b.next.length > 128)
      fail("Mật khẩu mới cần 8–128 ký tự.");
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET password_hash=? WHERE id=?").bind(
        await hashPassword(b.next),
        uid,
      ),
      env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(uid),
    ]);
    return json({ ok: true, loginRequired: true }, 200, {
      "set-cookie": "nutri_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
    });
  }
  if (method === "POST" && path === "/api/meals") {
    const m = validateMeal(await body(req));
    await imageOwned(env, uid, m.imageId);
    const id = crypto.randomUUID();
    await run(
      env,
      "INSERT INTO meals(id,user_id,date,data) VALUES(?,?,?,?)",
      id,
      uid,
      m.date,
      JSON.stringify(m),
    );
    await award(env, uid, "meal", m.date + ":" + m.slot, {}, 10);
    return json({ meal: { ...m, id } }, 201);
  }
  const mealMatch = path.match(/^\/api\/meals\/([\w-]+)$/);
  if (mealMatch && ["PUT", "DELETE"].includes(method)) {
    const old = await one(
      env,
      "SELECT id FROM meals WHERE id=? AND user_id=?",
      mealMatch[1],
      uid,
    );
    if (!old) fail("Không tìm thấy bữa ăn.", 404);
    if (method === "DELETE") {
      await run(
        env,
        "DELETE FROM meals WHERE id=? AND user_id=?",
        mealMatch[1],
        uid,
      );
      return json({ ok: true });
    }
    const m = validateMeal(await body(req));
    await imageOwned(env, uid, m.imageId);
    await run(
      env,
      "UPDATE meals SET date=?,data=? WHERE id=? AND user_id=?",
      m.date,
      JSON.stringify(m),
      mealMatch[1],
      uid,
    );
    return json({ meal: { ...m, id: mealMatch[1] } });
  }
  if (method === "POST" && path === "/api/water") {
    const b = await body(req),
      date = b.date ?? dayKey();
    if (!validDate(date)) fail("Ngày không hợp lệ");
    const delta = num(b.delta, -1000, 1000, "Lượng nước");
    const row = await env.DB.prepare(
      "INSERT INTO water(user_id,date,ml) VALUES(?,?,MAX(0,?)) ON CONFLICT(user_id,date) DO UPDATE SET ml=MIN(10000,MAX(0,ml+?)) RETURNING ml",
    )
      .bind(uid, date, delta, delta)
      .first();
    if (row.ml >= 500) await award(env, uid, "water", date, {}, 5);
    return json(row);
  }
  if (method === "POST" && path === "/api/weight") {
    const b = await body(req),
      kg = num(b.kg, 15, 220, "Cân nặng"),
      date = b.date ?? dayKey();
    if (!validDate(date)) fail("Ngày không hợp lệ");
    await run(
      env,
      "INSERT INTO weights(id,user_id,date,kg) VALUES(?,?,?,?)",
      crypto.randomUUID(),
      uid,
      date,
      kg,
    );
    const p = await profileOf(env, uid);
    if (p) {
      p.weight = kg;
      delete p.analysis;
      await run(
        env,
        "UPDATE profiles SET data=? WHERE user_id=?",
        JSON.stringify(p),
        uid,
      );
    }
    return json({ ok: true });
  }
  if (method === "POST" && path === "/api/media") {
    const b = await body(req, 7500000);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(b.mime) ||
      typeof b.data !== "string"
    )
      fail("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
    let bytes;
    try {
      bytes = Uint8Array.from(atob(b.data), (c) => c.charCodeAt(0));
    } catch {
      fail("Ảnh không hợp lệ");
    }
    if (bytes.length > 5 * 1024 * 1024 || bytes.length < 12)
      fail("Ảnh tối đa 5MB.");
    const ok =
      b.mime === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216
        : b.mime === "image/png"
          ? bytes[0] === 137 &&
            bytes[1] === 80 &&
            bytes[2] === 78 &&
            bytes[3] === 71
          : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
            String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!ok) fail("Nội dung ảnh không khớp định dạng.");
    const id = crypto.randomUUID();
    await env.MEDIA.put("media/" + uid + "/" + id, bytes, {
      httpMetadata: { contentType: b.mime },
    });
    await run(
      env,
      "INSERT INTO media(id,user_id,mime,size) VALUES(?,?,?,?)",
      id,
      uid,
      b.mime,
      bytes.length,
    );
    return json({ id }, 201);
  }
  const mediaMatch = path.match(/^\/api\/media\/([\w-]+)$/);
  if (method === "GET" && mediaMatch) {
    const row = await one(
      env,
      "SELECT mime FROM media WHERE id=? AND user_id=?",
      mediaMatch[1],
      uid,
    );
    if (!row) fail("Không tìm thấy ảnh", 404);
    const object = await env.MEDIA.get("media/" + uid + "/" + mediaMatch[1]);
    if (!object) fail("Không tìm thấy ảnh", 404);
    return new Response(object.body, {
      headers: {
        "content-type": row.mime,
        "cache-control": "private, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  }
  if (method === "POST" && path === "/api/progress") {
    const b = await body(req);
    if (!["plan", "challenge", "experiment"].includes(b.kind))
      fail("Loại thành tích không hợp lệ");
    let id = String(b.itemId ?? "");
    if (b.kind === "plan" && !/^(?:[1-9]|[12]\d|30)$/.test(id))
      fail("Ngày không hợp lệ");
    if (b.kind === "challenge" && !recipes.some((r) => r.id === id))
      fail("Món ăn không hợp lệ");
    if (b.kind === "experiment" && !experiments.some((e) => e.id === id))
      fail("Thí nghiệm không hợp lệ");
    await imageOwned(env, uid, b.imageId);
    const awarded = await award(
      env,
      uid,
      b.kind,
      id,
      { imageId: text(b.imageId, 100), note: text(b.note, 500) },
      b.kind === "challenge" ? 30 : 15,
    );
    return json({ ok: true, awarded });
  }
  if (method === "PUT" && path === "/api/settings") {
    const b = await body(req);
    const s = {
      sound: !!b.sound,
      pushEnabled: !!b.pushEnabled,
      autoBackup: !!b.autoBackup,
      disabled: Array.isArray(b.disabled)
        ? b.disabled.filter((v) =>
            [
              "breakfast",
              "lunch",
              "snack",
              "dinner",
              "water",
              "checkin",
              "streak",
            ].includes(v),
          )
        : [],
    };
    await run(
      env,
      "INSERT INTO settings(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data",
      uid,
      JSON.stringify(s),
    );
    return json(s);
  }
  if (method === "GET" && path === "/api/chat")
    return json({
      messages: await all(
        env,
        "SELECT id,role,content,created_at FROM (SELECT rowid,id,role,content,created_at FROM chats WHERE user_id=? ORDER BY rowid DESC LIMIT 200) ORDER BY rowid",
        uid,
      ),
    });
  if (method === "DELETE" && path === "/api/chat") {
    await run(env, "DELETE FROM chats WHERE user_id=?", uid);
    return json({ ok: true });
  }
  if (method === "POST" && path.startsWith("/api/ai/")) {
    await limit(env, "ai:" + uid, 15, 3600000);
    const b = await body(req),
      p = await profileOf(env, uid);
    if (path === "/api/ai/meal") {
      const image = b.imageId ? await getImage(env, uid, b.imageId) : null;
      if (!image && !text(b.name, 300)) fail("Nhập tên món hoặc chọn ảnh");
      return json({ analysis: await analyzeMeal(env, b, p, image) });
    }
    if (path === "/api/ai/profile") {
      if (!p) fail("Bạn cần hoàn tất hồ sơ");
      const analysis = await profileAnalysis(env, p);
      p.analysis = analysis;
      await run(
        env,
        "UPDATE profiles SET data=? WHERE user_id=?",
        JSON.stringify(p),
        uid,
      );
      return json({ analysis });
    }
    if (path === "/api/ai/plan") {
      if (!p) fail("Bạn cần hoàn tất hồ sơ");
      const plan = await generatePlan(env, p);
      await run(
        env,
        "INSERT INTO plans(user_id,data,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at",
        uid,
        JSON.stringify(plan),
        new Date().toISOString(),
      );
      return json({ plan });
    }
    if (path === "/api/ai/chat") {
      const message = text(b.message, 2000);
      if (!message) fail("Nhập câu hỏi");
      const history = await all(
        env,
        "SELECT role,content FROM chats WHERE user_id=? ORDER BY rowid DESC LIMIT 12",
        uid,
      );
      const answer = await gemini(
        env,
        "Hội thoại trước: " +
          JSON.stringify(history.reverse()) +
          "\nCâu hỏi mới: " +
          message,
        { profile: p },
      );
      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO chats(id,user_id,role,content) VALUES(?,?,'user',?)",
        ).bind(crypto.randomUUID(), uid, message),
        env.DB.prepare(
          "INSERT INTO chats(id,user_id,role,content) VALUES(?,?,'assistant',?)",
        ).bind(crypto.randomUUID(), uid, answer),
      ]);
      return json({ answer });
    }
  }
  if (method === "GET" && path === "/api/admin/gemini")
    return json(
      publicKeyStatus(
        await one(env, "SELECT * FROM integrations WHERE id='gemini'"),
      ),
    );
  if (method === "PUT" && path === "/api/admin/gemini") {
    await limit(env, "rotate:" + uid, 6, 3600000);
    const b = await body(req);
    if (typeof b.key !== "string" || b.key.length < 20 || b.key.length > 200)
      fail("Khóa Gemini chưa hợp lệ.");
    const model = text(b.model ?? env.GEMINI_MODEL, 100);
    if (!/^gemini-[a-zA-Z0-9.-]+$/.test(model)) fail("Tên model không hợp lệ.");
    let check;
    try {
      check = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
        {
          headers: { "x-goog-api-key": b.key },
          signal: AbortSignal.timeout(20000),
        },
      );
    } catch {
      fail("Không thể kiểm tra khóa với Google. Chưa thay khóa cũ.", 502);
    }
    if (!check.ok)
      fail("Google không chấp nhận khóa này. Chưa thay khóa cũ.", 400);
    const models = await check.json();
    if (
      !models.models?.some(
        (m) =>
          m.name === "models/" + model &&
          m.supportedGenerationMethods?.includes("generateContent"),
      )
    )
      fail("Khóa không truy cập được model đã chọn. Chưa thay khóa cũ.");
    const ciphertext = await encryptSecret(b.key, env.ENCRYPTION_KEY),
      updatedAt = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO integrations(id,ciphertext,model,updated_at) VALUES('gemini',?,?,?) ON CONFLICT(id) DO UPDATE SET ciphertext=excluded.ciphertext,model=excluded.model,updated_at=excluded.updated_at",
      ).bind(ciphertext, model, updatedAt),
      env.DB.prepare(
        "INSERT INTO audit(id,user_id,event) VALUES(?,?,'gemini_key_rotated')",
      ).bind(crypto.randomUUID(), uid),
    ]);
    return json({ configured: true, updatedAt, model });
  }
  if (method === "POST" && path === "/api/backup") {
    const id = await backupUser(env, uid);
    return json({ id, createdAt: new Date().toISOString() });
  }
  const backupMatch = path.match(/^\/api\/backup\/([\w-]+)$/);
  if (method === "GET" && backupMatch) {
    if (
      !(await one(
        env,
        "SELECT id FROM backups WHERE id=? AND user_id=?",
        backupMatch[1],
        uid,
      ))
    )
      fail("Không tìm thấy bản sao lưu", 404);
    const obj = await env.MEDIA.get(
      "backup/" + uid + "/" + backupMatch[1] + ".json",
    );
    if (!obj) fail("Không tìm thấy bản sao lưu", 404);
    return new Response(obj.body, {
      headers: {
        "content-type": "application/json",
        "content-disposition": 'attachment; filename="nutri-backup.json"',
        "cache-control": "no-store",
      },
    });
  }
  if (method === "POST" && path === "/api/push/subscribe") {
    const b = await body(req);
    if (!b.endpoint || !b.keys?.p256dh || !b.keys?.auth)
      fail("Đăng ký thông báo không hợp lệ");
    let endpoint;
    try {
      endpoint = new URL(b.endpoint);
    } catch {
      fail("Địa chỉ thông báo không hợp lệ");
    }
    if (
      endpoint.protocol !== "https:" ||
      ![
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
      ].some(
        (h) => endpoint.hostname === h || endpoint.hostname.endsWith("." + h),
      )
    )
      fail("Nhà cung cấp thông báo chưa được hỗ trợ.");
    await run(
      env,
      "INSERT INTO push_subscriptions(id,user_id,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id,data=excluded.data",
      await digest(b.endpoint),
      uid,
      JSON.stringify(b),
    );
    return json({ ok: true });
  }
  if (method === "POST" && path === "/api/push/unsubscribe") {
    const b = await body(req);
    if (b.endpoint)
      await run(
        env,
        "DELETE FROM push_subscriptions WHERE user_id=? AND id=?",
        uid,
        await digest(String(b.endpoint)),
      );
    else await run(env, "DELETE FROM push_subscriptions WHERE user_id=?", uid);
    return json({ ok: true });
  }
  if (method === "POST" && path === "/api/push/test") {
    await limit(env, "push:" + uid, 5, 3600000);
    const sent = await pushUser(
      env,
      uid,
      "NuTri Teens",
      "Thông báo thử đã đến. Chúc bạn một ngày cân bằng!",
    );
    return json({ sent });
  }
  fail("Không tìm thấy chức năng.", 404);
}
export default {
  async fetch(req, env, ctx) {
    try {
      return await route(req, env, ctx);
    } catch (e) {
      return json(
        {
          error: e.status
            ? e.message
            : e.message?.includes("không hợp lệ") ||
                e.message?.startsWith("Nhập ")
              ? e.message
              : "Không xử lý được yêu cầu. Vui lòng thử lại.",
        },
        e.status ?? 400,
      );
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(scheduledTasks(env));
  },
};
