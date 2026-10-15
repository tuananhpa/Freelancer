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
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .waitFor();
  assert.equal(new URL(page.url()).pathname, "/");
  assert.equal((await context.request.get(base + "/api/state")).status(), 401);
  console.log(
    "Admin next step passed: returns to public login and ends admin session.",
  );
} finally {
  await browser.close();
}
