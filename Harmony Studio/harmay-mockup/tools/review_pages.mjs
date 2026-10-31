// Kiểm tra toàn bộ 6 trang ở 1440px và 375px + menu toàn màn hình + modal xem nhanh + lọc + form.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [round = 'pages-r1'] = process.argv.slice(2);
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots', round);
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html;charset=utf-8', '.css': 'text/css;charset=utf-8', '.js': 'application/javascript;charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const fp = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return; }
  const st = fs.statSync(fp);
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream', 'Content-Length': st.size });
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}/`;

const pages = [
  ['collections', 'bo-suu-tap.html'],
  ['detail-rouge', 'chi-tiet-bo-suu-tap.html?id=rouge'],
  ['detail-flora', 'chi-tiet-bo-suu-tap.html?id=flora'],
  ['services', 'dich-vu.html'],
  ['about', 'gioi-thieu.html'],
  ['contact', 'lien-he.html?nhu-cau=dat-may&look=04'],
];

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });

for (const [lbl, W, H] of [['d', 1440, 900], ['m', 375, 812]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, isMobile: W < 600, hasTouch: W < 600 });
  await ctx.addInitScript(() => sessionStorage.setItem('hm_intro', '1'));
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('ERR', lbl, e.message));

  for (const [name, url] of pages) {
    await p.goto(base + url, { waitUntil: 'load' });
    await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(OUT, `${lbl}-${name}-top.png`) });
    const maxY = await p.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    await p.evaluate(y => window.scrollTo(0, y), Math.round(maxY * 0.45));
    await p.waitForTimeout(450);
    await p.screenshot({ path: path.join(OUT, `${lbl}-${name}-mid.png`) });
  }

  // mở menu và modal trên desktop
  if (lbl === 'd') {
    await p.goto(base + 'index.html', { waitUntil: 'load' });
    await p.waitForTimeout(700);
    await p.click('#menuBtn');
    await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(OUT, 'd-menu.png') });
    await p.click('#menuBtn');
    await p.waitForTimeout(700);

    await p.goto(base + 'chi-tiet-bo-suu-tap.html?id=rouge', { waitUntil: 'load' });
    await p.waitForTimeout(700);
    await p.click('[data-open-look="04"]');
    await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(OUT, 'd-modal.png') });
  }
  await ctx.close();
}

await browser.close();
srv.close();
console.log('all pages checked');
