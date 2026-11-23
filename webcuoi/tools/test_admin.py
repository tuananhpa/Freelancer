"""Kiểm tra luồng admin -> trang chính qua backend.
Chạy: python tools/test_admin.py http://localhost:8787   (wrangler dev)  hoặc link thật.
Mật khẩu lấy từ biến môi trường MI_ADMIN_PASS hoặc file .dev.vars. Test tự đặt lại nội dung khi xong."""
import os, pathlib, sys, urllib.request, urllib.error
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8787").rstrip("/")
pw = os.environ.get("MI_ADMIN_PASS")
if not pw:
    for line in (pathlib.Path(__file__).resolve().parent.parent / ".dev.vars").read_text().splitlines():
        if line.startswith("ADMIN_PASS="): pw = line.split("=", 1)[1]
IMG = pathlib.Path(__file__).resolve().parent.parent / "assets/img/albums/a1/01-sm.webp"


def status(method, path, body=b"", headers=None):
    # Cloudflare chặn User-Agent mặc định của Python-urllib
    req = urllib.request.Request(base + path, data=body or None, method=method, headers={"user-agent": "mi-studio-test", **(headers or {})})
    try: return urllib.request.urlopen(req).status
    except urllib.error.HTTPError as e: return e.code


# API phải từ chối khi không có / sai token
assert status("PUT", "/api/content", b'{"albums":[],"texts":{}}', {"content-type": "application/json"}) == 401
assert status("PUT", "/api/content", b'{"albums":[],"texts":{}}', {"content-type": "application/json", "authorization": "Bearer abc.def"}) == 401
assert status("POST", "/api/media", b"x", {"content-type": "image/webp"}) == 401
assert status("DELETE", "/api/content") == 401

with sync_playwright() as p:
    b = p.chromium.launch()
    errs = []
    admin_ctx = b.new_context(viewport={"width": 1280, "height": 900}); pg = admin_ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(base + "/admin.html")
    pg.fill("[name=user]", "Admin"); pg.fill("[name=pass]", "sai-mat-khau"); pg.click("#loginForm button")
    pg.wait_for_function("document.querySelector('.login__err').textContent.length > 0")
    assert "Sai" in pg.inner_text(".login__err")
    pg.fill("[name=pass]", pw); pg.click("#loginForm button")
    pg.wait_for_selector("#app:not([hidden]) .arow")
    assert "máy chủ" in pg.inner_text(".demo-note"), "admin phải đang ở chế độ máy chủ"
    pg.locator(".arow").nth(1).locator("input[type=checkbox]").click()
    pg.click("[data-tab=texts]"); pg.fill("[data-text='hero.title1']", "Giữ lại")
    pg.click("[data-tab=prices]"); pg.fill("[data-bind='print|0|price']", "650.000đ")
    pg.click("[data-tab=contact]"); pg.fill("[data-bind='contact|phone']", "0909 000 111")
    # album mới + tải ảnh lên máy chủ
    pg.click("[data-tab=albums]"); pg.click("[data-act=addAlbum]")
    pg.fill("[data-bind='albums|0|title']", "Album thử")
    pg.set_input_files("[data-upload-add='albums|0|photos']", str(IMG))
    pg.wait_for_selector(".pitem img[src^='/media/']", timeout=20000)
    pg.wait_for_function("document.querySelector('#status').textContent.includes('Đã lưu')", timeout=10000)

    # trình duyệt KHÁC (không chung bộ nhớ) phải thấy thay đổi
    guest = b.new_context().new_page(); guest.on("pageerror", lambda e: errs.append(str(e)))
    guest.goto(base + "/"); guest.wait_for_timeout(2500)
    assert guest.locator(".acard").count() == 7, guest.locator(".acard").count()   # 7 gốc - 1 ẩn + 1 mới
    assert guest.inner_text(".hero__l--1") == "Giữ lại"
    assert "650.000đ" in guest.inner_text("#printList")
    assert guest.get_attribute(".dock__btn--tel", "href") == "tel:0909000111"
    src = guest.locator(".acard img").first.get_attribute("src")
    assert src.startswith("/media/"), src
    assert status("GET", src) == 200

    # đặt lại
    pg.click("[data-tab=backup]"); pg.click("[data-act=resetAll]"); pg.click("[data-act=resetAll]")
    pg.wait_for_function("document.querySelector('#status').textContent.includes('đặt lại')")
    guest.reload(); guest.wait_for_timeout(2500)
    assert guest.locator(".acard").count() == 7 and guest.inner_text(".hero__l--1") == "Kể lại"
    assert not errs, errs
    print("OK: đăng nhập thật, API chặn khi chưa đăng nhập, trình duyệt khác thấy thay đổi, tải ảnh, đặt lại")
    b.close()
