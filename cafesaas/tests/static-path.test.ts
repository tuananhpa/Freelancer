import {it,expect} from 'vitest';import {resolvePublicPath} from '../scripts/static-path.mjs';
it('serves deep app routes as SPA and assets directly',()=>{expect(resolvePublicPath('/admin/dashboard')).toBe('index.html');expect(resolvePublicPath('/order/opaque')).toBe('index.html');expect(resolvePublicPath('/assets/index-ab12.js')).toBe('assets/index-ab12.js')});
it('rejects source, secrets, backend and traversal paths',()=>{for(const p of ['/src/main.ts','/package.json','/.env','/api/v1/me','/%2e%2e/secret','/assets/..%5c.env','/../PLAN.md'])expect(resolvePublicPath(p)).toBe(null)});

it('serves the public app shell used by service-worker precache',()=>expect(resolvePublicPath('/index.html')).toBe('index.html'));
