const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { auditText } = require("./contrast.cjs");
const { PNG } = require("pngjs");
const jsQR = require("jsqr");
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const output = path.resolve(__dirname, "../test-results");
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      (process.platform === "win32"
        ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
        : undefined),
  });
  try {
    const context = await browser.newContext({
      locale: "vi-VN",
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "day");
    const before = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    await page
      .getByRole("button", { name: "Chuyển sang Night", exact: true })
      .click();
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "night",
    );
    assert.notEqual(
      await page
        .locator("body")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      before,
      "Night changes the page palette",
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Chuyển sang Day", exact: true })
      .waitFor();
    assert.deepEqual(await auditText(page), [], "Night homepage text contrast");
    await page.screenshot({ path: path.join(output, "night-home.png") });
    await page.goto(base + "/admin/login");
    await page.getByRole("button", { name: "Mở không gian quản trị" }).click();
    await page.goto(base + "/admin/settings");
    await page
      .getByRole("heading", { name: "Logo & khung ảnh", exact: true })
      .waitFor();
    for (let i = 0; i < 4; i++)
      await page
        .getByRole("button", { name: "Thêm kênh liên hệ", exact: true })
        .click();
    const platforms = [
      "zalo",
      "facebook",
      "instagram",
      "messenger",
      "tiktok",
      "youtube",
    ];
    for (let i = 0; i < platforms.length; i++)
      await page
        .locator(".social-link-editor")
        .nth(i)
        .getByRole("textbox", { name: /Liên kết/ })
        .fill(`https://${platforms[i]}.com/hytales`);
    const logo = page.getByTestId("brand-logo-editor");
    await logo
      .locator('input[type="file"]')
      .setInputFiles(path.resolve(__dirname, "../public/media/nhan-long.webp"));
    await logo.locator(".image-framing").waitFor();
    await logo.getByLabel("Cách hiển thị").selectOption("cover");
    await logo
      .getByRole("slider", { name: "Vị trí ngang", exact: true })
      .fill("80");
    await logo
      .getByRole("slider", { name: "Vị trí dọc", exact: true })
      .fill("20");
    const story = page.getByTestId("story-image-0");
    await story
      .getByRole("slider", { name: "Vị trí ngang", exact: true })
      .fill("10");
    await story
      .getByRole("slider", { name: "Vị trí dọc", exact: true })
      .fill("75");
    await page
      .getByLabel("Ảnh cần chỉnh", { exact: true })
      .selectOption("/media/vai-trung.webp");
    const other = page.locator(".appearance-panel > .image-framing");
    await other
      .getByRole("slider", { name: "Vị trí ngang", exact: true })
      .fill("25");
    await other
      .getByRole("slider", { name: "Vị trí dọc", exact: true })
      .fill("95");
    await page
      .getByRole("button", { name: "Lưu thiết lập", exact: true })
      .click();
    await page
      .getByText("Đã lưu thiết lập liên hệ.", { exact: true })
      .waitFor();
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page
        .locator(".site-header .brand-custom-logo img")
        .evaluate((el) => getComputedStyle(el).objectPosition),
      "80% 20%",
    );
    assert.equal(
      await page
        .locator(".story-grower img")
        .evaluate((el) => getComputedStyle(el).objectPosition),
      "10% 75%",
    );
    assert.equal(
      await page
        .locator(".passport-cover img")
        .evaluate((el) => getComputedStyle(el).objectPosition),
      "25% 95%",
    );
    assert.equal(
      await page.locator(".social-widgets img.official-social-logo").count(),
      6,
    );
    assert.ok(
      await page
        .locator(".social-widgets img")
        .evaluateAll((els) =>
          els.every((el) => el.complete && el.naturalWidth > 0),
        ),
      "official logos load",
    );
    await page.goto(base + "/admin/products");
    await page
      .getByRole("button", { name: "Sửa Nhãn lồng Phố Hiến", exact: true })
      .click();
    await page.getByRole("tab", { name: "Ảnh & video", exact: true }).click();
    const cover = page.getByTestId("product-cover-framing");
    assert.deepEqual(
      await auditText(page),
      [],
      "Night product editor text contrast",
    );
    await cover
      .getByRole("slider", { name: "Vị trí ngang", exact: true })
      .fill("15");
    await cover
      .getByRole("slider", { name: "Vị trí dọc", exact: true })
      .fill("90");
    const gallery = page.getByTestId("gallery-framing-0");
    await page
      .getByRole("button", { name: "Chỉnh khung ảnh 1", exact: true })
      .click();
    await gallery
      .getByRole("slider", { name: "Vị trí ngang", exact: true })
      .fill("30");
    await gallery
      .getByRole("slider", { name: "Vị trí dọc", exact: true })
      .fill("70");
    await page
      .getByRole("button", { name: "Lưu sản phẩm", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page
        .locator(".product-card")
        .first()
        .locator("img")
        .evaluate((el) => getComputedStyle(el).objectPosition),
      "15% 90%",
    );
    await page.goto(base + "/p/nhan-long-pho-hien");
    await page.waitForLoadState("networkidle");
    assert.deepEqual(
      await auditText(page),
      [],
      "Night product page text contrast",
    );
    assert.equal(
      await page
        .locator(".story-gallery img")
        .nth(1)
        .evaluate((el) => getComputedStyle(el).objectPosition),
      "30% 70%",
    );
    for (const width of [1440, 1280, 1200, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base);
      await page.waitForLoadState("networkidle");
      const sizing = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        over: [...document.querySelectorAll("body *")]
          .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
          .map((el) => ({
            cls: el.className,
            right: el.getBoundingClientRect().right,
          })),
      }));
      assert.ok(
        sizing.scroll <= sizing.width,
        `home fits ${width}px: ${JSON.stringify(sizing)}`,
      );
      const language = await page.locator(".language-button").boundingBox(),
        theme = await page.locator(".theme-toggle").boundingBox();
      assert.ok(
        theme.x >= language.x + language.width &&
          theme.x + theme.width <= width,
        "theme sits alongside VI/EN",
      );
      await page
        .getByRole("button", { name: "Chuyển sang Day", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Chuyển sang Night", exact: true })
        .click();
      if (width === 390)
        await page.screenshot({
          path: path.join(output, "night-home-mobile.png"),
        });
    }
    await page.goto(base + "/admin/settings");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(output, "appearance-settings-night.png"),
      fullPage: true,
    });
    assert.deepEqual(await auditText(page), [], "Night settings text contrast");
    await page
      .getByRole("button", { name: "Chuyển sang Day", exact: true })
      .click();
    await logo.getByRole("button", { name: "Gỡ ảnh", exact: true }).click();
    await page
      .getByRole("button", { name: "Lưu thiết lập", exact: true })
      .click();
    await page
      .getByText("Đã lưu thiết lập liên hệ.", { exact: true })
      .waitFor();
    await page.goto(base);
    assert.equal(
      await page.locator(".site-header .brand-symbol img").count(),
      0,
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/admin/settings");
    const facebook = page.locator(".social-link-editor").nth(1);
    await facebook.locator(".social-logo-details summary").click();
    await facebook
      .getByRole("button", { name: "Chọn từ thư viện", exact: true })
      .click();
    let picker = page.getByRole("dialog", {
      name: "Chọn ảnh từ thư viện",
      exact: true,
    });
    await picker.getByRole("button", { name: "Đóng", exact: true }).click();
    assert.equal(
      await page
        .getByText("Đã lưu thiết lập liên hệ.", { exact: true })
        .count(),
      0,
      "closing library does not submit settings",
    );
    await facebook
      .getByRole("button", { name: "Chọn từ thư viện", exact: true })
      .click();
    picker = page.getByRole("dialog", {
      name: "Chọn ảnh từ thư viện",
      exact: true,
    });
    await picker.locator(".media-library-item").first().click();
    await picker
      .getByRole("button", { name: "Dùng ảnh này", exact: true })
      .click();
    await facebook.getByLabel("Cách hiển thị").selectOption("cover");
    await facebook
      .getByRole("slider", { name: "Vị trí ngang", exact: true })
      .fill("100");
    await facebook
      .getByRole("slider", { name: "Vị trí dọc", exact: true })
      .fill("0");
    await page
      .getByRole("button", { name: "Lưu thiết lập", exact: true })
      .click();
    await page
      .getByText("Đã lưu thiết lập liên hệ.", { exact: true })
      .waitFor();
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page
        .getByRole("link", { name: "Liên hệ qua Facebook", exact: true })
        .locator("img")
        .evaluate((el) => getComputedStyle(el).objectPosition),
      "100% 0%",
    );
    await page.goto(base + "/admin/settings");
    await facebook.locator(".social-logo-details summary").click();
    await facebook.getByRole("button", { name: "Gỡ ảnh", exact: true }).click();
    await page
      .getByRole("button", { name: "Lưu thiết lập", exact: true })
      .click();
    await page
      .getByText("Đã lưu thiết lập liên hệ.", { exact: true })
      .waitFor();
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page
        .getByRole("link", { name: "Liên hệ qua Facebook", exact: true })
        .locator("img")
        .getAttribute("data-platform"),
      "facebook",
    );
    await page.goto(base + "/admin/qr?product=nhan-long");
    await page
      .getByLabel("Chọn logo thương hiệu")
      .setInputFiles(path.resolve(__dirname, "../public/media/nhan-long.webp"));
    const qrFrame = page.getByTestId("qr-logo-framing");
    await qrFrame.getByLabel("Cách hiển thị").selectOption("cover");
    await qrFrame
      .getByRole("slider", { name: "Vị trí ngang", exact: true })
      .fill("0");
    await page.locator(".qr-label img").waitFor();
    const leftLogo = await page.locator(".qr-label img").getAttribute("src");
    await qrFrame
      .getByRole("slider", { name: "Vị trí ngang", exact: true })
      .fill("100");
    await page.waitForFunction((before) => {
      const img = document.querySelector(".qr-label img");
      return img && img.getAttribute("src") !== before;
    }, leftLogo);
    const qrData = await page.locator(".qr-label img").getAttribute("src");
    const png = PNG.sync.read(Buffer.from(qrData.split(",")[1], "base64"));
    assert.equal(
      jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data,
      base + "/q/nhan-long",
      "framed QR remains scannable",
    );
    await page
      .getByRole("button", { name: "Chuyển sang Night", exact: true })
      .click();
    assert.deepEqual(await auditText(page), [], "Night QR editor contrast");
    await page.screenshot({
      path: path.join(output, "night-qr-logo-framing.png"),
    });
    for (const route of [
      "/admin",
      "/admin/inbox",
      "/admin/quick-replies",
      "/admin/login",
    ]) {
      await page.goto(base + route);
      await page.waitForLoadState("networkidle");
      assert.deepEqual(
        await auditText(page),
        [],
        "Night text contrast " + route,
      );
    }
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("button", { name: "Hỏi HYTales", exact: true })
      .click();
    await page.locator(".chat-suggestions button").first().click();
    assert.deepEqual(await auditText(page), [], "Night chat contrast");
    await page
      .getByRole("button", { name: "Đóng trò chuyện", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Kết nối cùng HYTales", exact: true })
      .click();
    await page.getByRole("dialog").waitFor();
    assert.deepEqual(await auditText(page), [], "Night inquiry form contrast");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Đóng", exact: true })
      .click();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: Day/Night beside VI/EN, saved theme; site/social logos upload/library/frame/remove; official assets; homepage/global/product/gallery framing; scannable framed QR; Night text contrast across public/admin/chat/forms; responsive 360–1440; no JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
