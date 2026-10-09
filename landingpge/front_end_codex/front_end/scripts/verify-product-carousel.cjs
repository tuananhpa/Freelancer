const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      locale: "vi-VN",
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/admin/login");
    await page.getByRole("button", { name: "Mở không gian demo" }).click();
    await page.goto(base + "/admin/settings");
    await page
      .getByRole("button", { name: "Lưu thiết lập", exact: true })
      .click();
    await page
      .getByText("Đã lưu thiết lập liên hệ.", { exact: true })
      .waitFor();
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem("hytales.demo.v1"));
      const seeds = data.products;
      data.products = Array.from({ length: 20 }, (_, i) => ({
        ...seeds[i % seeds.length],
        id: i === 0 ? seeds[0].id : `carousel-${i}`,
        slug: i === 0 ? seeds[0].slug : `carousel-${i}`,
        name: i === 0 ? seeds[0].name : `Thức quà ${i + 1}`,
      }));
      localStorage.setItem("hytales.demo.v1", JSON.stringify(data));
    });
    for (const width of [1440, 1280, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base);
      await page.locator(".product-carousel-track").waitFor();
      const track = page.locator(".product-carousel-track");
      await track.scrollIntoViewIfNeeded();
      assert.equal(await track.locator(".product-card").count(), 20);
      const positions = await track
        .locator(".product-card")
        .evaluateAll((els) =>
          els.map((el) => Math.round(el.getBoundingClientRect().top)),
        );
      assert.equal(
        new Set(positions).size,
        1,
        "20 products stay in one horizontal row",
      );
      assert.ok(
        (await track.boundingBox()).height < 700,
        "collection height stays bounded",
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `no page overflow at ${width}`,
      );
      const previous = page.getByRole("button", {
          name: "Xem sản phẩm trước",
          exact: true,
        }),
        next = page.getByRole("button", {
          name: "Xem sản phẩm tiếp theo",
          exact: true,
        });
      assert.ok(await previous.isDisabled());
      assert.ok(await next.isEnabled());
      await next.click();
      await page.waitForFunction(
        () => document.querySelector(".product-carousel-track").scrollLeft > 10,
      );
      await page.waitForFunction(
        () =>
          !document.querySelector('[aria-label="Xem sản phẩm trước"]').disabled,
      );
      assert.ok(await previous.isEnabled());
      await track.focus();
      await page.keyboard.press("End");
      await page.waitForFunction(() => {
        const el = document.querySelector(".product-carousel-track");
        return el.scrollWidth - el.clientWidth - el.scrollLeft < 3;
      });
      await page.waitForFunction(
        () =>
          document.querySelector('[aria-label="Xem sản phẩm tiếp theo"]')
            .disabled,
      );
      await track.locator(".product-card").last().scrollIntoViewIfNeeded();
      assert.ok(
        (await track.locator(".product-card").last().boundingBox()).x < width,
      );
      await track.focus();
      await page.keyboard.press("Home");
      await page.waitForFunction(
        () => document.querySelector(".product-carousel-track").scrollLeft < 3,
      );
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction(
        () => document.querySelector(".product-carousel-track").scrollLeft > 10,
      );
      if (width === 1440 || width === 390)
        await page.screenshot({
          path: path.resolve(
            __dirname,
            `../test-results/product-carousel-${width}.png`,
          ),
        });
    }
    await page
      .getByRole("button", { name: "Chuyển sang Night", exact: true })
      .click();
    await page.locator(".product-carousel-track").focus();
    await page.keyboard.press("Home");
    await page.locator(".product-carousel-track .product-card").first().click();
    await page.waitForURL("**/p/nhan-long-pho-hien");
    const demoState = await page.evaluate(() =>
      localStorage.getItem("hytales.demo.v1"),
    );
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    mobile.on("pageerror", (error) => errors.push(error.message));
    await mobile.addInitScript(
      (state) => localStorage.setItem("hytales.demo.v1", state),
      demoState,
    );
    await mobile.goto(base);
    const mobileTrack = mobile.locator(".product-carousel-track");
    await mobileTrack.scrollIntoViewIfNeeded();
    const box = await mobileTrack.boundingBox();
    const cdp = await mobile.context().newCDPSession(mobile);
    const y = Math.max(80, box.y + 80);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 300, y }],
    });
    for (let step = 1; step <= 10; step++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 300 - step * 24, y }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await mobile.waitForFunction(
      () => document.querySelector(".product-carousel-track").scrollLeft > 20,
    );
    assert.ok(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "swipe does not overflow the page",
    );
    await mobile.close();
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const count of [3, 1, 0]) {
      await page.evaluate((count) => {
        const state = JSON.parse(localStorage.getItem("hytales.demo.v1"));
        state.products = state.products.slice(0, count);
        localStorage.setItem("hytales.demo.v1", JSON.stringify(state));
      }, count);
      await page.goto(base);
      if (count === 0) {
        await page
          .getByText("Những thức quà biết kể chuyện", { exact: true })
          .waitFor();
        await page
          .getByText("Những câu chuyện đang được chuẩn bị. Hẹn gặp bạn sớm.", {
            exact: true,
          })
          .waitFor();
        assert.equal(await page.locator(".product-carousel-track").count(), 0);
      } else {
        await page.waitForFunction(
          (count) =>
            document.querySelectorAll(".product-carousel-track .product-card")
              .length === count,
          count,
        );
        await page.waitForFunction(
          () =>
            document.querySelector('[aria-label="Xem sản phẩm tiếp theo"]')
              .disabled,
        );
        assert.ok(
          await page
            .getByRole("button", { name: "Xem sản phẩm trước", exact: true })
            .isDisabled(),
        );
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: 20 products in one row, bounded collection height, next/previous/end states, keyboard navigation, native touch swipe, 0/1/3-product states, product link, Day/Night and no JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
