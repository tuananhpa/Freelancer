const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const catalog = require("./video-sources.json");
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const originalRoot = path.resolve(__dirname, "../../../HYTales/Video");
(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.locator(".hero-film video").waitFor({ state: "attached" });
    const names = await fs.readdir(originalRoot);
    for (const { slug, prefix } of catalog) {
      const original = path.join(
        originalRoot,
        names.find((name) => name.startsWith(prefix) && name.endsWith(".mp4")),
      );
      const size = (await fs.stat(original)).size;
      const endpoint = `${base}/hytales-videos/${slug}.mp4`;
      const file = await fs.open(original, "r");
      try {
        for (const [start, end] of [
          [0, 127],
          [size - 128, size - 1],
        ]) {
          const response = await page.request.get(endpoint, {
            headers: { Range: `bytes=${start}-${end}` },
          });
          assert.equal(response.status(), 206);
          assert.equal(
            response.headers()["content-range"],
            `bytes ${start}-${end}/${size}`,
          );
          const expected = Buffer.alloc(128);
          await file.read(expected, 0, 128, start);
          assert.deepEqual(
            await response.body(),
            expected,
            "served bytes must match HYTales original",
          );
        }
      } finally {
        await file.close();
      }
      const head = await page.request.head(endpoint);
      assert.equal(Number(head.headers()["content-length"]), size);
      const invalid = await page.request.get(endpoint, {
        headers: { Range: `bytes=${size}-` },
      });
      assert.equal(invalid.status(), 416);
      await page.evaluate((url) => {
        const video = document.querySelector(".hero-film video");
        video.pause();
        video.src = url;
        video.muted = true;
        video.load();
      }, endpoint);
      await page.waitForFunction(() => {
        const video = document.querySelector(".hero-film video");
        return (
          video.readyState >= 1 &&
          video.videoWidth === 1080 &&
          video.videoHeight === 1920
        );
      });
      await page.locator(".hero-film video").evaluate((video) => video.play());
      await page.waitForFunction(
        () => document.querySelector(".hero-film video").currentTime > 0,
      );
      console.log(`PASS original source/ranges/playback: ${slug}`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
