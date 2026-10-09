const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const output = path.resolve(__dirname, "../test-results");
fs.mkdirSync(output, { recursive: true });
const loaded = (video) => video.waitFor({ state: "visible" });
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
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page.locator(".floating-passport").count(),
      0,
      "remove unwanted floating passport",
    );
    const hero = page.getByRole("region", {
      name: "Phim nông sản Hưng Yên",
      exact: true,
    });
    await loaded(hero.locator("video"));
    await page.waitForFunction(() => {
      const v = document.querySelector("#hero-film video");
      return v && !v.paused && v.currentTime > 0 && v.muted;
    });
    await hero
      .getByRole("button", { name: "Tạm dừng phim", exact: true })
      .click();
    assert.ok(await hero.locator("video").evaluate((v) => v.paused));
    await hero
      .getByRole("button", { name: "Bật âm thanh", exact: true })
      .click();
    assert.equal(await hero.locator("video").evaluate((v) => v.muted), false);
    await hero
      .getByRole("button", { name: "Tắt âm thanh", exact: true })
      .click();
    await hero
      .getByRole("button", { name: "Phim tiếp theo", exact: true })
      .click();
    await hero
      .getByRole("heading", { name: "Vải trứng Phù Cừ", exact: true })
      .waitFor();
    assert.ok(
      await hero.locator("video").evaluate((v) => v.paused),
      "manual pause survives slide changes",
    );
    await hero
      .getByRole("button", {
        name: "Xem phim Cam Đường Canh",
        exact: true,
      })
      .click();
    await hero
      .getByRole("heading", { name: "Cam Đường Canh", exact: true })
      .waitFor();
    await hero
      .getByRole("button", { name: "Phim tiếp theo", exact: true })
      .click();
    await hero
      .getByRole("heading", { name: "Nhãn lồng Phố Hiến", exact: true })
      .waitFor();
    const currentLink = hero.getByRole("link", {
      name: "Xem câu chuyện sản phẩm",
      exact: true,
    });
    assert.equal(
      await currentLink.getAttribute("href"),
      "/p/nhan-long-pho-hien",
    );
    await hero.focus();
    await page.keyboard.press("ArrowLeft");
    await hero
      .getByRole("heading", { name: "Cam Đường Canh", exact: true })
      .waitFor();
    await hero.getByRole("button", { name: "Phát phim", exact: true }).click();
    await page.waitForFunction(
      () => !document.querySelector("#hero-film video").paused,
    );
    await page.locator("#ket-noi").scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => document.querySelector("#hero-film video").paused,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await hero
      .getByRole("button", { name: "Tạm dừng phim", exact: true })
      .waitFor();
    await hero
      .getByRole("button", { name: "Xem phim toàn màn hình", exact: true })
      .click();
    await page.waitForFunction(
      () => document.fullscreenElement?.id === "hero-film",
    );
    await hero
      .getByRole("button", { name: "Tạm dừng phim", exact: true })
      .click();
    assert.ok(
      await hero.locator("video").evaluate((v) => v.paused),
      "fullscreen keeps playback controls accessible",
    );
    await page.evaluate(() => document.exitFullscreen());
    await page.screenshot({
      path: path.join(output, "hero-video-desktop.png"),
    });
    const text = await page.evaluate(() => {
      const nav = document.querySelector(".main-nav a");
      const p = document.querySelector(".hero-copy>p");
      return {
        nav: parseFloat(getComputedStyle(nav).fontSize),
        body: parseFloat(getComputedStyle(p).fontSize),
        color: getComputedStyle(p).color,
      };
    });
    assert.ok(
      text.nav >= 16 && text.body >= 16,
      "readable nav and paragraph size",
    );
    for (const width of [360, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        width + " home no horizontal overflow",
      );
      if (width <= 1100) {
        await page
          .getByRole("button", { name: "Mở menu", exact: true })
          .click();
        await page
          .getByRole("navigation", { name: "Điều hướng chính" })
          .waitFor();
        assert.ok(
          await page.evaluate(
            () =>
              parseFloat(
                getComputedStyle(document.querySelector(".main-nav a"))
                  .fontSize,
              ) >= 16,
          ),
        );
        await page
          .getByRole("button", { name: "Mở menu", exact: true })
          .click();
      }
      if (width === 390) {
        await hero.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(output, "hero-video-mobile.png"),
        });
      }
    }
    await page.goto(base + "/admin/login");
    await page.getByRole("button", { name: "Mở không gian demo" }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.ok(
      await page
        .locator(".admin-sidebar nav a")
        .first()
        .evaluate((a) => parseFloat(getComputedStyle(a).fontSize) >= 15),
    );
    assert.deepEqual(errors, []);
    const reduced = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "vi-VN",
      reducedMotion: "reduce",
      hasTouch: true,
      isMobile: true,
    });
    const phone = await reduced.newPage();
    phone.setDefaultTimeout(10000);
    await phone.goto(base);
    const mobile = phone.getByRole("region", {
      name: "Phim nông sản Hưng Yên",
      exact: true,
    });
    await mobile.scrollIntoViewIfNeeded();
    await loaded(mobile.locator("video"));
    assert.ok(
      await mobile.locator("video").evaluate((v) => v.paused),
      "reduced motion does not autoplay",
    );
    await mobile
      .getByRole("button", { name: "Phát phim", exact: true })
      .click();
    await phone.waitForFunction(
      () => !document.querySelector("#hero-film video").paused,
    );
    const box = await mobile.boundingBox();
    const session = await reduced.newCDPSession(phone);
    const y = box.y + box.height / 2;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.x + box.width - 40, y }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box.x + 45, y: y + 5 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await mobile
      .getByRole("heading", { name: "Vải trứng Phù Cừ", exact: true })
      .waitFor();
    await reduced.close();
    console.log(
      "PASS: inline muted autoplay, play/pause/audio, arrows/dots/keyboard/swipe, paused choice persists, scroll pause/resume, reduced-motion manual play, larger text, public/admin menus, responsive 360–1440, no JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
