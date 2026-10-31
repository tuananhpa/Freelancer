import type { Bindings } from './types';

const norm = (params: unknown[]) => params.map((p) => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p));

export const one = async <T = any>(env: Bindings, sql: string, ...params: unknown[]) =>
  (await env.DB.prepare(sql).bind(...norm(params)).first<T>()) ?? null;

export const all = async <T = any>(env: Bindings, sql: string, ...params: unknown[]) =>
  (await env.DB.prepare(sql).bind(...norm(params)).all<T>()).results;

export const run = (env: Bindings, sql: string, ...params: unknown[]) => env.DB.prepare(sql).bind(...norm(params)).run();

/** Nhiều câu ghi trong một giao dịch D1 */
export const batch = (env: Bindings, stmts: [string, ...unknown[]][]) =>
  env.DB.batch(stmts.map(([sql, ...p]) => env.DB.prepare(sql).bind(...norm(p))));

export const count = async (env: Bindings, sql: string, ...params: unknown[]) =>
  Number((await one<{ n: number }>(env, sql, ...params))?.n ?? 0);

/** "IN (?,?,?)" an toàn cho danh sách id */
export const inList = (n: number) => (n ? `(${Array(n).fill('?').join(',')})` : '(NULL)');

export const parseJson = <T = any>(v: unknown, fallback: T): T => {
  if (v == null || v === '') return fallback;
  if (typeof v !== 'string') return v as T;
  try { return JSON.parse(v) as T; } catch { return fallback; }
};

/** UUID v4 sinh trong SQL, dùng khi INSERT ... SELECT nhiều dòng (mỗi dòng một id) */
export const SQL_UUID = "lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + abs(random()) % 4, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))";
