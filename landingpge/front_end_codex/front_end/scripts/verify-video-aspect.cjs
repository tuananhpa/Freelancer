const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
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
      reducedMotion: "reduce",
      locale: "vi-VN",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    async function checkVideo(selector) {
      const video = page.locator(selector).first();
      await video.evaluate((el) => {
        el.preload = "metadata";
        el.load();
      });
      await page.waitForFunction((selector) => {
        const v = document.querySelector(selector);
        return v?.videoWidth > 0;
      }, selector);
      const size = await video.evaluate((v) => {
        const b = v.getBoundingClientRect();
        return {
          width: v.videoWidth,
          height: v.videoHeight,
          duration: v.duration,
          ratio: b.width / b.height,
          fit: getComputedStyle(v).objectFit,
        };
      });
      assert.equal(size.width, 1080);
      assert.equal(size.height, 1920);
      assert.ok(size.duration > 85, "full film, not 30-second cut");
      assert.ok(
        Math.abs(size.ratio - size.width / size.height) < 0.006,
        `native video ratio ${JSON.stringify(size)}`,
      );
      assert.equal(size.fit, "contain");
    }
    for (const width of [1440, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      await page.locator(".hero-film-stage video").waitFor();
      await checkVideo(".hero-film-stage video");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (width === 1440 || width === 390)
        await page.screenshot({
          path: path.resolve(
            __dirname,
            `../test-results/video-native-${width}.png`,
          ),
          fullPage: false,
        });
      await page.goto(base + "/p/nhan-long-pho-hien");
      await page.locator(".product-hero-media video").waitFor();
      await checkVideo(".product-hero-media video");
      assert.equal(
        await page.locator(".transcript").count(),
        0,
        "narration section removed",
      );
      assert.ok(
        !/\bdemo\b|bản trải nghiệm|hành trình minh họa/i.test(
          await page.locator("body").innerText(),
        ),
        "no public demo labels",
      );
      await page.locator(".film-card").first().click();
      await page.locator(".modal-video").waitFor();
      await checkVideo(".modal-video");
      await page.getByRole("button", { name: "Đóng", exact: true }).click();
    }
    for (const slug of ["vai-trung-phu-cu", "cam-duong-canh-hung-yen"]) {
      await page.goto(base + "/p/" + slug);
      await page.locator(".product-hero-media video").waitFor();
      await checkVideo(".product-hero-media video");
      assert.equal(await page.locator(".transcript").count(), 0);
    }
    await page.locator(".product-hero-media video").evaluate(async (video) => {
      await video.play();
      video.currentTime = video.duration - 3;
    });
    await page.waitForFunction(() => {
      const video = document.querySelector(".product-hero-media video");
      return (
        !video.seeking &&
        video.readyState >= 2 &&
        video.currentTime > video.duration - 4
      );
    });
    await page
      .locator(".product-hero-media video")
      .evaluate((video) => video.pause());
    await page.goto(base + "/admin/login");
    await page
      .getByRole("button", { name: "Mở không gian quản trị", exact: true })
      .click();
    await page.goto(base + "/admin/settings");
    await page
      .getByRole("button", { name: "Lưu thiết lập", exact: true })
      .click();
    await page
      .getByText("Đã lưu thiết lập liên hệ.", { exact: true })
      .waitFor();
    assert.ok(
      !/\bdemo\b|bản trải nghiệm/i.test(await page.locator("body").innerText()),
      "no admin demo labels",
    );
    const landscape = fs
      .readFileSync(
        path.resolve(__dirname, "../.runtime/video-aspect-landscape.mp4"),
      )
      .toString("base64");
    await page.evaluate((landscape) => {
      const state = JSON.parse(localStorage.getItem("hytales.demo.v1"));
      state.products[0].video = `data:video/mp4;base64,${landscape}`;
      state.products[0].batchCode = "HY-NL-DEMO-01";
      localStorage.setItem("hytales.demo.v1", JSON.stringify(state));
    }, landscape);
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const route of ["/", "/p/nhan-long-pho-hien"]) {
      await page.goto(base + route);
      await page.waitForFunction(() => {
        const video = document.querySelector(
          ".hero-film-stage video, .product-hero-media video",
        );
        if (!video || video.videoWidth !== 640) return false;
        const box = video.getBoundingClientRect();
        return Math.abs(box.width / box.height - 16 / 9) < 0.006;
      });
      assert.ok(
        !/\bdemo\b/i.test(await page.locator("body").innerText()),
        "legacy batch label removed without inventing batch data",
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: full 1080x1920 films, native portrait/landscape aspect at 360–1440px, seek near full-film end, narration/demo labels removed, no overflow or JS errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
