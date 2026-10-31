// Server tĩnh + chụp các điểm cuộn + ghi video cuộn trang (1440px và 375px).
// Usage: node tools/review.mjs <roundName> [page=index.html]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [round = 'r1', pagePath = 'index.html'] = process.argv.slice(2);
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots', round);
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html;charset=utf-8', '.css': 'text/css;charset=utf-8', '.js': 'application/javascript;charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const fp = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return; }
  const st = fs.statSync(fp);
  const ext = path.extname(fp);
  const range = req.headers.range;
  if (range && ext === '.mp4') {
    const [s, e] = range.replace(/bytes=/, '').split('-');
    const start = +s, end = e ? +e : st.size - 1;
    res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': 'video/mp4' });
    fs.createReadStream(fp, { start, end }).pipe(res); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size });
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const port = srv.address().port;
const base = `http://127.0.0.1:${port}/${pagePath}`;

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });

for (const [label, W, H] of [['desktop', 1440, 900], ['mobile', 375, 812]]) {
  const mobile = W < 600;
  // 1) chụp intro (tại 0.7s)
  if (pagePath === 'index.html' && label === 'desktop') {
    const c0 = await browser.newContext({ viewport: { width: W, height: H } });
    const p0 = await c0.newPage();
    await p0.goto(base + '?intro=1', { waitUntil: 'load' });
    await p0.waitForTimeout(750);
    await p0.screenshot({ path: path.join(OUT, 'intro.png') });
    await c0.close();
  }

  // 2) chụp các điểm cuộn + ghi video cuộn từ đầu đến cuối
  const vdir = path.join(OUT, `_v_${label}`);
  fs.mkdirSync(vdir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, isMobile: mobile, hasTouch: mobile,
    recordVideo: { dir: vdir, size: { width: W, height: H } },
  });
  await ctx.addInitScript(() => sessionStorage.setItem('hm_intro', '1'));
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(`[${label}] PAGEERROR`, e.message));
  page.on('console', m => { if (m.type() === 'error') console.log(`[${label}] CONSOLE`, m.text()); });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(1400);

  // kiểm tra cận cảnh câu tiếng Việt ở lần đầu
  if (label === 'desktop' && pagePath === 'index.html') {
    const el = page.locator('.manifesto__lbl p');
    if (await el.count()) await el.screenshot({ path: path.join(OUT, 'vn-type-check.png') });
  }

  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const stops = [0, 0.06, 0.14, 0.24, 0.36, 0.5, 0.62, 0.76, 0.88, 0.96, 1];
  for (let i = 0; i < stops.length; i++) {
    const y = Math.round(maxY * stops[i]);
    await page.evaluate(to => window.scrollTo(0, to), y);
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(OUT, `${label}-${String(i).padStart(2, '0')}.png`) });
  }

  // cuộn mượt từ đầu đến cuối để ghi video
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  const steps = 60;
  for (let s = 1; s <= steps; s++) {
    const y = Math.round(maxY * (s / steps));
    await page.evaluate(to => window.scrollTo(0, to), y);
    await page.waitForTimeout(75);
  }
  await page.waitForTimeout(500);
  const vpath = await page.video().path();
  await ctx.close();
  const dest = path.join(OUT, `scroll-${label}.webm`);
  fs.copyFileSync(vpath, dest);
  fs.rmSync(vdir, { recursive: true, force: true });
  console.log(label, 'maxY=', maxY, 'video=', path.basename(dest));
}

await browser.close();
srv.close();
