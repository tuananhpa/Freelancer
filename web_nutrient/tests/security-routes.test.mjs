import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";
const request = (path, options = {}) =>
  new Request("https://nutri.example" + path, options);
test("private state rejects missing authentication", async () => {
  const r = await worker.fetch(request("/api/state"), {}, {});
  assert.equal(r.status, 401);
});
test("admin key status rejects unauthenticated reads", async () => {
  const r = await worker.fetch(request("/api/admin/gemini"), {}, {});
  assert.equal(r.status, 401);
  assert.equal(JSON.stringify(await r.json()).includes("ciphertext"), false);
});
test("cross origin mutation is denied before database access", async () => {
  const r = await worker.fetch(
    request("/api/water", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        "content-type": "application/json",
        "x-nutri-request": "1",
      },
      body: '{"delta":250}',
    }),
    {},
    {},
  );
  assert.equal(r.status, 403);
});
test("browser mutation without custom header is denied", async () => {
  const r = await worker.fetch(
    request("/api/auth/register", {
      method: "POST",
      headers: {
        origin: "https://nutri.example",
        "content-type": "application/json",
      },
      body: "{}",
    }),
    {},
    {},
  );
  assert.equal(r.status, 403);
});
test("public health check carries no secrets", async () => {
  const r = await worker.fetch(request("/api/health"), {}, {});
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, storage: "cloudflare-d1-r2" });
});
