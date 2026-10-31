// Usage: node shot.mjs <url> <outPrefix> [width=1440] [height=900] [scrollPositions comma list in vh, e.g. 0,1,2]
// Chụp ảnh các vị trí cuộn của một trang (Chrome hệ thống).
import { chromium } from 'playwright-core';
const [url, out, w = '1440', h = '900', pos = '0', extra = ''] = process.argv.slice(2);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const mobile = +w < 600;
const ctx = await browser.newContext({
  viewport: { width: +w, height: +h },
  deviceScaleFactor: 1,
  isMobile: mobile, hasTouch: mobile,
  reducedMotion: extra.includes('reduced') ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(extra.includes('intro') ? 600 : 2500);
// bấm cookie nếu có
for (const t of ['Continue without Accepting', 'Accept']) {
  const b = page.getByText(t, { exact: false }).first();
  if (await b.count().catch(() => 0)) { await b.click({ timeout: 1500 }).catch(() => {}); }
}
await page.waitForTimeout(1500);
const positions = pos.split(',').map(Number);
for (const p of positions) {
  await page.evaluate(y => window.scrollTo(0, y), Math.round(p * +h));
  await page.waitForTimeout(extra.includes('slow') ? 1600 : 900);
  await page.screenshot({ path: `${out}-${String(p).replace('.', '_')}.png` });
}
await browser.close();
console.log('done');
