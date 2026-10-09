const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
      locale: "vi-VN",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.locator("#hero-film video").waitFor();
    await page.evaluate(() => scrollTo(0, 1200));
    await page.waitForTimeout(500);
    assert.equal(
      Math.round((await page.locator(".site-header").boundingBox()).y),
      0,
      "header follows scroll",
    );
    await page.locator("#hero-film").scrollIntoViewIfNeeded();
    await page.locator(".hero-film-title").waitFor();
    assert.equal(await page.locator(".video-backdrop").count(), 0);
    assert.equal(await page.locator(".hero-benefits").count(), 0);
    assert.equal(
      await page
        .locator(".hero-film-title")
        .evaluate((el) => getComputedStyle(el).position),
      "absolute",
    );
    await page
      .getByRole("button", { name: "Xem phim toàn màn hình", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Thu nhỏ phim", exact: true })
      .waitFor();
    assert.ok(
      await page.evaluate(() => document.fullscreenElement?.id === "hero-film"),
      "desktop uses actual Fullscreen API",
    );
    await page
      .getByRole("button", { name: "Thu nhỏ phim", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Xem phim toàn màn hình", exact: true })
      .waitFor();
    // No native API: keep the same video and a visible exit in the expanded fallback.
    await page.evaluate(() => {
      document.querySelector("#hero-film").requestFullscreen = undefined;
      document.querySelector("#hero-film video").webkitEnterFullscreen =
        undefined;
    });
    await page
      .getByRole("button", { name: "Xem phim toàn màn hình", exact: true })
      .click();
    await page.locator("#hero-film.is-expanded").waitFor();
    await page
      .getByRole("button", { name: "Đóng toàn màn hình", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Xem phim toàn màn hình", exact: true })
      .click();
    await page.locator("#hero-film.is-expanded").waitFor();
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () =>
        !document.querySelector("#hero-film").classList.contains("is-expanded"),
    );
    // Emulate the iOS video-specific API and its native exit event.
    await page.evaluate(() => {
      const v = document.querySelector("#hero-film video");
      v.webkitEnterFullscreen = () => {
        window.iosEntered = true;
        v.dispatchEvent(new Event("webkitbeginfullscreen"));
      };
      v.webkitExitFullscreen = () => {
        window.iosExited = true;
        v.dispatchEvent(new Event("webkitendfullscreen"));
      };
    });
    await page
      .getByRole("button", { name: "Xem phim toàn màn hình", exact: true })
      .click();
    assert.ok(await page.evaluate(() => window.iosEntered));
    await page
      .getByRole("button", { name: "Thu nhỏ phim", exact: true })
      .click();
    assert.ok(await page.evaluate(() => window.iosExited));
    await page.goto(base + "/p/nhan-long-pho-hien");
    const sound = page
      .locator(".product-video-overlay")
      .getByRole("button", { name: "Bật âm thanh", exact: true });
    await sound.waitFor();
    assert.equal((await sound.innerText()).trim(), "", "sound is icon only");
    await sound.click();
    assert.equal(
      await page.locator(".product-hero-media video").evaluate((v) => v.muted),
      false,
    );
    await page.goto(base + "/admin/login");
    await page.getByRole("button", { name: "Mở không gian quản trị" }).click();
    const handle = page.getByRole("separator", {
      name: "Điều chỉnh độ rộng sidebar",
    });
    await handle.waitFor();
    const before = (await page.locator(".admin-sidebar").boundingBox()).width;
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 85, box.y + 100, { steps: 8 });
    await page.mouse.up();
    assert.ok(
      (await page.locator(".admin-sidebar").boundingBox()).width > before + 60,
    );
    await page.reload();
    assert.ok(
      (await page.locator(".admin-sidebar").boundingBox()).width > before + 60,
      "sidebar width persists",
    );
    await page.getByRole("button", { name: "Thu gọn sidebar" }).click();
    assert.ok((await page.locator(".admin-sidebar").boundingBox()).width < 100);
    await page.getByRole("button", { name: "Mở rộng sidebar" }).click();
    await page.goto(base + "/admin/products");
    await page.getByRole("button", { name: "Sửa Nhãn lồng Phố Hiến" }).click();
    await page.getByRole("tab", { name: "Hành trình", exact: true }).click();
    const first = page.locator(".timeline-editor").first();
    await first
      .getByRole("button", { name: "Thêm ảnh cho mốc", exact: true })
      .click();
    await first
      .getByRole("button", { name: "Chọn từ thư viện", exact: true })
      .click();
    const picker = page.getByRole("dialog", { name: "Chọn ảnh từ thư viện" });
    await picker.locator(".media-library-item").first().click();
    await picker.getByRole("button", { name: "Dùng ảnh này" }).click();
    await first.getByLabel("Cách hiển thị").selectOption("contain");
    await first.getByRole("button", { name: "Phải", exact: true }).click();
    await first
      .getByRole("button", { name: "Thêm ảnh cho mốc", exact: true })
      .click();
    const second = first.locator(".timeline-image-editor").nth(1);
    await second.locator("input[type=file]").setInputFiles({
      name: "timeline-test.webp",
      mimeType: "image/webp",
      buffer: require("node:fs").readFileSync(
        "public/media/nhan-long-scene-1.webp",
      ),
    });
    await second.locator("img").waitFor();
    await first
      .getByRole("button", { name: "Thêm ảnh cho mốc", exact: true })
      .click();
    await first
      .getByRole("button", { name: "Xóa khung ảnh 3", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Lưu sản phẩm", exact: true })
      .click();
    await page.goto(base + "/p/nhan-long-pho-hien");
    await page.locator(".timeline-images img").first().waitFor();
    assert.equal(
      await page.locator(".timeline-images img").count(),
      2,
      "library and uploaded image both persisted",
    );
    assert.equal(
      await page
        .locator(".timeline-images img")
        .first()
        .evaluate((img) => getComputedStyle(img).objectFit),
      "contain",
    );
    assert.equal(
      await page
        .locator(".timeline-images img")
        .first()
        .evaluate((img) => getComputedStyle(img).objectPosition),
      "100% 50%",
    );
    await page.waitForFunction(() => {
      const image = document.querySelectorAll(".timeline-images img")[1];
      return (
        image?.src.startsWith("blob:") &&
        image.complete &&
        image.naturalWidth > 0
      );
    });
    await page.locator(".timeline-images button").first().click();
    await page.getByRole("dialog", { name: "Ảnh hành trình" }).waitFor();
    await page
      .getByRole("dialog", { name: "Ảnh hành trình" })
      .getByRole("button", { name: "Đóng", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 1500));
    await page.waitForTimeout(400);
    assert.equal(
      Math.round((await page.locator(".site-header").boundingBox()).y),
      0,
      "mobile sticky header",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "no horizontal page overflow",
    );
    await page.locator(".timeline-detail").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "test-results/timeline-photos-mobile.png" });
    await page.goto(base + "/admin/products");
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    assert.ok(
      (await page.locator(".admin-sidebar").boundingBox()).x >= 0,
      "mobile drawer opens",
    );
    await page
      .getByRole("button", { name: "Đóng menu quản trị", exact: true })
      .click();
    await page.getByRole("button", { name: "Sửa Nhãn lồng Phố Hiến" }).click();
    await page.getByRole("tab", { name: "Hành trình", exact: true }).click();
    await page
      .locator(".timeline-editor")
      .first()
      .getByRole("button", { name: "Gỡ ảnh", exact: true })
      .last()
      .click();
    await page
      .getByRole("button", { name: "Lưu sản phẩm", exact: true })
      .click();
    await page.goto(base + "/p/nhan-long-pho-hien");
    await page.locator(".timeline-images img").waitFor();
    assert.equal(
      await page.locator(".timeline-images img").count(),
      1,
      "remove only selected image",
    );
    await page.goto(base);
    await page.locator("#hero-film video").waitFor();
    await page.evaluate(() => {
      const root = document.querySelector("#hero-film");
      root.requestFullscreen = undefined;
      const video = root.querySelector("video");
      video.webkitEnterFullscreen = undefined;
      window.originalPlayer = video;
    });
    await page
      .getByRole("button", { name: "Xem phim toàn màn hình", exact: true })
      .click();
    await page.locator("#hero-film.is-expanded").waitFor();
    const expanded = await page.locator("#hero-film").boundingBox();
    assert.equal(Math.round(expanded.width), 390);
    assert.equal(Math.round(expanded.height), 844);
    await page.screenshot({ path: "test-results/player-expanded-mobile.png" });
    await page
      .getByRole("button", { name: "Đóng toàn màn hình", exact: true })
      .click();
    assert.ok(
      await page.evaluate(
        () =>
          window.originalPlayer === document.querySelector("#hero-film video"),
      ),
      "same player after mobile fullscreen exit",
    );
    await page.screenshot({ path: "test-results/player-improved-mobile.png" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS sticky header, fullscreen/exit/fallback/iOS API branch, icon audio, sidebar resizing/persistence, timeline image save/display/lightbox, mobile layout",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
