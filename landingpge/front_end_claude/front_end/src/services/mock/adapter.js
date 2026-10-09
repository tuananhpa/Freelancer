/**
 * Mock adapter: giả lập backend REST bằng localStorage.
 * Mỗi route tương ứng 1 endpoint trong docs/API_CONTRACT.md.
 */
import { ApiError } from '@/services/http/ApiError';
import { loadDb, saveDb } from './db';
import { publicRoutes, requireAdmin } from './routes.public';
import { adminRoutes } from './routes.admin';

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => (v === undefined || v === null ? v : structuredClone(v));

const compiled = [...publicRoutes, ...adminRoutes].map(([method, pattern, handler]) => {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
  return { method, re, keys, handler };
});

export async function mockAdapter({ method, path, body, query, token }) {
  await delay();
  const db = loadDb();
  for (const r of compiled) {
    if (r.method !== method) continue;
    const m = path.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    if (path.startsWith('/admin')) requireAdmin(token);
    const result = r.handler({ db, params, body: clone(body), query, token });
    saveDb();
    return clone(result);
  }
  throw new ApiError(`Mock: chưa có route ${method} ${path}`, 404);
}
