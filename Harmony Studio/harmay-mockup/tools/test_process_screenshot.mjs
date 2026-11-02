import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs/screenshots/ui_debug');

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

  await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Scroll to process section and click step 4 node
  const proc = await page.$('#process');
  if (proc) {
    await proc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Switch to step 4
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.process__nodes span');
      if (nodes[3]) nodes[3].click();
      // Or call showStep directly if available
      const sec = document.getElementById('process');
      const steps = sec.querySelectorAll('.process__step');
      steps.forEach((s, idx) => {
        s.style.opacity = idx === 3 ? '1' : '0';
        s.style.transform = 'none';
      });
    });

    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '05-process-step-4.png') });
    console.log('05-process-step-4 captured');
  }

  await browser.close();
  srv.close();
  process.exit(0);
});
