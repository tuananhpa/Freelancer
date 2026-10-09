const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const output = path.resolve(__dirname, "../test-results");
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE }
      : process.platform === "win32"
        ? {
            executablePath:
              "C:/Program Files/Google/Chrome/Application/chrome.exe",
          }
        : {}),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      locale: "vi-VN",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const overflow = async (label) =>
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        label + " fits viewport",
      );
    const saveSettings = async () => {
      await page
        .getByRole("button", { name: "Lưu thiết lập", exact: true })
        .click();
      await page
        .getByText("Đã lưu thiết lập liên hệ.", { exact: true })
        .waitFor();
    };
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page.locator(".social-widgets a").count(),
      0,
      "blank social links are hidden",
    );
    await page.goto(base + "/admin/login");
    await page.getByRole("button", { name: "Mở không gian demo" }).click();
    await page.goto(base + "/admin/settings");
    await page
      .getByLabel("Liên kết Zalo", { exact: true })
      .fill("https://zalo.me/0912345678");
    await page
      .getByLabel("Liên kết Facebook", { exact: true })
      .fill("https://facebook.com/hytales-test");
    await page.getByRole("button", { name: "Thêm kênh liên hệ" }).click();
    await page
      .getByLabel("Liên kết Instagram", { exact: true })
      .fill("https://instagram.com/hytales-test");
    await saveSettings();
    await page.screenshot({
      path: path.join(output, "settings-widgets-desktop.png"),
      fullPage: true,
    });
    await page.goto(base);
    await page
      .getByRole("link", { name: "Liên hệ qua Instagram", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("link", { name: "Liên hệ qua Zalo", exact: true })
        .getAttribute("href"),
      "https://zalo.me/0912345678",
    );
    await page.goto(base + "/admin/settings");
    await page.getByLabel("Hiển thị Facebook", { exact: true }).uncheck();
    await page.getByLabel("Tên hiển thị kênh 3").fill("Ảnh miền vườn");
    await page
      .getByLabel("Liên kết Ảnh miền vườn", { exact: true })
      .fill("https://instagram.com/hytales-updated");
    await saveSettings();
    await page.goto(base);
    await page
      .getByRole("link", { name: "Liên hệ qua Ảnh miền vườn", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("link", { name: "Liên hệ qua Facebook", exact: true })
        .count(),
      0,
    );
    await page.goto(base + "/admin/settings");
    await page
      .getByRole("button", { name: "Xóa kênh Ảnh miền vườn", exact: true })
      .click();
    await page.getByLabel("Hiển thị widget", { exact: true }).uncheck();
    await saveSettings();
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page
        .getByRole("link", { name: "Liên hệ qua Zalo", exact: true })
        .count(),
      0,
      "global toggle hides widgets",
    );
    await page.goto(base + "/admin/settings");
    await page.getByLabel("Hiển thị widget", { exact: true }).check();
    await saveSettings();
    await page.goto(base + "/admin/products");
    await page
      .getByRole("button", { name: "Tạo sản phẩm", exact: true })
      .click();
    let editor = page.getByRole("dialog", {
      name: "Tạo câu chuyện mới",
      exact: true,
    });
    const batch = await editor
      .getByLabel("Mã lô hàng", { exact: true })
      .inputValue();
    assert.match(batch, /^HY-\d{4}-[A-F0-9]{8}$/);
    assert.equal(await editor.getByLabel("Đường dẫn ổn định").count(), 0);
    await editor.getByRole("button", { name: "Tạo mã lô mới" }).click();
    assert.notEqual(
      await editor.getByLabel("Mã lô hàng", { exact: true }).inputValue(),
      batch,
    );
    await editor
      .getByLabel("Mã lô hàng", { exact: true })
      .fill("TEST-BATCH-001");
    await editor
      .getByLabel("Tên sản phẩm (VI)", { exact: true })
      .fill("Sản phẩm kiểm thử");
    await editor
      .getByLabel("Tên sản phẩm (EN)", { exact: true })
      .fill("Test product");
    await editor
      .getByLabel("Trạng thái", { exact: true })
      .selectOption("published");
    await editor.getByRole("tab", { name: "Ảnh & video", exact: true }).click();
    assert.equal(
      await editor.locator("input[type=url],textarea").count(),
      0,
      "no URL media fields",
    );
    await editor
      .getByRole("button", { name: "Chọn ảnh từ thư viện", exact: true })
      .click();
    let picker = page.getByRole("dialog", {
      name: "Chọn ảnh từ thư viện",
      exact: true,
    });
    await picker
      .getByRole("button", {
        name: "Nhãn lồng Phố Hiến – ảnh chính",
        exact: true,
      })
      .click();
    await picker.getByRole("button", { name: "Dùng ảnh này" }).click();
    await editor.getByRole("img", { name: "Ảnh đại diện sản phẩm" }).waitFor();
    await editor
      .getByRole("button", { name: "Xóa ảnh đại diện", exact: true })
      .click();
    await editor.getByText("Chưa có ảnh đại diện", { exact: true }).waitFor();
    const imageFile = path.resolve(__dirname, "../public/media/nhan-long.webp");
    await editor
      .getByLabel("Tải ảnh đại diện", { exact: true })
      .setInputFiles(imageFile);
    await page.waitForFunction(() =>
      document.querySelector(".editor-image-preview")?.src.startsWith("blob:"),
    );
    await editor
      .getByLabel("Tải ảnh bộ sưu tập", { exact: true })
      .setInputFiles(imageFile);
    await editor
      .getByRole("button", { name: "Xóa ảnh bộ sưu tập 1", exact: true })
      .waitFor();
    await editor
      .getByRole("button", { name: "Xóa ảnh bộ sưu tập 1", exact: true })
      .click();
    assert.equal(await editor.locator(".gallery-editor-grid img").count(), 0);
    await editor
      .getByRole("button", { name: "Thêm ảnh từ thư viện", exact: true })
      .click();
    picker = page.getByRole("dialog", {
      name: "Chọn ảnh từ thư viện",
      exact: true,
    });
    await picker
      .getByRole("button", {
        name: "Nhãn lồng Phố Hiến – khung hình 1",
        exact: true,
      })
      .click();
    await picker
      .getByRole("button", {
        name: "Nhãn lồng Phố Hiến – khung hình 2",
        exact: true,
      })
      .click();
    await picker.getByRole("button", { name: "Thêm ảnh đã chọn" }).click();
    assert.equal(await editor.locator(".gallery-editor-grid img").count(), 2);
    await editor
      .getByRole("button", { name: "Chọn video từ thư viện", exact: true })
      .click();
    picker = page.getByRole("dialog", {
      name: "Chọn video từ thư viện",
      exact: true,
    });
    await picker
      .getByRole("button", {
        name: "Nhãn lồng Phố Hiến – phim 30 giây",
        exact: true,
      })
      .click();
    await picker.getByRole("button", { name: "Dùng video này" }).click();
    await editor
      .getByRole("button", { name: "Xóa video", exact: true })
      .click();
    await editor
      .getByText("Chưa có video câu chuyện", { exact: true })
      .waitFor();
    await editor
      .getByLabel("Tải video câu chuyện", { exact: true })
      .setInputFiles(path.resolve(__dirname, "../public/media/nhan-long.mp4"));
    await page.waitForFunction(() =>
      document.querySelector(".editor-video-preview")?.src.startsWith("blob:"),
    );
    await page.screenshot({
      path: path.join(output, "product-media-desktop.png"),
    });
    await editor
      .getByRole("button", { name: "Lưu sản phẩm", exact: true })
      .click();
    await editor.waitFor({ state: "hidden" });
    const product = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("hytales.demo.v1")).products.find(
        (p) => p.name === "Sản phẩm kiểm thử",
      ),
    );
    assert.equal(product.batchCode, "TEST-BATCH-001");
    assert.ok(product.image.startsWith("local-media:"));
    assert.ok(product.video.startsWith("local-media:"));
    await page.reload();
    await page
      .getByRole("button", { name: "Sửa Sản phẩm kiểm thử", exact: true })
      .click();
    editor = page.getByRole("dialog", {
      name: "Chăm chút câu chuyện sản phẩm",
      exact: true,
    });
    await editor.getByRole("tab", { name: "Ảnh & video" }).click();
    await page.waitForFunction(
      () =>
        document.querySelector(".editor-image-preview")?.naturalWidth > 0 &&
        document.querySelector(".editor-video-preview")?.readyState >= 1,
    );
    await editor.getByRole("button", { name: "Đóng", exact: true }).click();
    await page.goto(base + "/p/" + product.slug);
    await page
      .getByRole("heading", { name: "Sản phẩm kiểm thử", exact: true })
      .waitFor();
    await page.waitForFunction(() =>
      document
        .querySelector(".product-hero-media video")
        ?.src.startsWith("blob:"),
    );
    await page
      .locator(".product-hero-media video")
      .evaluate((video) => video.load());
    await page.waitForFunction(
      () =>
        document.querySelector(".product-hero-media video")?.readyState >= 1,
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    await page.waitForFunction(() => {
      const video = document.querySelector(".product-hero-media video");
      return video && !video.paused && video.currentTime > 0;
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(base + "/admin/qr?product=nhan-long");
    await page.locator(".qr-label img").waitFor();
    const beforeQr = await page.locator(".qr-label img").getAttribute("src");
    await page
      .getByLabel("Đường dẫn đích", { exact: true })
      .selectOption("vai-trung");
    await page.getByRole("button", { name: "Áp dụng đích đến" }).click();
    await page.getByText(/Đích hiện tại: Vải trứng Phù Cừ/).waitFor();
    assert.equal(
      await page.locator(".qr-label img").getAttribute("src"),
      beforeQr,
      "QR remains unchanged after changing target",
    );
    await page.goto(base + "/q/nhan-long");
    await page.waitForURL("**/p/vai-trung-phu-cu");
    await page.goto(base + "/admin/qr?product=nhan-long");
    await page
      .getByLabel("Đường dẫn đích", { exact: true })
      .selectOption("custom");
    await page
      .getByLabel("Liên kết riêng", { exact: true })
      .fill("javascript:alert(1)");
    await page.getByRole("button", { name: "Áp dụng đích đến" }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Nhập liên kết" })
      .waitFor();
    await page
      .getByLabel("Liên kết riêng", { exact: true })
      .fill("https://example.com/hytales");
    await page.getByRole("button", { name: "Áp dụng đích đến" }).click();
    await page
      .getByText(/Đích hiện tại: https:\/\/example.com\/hytales/)
      .waitFor();
    await page.getByLabel("Chọn logo thương hiệu").setInputFiles(imageFile);
    await page.getByRole("button", { name: "Xóa logo", exact: true }).click();
    assert.equal(
      await page.getByLabel("Chọn logo thương hiệu").inputValue(),
      "",
    );
    assert.equal(
      await page.getByRole("img", { name: "Logo đã chọn" }).count(),
      0,
    );
    await page.getByLabel("Chọn logo thương hiệu").setInputFiles(imageFile);
    await page.getByRole("img", { name: "Logo đã chọn" }).waitFor();
    await page.getByRole("button", { name: "Xóa logo", exact: true }).click();
    await page.screenshot({
      path: path.join(output, "qr-destination-desktop.png"),
      fullPage: true,
    });
    await page.goto(base + "/q/nhan-long");
    await page.getByText("example.com", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("link", { name: "Mở trang đích", exact: true })
        .getAttribute("href"),
      "https://example.com/hytales",
    );
    for (const width of [360, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of ["/admin/settings", "/admin/qr?product=nhan-long"]) {
        await page.goto(base + route);
        await page.waitForLoadState("networkidle");
        await overflow(width + route);
        if (width === 390)
          await page.screenshot({
            path: path.join(
              output,
              route.includes("settings")
                ? "settings-widgets-mobile.png"
                : "qr-destination-mobile.png",
            ),
            fullPage: true,
          });
      }
      await page.goto(base + "/admin/products");
      await page
        .getByRole("button", { name: "Sửa Sản phẩm kiểm thử", exact: true })
        .click();
      const mobileEditor = page.getByRole("dialog", {
        name: "Chăm chút câu chuyện sản phẩm",
        exact: true,
      });
      await mobileEditor
        .getByRole("tab", { name: "Ảnh & video", exact: true })
        .click();
      await overflow(width + " media editor");
      if (width === 390)
        await page.screenshot({
          path: path.join(output, "product-media-mobile.png"),
        });
      await mobileEditor
        .getByRole("button", { name: "Chọn ảnh từ thư viện", exact: true })
        .click();
      await page
        .getByRole("dialog", { name: "Chọn ảnh từ thư viện", exact: true })
        .waitFor();
      await overflow(width + " media library");
      await page.goto(base);
      await page
        .getByRole("link", { name: "Liên hệ qua Zalo", exact: true })
        .waitFor();
      await overflow(width + " widgets");
      const widget = await page
        .getByRole("link", { name: "Liên hệ qua Zalo", exact: true })
        .boundingBox();
      assert.ok(
        widget.y >= 0 && widget.y + widget.height <= 844,
        "widget inside viewport",
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/admin/products");
    await page
      .getByRole("button", { name: "Xóa Sản phẩm kiểm thử", exact: true })
      .click();
    let confirm = page.getByRole("dialog", {
      name: "Xóa sản phẩm",
      exact: true,
    });
    await confirm.getByRole("button", { name: "Hủy", exact: true }).click();
    await page
      .getByRole("button", { name: "Xóa Sản phẩm kiểm thử", exact: true })
      .click();
    confirm = page.getByRole("dialog", { name: "Xóa sản phẩm", exact: true });
    await confirm
      .getByRole("button", { name: "Xóa sản phẩm", exact: true })
      .click();
    await confirm.waitFor({ state: "hidden" });
    await page.reload();
    assert.equal(
      await page
        .getByRole("button", { name: "Sửa Sản phẩm kiểm thử", exact: true })
        .count(),
      0,
    );
    await page.goto(base + "/q/" + product.id);
    await page
      .getByRole("heading", {
        name: "Câu chuyện này chưa được mở",
        exact: true,
      })
      .waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: social channels add/edit/delete/hide, auto batch code, visual media library/upload/delete and persistence, product CRUD, stable QR destination choice/custom validation, logo removal/reupload, mobile layouts, no JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
