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
    assert.equal(await page.locator(".passport-note").count(), 0);
    await page.goto(base + "/p/nhan-long-pho-hien");
    const openInquiry = () =>
      page.getByRole("button", { name: "Tặng bạn bè / Đặt mua thêm" }).click();
    await openInquiry();
    const dialog = page.getByRole("dialog");
    const product = dialog.getByLabel(/^Sản phẩm/);
    const name = dialog.getByLabel(/^Tên của bạn/);
    const phone = dialog.getByLabel(/^Số điện thoại/);
    const quantity = dialog.getByLabel(/^Số lượng/);
    const unit = dialog.getByLabel(/^Đơn vị/);
    const send = dialog.getByRole("button", {
      name: "Gửi yêu cầu",
      exact: true,
    });
    await product.waitFor();
    assert.equal(await product.inputValue(), "nhan-long");
    assert.equal(await quantity.inputValue(), "1");
    assert.equal(await unit.inputValue(), "kg");
    assert.ok((await name.getAttribute("required")) !== null);
    assert.ok((await phone.getAttribute("required")) !== null);
    assert.ok(await send.isDisabled());
    await name.fill("   ");
    await phone.fill("0912345678");
    assert.ok(await send.isDisabled(), "spaces do not satisfy required name");
    await name.fill("Khách đặt thử");
    await phone.fill("         ");
    assert.ok(await send.isDisabled(), "spaces do not satisfy phone");
    await phone.fill("09123");
    assert.ok(await send.isDisabled());
    await phone.fill("0912 345 678");
    const otherProduct = await product.evaluate((el) => el.options[2].value);
    await product.selectOption(otherProduct);
    await quantity.fill("0");
    await dialog.getByRole("checkbox").check();
    await send.click();
    assert.equal(
      await dialog.getByText("Đã lưu yêu cầu", { exact: true }).count(),
      0,
      "zero quantity cannot submit",
    );
    await quantity.fill("2.5");
    await unit.fill("thùng");
    await dialog.getByLabel("Lời nhắn").fill("Yêu cầu kiểm tra số lượng");
    await send.click();
    await dialog.getByText("Đã lưu yêu cầu", { exact: true }).waitFor();
    let stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("hytales.demo.v1")),
    );
    assert.equal(stored.inquiries.length, 1);
    assert.equal(stored.inquiries[0].productId, otherProduct);
    assert.equal(stored.inquiries[0].quantity, 2.5);
    assert.equal(stored.inquiries[0].unit, "thùng");
    assert.ok(stored.inquiries[0].productName);
    await dialog.getByRole("button", { name: "Tiếp tục khám phá" }).click();
    await page.goto(base + "/admin/login");
    await page.getByRole("button", { name: "Mở không gian quản trị" }).click();
    await page.goto(base + "/admin/inbox");
    await page.getByRole("button", { name: /Yêu cầu kết nối/ }).click();
    await page
      .locator(".inquiry-product")
      .filter({ hasText: "2.5 thùng" })
      .waitFor();
    await page.goto(base + "/admin/products");
    await page
      .getByRole("button", { name: "Sửa Nhãn lồng Phố Hiến", exact: true })
      .click();
    await dialog.getByLabel("Đơn vị mặc định").fill("giỏ");
    await dialog
      .getByRole("button", { name: "Lưu sản phẩm", exact: true })
      .click();
    await dialog.waitFor({ state: "hidden" });
    for (const width of [1440, 390, 360]) {
      await page.setViewportSize({ width, height: 820 });
      await page
        .getByRole("button", { name: "Sửa Nhãn lồng Phố Hiến", exact: true })
        .click();
      const input = dialog.getByLabel("Tên sản phẩm (VI)", { exact: true });
      await input.focus();
      const geometry = await input.evaluate((el) => {
        const r = el.getBoundingClientRect(),
          b = el.closest(".editor-body").getBoundingClientRect();
        const d = el.closest("dialog"),
          f = d.querySelector(".editor-footer").getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          left: r.left - b.left,
          right: b.right - r.right,
          ring:
            parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset),
          dialogScroll: d.scrollHeight - d.clientHeight,
          footerBottom: f.bottom,
          bottom: d.getBoundingClientRect().bottom,
          horizontal: d.scrollWidth - d.clientWidth,
        };
      });
      assert.ok(
        geometry.left >= geometry.ring,
        "left focus ring fully visible at " + width,
      );
      assert.ok(
        geometry.right >= geometry.ring,
        "right focus ring fully visible at " + width,
      );
      assert.ok(
        geometry.dialogScroll <= 1,
        "only field area scrolls, not whole dialog",
      );
      assert.ok(
        geometry.horizontal <= 1 && geometry.footerBottom <= geometry.bottom,
        "footer remains within editor",
      );
      await page.screenshot({
        path: path.join(output, "editor-focus-" + width + ".png"),
      });
      await dialog
        .getByRole("tab", { name: "Ảnh & video", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "Lưu sản phẩm", exact: true })
        .waitFor();
      await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/p/nhan-long-pho-hien");
    await openInquiry();
    await product.waitFor();
    assert.equal(
      await unit.inputValue(),
      "giỏ",
      "product default unit persisted",
    );
    await product.selectOption(otherProduct);
    assert.equal(await unit.inputValue(), "kg");
    await product.selectOption("nhan-long");
    assert.equal(await unit.inputValue(), "giỏ");
    await page.screenshot({
      path: path.join(output, "inquiry-selection-desktop.png"),
    });
    await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
    await page.goto(base);
    await page
      .getByRole("button", { name: "Hỏi HYTales", exact: true })
      .click();
    const quick = page.locator(".faq-button");
    const q1 = (await quick.nth(0).innerText()).trim(),
      q2 = (await quick.nth(1).innerText()).trim();
    await quick.nth(0).click();
    await quick.nth(1).click();
    assert.equal(await page.locator(".chat-message-user").count(), 2);
    assert.equal(await page.locator(".chat-answer").count(), 2);
    assert.ok(
      (await page.locator(".chat-message-user").nth(0).innerText()).includes(
        q1,
      ),
    );
    assert.ok(
      (await page.locator(".chat-message-user").nth(1).innerText()).includes(
        q2,
      ),
    );
    assert.deepEqual(
      await page
        .locator(".chat-message")
        .evaluateAll((els) =>
          els.map((el) =>
            el.classList.contains("chat-message-user") ? "user" : "assistant",
          ),
        ),
      ["user", "assistant", "user", "assistant"],
    );
    await page
      .getByRole("button", { name: "Đóng trò chuyện", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Hỏi HYTales", exact: true })
      .click();
    assert.equal(
      await page.locator(".chat-message-user").count(),
      2,
      "closing preserves conversation",
    );
    await page.locator("#chat-question").fill(q1);
    await page
      .getByRole("button", { name: "Gửi câu hỏi", exact: true })
      .click();
    assert.equal(
      await page.locator(".chat-answer").count(),
      3,
      "typed matching question uses configured answer",
    );
    for (const text of ["Gửi lời nhắn thứ nhất", "Gửi lời nhắn thứ hai"]) {
      await page.locator("#chat-question").fill(text);
      await page
        .getByRole("button", { name: "Gửi câu hỏi", exact: true })
        .click();
      await page.waitForFunction(
        (expected) =>
          document.querySelectorAll(".chat-answer").length === expected,
        text.endsWith("nhất") ? 4 : 5,
      );
      assert.equal(await page.locator("#chat-question").inputValue(), "");
    }
    stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("hytales.demo.v1")),
    );
    assert.equal(
      stored.messages.length,
      2,
      "both free-text turns sent to admin inbox",
    );
    await page.screenshot({
      path: path.join(output, "chat-transcript-desktop.png"),
    });
    for (const width of [390, 360]) {
      await page.setViewportSize({ width, height: 820 });
      assert.equal(await page.locator(".chat-message-user").count(), 5);
      const composer = await page.locator(".chat-composer").boundingBox();
      assert.ok(
        composer.x >= 0 &&
          composer.x + composer.width <= width &&
          composer.y + composer.height <= 820,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: path.join(output, "chat-transcript-" + width + ".png"),
      });
      await page
        .getByRole("button", { name: "Đóng trò chuyện", exact: true })
        .click();
      await page.goto(base + "/p/nhan-long-pho-hien");
      await openInquiry();
      await product.waitFor();
      await page.screenshot({
        path: path.join(output, "inquiry-selection-" + width + ".png"),
      });
      await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
      await page.goto(base);
      await page
        .getByRole("button", { name: "Hỏi HYTales", exact: true })
        .click();
      // Route changes start a new product/context conversation.
      await quick.nth(0).click();
      if (width === 390) {
        await quick.nth(1).click();
        await quick.nth(0).click();
        await quick.nth(1).click();
        await quick.nth(0).click();
      }
    }
    await page.evaluate(() => {
      window.restoreInquiryChatStorage = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "hytales.demo.v1")
          throw new Error("Storage blocked for test");
        return window.restoreInquiryChatStorage.call(this, key, value);
      };
    });
    await page.locator("#chat-question").fill("Câu hỏi cần thử gửi lại");
    await page
      .getByRole("button", { name: "Gửi câu hỏi", exact: true })
      .click();
    await page.locator(".chat-composer [role=alert]").waitFor();
    assert.equal(
      await page.locator("#chat-question").inputValue(),
      "Câu hỏi cần thử gửi lại",
      "failure preserves draft for retry",
    );
    assert.ok(
      (await page.locator(".chat-answer").last().innerText()).includes(
        "chưa gửi được",
      ),
    );
    await page.evaluate(() => {
      Storage.prototype.setItem = window.restoreInquiryChatStorage;
      delete window.restoreInquiryChatStorage;
    });
    await page
      .getByRole("button", { name: "Gửi câu hỏi", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector("#chat-question").value === "" &&
        document
          .querySelector(".chat-answer:last-of-type")
          ?.textContent.includes("Đã lưu câu hỏi"),
    );
    assert.equal(await page.locator(".chat-composer [role=alert]").count(), 0);
    await page.setViewportSize({ width: 700, height: 400 });
    const shortComposer = await page.locator(".chat-composer").boundingBox();
    const shortPanel = await page.locator(".chat-panel").boundingBox();
    if (
      shortComposer.y + shortComposer.height >
      shortPanel.y + shortPanel.height
    ) {
      console.log(
        await page.locator(".chat-panel").evaluate((el) =>
          [el, ...el.children].map((n) => ({
            class: n.className,
            height: n.getBoundingClientRect().height,
            bottom: n.getBoundingClientRect().bottom,
            minHeight: getComputedStyle(n).minHeight,
            flex: getComputedStyle(n).flex,
          })),
        ),
      );
      await page.screenshot({
        path: path.join(output, "chat-landscape-diagnostic.png"),
      });
    }
    assert.ok(
      shortComposer.y + shortComposer.height <=
        shortPanel.y + shortPanel.height,
      "composer stays inside chat on landscape screens",
    );
    await page.screenshot({ path: path.join(output, "chat-landscape.png") });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: removed note, required name/phone, product selection, positive quantity, custom/default units, payload/inbox persistence, editor focus/one scroll, chat turns/history/continued sends, desktop/mobile and no JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
