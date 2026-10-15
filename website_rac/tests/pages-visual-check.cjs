const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('test-results',{recursive:true});
  for(const width of [1440,768,375]){
   await page.setViewportSize({width,height:1000});
   for(const route of ['rankings','history','account','classes','login','register','admin','admin/members','admin/points','admin/content','admin/settings']){
    await page.goto(`http://127.0.0.1:5199/?bin=R01#/${route}`);await page.waitForLoadState('networkidle');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} @ ${width} overflow`).toBe(true);
    await expect(page.locator('main h1').first()).toBeVisible();
    await page.screenshot({path:`test-results/garden-${route.replaceAll('/','-')}-${width}.png`,fullPage:true});
   }
  }
  expect(errors).toEqual([]);console.log('PASS: 11 pages x 3 widths, headings visible, no page errors or horizontal overflow; screenshots saved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
