import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
const base = process.env.BASE_URL || "http://127.0.0.1:8788";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
mkdirSync("docs/screenshots", { recursive: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(base);
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await page
    .getByLabel("Tên đăng nhập", { exact: true })
    .fill("browser_" + randomBytes(4).toString("hex"));
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(randomBytes(16).toString("base64url"));
  await page.getByLabel("Biệt danh hiển thị").fill("Bạn khám phá");
  await page.getByRole("button", { name: "Tiếp theo", exact: true }).click();
  await page.getByLabel("Tuổi", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Tiếp theo", exact: true }).click();
  await page.getByLabel("Dị ứng thực phẩm (nếu có)").waitFor();
  await page.getByRole("button", { name: "Tiếp theo", exact: true }).click();
  await page.getByLabel("Mục tiêu của mình").waitFor();
  await page.getByRole("button", { name: "Tiếp theo", exact: true }).click();
  await page
    .locator("form")
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await page.locator(".page-title h1").waitFor();
  assert.equal(
    await page.locator(".page-title h1").textContent(),
    "Nhật ký dinh dưỡng",
    "home makes the nutrition diary the primary task",
  );
  assert.equal(
    await page.locator(".weekly-chart").count(),
    0,
    "weekly chart stays in statistics",
  );
  await page.screenshot({
    path: "docs/screenshots/dashboard-empty-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Ghi bữa ăn", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Nhập thủ công", exact: true })
    .click();
  await page.getByLabel("Tên món ăn", { exact: true }).fill("Bánh mì trứng");
  await page.getByLabel("Năng lượng (kcal)", { exact: true }).fill("410");
  await page.getByLabel("Đạm (g)", { exact: true }).fill("18");
  await page.getByLabel("Tinh bột (g)", { exact: true }).fill("48");
  await page.getByLabel("Chất béo (g)", { exact: true }).fill("17");
  await page.getByRole("button", { name: "Bữa sáng", exact: true }).click();
  await page.getByRole("button", { name: "Lưu bữa ăn", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByText("Bánh mì trứng", { exact: true }).waitFor();
  await page.getByRole("button", { name: "+250 ml", exact: true }).click();
  await page.getByRole("button", { name: "+250 ml", exact: true }).click();
  await page
    .locator(".water-value strong")
    .getByText("500", { exact: true })
    .waitFor();
  await page.getByText("Xem chi tiết dinh dưỡng", { exact: true }).click();
  assert.equal(
    await page.locator(".journal-nutrients .macro").first().isVisible(),
    true,
    "macro details remain available",
  );
  await page.getByText("Xem chi tiết dinh dưỡng", { exact: true }).click();
  await page.screenshot({
    path: "docs/screenshots/dashboard-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Sửa Bánh mì trứng", exact: true })
    .click();
  await page.getByLabel("Khẩu phần", { exact: true }).fill("1 ổ nhỏ");
  await page.getByRole("button", { name: "Lưu bữa ăn", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByText("1 ổ nhỏ", { exact: true }).waitFor();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Thống kê", exact: true })
    .click();
  await page.locator(".weekly-chart").waitFor();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Lộ trình", exact: true })
    .click();
  await page.locator(".day-picker button").nth(29).click();
  await page
    .getByRole("heading", { name: "Thực đơn ngày 30", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Đánh dấu hoàn thành", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Đã hoàn thành", exact: true })
    .waitFor();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Khoa học", exact: true })
    .click();
  await page.getByLabel("Tìm kiếm nội dung").fill("trứng nổi");
  assert.equal(await page.locator(".experiment-card").count(), 1);
  await page.locator(".experiment-card").click();
  await page
    .getByRole("heading", { name: "Điều gì đang xảy ra?", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Đã khám phá", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Công cụ ảo", exact: true }).click();
  await page.getByRole("button", { name: /Giấm/ }).click();
  await page
    .getByRole("heading", { name: "Khám phá tốc độ hòa tan", exact: true })
    .waitFor();
  await page.screenshot({
    path: "docs/screenshots/science-desktop.png",
    fullPage: true,
  });
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Ẩm thực", exact: true })
    .click();
  await page.getByRole("button", { name: "Italia", exact: true }).click();
  await page
    .getByRole("button", { name: "Xem công thức", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Điều chỉnh Việt hóa", exact: true })
    .click();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page
    .getByRole("button", { name: /Nộp thành tích/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Ghi nhận thành tích", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Hồ sơ", exact: true })
    .click();
  await page.getByLabel("Biệt danh", { exact: true }).fill("Bạn cân bằng");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await page.getByRole("button", { name: "Sao lưu ngay", exact: true }).click();
  await page
    .getByRole("link", { name: "Tải bản sao lưu", exact: true })
    .waitFor();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Tổng quan", exact: true })
    .click();
  await page.getByRole("button", { name: "Mở NuTri AI", exact: true }).click();
  await page
    .getByText("Gemini chưa được cấu hình.", { exact: false })
    .waitFor();
  await page
    .getByRole("button", { name: "Đóng cửa sổ chat", exact: true })
    .click();
  const overflows = [];
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    if (width <= 390) {
      assert.equal(
        await page.locator(".mobile-subnav").count(),
        0,
        "home has no extra mobile navigation row",
      );
      assert.equal(
        await page
          .locator(".today-journal")
          .evaluate((el) => el.getBoundingClientRect().top < 400),
        true,
        "meal diary starts in the first mobile screen",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Ghi bữa ăn", exact: true })
          .isVisible(),
        true,
        "primary meal action is visible on mobile",
      );
    }
    await page.screenshot({
      path: "docs/screenshots/dashboard-" + width + ".png",
      fullPage: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    if (overflow) overflows.push(width);
  }
  assert.deepEqual(overflows, [], "no horizontal overflow");
  assert.equal(
    await page
      .locator(".sidebar")
      .evaluate((el) => el.getBoundingClientRect().right <= 1),
    true,
    "mobile sidebar fully hidden until opened",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Nhật ký", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Nhật ký dinh dưỡng", exact: true })
    .waitFor();
  await page.screenshot({
    path: "docs/screenshots/diary-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, [], "no browser runtime errors");
  writeFileSync(
    "docs/screenshots/browser-result.json",
    JSON.stringify(
      {
        passed: true,
        checks: [
          "onboarding",
          "meal create/edit",
          "water",
          "30 day plan",
          "experiment/search",
          "simulations",
          "world recipe/challenge",
          "profile",
          "backup",
          "chat empty state",
          "responsive 1440/1024/768/390/320",
          "mobile navigation",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Browser flows passed; screenshots saved. No runtime errors or horizontal overflow.",
  );
} catch (e) {
  await page.screenshot({
    path: "docs/screenshots/failure.png",
    fullPage: true,
  });
  console.error(await page.locator("body").innerText());
  throw e;
} finally {
  await browser.close();
}
