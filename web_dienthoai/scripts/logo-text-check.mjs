import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/buiti/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
const p=await browser.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:5180/#admin/settings');
await p.locator('input[name=name]').fill('Cửa hàng Hoàng');await p.locator('input[name=tagline]').fill('Mua bán, sửa chữa tận tâm');
await p.locator('input[data-upload-field=logo]').setInputFiles('assets/ref-62.jpg');await p.waitForFunction(()=>document.querySelector('input[name=logo]').value.startsWith('data:image/'));
await p.locator('#settings-form .form-footer button').click();await p.goto('http://localhost:5180/');
assert.equal(await p.locator('.brand-logo').count(),1);
assert.equal(await p.locator('.brand-word').count(),1,'Uploading logo must keep store name and tagline');
assert.match(await p.locator('.brand-word').textContent(),/Cửa hàng Hoàng/);assert.match(await p.locator('.brand-word small').textContent(),/Mua bán, sửa chữa tận tâm/);
await p.setViewportSize({width:390,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
const bounds=await p.locator('.brand').evaluate(e=>{const logo=e.querySelector('img').getBoundingClientRect();const word=e.querySelector('.brand-word').getBoundingClientRect();return {overlap:logo.right>word.left,visible:word.width>0};});assert.equal(bounds.overlap,false);assert.equal(bounds.visible,true);
console.log('PASS: uploaded logo retains store name/tagline, desktop/mobile, no overlap or horizontal overflow.');
}finally{await browser.close();}
