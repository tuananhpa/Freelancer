const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const output = path.resolve(__dirname, "../test-results");
fs.mkdirSync(output, { recursive: true });
async function auditText(page) {
  return page.evaluate(() => {
    const rgba = (value) => (value.match(/[\d.]+/g) || []).map(Number);
    const blend = (front, back) =>
      front
        .slice(0, 3)
        .map((v, i) => v * (front[3] ?? 1) + back[i] * (1 - (front[3] ?? 1)));
    const luminance = (c) =>
      c
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => {
      const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (light + 0.05) / (dark + 0.05);
    };
    const failures = [];
    for (const el of document.querySelectorAll("body *")) {
      if (
        el.closest(
          "svg, script, style, .hero-film, .product-hero-media, .film-card, .story-mosaic, .passport-cover",
        ) ||
        !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) ||
        el.closest(":disabled")
      )
        continue;
      const text = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent.trim())
        .join("")
        .trim();
      const placeholder =
        el.matches("input, textarea") && el.getAttribute("placeholder");
      if (!text && !placeholder) continue;
      const ancestors = [];
      for (let node = el; node; node = node.parentElement)
        ancestors.unshift(node);
      let background = [255, 255, 255];
      for (const ancestor of ancestors)
        background = blend(
          rgba(getComputedStyle(ancestor).backgroundColor),
          background,
        );
      const style = getComputedStyle(el),
        foreground = blend(rgba(style.color), background);
      const contrast = ratio(foreground, background);
      if (text && contrast < 4.5)
        failures.push({
          text: text.slice(0, 70),
          tag: el.tagName,
          class: el.className,
          color: style.color,
          contrast: +contrast.toFixed(2),
        });
      if (placeholder) {
        const p = getComputedStyle(el, "::placeholder");
        const contrast = ratio(blend(rgba(p.color), background), background);
        if (contrast < 4.5)
          failures.push({
            text: placeholder,
            tag: "placeholder",
            color: p.color,
            contrast: +contrast.toFixed(2),
          });
      }
    }
    return failures;
  });
}
async function checkTimeline(page, count) {
  const timeline = page.locator(".timeline");
  assert.equal(await timeline.locator(".timeline-step").count(), count);
  assert.equal(
    await timeline.evaluate((el) => getComputedStyle(el, "::before").content),
    "none",
    "no whole-container line extending beyond last step",
  );
  const nodes = await timeline.locator(".timeline-step").evaluateAll((els) =>
    els.map((el) => {
      const line = getComputedStyle(el, "::after"),
        box = el.getBoundingClientRect(),
        circle = el.querySelector("span").getBoundingClientRect();
      return {
        content: line.content,
        width: parseFloat(line.width),
        height: parseFloat(line.height),
        startX: box.left + parseFloat(line.left),
        startY: box.top + parseFloat(line.top),
        circleX: circle.left + circle.width / 2,
        circleY: circle.top + circle.height / 2,
      };
    }),
  );
  assert.equal(
    nodes.at(-1).content,
    "none",
    "last step has no trailing segment",
  );
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i],
      b = nodes[i + 1];
    assert.notEqual(a.content, "none");
    if (a.width > 1) {
      assert.ok(Math.abs(a.startX - a.circleX) <= 1);
      assert.ok(
        Math.abs(a.startX + a.width - b.circleX) <= 1,
        "horizontal segment joins exactly the next circle",
      );
    } else {
      assert.ok(Math.abs(a.startY - a.circleY) <= 1);
      assert.ok(
        Math.abs(a.startY + a.height - b.circleY) <= 1,
        "vertical segment joins exactly the next circle",
      );
    }
  }
}
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
      viewport: { width: 1440, height: 1000 },
      locale: "vi-VN",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/p/nhan-long-pho-hien");
    await page.locator(".timeline").waitFor();
    await checkTimeline(page, 4);
    await page.locator(".timeline-step").nth(2).click();
    await page.locator("#hanh-trinh").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(output, "journey-four-desktop.png"),
    });
    await page.goto(base + "/admin/login");
    await page.getByRole("button", { name: "Mở không gian quản trị" }).click();
    const edit = async () => {
      await page.goto(base + "/admin/products");
      await page
        .getByRole("button", { name: "Sửa Nhãn lồng Phố Hiến", exact: true })
        .click();
      await page.getByRole("tab", { name: "Hành trình", exact: true }).click();
    };
    const save = async () => {
      await page
        .getByRole("button", { name: "Lưu sản phẩm", exact: true })
        .click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
    };
    await edit();
    for (let i = 5; i <= 7; i++) {
      await page
        .getByRole("button", { name: "Thêm mốc hành trình", exact: true })
        .click();
      const item = page.locator(".timeline-editor").last();
      await item
        .getByLabel("Tiêu đề (VI)", { exact: true })
        .fill("Mốc bổ sung " + i);
      await item
        .getByLabel("Mô tả (VI)", { exact: true })
        .fill("Nội dung hành trình " + i);
    }
    await save();
    for (const width of [1440, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + "/p/nhan-long-pho-hien");
      await page.locator(".timeline").waitFor();
      await checkTimeline(page, 7);
      await page.locator(".timeline-step").last().click();
      await page
        .getByRole("tabpanel")
        .getByText("Nội dung hành trình 7", { exact: true })
        .waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.locator("#hanh-trinh").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(output, "journey-seven-" + width + ".png"),
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const target of [2, 1, 0]) {
      await edit();
      while ((await page.locator(".timeline-editor").count()) > target)
        await page
          .locator(".timeline-editor")
          .last()
          .getByRole("button", { name: /Xóa mốc/ })
          .click();
      await save();
      await page.goto(base + "/p/nhan-long-pho-hien");
      await page.waitForLoadState("networkidle");
      if (target) {
        await checkTimeline(page, target);
        await page.locator(".timeline-step").last().click();
        await page.getByRole("tabpanel").waitFor();
      } else {
        assert.equal(
          await page.locator("#hanh-trinh").count(),
          0,
          "empty journey hides section",
        );
        assert.equal(await page.locator('a[href="#hanh-trinh"]').count(), 0);
      }
    }
    // Restore a public timeline for the final visual checks.
    await edit();
    for (let i = 1; i <= 4; i++) {
      await page
        .getByRole("button", { name: "Thêm mốc hành trình", exact: true })
        .click();
      const item = page.locator(".timeline-editor").last();
      await item.getByLabel("Tiêu đề (VI)", { exact: true }).fill("Mốc " + i);
      await item
        .getByLabel("Mô tả (VI)", { exact: true })
        .fill("Nội dung mốc " + i);
    }
    await save();
    for (const route of [
      "/",
      "/p/nhan-long-pho-hien",
      "/p/vai-trung-phu-cu",
      "/p/cam-duong-canh-hung-yen",
      "/admin",
      "/admin/products",
      "/admin/qr",
      "/admin/inbox",
      "/admin/settings",
      "/admin/quick-replies",
    ]) {
      await page.goto(base + route);
      await page.waitForLoadState("networkidle");
      const failures = await auditText(page);
      assert.deepEqual(
        failures,
        [],
        "text and placeholder contrast on " + route,
      );
    }
    await edit();
    for (const name of [
      "Thông tin lô",
      "Câu chuyện",
      "Ảnh & video",
      "Hành trình",
      "Khối & hỏi đáp",
    ]) {
      await page.getByRole("tab", { name, exact: true }).click();
      assert.deepEqual(await auditText(page), [], "editor contrast " + name);
    }
    await page.getByRole("button", { name: "Đóng", exact: true }).click();
    await page.goto(base + "/p/nhan-long-pho-hien");
    await page
      .getByRole("button", { name: "Tặng bạn bè / Đặt mua thêm" })
      .click();
    assert.deepEqual(await auditText(page), [], "inquiry text contrast");
    await page.getByRole("button", { name: "Đóng", exact: true }).click();
    await page
      .getByRole("button", { name: "Hỏi HYTales", exact: true })
      .click();
    await page.locator(".faq-button").first().click();
    assert.deepEqual(await auditText(page), [], "chat text contrast");
    assert.deepEqual(errors, []);
    console.log(
      "PASS: admin adds/removes milestones, dynamic 7/4/2/1/0 steps, exact line endpoints desktop/mobile, final milestone selectable, empty journey hidden, readable text/placeholder contrast across public/admin/modal/chat, no JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
