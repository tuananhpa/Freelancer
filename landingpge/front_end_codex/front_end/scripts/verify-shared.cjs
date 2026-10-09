const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = (
  process.env.TEST_URL ||
  fs
    .readFileSync(path.resolve(__dirname, "../.runtime/tunnel-url.txt"), "utf8")
    .trim()
).replace(/\/$/, "");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  try {
    const context = await browser.newContext({
      locale: "vi-VN",
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto(base);
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: /Chạm mã QR/ }).waitFor();
    await page.locator(".story-grower img").evaluate((img) => {
      img.loading = "eager";
      return img.decode();
    });
    for (const file of [
      "facebook.png",
      "messenger.svg",
      "instagram.svg",
      "zalo.webp",
      "tiktok.ico",
      "youtube.png",
    ]) {
      const asset = await page.request.get(base + "/brand/social/" + file);
      assert.equal(asset.status(), 200);
      assert.match(asset.headers()["content-type"], /^image\//);
      assert.ok((await asset.body()).length > 0);
    }
    const source = await page.request.get(base + "/src/main.tsx");
    assert.ok(
      !(await source.text()).includes("import React from"),
      "source is not exposed through production preview",
    );
    await page.screenshot({
      path: path.resolve(__dirname, "../test-results/shared-day-desktop.png"),
    });
    await page
      .getByRole("button", { name: "Chuyển sang Night", exact: true })
      .click();
    await page.reload();
    await page
      .getByRole("button", { name: "Chuyển sang Day", exact: true })
      .waitFor();
    await page.goto(base + "/p/nhan-long-pho-hien");
    await page
      .getByRole("heading", { name: "Nhãn lồng Phố Hiến", exact: true })
      .waitFor();
    assert.equal(await page.locator(".timeline-step").count(), 4);
    await page.getByRole("button", { name: "Phát video", exact: true }).click();
    await page.waitForFunction(() => {
      const video = document.querySelector(".product-hero-media video");
      return video?.readyState >= 1 && !video.paused && video.currentTime > 0;
    });
    await page.goto(base + "/q/nhan-long");
    await page.waitForURL("**/p/nhan-long-pho-hien");
    await page.goto(base + "/admin/login");
    await page
      .getByRole("button", { name: "Mở không gian quản trị", exact: true })
      .click();
    await page.goto(base + "/admin/settings");
    await page
      .getByRole("heading", { name: "Logo & khung ảnh", exact: true })
      .waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    await page.getByRole("heading", { name: /Chạm mã QR/ }).waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: path.resolve(__dirname, "../test-results/shared-night-mobile.png"),
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: public HTTPS home, official logo assets, Day/Night and persistence, mobile layout, direct product/video/admin routes, QR redirect, no JS errors. " +
        base,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
