// Optional design export; uses an installed Playwright, not a production dependency.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});await page.goto('http://127.0.0.1:5188/assets/share.svg');await page.screenshot({path:'public/assets/share.png'});}finally{await browser.close();}
