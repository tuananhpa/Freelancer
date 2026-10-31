import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { passwordHash } from './worker.mjs';

test('D1 demo: authentication, content, orders, media and password rotation', async () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const db = { prepare(sql) {
    let args = [];
    return { bind(...values) { args = values.map(v => v instanceof ArrayBuffer ? new Uint8Array(v) : v); return this; },
      async first() { return sqlite.prepare(sql).get(...args) || null; },
      async all() { return { results: sqlite.prepare(sql).all(...args) }; },
      async run() { return sqlite.prepare(sql).run(...args); } };
  } };
  const env = { DB: db, ASSETS: { fetch: () => new Response('asset') } };
  let token = '';
  async function request(path, method = 'GET', data, auth = true) {
    const headers = { 'content-type': 'application/json', 'x-eser-admin': '1' };
    if (auth) headers.cookie = token;
    return worker.fetch(new Request('https://demo.test' + path, { method, headers, body: data === undefined ? undefined : JSON.stringify(data) }), env);
  }
  const salt = 'test-salt';
  await db.prepare('INSERT INTO state VALUES (?,?)').bind('auth', JSON.stringify({ salt, hash: await passwordHash('test-password', salt) })).run();
  assert.equal((await request('/api/content')).status, 401);
  assert.equal((await request('/api/login', 'POST', { password: 'wrong' })).status, 401);
  const login = await request('/api/login', 'POST', { password: 'test-password' });
  assert.equal(login.status, 200); token = login.headers.get('set-cookie').split(';')[0];
  const content = await (await request('/api/content')).json();
  content.site.title = 'D1 test';
  assert.equal((await request('/api/content', 'PUT', content)).status, 200);
  assert.equal((await (await request('/api/content')).json()).site.title, 'D1 test');
  assert.match(await (await request('/')).text(), /<!doctype html>/i);
  assert.equal((await request('/api/inquiries', 'POST', { name: 'Test', phone: 'bad' }, false)).status, 400);
  const product = content.products[0];
  assert.equal((await request('/api/inquiries', 'POST', { name: 'Test', phone: '0901234567', items: [{ id: product.id, qty: 2, price: 1 }] }, false)).status, 200);
  const records = await (await request('/api/inquiries')).json();
  assert.equal(records[0].total, Number(product.price) * 2);
  const id = records[0].id;
  assert.equal((await request('/api/inquiries/' + id, 'PATCH', { status: 'done' })).status, 200);
  const upload = await request('/api/upload', 'POST', { data: 'data:image/png;base64,iVBORw0KGgo=' });
  assert.equal(upload.status, 200);
  const file = (await upload.json()).url;
  assert.equal((await request(file)).status, 200);
  assert.equal((await request('/api/media?file=' + file, 'DELETE')).status, 200);
  assert.equal((await request('/api/inquiries/' + id, 'DELETE')).status, 200);
  assert.equal((await request('/api/password', 'POST', { current: 'test-password', next: 'new-password' })).status, 200);
  assert.equal((await request('/api/content')).status, 401);
  assert.equal((await request('/api/login', 'POST', { password: 'new-password' })).status, 200);
  sqlite.close();
});
