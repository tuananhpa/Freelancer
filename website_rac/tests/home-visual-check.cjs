const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  fs.mkdirSync('test-results',{recursive:true});
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  for(const width of [1440,768,375]){
   await page.setViewportSize({width,height:1000});
   await page.goto('http://127.0.0.1:5199/?bin=R01#/home');
   await page.waitForLoadState('networkidle');
   await expect(page.getByRole('heading',{name:'Phiên bỏ rác',exact:true})).toBeVisible();
   await expect(page.locator('.session-status')).toContainText('Đang chờ kết quả');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   expect(await page.locator('.home-scene,.school-image img').first().evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
   expect(await page.locator('.brand img.logo').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
   await page.locator('.school-team img').scrollIntoViewIfNeeded();
   await expect(page.locator('.school-team img')).toHaveJSProperty('complete',true);
   expect(await page.locator('.school-team img').evaluate(img=>img.naturalWidth>0)).toBe(true);
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:`test-results/home-garden-${width}.png`,fullPage:true});
  }
  expect(errors).toEqual([]);
  console.log('Home: 3 responsive widths, loaded illustration, session intact, no overflow or browser errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
