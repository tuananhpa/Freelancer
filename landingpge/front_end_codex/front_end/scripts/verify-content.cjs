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
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      (process.platform === "win32"
        ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
        : undefined),
  });
  try {
    const context = await browser.newContext({
      locale: "vi-VN",
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page
        .locator(".story-mosaic")
        .evaluate((el) => getComputedStyle(el).display),
      "grid",
      "story images render in the intended grid",
    );
    assert.ok(
      await page
        .locator(".home-hero")
        .evaluate((el) => parseFloat(getComputedStyle(el).paddingTop) <= 28),
      "hero content pulled closer to header",
    );
    if (!process.argv.includes("--widget-only")) {
      assert.equal(
        await page
          .getByText("Từ đất và người Hưng Yên", { exact: true })
          .count(),
        0,
      );
      assert.ok(
        (await page.locator("#cau-chuyen img").count()) >= 3,
        "story section includes real imagery",
      );
    }
    await page.goto(base + "/admin/login");
    await page.getByRole("button", { name: "Mở không gian demo" }).click();
    await page.goto(base + "/admin/settings");
    await page.getByLabel("Nền tảng kênh 1").selectOption("messenger");
    await page
      .getByLabel("Liên kết Messenger", { exact: true })
      .fill("https://m.me/hytales-test");
    await page
      .getByRole("button", { name: "Lưu thiết lập", exact: true })
      .click();
    await page
      .getByText("Đã lưu thiết lập liên hệ.", { exact: true })
      .waitFor();
    await page.goto(base);
    const messenger = page.getByRole("link", {
      name: "Liên hệ qua Messenger",
      exact: true,
    });
    await messenger.hover();
    const label = page
      .locator(".social-widgets")
      .getByText("Messenger", { exact: true });
    await label.waitFor();
    const rect = await label.boundingBox();
    console.log("Messenger label size", rect);
    assert.ok(
      rect.width >= 80 && rect.height < 50,
      "tooltip reads horizontally without clipping",
    );
    assert.ok(
      await label.evaluate((el) => el.getBoundingClientRect().left >= 0),
    );
    await page.screenshot({
      path: path.join(output, "widget-tooltip-fixed.png"),
    });
    if (process.argv.includes("--widget-only")) return;
    await page.goto(base + "/admin/quick-replies");
    await page
      .getByRole("heading", { name: "Hỏi đáp nhanh", exact: true })
      .waitFor();
    await page
      .getByLabel("Lời chào (VI)", { exact: true })
      .fill("Chào bạn, cùng nghe chuyện quê nhé!");
    await page
      .getByRole("button", { name: "Thêm câu hỏi", exact: true })
      .click();
    let item = page.locator(".quick-reply-item").last();
    await item
      .getByLabel("Câu hỏi (VI)", { exact: true })
      .fill("Nhãn được kể chuyện thế nào?");
    await item
      .getByLabel("Trả lời (VI)", { exact: true })
      .fill("Bạn chạm mã QR để xem phim và gặp người trồng.");
    await item
      .getByLabel("Câu hỏi (EN)", { exact: true })
      .fill("How do I discover the longan story?");
    await item
      .getByLabel("Trả lời (EN)", { exact: true })
      .fill("Scan the QR to watch the film and meet the growers.");
    await item
      .getByRole("button", { name: "Đưa lên trên", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Lưu bộ câu hỏi", exact: true })
      .click();
    await page.getByText("Đã lưu bộ câu hỏi.", { exact: true }).waitFor();
    await page.reload();
    await page.getByLabel("Lời chào (VI)", { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("Lời chào (VI)", { exact: true }).inputValue(),
      "Chào bạn, cùng nghe chuyện quê nhé!",
    );
    await page.goto(base);
    await page
      .getByRole("button", { name: "Hỏi HYTales", exact: true })
      .click();
    await page
      .getByText("Chào bạn, cùng nghe chuyện quê nhé!", { exact: true })
      .waitFor();
    await page
      .getByRole("button", {
        name: "Nhãn được kể chuyện thế nào?",
        exact: true,
      })
      .click();
    await page
      .locator(".chat-answer")
      .filter({ hasText: "Bạn chạm mã QR để xem phim và gặp người trồng." })
      .waitFor();
    await page
      .getByRole("button", { name: "Switch to English", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "How do I discover the longan story?",
        exact: true,
      })
      .waitFor();
    await page
      .locator(".chat-answer")
      .filter({
        hasText: "Scan the QR to watch the film and meet the growers.",
      })
      .waitFor();
    await page
      .getByRole("button", { name: "Chuyển sang tiếng Việt", exact: true })
      .click();
    await page.goto(base + "/admin/quick-replies");
    item = page.locator(".quick-reply-item").nth(1);
    assert.equal(
      await item.getByLabel("Câu hỏi (VI)", { exact: true }).inputValue(),
      "Nhãn được kể chuyện thế nào?",
    );
    await item.getByLabel("Hiển thị câu hỏi", { exact: true }).uncheck();
    await page
      .getByRole("button", { name: "Lưu bộ câu hỏi", exact: true })
      .click();
    await page.getByText("Đã lưu bộ câu hỏi.", { exact: true }).waitFor();
    await page.goto(base);
    await page
      .getByRole("button", { name: "Hỏi HYTales", exact: true })
      .click();
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page
        .getByRole("button", {
          name: "Nhãn được kể chuyện thế nào?",
          exact: true,
        })
        .count(),
      0,
    );
    await page.goto(base + "/admin/quick-replies");
    await page
      .getByLabel("Bộ câu hỏi", { exact: true })
      .selectOption("nhan-long");
    await page
      .getByRole("button", { name: "Thêm câu hỏi", exact: true })
      .click();
    item = page.locator(".quick-reply-item").last();
    await item
      .getByLabel("Câu hỏi (VI)", { exact: true })
      .fill("Câu hỏi riêng cho nhãn");
    await item
      .getByLabel("Trả lời (VI)", { exact: true })
      .fill("Câu trả lời riêng đã được admin cập nhật.");
    await page
      .getByRole("button", { name: "Lưu bộ câu hỏi", exact: true })
      .click();
    await page.getByText("Đã lưu bộ câu hỏi.", { exact: true }).waitFor();
    await page.goto(base + "/p/nhan-long-pho-hien");
    await page
      .getByRole("button", { name: "Hỏi HYTales", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Câu hỏi riêng cho nhãn", exact: true })
      .click();
    await page
      .locator(".chat-answer")
      .filter({ hasText: "Câu trả lời riêng đã được admin cập nhật." })
      .waitFor();
    await page.goto(base + "/admin/quick-replies");
    await page
      .locator(".quick-reply-item")
      .nth(1)
      .getByRole("button", { name: "Xóa câu hỏi", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Lưu bộ câu hỏi", exact: true })
      .click();
    await page.getByText("Đã lưu bộ câu hỏi.", { exact: true }).waitFor();
    await page.reload();
    await page
      .getByRole("button", { name: "Thêm câu hỏi", exact: true })
      .waitFor();
    assert.equal(await page.locator(".quick-reply-item").count(), 2);
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      await page.waitForLoadState("networkidle");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await messenger.focus();
      const tooltip = page.getByRole("tooltip");
      await tooltip.waitFor();
      const box = await tooltip.boundingBox();
      assert.ok(
        box.x >= 0 && box.x + box.width <= width && box.height < 50,
        "tooltip fits " + width,
      );
      if (width === 390)
        await page.screenshot({
          path: path.join(output, "widget-tooltip-mobile.png"),
        });
      await page.locator("#cau-chuyen").scrollIntoViewIfNeeded();
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: path.join(output, "story-intro-" + width + ".png"),
        });
      await page.goto(base + "/admin/quick-replies");
      await page.waitForLoadState("networkidle");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (width === 1440)
        await page.screenshot({
          path: path.join(output, "quick-replies-admin.png"),
          fullPage: true,
        });
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: compact hero, story imagery, widget tooltip desktop/mobile, admin general/product quick replies add/edit/reorder/hide/delete, greeting and VI/EN, persistence, responsive, no JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
