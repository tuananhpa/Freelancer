import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/buiti/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
const context=await browser.newContext({viewport:{width:1440,height:1000}});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
const base=process.env.TEST_URL||'http://localhost:5180/';
await p.goto(base);await p.waitForLoadState('networkidle');
assert.equal(await p.locator('.opening-message').textContent(),'Trung tâm mua bán, sửa chữa điện thoại tận tâm');
assert.equal(await p.locator('.closing-message').textContent(),'Cảm ơn Quý khách đã cho cửa hàng cơ hội phục vụ');
const colors=await p.evaluate(()=>({header:getComputedStyle(document.querySelector('.store-header')).backgroundColor,body:getComputedStyle(document.documentElement).backgroundColor,texture:getComputedStyle(document.documentElement).backgroundImage}));
assert.equal(colors.header,'rgb(23, 23, 23)');assert.match(colors.texture,/concrete.svg/);
await p.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));await p.screenshot({path:'docs/screenshots/client-theme-desktop.png',fullPage:true});
await p.goto(base+'#admin/settings?group=home');await p.locator('input[name=openingMessage]').fill('Giới thiệu kiểm thử');await p.locator('#settings-form .form-footer button').click();await p.goto(base);assert.equal(await p.locator('.opening-message').textContent(),'Giới thiệu kiểm thử');
await p.goto(base+'#admin/settings?group=footer');await p.locator('input[name=closingMessage]').fill('Cảm ơn kiểm thử');await p.locator('#settings-form .form-footer button').click();await p.goto(base);assert.equal(await p.locator('.closing-message').textContent(),'Cảm ơn kiểm thử');
await p.goto(base+'#admin/settings');assert.equal(await p.locator('input[name=accent]').count(),1);assert.equal(await p.locator('input[name=surface]').count(),1);assert.equal(await p.locator('input[name=headerColor]').count(),1);await p.screenshot({path:'docs/screenshots/client-theme-admin.png',fullPage:true});
await p.evaluate(()=>localStorage.removeItem('mobile-store:v1'));await p.setViewportSize({width:390,height:844});await p.goto(base);await p.reload();await p.waitForLoadState('networkidle');await p.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:'docs/screenshots/client-theme-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);console.log('PASS: live tunnel theme, concrete background, desktop/mobile, client opening/closing messages and admin editing, palette controls, no page errors.');
}finally{await browser.close();}
