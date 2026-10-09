const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const out = path.join(__dirname, "../test-results");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    locale: "vi-VN",
  });
  page.on("pageerror", (e) => console.log("PAGE_ERROR", e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: path.join(out, "home-desktop.png"),
    fullPage: true,
  });
  console.log("HOME", await page.locator("h1").innerText());
  console.log("BUTTONS", await page.locator("button").allTextContents());
  await page.goto("http://127.0.0.1:5173/p/nhan-long-pho-hien");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: path.join(out, "product-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Hỏi HYTales" }).click();
  console.log("CHAT", await page.locator(".faq-button").allTextContents());
  if (
    !(await page.locator(".faq-button").first().innerText()).includes(
      "Nhãn lồng",
    )
  )
    throw new Error("Product chat must use the longan FAQ");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:5173/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: path.join(out, "home-mobile.png"),
    fullPage: true,
  });
  console.log(
    "MOBILE_OVERFLOW",
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
