const {chromium,expect}=require('@playwright/test');
const XLSX=require('xlsx'),fs=require('node:fs');
function excel(rows){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Mã học sinh','Họ và tên','Lớp'],...rows]),'Danh sách');return XLSX.write(wb,{type:'buffer',bookType:'xlsx'});}
async function main(){
  const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5199';page.on('pageerror',e=>errors.push(e.message));fs.mkdirSync('test-results',{recursive:true});
  const go=async route=>{await page.goto(`${base}/?bin=R01#/${route}`);await page.waitForLoadState('networkidle');};
  const readDownload=async label=>{const [d]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:label,exact:true}).click()]);return XLSX.read(fs.readFileSync(await d.path()),{type:'buffer'});};
  const register=async(code,name,email)=>{
    await go('register');await page.getByLabel('Mã học sinh',{exact:true}).fill(code);await page.getByLabel('Họ và tên',{exact:true}).fill(name);await page.getByRole('button',{name:'Kiểm tra thông tin học sinh'}).click();
    await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Mật khẩu',{exact:true}).fill('testpassword123');await page.getByLabel('Xác nhận mật khẩu').fill('testpassword123');await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
  };
  try{
    await go('admin/members');await expect(page.locator('.students-table tbody tr')).toHaveCount(4);
    const template=await readDownload('Tải file mẫu');expect(template.SheetNames).toContain('Hướng dẫn');
    await page.locator('#student-file').setInputFiles({name:'invalid.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:excel([['INVALID','Sai lớp','']])});await page.getByRole('button',{name:'Xem trước danh sách'}).click();await expect(page.locator('#student-import-form .form-error')).toContainText('Lớp');await expect(page.locator('.students-table tbody tr')).toHaveCount(4);
    const content=excel([['REG01','Nguyễn An','11T2'],['','Trần Bình','11T3'],['REG03','Lê Linh','11T1'],['REG04','Hoàng Nam','11T1']]);
    await page.locator('#student-file').setInputFiles({name:'students.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:content});await page.getByRole('button',{name:'Xem trước danh sách'}).click();await expect(page.locator('.import-preview')).toBeVisible();await expect(page.locator('.students-table tbody tr')).toHaveCount(4);
    const autoCode=(await page.locator('.import-preview tbody tr').nth(1).locator('td').first().innerText()).trim();expect(autoCode).toMatch(/^HS/);
    await page.getByRole('button',{name:'Xác nhận nhập 4 học sinh'}).click();await expect(page.locator('.students-table tbody tr')).toHaveCount(8);
    await page.reload();await expect(page.locator('.students-table tbody tr')).toHaveCount(8);
    await page.locator('h1').click();
    await page.screenshot({path:'docs/mockups/student-admin.png',fullPage:true});
    const allExport=await readDownload('Xuất Excel tất cả lớp');expect(allExport.SheetNames).toEqual(['Danh sách']);expect(XLSX.utils.sheet_to_json(allExport.Sheets['Danh sách'])).toHaveLength(8);
    await page.getByLabel('Lớp',{exact:true}).selectOption('11T3');await expect(page.locator('.students-table tbody tr')).toHaveCount(2);const classExport=await readDownload('Xuất Excel 11T3');expect(classExport.SheetNames).toEqual(['11T3']);const exportedRows=XLSX.utils.sheet_to_json(classExport.Sheets['11T3']);expect(exportedRows.find(row=>row['Họ và tên']==='Trần Bình')['Mã học sinh']).toBe(autoCode);
    await page.getByLabel('Tìm học sinh').fill('Trần Bình');await expect(page.locator('.students-table tbody tr')).toHaveCount(1);
    await go('admin/settings');await page.getByLabel('Tham gia lớp ngay khi đăng ký',{exact:false}).check();await page.getByRole('button',{name:'Lưu cài đặt'}).click();
    await go('account');await page.getByRole('button',{name:'Đăng xuất'}).click();await go('register');
    await page.screenshot({path:'docs/mockups/student-registration.png',fullPage:true});
    await page.getByLabel('Mã học sinh',{exact:true}).fill('UNKNOWN');await page.getByLabel('Họ và tên',{exact:true}).fill('Nguyễn An');await page.getByRole('button',{name:'Kiểm tra thông tin học sinh'}).click();await expect(page.locator('.form-error')).toContainText('danh sách');
    await page.getByLabel('Mã học sinh',{exact:true}).fill('HS000005');await page.getByLabel('Họ và tên',{exact:true}).fill('Sai tên');await page.getByRole('button',{name:'Kiểm tra thông tin học sinh'}).click();await expect(page.locator('.form-error')).toContainText('không khớp');
    await register('HS000005','Nguyễn An','an-ui@example.com');await expect(page.locator('.bin-info')).toContainText('Lớp 11T2');await expect(page.locator('.bin-info')).toContainText('Thùng R01');await expect(page.locator('.session-status')).toContainText('Đang chờ kết quả');
    await go('classes');await expect(page.getByRole('radio')).toHaveCount(0);await expect(page.locator('main')).toContainText('Lớp 11T2');
    await go('account');await page.getByRole('button',{name:'Đăng xuất'}).click();await go('register');await page.getByLabel('Mã học sinh',{exact:true}).fill('HS000005');await page.getByLabel('Họ và tên',{exact:true}).fill('Nguyễn An');await page.getByRole('button',{name:'Kiểm tra thông tin học sinh'}).click();await expect(page.locator('.form-error')).toContainText('đã đăng ký');
    await go('admin/settings');await page.getByLabel('Cần admin duyệt',{exact:false}).check();await page.getByRole('button',{name:'Lưu cài đặt'}).click();
    await register(autoCode,'Trần Bình','binh-ui@example.com');await expect(page.locator('.session-status')).toContainText('Đang chờ duyệt');
    await go('admin/members');await page.getByLabel('Tìm học sinh').fill('');await page.getByLabel('Lớp',{exact:true}).selectOption('all');const studentRow=page.locator('.students-table tbody tr').filter({hasText:'binh-ui@example.com'});await studentRow.getByRole('button',{name:'Từ chối',exact:true}).click();await studentRow.getByRole('button',{name:'Duyệt lại',exact:true}).click();await go('home');await expect(page.locator('.session-status')).toContainText('Đang chờ kết quả');
    await go('account');await page.getByRole('button',{name:'Đăng xuất'}).click();await page.getByLabel('Email',{exact:true}).fill('binh-ui@example.com');await page.getByLabel('Mật khẩu',{exact:true}).fill('incorrect');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page.locator('.form-error')).toContainText('không đúng');await page.getByLabel('Mật khẩu',{exact:true}).fill('testpassword123');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page.locator('.bin-info')).toContainText('Thùng R01');
    await go('admin/points');await page.getByLabel('Học sinh',{exact:true}).selectOption({label:'Trần Bình — 11T3 (0 điểm)'});await page.getByLabel('Số điểm điều chỉnh').fill('10');await page.getByLabel('Lý do',{exact:true}).fill('Bổ sung đã kiểm tra');await page.getByRole('button',{name:'Lưu điều chỉnh'}).click();await expect(page.locator('.adjustment')).toContainText('+10');
    await go('home');await page.getByRole('button',{name:'Xem hướng dẫn'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Mình đã hiểu'}).click();
    const tabs=[await context.newPage(),await context.newPage()];
    await Promise.all(tabs.map(async(tab,i)=>{
      tab.on('pageerror',e=>errors.push(e.message));await tab.goto(`${base}/?bin=R01#/register`);await tab.getByLabel('Mã học sinh',{exact:true}).fill('HS000008');await tab.getByLabel('Họ và tên',{exact:true}).fill('Hoàng Nam');await tab.getByRole('button',{name:'Kiểm tra thông tin học sinh'}).click();await tab.getByLabel('Email',{exact:true}).fill(`nam-tab-${i}@example.com`);await tab.getByLabel('Mật khẩu',{exact:true}).fill('testpassword123');await tab.getByLabel('Xác nhận mật khẩu').fill('testpassword123');
    }));
    await Promise.all(tabs.map(tab=>tab.getByRole('button',{name:'Tạo tài khoản',exact:true}).click()));
    await expect.poll(async()=>{
      const states=await Promise.all(tabs.map(async tab=>{
        if(tab.url().endsWith('#/home'))return 'success';
        return await tab.locator('#auth-form .form-error').textContent()?'failure':'waiting';
      }));return states.sort();
    }).toEqual(['failure','success']);await Promise.all(tabs.map(tab=>tab.close()));
    for(const width of [375,768,1440]){await page.setViewportSize({width,height:900});for(const route of ['home','rankings','history','account','classes','login','register','admin','admin/members','admin/points','admin/settings','admin/content']){await go(route);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route}@${width}`).toBe(true);}}
    if(errors.length)throw Error(errors.join('\n'));
    console.log('PASS: Excel template/import preview/atomic errors/persistence, per-class exports decoded, code gate/name/one-time registration across two browser tabs, both approval modes, rejection recovery, QR context, locked class, login/points/guide and 36 responsive page checks; no pageerrors.');
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
