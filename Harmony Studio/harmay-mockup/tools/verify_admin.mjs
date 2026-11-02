import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs/screenshots/admin');
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

  // 1. Check Login Screen
  await page.goto(base + '/admin.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '01-login-screen.png') });
  console.log('01-login-screen captured');

  // 2. Perform Login with Admin / admin123@
  await page.fill('#loginPass', 'admin123@');
  await page.click('#loginSubmitBtn');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '02-dashboard.png') });
  console.log('02-dashboard captured');

  // 3. Switch to Looks Tab
  await page.click('[data-tab="looks"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '03-looks-manager.png') });
  console.log('03-looks-manager captured');

  // 4. Switch to Studio AI Tab
  await page.click('[data-tab="studio-ai"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '04-studio-ai.png') });
  console.log('04-studio-ai captured');

  // 5. Switch to Collections Tab
  await page.click('[data-tab="collections"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '05-collections.png') });
  console.log('05-collections captured');

  // 6. Switch to Content Tab
  await page.click('[data-tab="content"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '06-content.png') });
  console.log('06-content captured');

  // 7. Switch to Settings Tab
  await page.click('[data-tab="settings"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '07-settings.png') });
  console.log('07-settings captured');

  await browser.close();
  srv.close();
  console.log('All admin screenshots captured successfully!');
});
