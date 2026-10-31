"""Kiểm thử đầu-cuối admin (mock): python e2e.py http://localhost:8080 <ảnh-test>"""
import sys
from playwright.sync_api import sync_playwright, expect
B, IMG = sys.argv[1], sys.argv[2]
ok = lambda c, m: print(('PASS ' if c else 'FAIL ') + m)
with sync_playwright() as p:
    br = p.chromium.launch(); ctx = br.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.goto(B + '/admin.html'); pg.fill('input[name=u]', 'admin'); pg.fill('input[name=p]', 'sai'); pg.click('#loginForm button')
    expect(pg.locator('#loginErr')).to_contain_text('Sai'); ok(True, 'đăng nhập sai báo lỗi')
    pg.fill('input[name=p]', 'demo2026'); pg.click('#loginForm button'); pg.wait_for_selector('#app:not([hidden])')
    pg.screenshot(path='shots/a-dash.png'); ok(True, 'đăng nhập đúng')
    # sửa hotline
    pg.click('#tabs button[data-t=site]'); pg.wait_for_selector('#docForm')
    pg.fill('.f[data-k=hotline] input', '0988 123 456'); pg.click('#docForm .sticky-row button'); pg.wait_for_timeout(400)
    ok('dirty' in pg.get_attribute('#pubbar', 'class'), 'lưu nháp -> thanh vàng "chưa xuất bản"')
    pg.screenshot(path='shots/a-site.png', full_page=False)
    site = ctx.new_page(); site.goto(B + '/index.html'); site.wait_for_selector('.header-hot')
    ok('0988 123 456' not in site.inner_text('.header-hot'), 'website công khai vẫn bản cũ trước khi xuất bản')
    site.goto(B + '/index.html?preview=1'); site.wait_for_selector('.header-hot')
    ok('0988 123 456' in site.inner_text('.header-hot'), 'xem trước hiển thị bản nháp')
    site.goto(B + '/index.html?preview=0')
    pg.click('#pubBtn'); pg.wait_for_timeout(400)
    site.goto(B + '/index.html'); site.wait_for_selector('.header-hot')
    ok('0988 123 456' in site.inner_text('.header-hot'), 'sau xuất bản website cập nhật')
    # thêm công trình có ảnh
    pg.click('#tabs button[data-t=projects]'); pg.wait_for_selector('table'); n0 = pg.locator('tbody tr').count()
    pg.click('#addBtn'); pg.fill('.f[data-k=name] input', 'Nhà phố thử nghiệm Đà Lạt'); pg.fill('.f[data-k=location] input', 'Đà Lạt')
    pg.set_input_files('.f[data-k=cover] input[data-up]', IMG); pg.wait_for_function("document.querySelector('.f[data-k=cover] [data-v]').value.startsWith('data:image')")
    pg.set_input_files('.f[data-k=gallery] input[data-upg]', [IMG, IMG]); pg.wait_for_function("document.querySelectorAll('.f[data-k=gallery] figure').length==2")
    pg.screenshot(path='shots/a-edit.png')
    pg.click('#form button[value=ok]'); pg.wait_for_timeout(500)
    ok(pg.locator('tbody tr').count() == n0 + 1, 'thêm công trình mới')
    pg.fill('#search', 'da lat'); pg.wait_for_timeout(300); ok(pg.locator('tbody tr').count() == 1, 'tìm không dấu "da lat"')
    pg.fill('#search', ''); pg.wait_for_timeout(300)
    pg.locator('tbody tr').last.locator('[data-a=up]').click(); pg.wait_for_timeout(300)
    ok('Đà Lạt' in pg.locator('tbody tr').nth(n0 - 1).inner_text(), 'đổi thứ tự ↑')
    pg.click('#pubBtn'); pg.wait_for_timeout(300)
    site.goto(B + '/cong-trinh-chi-tiet.html?ct=nha-pho-thu-nghiem-da-lat'); site.wait_for_selector('h1')
    ok('Đà Lạt' in site.inner_text('h1'), 'trang chi tiết công trình mới hiển thị'); ok(site.locator('.gallery img').count() == 2, 'album 2 ảnh')
    # media có ảnh mới
    pg.click('#tabs button[data-t=media]'); expect(pg.locator('tbody')).to_contain_text('sv-nha-o'); ok(pg.locator('tbody tr').count() >= 30, 'ảnh tải lên vào thư viện')
    # form tư vấn
    site.goto(B + '/lien-he.html?dv=thi-cong-phan-tho#tu-van'); site.wait_for_selector('#tu-van form')
    ok(site.input_value('#tu-van select') == 'Thi công phần thô', 'chọn sẵn dịch vụ từ ?dv=')
    site.click('#tu-van button[type=submit]'); ok(site.locator('.field.invalid').count() >= 2, 'form trống báo lỗi')
    site.fill('#tu-van input[name=name]', 'Khách Test'); site.fill('#tu-van input[name=phone]', '0912 345 678'); site.click('#tu-van button[type=submit]')
    expect(site.locator('#tu-van .form-msg.ok')).to_be_visible(); ok(True, 'gửi form tư vấn')
    pg.click('#tabs button[data-t=leads]'); expect(pg.locator('tbody')).to_contain_text('Khách Test'); ok(True, 'admin thấy yêu cầu tư vấn')
    pg.screenshot(path='shots/a-leads.png')
    # ứng tuyển
    site.goto(B + '/tuyen-dung-chi-tiet.html?vt=tho-ne-tho-ho'); site.wait_for_selector('#ung-tuyen form')
    site.fill('#ung-tuyen input[name=name]', 'Ứng viên Test'); site.fill('#ung-tuyen input[name=phone]', '0912000111'); site.set_input_files('#ung-tuyen input[name=cv]', IMG)
    site.click('#ung-tuyen button[type=submit]'); expect(site.locator('#ung-tuyen .form-msg.ok')).to_be_visible()
    pg.click('#tabs button[data-t=applications]'); expect(pg.locator('tbody')).to_contain_text('Ứng viên Test'); ok(True, 'admin thấy hồ sơ ứng tuyển')
    pg.locator('tbody tr').first.locator('[data-a=edit]').click(); ok(pg.locator('#fields a[download]').count() == 1, 'tải được CV'); pg.click('#form button[value=cancel]')
    # chatbot
    pg.click('#tabs button[data-t=chatbot]'); pg.wait_for_selector('#docForm'); pg.screenshot(path='shots/a-chatbot.png', full_page=True)
    site.goto(B + '/index.html'); site.click('.cb-launch'); site.fill('.cb-form input', 'toi muon xin viec'); site.press('.cb-form input', 'Enter'); site.wait_for_timeout(300)
    ok('tuyển' in site.inner_text('.cb-body'), 'chatbot hiểu "xin viec" -> tuyển dụng')
    site.screenshot(path='shots/a-chat-site.png')
    # trang chủ: tắt khối
    pg.click('#tabs button[data-t=home]'); pg.wait_for_selector('#docForm')
    pg.locator('.f[data-k=sections] .item').nth(6).locator('input[type=checkbox]').uncheck(); pg.click('#docForm .sticky-row button'); pg.wait_for_timeout(300); pg.click('#pubBtn'); pg.wait_for_timeout(300)
    site.goto(B + '/index.html'); site.wait_for_selector('.hero'); ok(site.locator('#tuyen-dung').count() == 0, 'tắt khối tuyển dụng trang chủ')
    pg.screenshot(path='shots/a-home.png')
    # đặt lại
    pg.click('#resetBtn'); pg.click('#resetBtn'); pg.wait_for_timeout(500)
    print('errors:', errs)
    br.close()
