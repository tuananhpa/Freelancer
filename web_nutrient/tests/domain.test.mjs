import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMeal,
  validateProfile,
  mergeProfile,
  dayKey,
  summarize,
  advanceStreak,
} from "../worker/domain.mjs";
import {
  hashPassword,
  verifyPassword,
  encryptSecret,
  decryptSecret,
  publicKeyStatus,
} from "../worker/security.mjs";
test("meal validation rejects negative energy and invalid dates", () => {
  assert.throws(() =>
    validateMeal({
      name: "Cơm",
      kcal: -1,
      protein: 2,
      carbs: 3,
      fat: 1,
      date: "2026-10-14",
      slot: "lunch",
      time: "12:00",
    }),
  );
  assert.throws(() =>
    validateMeal({
      name: "Cơm",
      kcal: 100,
      date: "2026-02-31",
      slot: "lunch",
      time: "12:00",
    }),
  );
});
test("profile validation rejects impossible dimensions and oversized goal", () => {
  assert.throws(() =>
    validateProfile({ name: "A", age: 14, height: 0, weight: 46 }),
  );
  assert.throws(() =>
    validateProfile({
      name: "A",
      age: 14,
      height: 155,
      weight: 46,
      waterTarget: 2000000,
    }),
  );
});
test("timezone changes date at Vietnam midnight", () => {
  assert.equal(dayKey(new Date("2026-10-13T17:01:00Z")), "2026-10-14");
});
test("summary totals genuine entries without fabricated values", () => {
  assert.deepEqual(
    summarize(
      [
        { kcal: 100, protein: 8, carbs: 10, fat: 3 },
        { kcal: 200, protein: 12, carbs: 20, fat: 7 },
      ],
      500,
    ),
    { kcal: 300, protein: 20, carbs: 30, fat: 10, water: 500 },
  );
});
test("streak is idempotent on same date and resets after a missed day", () => {
  assert.equal(advanceStreak("2026-10-13", "2026-10-14", 4), 5);
  assert.equal(advanceStreak("2026-10-14", "2026-10-14", 4), 4);
  assert.equal(advanceStreak("2026-10-11", "2026-10-14", 4), 1);
});
test("salted password verifies only the correct password", async () => {
  const h = await hashPassword("test-password-123");
  assert.equal(await verifyPassword("test-password-123", h), true);
  assert.equal(await verifyPassword("incorrect", h), false);
  assert.notEqual(h, await hashPassword("test-password-123"));
});
test("AES ciphertext cannot expose plaintext and roundtrips only with correct root key", async () => {
  const root = Buffer.alloc(32, 17).toString("base64");
  const value = await encryptSecret("not-a-real-provider-key", root);
  assert.ok(!value.includes("not-a-real"));
  assert.equal(await decryptSecret(value, root), "not-a-real-provider-key");
  await assert.rejects(() =>
    decryptSecret(value, Buffer.alloc(32, 18).toString("base64")),
  );
});
test("public key status never exposes secret fields", () => {
  assert.deepEqual(
    publicKeyStatus({
      ciphertext: "secret",
      updated_at: "2026-10-14",
      model: "gemini-test",
    }),
    { configured: true, updatedAt: "2026-10-14", model: "gemini-test" },
  );
});
test("profile ignores client-forged analysis and preserves server analysis when inputs unchanged", () => {
  const base = validateProfile({ name: "A", age: 14, height: 155, weight: 46 });
  const analysis = {
    summary: "server",
    nutrition: [],
    movement: [],
    habits: [],
    cautions: [],
  };
  const existing = { ...base, analysis };
  assert.equal(validateProfile({ ...base, analysis: {} }).analysis, undefined);
  assert.deepEqual(
    mergeProfile(existing, { ...base, name: "B", analysis: {} }).analysis,
    analysis,
  );
  assert.equal(
    mergeProfile(existing, { ...base, allergies: "milk" }).analysis,
    undefined,
  );
});
