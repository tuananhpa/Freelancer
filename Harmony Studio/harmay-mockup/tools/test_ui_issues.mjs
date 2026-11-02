import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs/screenshots/ui_debug');
fs.mkdirSync(outDir, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.json': 'application/json'
};

const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const fp = path.join(root, u === '/' ? 'index.html' : u);
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port;
  const base = 'http://127.0.0.1:' + port;
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Index Chapters (Rouge)
  await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const chapter1 = await page.$('.chapter');
  if (chapter1) {
    await chapter1.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '01-rouge-chapter.png') });
    console.log('01-rouge-chapter captured');
  }

  // 1b. Bo suu tap
  await page.goto(base + '/bo-suu-tap.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const clItem = await page.$('.cl-item');
  if (clItem) {
    await clItem.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(outDir, '01b-bo-suu-tap-rouge.png') });
  console.log('01b-bo-suu-tap-rouge captured');

  // 2. Services sticky tabs
  await page.goto(base + '/dich-vu.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 650));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '02-services-scroll.png') });
  console.log('02-services-scroll captured');

  // 3. Collection detail Look 05
  await page.goto(base + '/chi-tiet-bo-suu-tap.html?id=creme', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const look05 = await page.$('.lb-item');
  if (look05) {
    await look05.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '03-look-05.png') });
    console.log('03-look-05 captured');
  }

  // 4. Footer
  const footer = await page.$('#footer');
  if (footer) {
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '04-footer.png') });
    console.log('04-footer captured');
  }

  await browser.close();
  srv.close();
  process.exit(0);
});
