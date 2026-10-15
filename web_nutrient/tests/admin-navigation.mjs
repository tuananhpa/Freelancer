import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";

const base = process.env.BASE_URL || "http://127.0.0.1:8788";
const vars = readFileSync(".dev.vars", "utf8");
const username = vars.match(/ADMIN_USERNAME="([^"]+)"/)[1];
const password = vars.match(/ADMIN_PASSWORD="([^"]+)"/)[1];
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
try {
  const login = await context.request.post(base + "/api/auth/login", {
    headers: { "x-nutri-request": "1" },
    data: { username, password },
  });
  assert.equal(login.status(), 200);
  const page = await context.newPage();
  await page.goto(base + "/admin");
  await page.getByText("Đã cấu hình", { exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Về ứng dụng", exact: true })
      .count(),
    1,
    "configured admin has an explicit next step",
  );
  mkdirSync("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "docs/screenshots/admin-next-step.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Về ứng dụng", exact: true }).click();
  await page.waitForURL(base + "/");
  assert.equal(new URL(page.url()).pathname, "/");
  assert.equal((await context.request.get(base + "/api/state")).status(), 200,
    "returning to the app must preserve the admin session");
  await page.getByRole("heading", { name: "Nhật ký dinh dưỡng", exact: true }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "Nhật ký dinh dưỡng", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).count(), 0);
  await page.screenshot({ path: "docs/screenshots/admin-home.png", fullPage: true });
  const state = await (await context.request.get(base + "/api/state")).json();
  assert.equal(state.user.role, "admin");
  if (!state.profile) {
    await page.getByRole("button", { name: "Hoàn tất hồ sơ", exact: true }).click();
    assert.equal(await page.getByLabel("Tuổi", { exact: true }).inputValue(), "");
    assert.equal(await page.getByLabel("Chiều cao (cm)", { exact: true }).inputValue(), "");
    assert.equal(await page.getByLabel("Cân nặng (kg)", { exact: true }).first().inputValue(), "");
    assert.equal((await (await context.request.get(base + "/api/state")).json()).profile, null,
      "viewing the app must not persist fabricated profile details");
  }
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page.getByRole("button", { name: "Quản trị Gemini", exact: true }).click();
  await page.getByRole("heading", { name: "Kết nối Gemini", exact: true }).waitFor();
  assert.equal(new URL(page.url()).pathname, "/admin");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Về ứng dụng", exact: true }).click();
  await page.getByRole("heading", { name: "Nhật ký dinh dưỡng", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  console.log(
    "Admin navigation passed: mobile/desktop diary, reload, blank unsaved profile and return to admin; session preserved.",
  );
} finally {
  await browser.close();
}
