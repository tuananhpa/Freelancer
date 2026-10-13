import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:5188';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const checks=[];
await mkdir('docs/screenshots',{recursive:true});
async function navigate(path){const r=await page.goto(base+path);await page.waitForLoadState('networkidle');return r;}
async function widthCheck(label){const dimensions=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,win:window.innerWidth}));assert.ok(dimensions.doc<=dimensions.win,`${label} overflow ${JSON.stringify(dimensions)}`);checks.push(`${label}: no horizontal overflow`);}
try {
 await navigate('/');await page.locator('.hero h1').waitFor();await page.screenshot({path:'docs/screenshots/home-desktop.png',fullPage:true});await widthCheck('Desktop home');
 assert.equal(await page.locator('.project-card').count(),3);
 const links=await page.locator('a[href^="/"]').evaluateAll(a=>[...new Set(a.map(x=>new URL(x.href).pathname))]);
 for(const path of links){const r=await page.request.get(base+path);assert.equal(r.status(),200,`Broken link ${path}`);}
 checks.push('Homepage internal links return 200');
 await navigate('/du-an/');await page.getByRole('button',{name:'Website',exact:true}).click();assert.equal(await page.locator('.project-card').count(),1);
 await page.getByRole('searchbox').fill('khong co du an');await page.locator('#project-empty').waitFor({state:'visible'});await page.getByRole('button',{name:'Xem tất cả dự án'}).click();assert.equal(await page.locator('.project-card').count(),3);
 await page.getByRole('searchbox').fill('dat lich');assert.equal(await page.locator('.project-card').count(),1);checks.push('Search, category filtering, accent normalization and empty reset');
 await navigate('/du-an/lanh-house/');assert.equal(await page.locator('h1').textContent(),'Lành House');assert.ok((await page.title()).includes('Lành House'));checks.push('Direct project URL and page title');
 await navigate('/lien-he/');await page.getByRole('button',{name:'Lưu bản nháp'}).click();assert.equal(await page.locator('[aria-invalid="true"]').count(),4);
 await page.getByLabel('Tên của bạn').fill('Nguyễn An');await page.getByLabel('Email hoặc số điện thoại').fill('an@example.com');await page.getByLabel('Dịch vụ bạn quan tâm').selectOption('Website');await page.getByLabel('Mô tả nhu cầu').fill('Tôi cần website giới thiệu sản phẩm và dịch vụ.');await page.getByRole('button',{name:'Lưu bản nháp'}).click();assert.ok((await page.locator('#form-status').textContent()).includes('chưa được gửi'));
 await page.reload();await page.waitForLoadState('networkidle');assert.equal(await page.getByLabel('Tên của bạn').inputValue(),'Nguyễn An');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Tải yêu cầu .txt'}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'yeu-cau-du-an.txt');checks.push('Form validation, local draft persistence, honest status, brief download');
 await page.getByRole('button',{name:'Chuyển sang giao diện tối'}).click();await page.reload();await page.waitForLoadState('networkidle');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.getByRole('button',{name:'Chuyển sang giao diện sáng'}).click();checks.push('Theme persistence');
 await navigate('/dich-vu/');await page.locator('summary').first().click();assert.equal(await page.locator('details[open]').count(),1);checks.push('FAQ disclosure');
 const unknown=await navigate('/missing-page/');assert.equal(unknown.status(),404);assert.ok((await page.locator('h1').textContent()).includes('chưa có'));checks.push('True 404 response');
 for(const width of [320,390,768,1024]){await page.setViewportSize({width,height:844});for(const path of ['/','/du-an/','/du-an/lanh-house/','/du-an/glow-booking/','/du-an/workflow/','/dich-vu/','/ve-nhom/','/lien-he/']){await navigate(path);await widthCheck(`${width}px ${path}`);}await navigate('/');await page.screenshot({path:`docs/screenshots/home-${width}.png`,fullPage:true});}
 await page.setViewportSize({width:390,height:844});await navigate('/');await page.getByRole('button',{name:'Mở menu'}).click();assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');checks.push('Mobile menu and Escape focus handling');
 await page.route('**/assets/ceramics.webp',route=>route.abort());await navigate('/');await page.locator('.media-error').first().waitFor();checks.push('Image loading error fallback');
 assert.deepEqual(errors,[]);checks.push('No JavaScript page errors');
 await writeFile('docs/screenshots/browser-results.json',JSON.stringify({checks,errors},null,2));
 console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
}finally{await browser.close();}
