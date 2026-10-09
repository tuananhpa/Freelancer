const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");
const jsQR = require("jsqr");
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const output = path.resolve(__dirname, "../test-results");
fs.mkdirSync(output, { recursive: true });
async function noOverflow(page, label) {
  const result = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(
    result.scroll <= result.width,
    `${label}: overflow ${JSON.stringify(result)}`,
  );
}
function decodeQr(filename, expected) {
  const image = PNG.sync.read(fs.readFileSync(filename));
  const code = jsQR(
    new Uint8ClampedArray(image.data),
    image.width,
    image.height,
  );
  assert.equal(code?.data, expected, "QR decodes to the stable product URL");
}
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
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator(".product-card").count(), 3);
    await noOverflow(page, "desktop home");
    await page.screenshot({
      path: path.join(output, "home-desktop.png"),
      fullPage: true,
    });
    await page.screenshot({ path: path.join(output, "home-preview.png") });
    await page.goto(`${base}/admin/products`);
    await page.getByRole("button", { name: "Mở không gian demo" }).waitFor();
    assert.ok(
      page.url().includes("/admin/login"),
      "private admin redirects to login",
    );
    await page.goto(`${base}/p/nhan-long-pho-hien`);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page.getByRole("heading", { level: 1 }).innerText(),
      "Nhãn lồng Phố Hiến",
    );
    await page.getByRole("tab", { name: /Đón mùa quả ngọt/ }).click();
    assert.match(
      await page.getByRole("tabpanel").innerText(),
      /Lựa chọn chùm nhãn/,
    );
    await page.locator(".story-gallery button").first().click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Ảnh tiếp" }).click();
    await page.getByRole("button", { name: "Đóng", exact: true }).click();
    await page
      .getByRole("button", { name: "Tặng bạn bè / Đặt mua thêm" })
      .click();
    const inquiry = page.getByRole("dialog");
    await inquiry.getByLabel("Tên của bạn").fill("Khách kiểm tra");
    await inquiry.getByLabel("Số điện thoại").fill("0912345678");
    await inquiry.getByLabel("Lời nhắn").fill("Quà quê cho bạn");
    await inquiry.getByRole("checkbox").check();
    await inquiry.getByRole("button", { name: "Gửi yêu cầu" }).click();
    await inquiry.getByText("Đã lưu yêu cầu", { exact: true }).waitFor();
    await inquiry.getByRole("button", { name: "Tiếp tục khám phá" }).click();
    const review = page.locator(".review-form");
    await review.getByRole("button", { name: "5 sao", exact: true }).click();
    await review.getByLabel("Tên của bạn").fill("Người thưởng thức");
    await review
      .getByLabel("Cảm nhận của bạn")
      .fill("Câu chuyện thật gần gũi.");
    await review.getByRole("button", { name: "Gửi cảm nhận" }).click();
    await page
      .locator(".review-item")
      .getByText("Câu chuyện thật gần gũi.")
      .waitFor();
    await page.getByRole("button", { name: "Hỏi HYTales" }).click();
    assert.match(
      await page.locator(".faq-button").first().innerText(),
      /Nhãn lồng/,
    );
    await page.locator(".faq-button").first().click();
    await page.locator(".chat-answer").waitFor();
    await page
      .getByLabel("Gửi câu hỏi cho đội ngũ")
      .fill("Nhà vườn có giao quà không?");
    await page
      .getByRole("button", { name: "Gửi câu hỏi", exact: true })
      .click();
    await page.getByText(/Đã lưu câu hỏi vào hộp thư admin demo/).waitFor();
    await page.getByRole("button", { name: "Đóng trò chuyện" }).click();
    await page.reload();
    await page
      .locator(".review-item")
      .getByText("Câu chuyện thật gần gũi.")
      .waitFor();
    await page.screenshot({
      path: path.join(output, "product-desktop.png"),
      fullPage: true,
    });
    await page.goto(`${base}/admin/login`);
    await page.getByRole("button", { name: "Mở không gian demo" }).click();
    await page
      .getByRole("heading", { name: "Chào người kể chuyện." })
      .waitFor();
    await page.screenshot({
      path: path.join(output, "admin-desktop.png"),
      fullPage: true,
    });
    await page.goto(`${base}/admin/inbox`);
    await page
      .getByText("Nhà vườn có giao quà không?", { exact: true })
      .waitFor();
    await page.getByRole("button", { name: /Yêu cầu kết nối/ }).click();
    await page.getByText("Quà quê cho bạn", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Đánh dấu đã liên hệ" }).click();
    await page
      .getByRole("button", { name: "Đã liên hệ", exact: true })
      .waitFor();
    await page.goto(`${base}/admin/products`);
    await page.getByRole("button", { name: "Sửa Nhãn lồng Phố Hiến" }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Câu chuyện", exact: true }).click();
    await dialog
      .getByLabel("Nội dung chuyện (VI)")
      .fill("Câu chuyện nhãn sau khi được cập nhật từ admin.");
    await dialog.getByRole("button", { name: "Lưu sản phẩm" }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.goto(`${base}/p/nhan-long-pho-hien`);
    await page
      .getByText("Câu chuyện nhãn sau khi được cập nhật từ admin.", {
        exact: true,
      })
      .waitFor();
    await page.goto(`${base}/admin/qr?product=nhan-long`);
    await page.locator(".qr-label img").waitFor();
    for (const format of ["PNG", "SVG", "PDF"]) {
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: format, exact: true }).click();
      const download = await downloadPromise;
      const filename = path.join(output, download.suggestedFilename());
      await download.saveAs(filename);
      assert.ok(
        fs.statSync(filename).size > 100,
        `${format} export is a real file`,
      );
    }
    decodeQr(
      path.join(output, "hytales-nhan-long-pho-hien.png"),
      `${base}/q/nhan-long`,
    );
    await page.locator('input[type="color"]').fill("#ffffff");
    await page
      .getByText("Chọn màu QR đủ tối để giữ khả năng quét trên nền trắng.", {
        exact: true,
      })
      .waitFor();
    await page.locator('input[type="color"]').fill("#294b35");
    await page.locator(".qr-label img").waitFor();
    const logo = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#294b35";
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "white";
      ctx.font = "bold 28px Arial";
      ctx.fillText("HY", 12, 43);
      return c.toDataURL("image/png").split(",")[1];
    });
    const oldQr = await page.locator(".qr-label img").getAttribute("src");
    await page.locator('input[type="file"]').setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from(logo, "base64"),
    });
    await page.waitForFunction((old) => {
      const src = document.querySelector(".qr-label img")?.getAttribute("src");
      return src && src !== old;
    }, oldQr);
    const logoDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "PNG", exact: true }).click();
    const logoDownload = await logoDownloadPromise;
    await logoDownload.saveAs(path.join(output, "qr-with-logo.png"));
    decodeQr(path.join(output, "qr-with-logo.png"), `${base}/q/nhan-long`);
    await page.screenshot({
      path: path.join(output, "qr-desktop.png"),
      fullPage: true,
    });
    await page.goto(`${base}/p/khong-ton-tai`);
    await page
      .getByRole("heading", { name: "Câu chuyện này chưa được mở" })
      .waitFor();
    for (const width of [360, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(base);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      await noOverflow(page, `${width} home`);
      if (width === 390)
        await page.screenshot({
          path: path.join(output, "home-mobile.png"),
          fullPage: true,
        });
      await page.goto(`${base}/p/vai-trung-phu-cu`);
      await page.waitForLoadState("networkidle");
      await noOverflow(page, `${width} product`);
      if (width === 390)
        await page.screenshot({
          path: path.join(output, "product-mobile.png"),
          fullPage: true,
        });
      await page.goto(`${base}/admin/products`);
      await page
        .getByRole("heading", { level: 1, name: "Sản phẩm & câu chuyện" })
        .waitFor();
      await noOverflow(page, `${width} admin`);
      if (width === 390)
        await page.screenshot({
          path: path.join(output, "admin-mobile.png"),
          fullPage: true,
        });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/admin/products`);
    await page.getByRole("button", { name: "Sửa Nhãn lồng Phố Hiến" }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Thông tin lô" }).click();
    await dialog
      .getByRole("combobox", { name: /Trạng thái/ })
      .selectOption("draft");
    await dialog.getByRole("button", { name: "Lưu sản phẩm" }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.goto(`${base}/p/nhan-long-pho-hien`);
    await page
      .getByRole("heading", { name: "Câu chuyện này chưa được mở" })
      .waitFor();
    await page.goto(`${base}/admin/products`);
    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await page.getByRole("button", { name: "Mở không gian demo" }).waitFor();
    assert.deepEqual(errors, [], "no uncaught browser errors");
    console.log(
      "PASS: guest routes, admin guard, timeline, gallery, inquiry, review persistence, FAQ/chat, CMS, drafts, QR PNG/SVG/PDF, QR decoding with/without logo, QR contrast validation, logout, responsive 360/390/768/1440, no JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
