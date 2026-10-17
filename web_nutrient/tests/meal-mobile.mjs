import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync, mkdirSync} from 'node:fs';
const base=process.env.BASE_URL||'http://127.0.0.1:8788';
const vars=readFileSync('.dev.vars','utf8');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
try {
 const login=await context.request.post(base+'/api/auth/login',{headers:{'x-nutri-request':'1'},data:{username:vars.match(/ADMIN_USERNAME="([^"]+)"/)[1],password:vars.match(/ADMIN_PASSWORD="([^"]+)"/)[1]}});
 assert.equal(login.status(),200);
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.getByRole('button',{name:'Ghi bữa ăn',exact:true}).click();
 for (const width of [320,375,390,430]) {
  await page.setViewportSize({width,height:844});
  const date=await page.getByLabel('Ngày ăn',{exact:true}).boundingBox();
  const time=await page.getByLabel('Giờ ăn',{exact:true}).boundingBox();
  assert.ok(time.y>=date.y+date.height,'date and time stack on narrow phones to accommodate Safari native controls');
  assert.equal(await page.locator('.modal-body').evaluate(el=>el.scrollWidth>el.clientWidth),false);
 }
 await page.getByLabel('Ngày ăn',{exact:true}).fill('2026-10-15');
 await page.getByLabel('Giờ ăn',{exact:true}).fill('12:34');
 await page.locator('input[type=file]').setInputFiles('public/images/food-grid.webp');
 await page.getByRole('img',{name:'Ảnh món ăn đã chọn'}).waitFor();
 await page.getByRole('button',{name:'Ước lượng bằng AI',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('input[placeholder="Ví dụ: Cơm gà, phở bò…"]')?.value || document.querySelector('[role=alert]'),{},{timeout:100000});
 assert.equal(await page.locator('[role=alert]').count(),0,'live image scan succeeds');
 assert.ok((await page.getByLabel('Tên món ăn',{exact:true}).inputValue()).length>0);
 assert.ok(Number(await page.getByLabel('Năng lượng (kcal)',{exact:true}).inputValue())>0);
 assert.equal(await page.getByLabel('Ngày ăn',{exact:true}).inputValue(),'2026-10-15');
 assert.equal(await page.getByLabel('Giờ ăn',{exact:true}).inputValue(),'12:34');
 mkdirSync('docs/screenshots',{recursive:true});
 await page.screenshot({path:'docs/screenshots/meal-mobile-scan.png',fullPage:true});
 await page.getByRole('button',{name:'Đóng',exact:true}).click();
 assert.equal(await page.locator('.journal-fruit').count(),1);
 await page.screenshot({path:'docs/screenshots/home-fruit-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});
 await page.screenshot({path:'docs/screenshots/home-fruit-desktop.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Meal mobile passed: 320–430px layout, live upload/Gemini estimate, preserved date/time, fruit artwork; no meal saved.');
} finally {await context.request.post(base+'/api/auth/logout',{headers:{'x-nutri-request':'1'},data:{}});await browser.close();}
