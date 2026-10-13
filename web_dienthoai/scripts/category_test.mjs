import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/buiti/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const admin=await context.newPage();const front=await context.newPage();
await front.goto('http://localhost:5180/');await front.waitForLoadState('networkidle');
await admin.goto('http://localhost:5180/#admin/categories');await admin.getByRole('button',{name:'Sửa Điện thoại',exact:true}).click();
await admin.locator('#editor input[data-upload-field=image]').waitFor({timeout:2500});
await admin.locator('#editor input[data-upload-field=image]').setInputFiles('assets/ref-62.jpg');await admin.waitForFunction(()=>document.querySelector('#editor input[name=image]').value.startsWith('data:image/'));
await admin.locator('#editor button[type=submit]').click();await admin.waitForFunction(()=>!document.querySelector('#editor').open);
await front.waitForFunction(()=>document.querySelectorAll('img.category-icon[alt="Điện thoại"]').length===2);
assert.equal(await front.locator('.store-nav img.category-icon').count(),1);
assert.equal(await front.locator('.category-sidebar img.category-icon').count(),1);
await front.reload();await front.locator('.category-sidebar img.category-icon').waitFor();
await admin.getByRole('button',{name:'Sửa Điện thoại',exact:true}).click();assert.match(await admin.locator('#editor input[name=image]').inputValue(),/^data:image/);
await admin.screenshot({path:'docs/screenshots/admin-category-image.png',fullPage:true});
await admin.locator('[data-clear-image=image]').click();await admin.locator('#editor button[type=submit]').click();await front.waitForFunction(()=>!document.querySelector('img.category-icon'));
console.log('PASS: category image upload, menu/sidebar icons, immediate cross-tab updates, reload persistence and removal fallback.');
}finally{await browser.close();}
