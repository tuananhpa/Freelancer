const enc = new TextEncoder();
const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export async function digest(s) {
  return b64(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}
export function token() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
}
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256,
  );
  return "pbkdf2$100000$" + b64(salt) + "$" + b64(hash);
}
export async function verifyPassword(password, stored) {
  try {
    const [, iterations, salt, hash] = stored.split("$");
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const result = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: unb64(salt),
        iterations: Number(iterations),
        hash: "SHA-256",
      },
      key,
      256,
    );
    return constantEqual(b64(result), hash);
  } catch {
    return false;
  }
}
export function constantEqual(a, b) {
  if (a.length !== b.length) return false;
  let n = 0;
  for (let i = 0; i < a.length; i++) n |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return n === 0;
}
async function aes(root) {
  if (!root) throw new Error("Thiếu khóa mã hóa server");
  return crypto.subtle.importKey("raw", unb64(root), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
export async function encryptSecret(value, root) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await aes(root),
    enc.encode(value),
  );
  return b64(iv) + "." + b64(data);
}
export async function decryptSecret(value, root) {
  const [iv, data] = value.split(".");
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: unb64(iv) },
      await aes(root),
      unb64(data),
    ),
  );
}
export function publicKeyStatus(row) {
  return {
    configured: !!row?.ciphertext,
    updatedAt: row?.updated_at ?? null,
    model: row?.model ?? null,
  };
}
