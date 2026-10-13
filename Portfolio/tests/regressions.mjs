import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
let failures=0;
try {
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('http://127.0.0.1:5188/lien-he/');
 try{assert.equal(await page.getByRole('button',{name:'Lưu bản nháp'}).isDisabled(),true);await page.getByLabel('Tên của bạn').fill('Test');await page.getByLabel('Email hoặc số điện thoại').fill('test@example.com');await page.getByLabel('Mô tả nhu cầu').fill('Nội dung riêng tư kiểm tra');await page.getByLabel('Tên của bạn').press('Enter');assert.equal(new URL(page.url()).search,'');console.log('PASS: no-JS local form cannot submit');}catch(e){failures++;console.error('FAIL: no-JS form',e.message);}await context.close();
 const normal=await browser.newPage();await normal.goto('http://127.0.0.1:5188/lien-he/');await normal.waitForLoadState('networkidle');await normal.getByRole('button',{name:'Chuyển sang giao diện tối'}).click();await normal.getByRole('button',{name:'Lưu bản nháp'}).click();
 const colors=await normal.locator('#name-error').evaluate(el=>({fg:getComputedStyle(el).color,bg:getComputedStyle(document.querySelector('.contact-form')).backgroundColor}));
 function lum(rgb){return rgb.match(/\d+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);}
 const levels=[lum(colors.fg),lum(colors.bg)].sort((a,b)=>b-a);const contrast=(levels[0]+.05)/(levels[1]+.05);
 try{assert.ok(contrast>=4.5,`contrast ${contrast.toFixed(2)}:1`);console.log(`PASS: dark validation contrast ${contrast.toFixed(2)}:1`);}catch(e){failures++;console.error('FAIL: dark validation',e.message);}
}finally{await browser.close();}
if(failures)process.exitCode=1;
