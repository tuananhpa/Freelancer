import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { app } from '../src/index';

// Mọi endpoint của backend Java (docs/ENDPOINTS.md) phải có route tương ứng
it('đủ 256 endpoint của Java', () => {
  const norm = (p: string) => p.replace(/\{[^}]+\}|:[A-Za-z]+(\{[^}]*\})?/g, '*').replace(/\/$/, '');
  const have = new Set(app.routes.filter((r) => r.method !== 'ALL').map((r) => `${r.method} ${norm(r.path)}`));
  const want = [...readFileSync('docs/ENDPOINTS.md', 'utf8').matchAll(/^\| (GET|POST|PUT|PATCH|DELETE) \| `([^`]+)`/gm)].map((m) => `${m[1]} ${norm(m[2])}`);
  expect(want.length).toBe(256);
  expect(want.filter((w) => !have.has(w))).toEqual([]);
});
