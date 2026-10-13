import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto('http://127.0.0.1:5188/');await page.waitForLoadState('networkidle');
console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({class:el.className,tag:el.tagName,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,overflow:getComputedStyle(el).overflow})).filter(r=>r.right>390||r.left<0)));
await page.screenshot({path:'docs/screenshots/mobile-before.png',fullPage:true});
await browser.close();
