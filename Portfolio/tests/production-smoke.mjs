import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const base='https://freelance-portfolio.tuananhha1710.workers.dev';
let ready=false;
for(let attempt=1;attempt<=12;attempt++){
  try{const r=await fetch(base+'/api/config');assert.equal(r.status,200);ready=true;break;}
  catch(e){console.log(`HTTPS availability check ${attempt}/12: ${e.cause?.code||e.message}`);if(attempt<12)await new Promise(resolve=>setTimeout(resolve,30000));}
}
assert.ok(ready,'Production HTTPS is not available yet');
const checks=[];
for(const [path,status] of [['/',200],['/du-an/',200],['/du-an/lanh-house/',200],['/dich-vu/',200],['/ve-nhom/',200],['/lien-he/',200],['/admin/',200],['/src/admin.js',200],['/assets/ceramics.webp',200],['/api/admin/content',401],['/sitemap.xml',200],['/xem-thu/',303],['/khong-ton-tai/',404]]){
  const r=await fetch(base+path,{redirect:'manual'});assert.equal(r.status,status,path);checks.push(`${path}: ${status}`);
  if(path==='/'){const html=await r.text();assert.ok(html.includes('__SERVER_MODE__=true'));assert.ok(r.headers.get('content-security-policy'));}
  if(path==='/sitemap.xml')assert.ok((await r.text()).includes(base+'/du-an/lanh-house/'));
}
const config=await (await fetch(base+'/api/config')).json();assert.equal(config.server,true);
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});assert.ok(await page.locator('h1').isVisible());
  await page.screenshot({path:'docs/screenshots/production-home-desktop.png',fullPage:true});checks.push('Public homepage renders in Edge');
  await page.goto(base+'/admin/',{waitUntil:'networkidle'});await page.locator('#server-login').waitFor();
  assert.ok(await page.locator('#login-password').isVisible());
  if(!config.initialized)assert.ok(await page.locator('#setup-token').isVisible());
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'docs/screenshots/production-admin-mobile.png',fullPage:true});checks.push('Admin login/setup renders at 390px');
  assert.deepEqual(errors,[]);checks.push('No browser JavaScript errors');
}finally{await browser.close();}
const result={url:base,checkedAt:new Date().toISOString(),initialized:config.initialized,passed:checks.length,checks};
writeFileSync('docs/screenshots/production-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
