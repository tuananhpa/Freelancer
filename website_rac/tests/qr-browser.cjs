const {chromium,expect}=require('@playwright/test');
const {PNG}=require('pngjs');const jsQR=require('jsqr');const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:5199')+'/#/admin/settings');
    await page.getByLabel('Địa chỉ website',{exact:true}).fill('https://qr-test.trycloudflare.com/?bin=R03#/admin/settings');
    await page.getByLabel('Mã thùng',{exact:true}).fill('R02');await page.getByRole('button',{name:'Tạo mã QR',exact:true}).click();
    await expect(page.getByRole('img',{name:'Mã QR mở phiên bỏ rác tại thùng R02'})).toBeVisible();
    const url='https://qr-test.trycloudflare.com/?bin=R02#/home';await expect(page.getByLabel('Link trong mã QR')).toHaveValue(url);
    await page.getByRole('button',{name:'Sao chép link'}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(url);
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Tải ảnh PNG'}).click()]);expect(download.suggestedFilename()).toBe('qr-thung-R02.png');
    const png=PNG.sync.read(fs.readFileSync(await download.path()));expect(jsQR(new Uint8ClampedArray(png.data),png.width,png.height)?.data).toBe(url);
    await page.locator('.qr-panel').screenshot({path:'docs/mockups/admin-qr.png'});
    await page.setViewportSize({width:375,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.locator('.qr-panel').screenshot({path:'test-results/admin-qr-mobile.png'});
    await page.getByLabel('Mã thùng',{exact:true}).fill('R1');await expect(page.getByRole('link',{name:'Tải ảnh PNG'})).toHaveCount(0);await page.getByRole('button',{name:'Tạo mã QR',exact:true}).click();await expect(page.locator('#qr-form .form-error')).toContainText('Mã thùng');
    await page.getByLabel('Mã thùng',{exact:true}).fill('R01');await page.getByLabel('Địa chỉ website',{exact:true}).fill('javascript:alert(1)');await page.getByRole('button',{name:'Tạo mã QR',exact:true}).click();await expect(page.locator('#qr-form .form-error')).toContainText('Địa chỉ');
    if(errors.length)throw Error(errors.join('\n'));
    console.log('PASS QR browser: generation, exact URL, clipboard, downloaded PNG decoded, responsive 375px, invalid inputs, stale result removed, no pageerrors.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
