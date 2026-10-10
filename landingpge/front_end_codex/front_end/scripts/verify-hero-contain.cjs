const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const base = process.env.TEST_URL || "http://127.0.0.1:4173";
// Test fixtures only; requires ffmpeg on PATH. Never rewrite project videos.
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
fs.mkdirSync("test-results", { recursive: true });
for (const [name, size] of [
  ["wide", "320x180"],
  ["tall", "180x320"],
]) {
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    `color=c=0x00aa66:s=${size}:r=15:d=2`,
    "-vf",
    "drawbox=x=0:y=0:w=30:h=30:color=0xff3300:t=fill,drawbox=x=iw-30:y=ih-30:w=30:h=30:color=0x2244ff:t=fill",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    `test-results/hero-${name}.mp4`,
  ]);
}

(async () => {
  const b = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  try {
    const p = await b.newPage({
      viewport: { width: 1440, height: 1000 },
      locale: "vi-VN",
      reducedMotion: "reduce",
    });
    await p.goto(base);
    await p.locator("#hero-film").waitFor();
    const originalHeight = await p
      .locator(".home-hero")
      .evaluate((e) => e.getBoundingClientRect().height);
    const fixtures = [
      require("node:fs").readFileSync("test-results/hero-wide.mp4"),
      require("node:fs").readFileSync("test-results/hero-tall.mp4"),
    ];
    await p.goto(base + "/admin/login");
    await p.getByRole("button", { name: "Mở không gian quản trị" }).click();
    for (let i = 0; i < fixtures.length; i++) {
      await p.goto(base + "/admin/settings");
      await p
        .getByLabel("Tải Video trang chủ (VI)", { exact: true })
        .setInputFiles({
          name: `aspect-${i}.mp4`,
          mimeType: "video/mp4",
          buffer: Buffer.from(fixtures[i]),
        });
      await p
        .getByRole("region", { name: "Video trang chủ (VI)", exact: true })
        .locator("video")
        .waitFor();
      await p
        .getByText("Đang lưu video vào thư viện…", { exact: true })
        .waitFor({ state: "hidden" });
      await p
        .getByRole("button", { name: "Lưu thiết lập", exact: true })
        .click();
      await p.getByText("Đã lưu thiết lập.", { exact: true }).waitFor();
      await p.goto(base);
      await p.locator("#hero-film video").waitFor();
      for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 390, height: 844 },
      ]) {
        await p.setViewportSize(viewport);
        const play = p.getByRole("button", { name: "Phát phim", exact: true });
        if (await play.count()) await play.click();
        await p
          .waitForFunction(() => {
            const c = document.querySelector(".home-video-backdrop");
            const v = document.querySelector("#hero-film video");
            return (
              v?.currentTime > 0 &&
              c?.width === v?.videoWidth &&
              c?.height === v?.videoHeight
            );
          })
          .catch(async (e) => {
            console.log(
              await p.evaluate(() => {
                const v = document.querySelector("#hero-film video"),
                  c = document.querySelector(".home-video-backdrop");
                return {
                  src: v?.src,
                  currentTime: v?.currentTime,
                  paused: v?.paused,
                  ready: v?.readyState,
                  error: v?.error?.message,
                  vwidth: v?.videoWidth,
                  vheight: v?.videoHeight,
                  cwidth: c?.width,
                  cheight: c?.height,
                  text: document.querySelector("#hero-film")?.innerText,
                };
              }),
            );
            throw e;
          });
        const info = await p.evaluate(() => {
          const v = document.querySelector("#hero-film video"),
            c = document.querySelector(".home-video-backdrop"),
            ctx = c.getContext("2d");
          return {
            fit: getComputedStyle(v).objectFit,
            blur: getComputedStyle(c).filter,
            top: Array.from(ctx.getImageData(5, 5, 1, 1).data),
            bottom: Array.from(
              ctx.getImageData(c.width - 5, c.height - 5, 1, 1).data,
            ),
            overflow: document.documentElement.scrollWidth > innerWidth,
            height: document.querySelector(".home-hero").getBoundingClientRect()
              .height,
            videoCount: document.querySelectorAll("#hero-film video").length,
          };
        });
        assert.equal(info.fit, "contain");
        assert.ok(info.blur.includes("blur"));
        assert.ok(info.top[0] > 180 && info.top[2] < 80, "top corner retained");
        assert.ok(
          info.bottom[2] > 180 && info.bottom[0] < 80,
          "bottom corner retained",
        );
        assert.equal(info.overflow, false);
        assert.equal(info.videoCount, 1, "one decoder only");
        if (viewport.width === 1440) assert.equal(info.height, originalHeight);
        await p.screenshot({
          path: `test-results/hero-contain-${i}-${viewport.width}.png`,
        });
      }
      await p.setViewportSize({ width: 1440, height: 1000 });
    }
    console.log(
      "PASS landscape and portrait: full frame, painted blur, unchanged desktop height, mobile fit, one video",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
