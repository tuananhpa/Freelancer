const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
async function main(){
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('test-results',{recursive:true});
  const go=async hash=>{await page.goto(`http://127.0.0.1:5173/?bin=R01#/${hash}`);await page.waitForLoadState('networkidle');};
  try{
    await go('home');await expect(page.getByRole('heading',{name:'Phiên bỏ rác',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Xem hướng dẫn'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Mình đã hiểu'}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.screenshot({path:'docs/mockups/frontend-desktop.png',fullPage:true});
    for(const width of [375,768,1440]){
      await page.setViewportSize({width,height:900});
      for(const route of ['home','rankings','history','account','classes','login','register','admin','admin/members','admin/points','admin/settings','admin/content']){
        await go(route);
        const overflowing=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
        if(overflowing)throw Error(`Page overflow: ${route} @${width}`);
      }
      await go('home');await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true});
    }
    await page.setViewportSize({width:1440,height:1000});
    await go('admin/settings');await page.getByLabel('Chọn lớp là tham gia ngay',{exact:false}).check();
    await page.getByLabel('Nhựa (điểm/lần)').fill('15');await page.getByRole('button',{name:'Lưu cài đặt'}).click();
    await page.reload();await expect(page.getByLabel('Chọn lớp là tham gia ngay',{exact:false})).toBeChecked();await expect(page.getByLabel('Nhựa (điểm/lần)')).toHaveValue('15');
    await go('home');await expect(page.locator('.waste-item').first()).toContainText('+15 điểm/lần');
    await go('account');await page.getByRole('button',{name:'Đăng xuất'}).click();
    await page.getByRole('link',{name:'Đăng ký ngay'}).click();
    await page.getByLabel('Họ và tên',{exact:true}).fill('Nguyễn An');await page.getByLabel('Email',{exact:true}).fill('an-ui@example.com');
    await page.getByLabel('Mật khẩu',{exact:true}).fill('testpassword123');await page.getByLabel('Xác nhận mật khẩu').fill('wrong');await page.getByRole('button',{name:'Tạo tài khoản'}).click();
    await expect(page.locator('.form-error')).toContainText('không khớp');
    await page.getByLabel('Xác nhận mật khẩu').fill('testpassword123');await page.getByRole('button',{name:'Tạo tài khoản'}).click();
    await expect(page.getByRole('heading',{name:'Tham gia lớp của bạn'})).toBeVisible();await page.getByRole('radio',{name:'11T2 Nhóm lớp'}).check();await page.getByRole('button',{name:'Tham gia lớp',exact:true}).click();
    await expect(page.locator('.bin-info')).toContainText('Thùng R01');await expect(page.locator('.bin-info')).toContainText('Lớp 11T2');await expect(page.locator('.session-status')).toContainText('Đang chờ kết quả');
    await go('admin/settings');await page.getByLabel('Cần admin duyệt',{exact:false}).check();await page.getByRole('button',{name:'Lưu cài đặt'}).click();
    await go('account');await page.getByRole('button',{name:'Đăng xuất'}).click();await page.getByRole('link',{name:'Đăng ký ngay'}).click();
    await page.getByLabel('Họ và tên',{exact:true}).fill('Nguyễn Bình');await page.getByLabel('Email',{exact:true}).fill('binh-ui@example.com');await page.getByLabel('Mật khẩu',{exact:true}).fill('testpassword123');await page.getByLabel('Xác nhận mật khẩu').fill('testpassword123');await page.getByRole('button',{name:'Tạo tài khoản'}).click();
    await page.getByRole('radio',{name:'11T3 Nhóm lớp'}).check();await page.getByRole('button',{name:'Gửi yêu cầu gia nhập'}).click();await expect(page.locator('.session-status')).toContainText('Đang chờ duyệt vào lớp');
    await go('admin/members');const row=page.getByRole('row').filter({hasText:'binh-ui@example.com'});await row.getByRole('button',{name:'Duyệt',exact:true}).click();
    await go('home');await expect(page.locator('.session-status')).toContainText('Đang chờ kết quả bỏ rác');
    await go('account');await page.getByRole('button',{name:'Đăng xuất'}).click();await page.getByLabel('Email',{exact:true}).fill('binh-ui@example.com');await page.getByLabel('Mật khẩu',{exact:true}).fill('incorrect');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page.locator('.form-error')).toContainText('không đúng');await page.getByLabel('Mật khẩu',{exact:true}).fill('testpassword123');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page.locator('.bin-info')).toContainText('Thùng R01');
    await go('admin/content');await page.getByLabel('Tên trường',{exact:true}).fill('THPT <Xanh>');await page.getByLabel('Tên sản phẩm',{exact:true}).fill('Thùng rác thông minh');await page.getByRole('button',{name:'Lưu nội dung'}).click();await go('home');await expect(page.locator('.brand')).toContainText('THPT <Xanh>');
    await go('admin/points');await page.getByLabel('Học sinh',{exact:true}).selectOption({label:'Nguyễn Bình — 11T3 (0 điểm)'});await page.getByLabel('Số điểm điều chỉnh').fill('10');await page.getByLabel('Lý do',{exact:true}).fill('Bổ sung điểm đã kiểm tra');await page.getByRole('button',{name:'Lưu điều chỉnh'}).click();await expect(page.locator('.adjustment')).toContainText('+10');
    await go('rankings');await page.getByLabel('Tuần thi đua').selectOption('2026-10-05');await expect(page.locator('.competition-banner')).toContainText('11T3');
    await go('history');await page.getByRole('button',{name:'Nhựa',exact:true}).click();await expect(page.locator('.empty-state')).toContainText('Chưa có lịch sử phù hợp');
    // Fresh context preserves screenshots with the original approved design.
    await context.close();const fresh=await browser.newContext({viewport:{width:375,height:900}});const mobile=await fresh.newPage();await mobile.goto('http://127.0.0.1:5173/?bin=R01#/home');await mobile.waitForLoadState('networkidle');await mobile.screenshot({path:'docs/mockups/frontend-mobile.png',fullPage:true});await fresh.close();
    const blocked=await browser.newContext();
    await blocked.addInitScript(()=>{
      Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}});
      Object.defineProperty(window,'sessionStorage',{get(){throw Error('blocked');}});
    });
    const blockedPage=await blocked.newPage();blockedPage.on('pageerror',e=>errors.push(e.message));
    await blockedPage.goto('http://127.0.0.1:5173/?bin=R02#/home');await expect(blockedPage.locator('.bin-info')).toContainText('Thùng R02');
    await blockedPage.goto('http://127.0.0.1:5173/?bin=R02#/admin/settings');await blockedPage.getByRole('button',{name:'Lưu cài đặt'}).click();await expect(blockedPage.locator('.form-error')).toContainText('Không lưu được');await blocked.close();
    if(errors.length)throw Error(errors.join('\n'));
    console.log('PASS: 36 responsive page checks, guide dialog, both membership modes, QR context, registration/login, approval, settings persistence, content escaping, points and filters. No browser errors.');
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
