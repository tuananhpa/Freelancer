import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
const base = process.env.BASE_URL || "http://127.0.0.1:8788";
let checks = 0;
const check = (test, message) => {
  assert.ok(test, message);
  checks++;
};
async function call(path, method = "GET", body, cookie = "") {
  const r = await fetch(base + "/api" + path, {
    method,
    headers: {
      "content-type": "application/json",
      "x-nutri-request": "1",
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await r.json();
  return {
    status: r.status,
    data,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
const suffix = randomBytes(5).toString("hex"),
  password = randomBytes(16).toString("base64url");
const profile = { name: "Kiểm thử", age: 14, height: 155, weight: 46 };
const a = await call("/auth/register", "POST", {
  username: "qa_a_" + suffix,
  password,
  profile,
});
check(a.status === 200, "create account A");
check(a.data.user.role === "user", "public registration never promotes admin");
const b = await call("/auth/register", "POST", {
  username: "qa_b_" + suffix,
  password,
  profile,
});
check(b.status === 200, "create account B");
let r = await call("/state", "GET", undefined, a.cookie);
check(
  r.status === 200 && r.data.meals.length === 0 && r.data.rewards.xp === 0,
  "new account starts empty",
);
const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Saigon",
}).format(new Date());
const meal = {
  name: "Cơm thử",
  date,
  time: "12:00",
  slot: "lunch",
  kcal: 420,
  protein: 20,
  carbs: 55,
  fat: 12,
  portion: "1 bát",
};
r = await call("/meals", "POST", meal, a.cookie);
check(r.status === 201, "create real persisted meal");
const mealId = r.data.meal.id;
r = await call("/meals/" + mealId, "PUT", { ...meal, kcal: 430 }, b.cookie);
check(r.status === 404, "other account cannot edit meal");
r = await call("/meals/" + mealId, "DELETE", undefined, b.cookie);
check(r.status === 404, "other account cannot delete meal");
r = await call("/state", "GET", undefined, b.cookie);
check(r.data.meals.length === 0, "other account cannot read meal");
r = await call("/meals", "POST", { ...meal, kcal: -1 }, a.cookie);
check(r.status === 400, "negative nutrition rejected");
r = await call("/meals", "POST", { ...meal, date: "2020-01-01" }, a.cookie);
check(r.status === 201, "historical meal saved");
r = await call("/state", "GET", undefined, a.cookie);
check(
  r.data.meals.some((m) => m.date === "2020-01-01"),
  "historical meal remains readable",
);
r = await call(
  "/profile",
  "PUT",
  { ...r.data.profile, analysis: {} },
  a.cookie,
);
check(
  r.status === 200 && !r.data.profile.analysis,
  "forged profile analysis discarded",
);
await Promise.all(
  Array.from({ length: 4 }, () =>
    call("/water", "POST", { delta: 250, date }, a.cookie),
  ),
);
r = await call("/state", "GET", undefined, a.cookie);
check(
  r.data.water.find((w) => w.date === date)?.ml === 1000,
  "atomic concurrent water updates",
);
const xp = r.data.rewards.xp;
await call("/progress", "POST", { kind: "challenge", itemId: "pho" }, a.cookie);
await call("/progress", "POST", { kind: "challenge", itemId: "pho" }, a.cookie);
r = await call("/state", "GET", undefined, a.cookie);
check(r.data.rewards.xp === xp + 30, "challenge reward idempotent");
r = await call("/progress", "POST", { kind: "plan", itemId: "31" }, a.cookie);
check(r.status === 400, "invalid plan day rejected");
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
r = await call("/media", "POST", { mime: "image/png", data: png }, a.cookie);
check(r.status === 201, "private image upload");
const imageId = r.data.id;
let raw = await fetch(base + "/api/media/" + imageId, {
  headers: { cookie: b.cookie },
});
check(raw.status === 404, "other user cannot read image");
r = await call("/meals", "POST", { ...meal, imageId }, b.cookie);
check(r.status === 403, "other user cannot attach private image");
r = await call(
  "/media",
  "POST",
  {
    mime: "image/png",
    data: Buffer.from("not an image at all").toString("base64"),
  },
  a.cookie,
);
check(r.status === 400, "file signature mismatch rejected");
r = await call("/backup", "POST", {}, a.cookie);
check(r.status === 200, "private backup created");
const backup = r.data.id;
raw = await fetch(base + "/api/backup/" + backup, {
  headers: { cookie: a.cookie },
});
const exported = await raw.json();
check(
  raw.status === 200 && !JSON.stringify(exported).includes("password_hash"),
  "backup excludes credentials",
);
raw = await fetch(base + "/api/backup/" + backup, {
  headers: { cookie: b.cookie },
});
check(raw.status === 404, "other user cannot read backup");
r = await call("/admin/gemini", "GET", undefined, a.cookie);
check(r.status === 403, "ordinary user blocked from admin key status");
r = await call("/admin/gemini", "PUT", { key: "not-a-real-key" }, a.cookie);
check(r.status === 403, "ordinary user cannot rotate key");
r = await call("/ai/chat", "POST", { message: "Xin chào" }, a.cookie);
check(r.status === 503, "unconfigured AI has honest unavailable response");
r = await call(
  "/push/subscribe",
  "POST",
  { endpoint: "https://example.com/private", keys: { p256dh: "x", auth: "x" } },
  a.cookie,
);
check(r.status === 400, "push endpoint SSRF blocked");
const vars = readFileSync(".dev.vars", "utf8"),
  admin = vars.match(/ADMIN_USERNAME="([^"]+)"/)[1],
  adminPassword = vars.match(/ADMIN_PASSWORD="([^"]+)"/)[1];
r = await call("/auth/login", "POST", {
  username: admin,
  password: adminPassword,
});
check(r.status === 200 && r.data.user.role === "admin", "admin login");
const adminCookie = r.cookie;
r = await call("/admin/gemini", "GET", undefined, adminCookie);
check(
  r.status === 200 && !("key" in r.data) && !("ciphertext" in r.data),
  "admin response never exposes key",
);
r = await call("/admin/gemini", "PUT", { key: "short" }, adminCookie);
check(r.status === 400, "invalid new key rejected");
raw = await fetch(base + "/cdn-cgi/local/explorer/api/d1/database");
check(raw.status === 404, "gateway blocks dev database explorer");
raw = await fetch(base + "/cdn-cgi/local/scheduled");
check(raw.status === 404, "gateway blocks dev scheduler");
raw = await fetch(base + "/.dev.vars");
check(raw.status === 404, "gateway blocks secrets path");
raw = await fetch(base + "/api/water", {
  method: "POST",
  headers: {
    origin: "https://evil.example",
    "content-type": "application/json",
    "x-nutri-request": "1",
    cookie: a.cookie,
  },
  body: '{"delta":250}',
});
check(raw.status === 403, "gateway rejects cross origin writes");
r = await call("/auth/logout", "POST", {}, a.cookie);
check(r.status === 200, "logout");
r = await call("/state", "GET", undefined, a.cookie);
check(r.status === 401, "logged out token invalidated");
console.log("API integration: " + checks + " checks passed.");
