import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.route("**/health", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ status: 401, json: { message: "请登录" } }),
  );
  await page.goto("/#/connect");
});

test("首次访问依次高亮工作台入口，完成后不再自动打开", async ({
  page,
  isMobile,
}) => {
  const tour = page.getByRole("dialog");
  const spotlight = tour.locator(".workspace-tour-spotlight");
  const panel = tour.locator(".workspace-tour-panel");
  await expect(tour.getByRole("heading", { name: "浏览工作台" })).toBeFocused();
  await expect(page.locator("body")).toHaveClass(/scroll-locked/);

  const steps = [
    ["浏览工作台", isMobile ? ".mobile-toggle" : ".sidebar"],
    [
      "快速找知识",
      isMobile ? '[data-tour="mobile-search"]' : '[data-tour="search"]',
    ],
    ["切换主题", '[data-tour="theme"]'],
    ["接入本地智能体", isMobile ? ".mobile-toggle" : '[data-tour="connect"]'],
  ];
  for (const [index, [title, target]] of steps.entries()) {
    if (index) await tour.getByRole("button", { name: "下一步" }).click();
    await expect(tour.getByRole("heading", { name: title })).toBeFocused();
    await expect(spotlight).toBeInViewport();
    await expect(panel).toBeInViewport({ ratio: 1 });
    const highlight = await spotlight.boundingBox();
    const anchor = await page.locator(target).boundingBox();
    expect(highlight.x).toBeLessThanOrEqual(anchor.x);
    expect(highlight.y).toBeLessThanOrEqual(anchor.y);
    expect(highlight.x + highlight.width).toBeGreaterThanOrEqual(
      anchor.x + anchor.width - 1,
    );
    expect(highlight.y + highlight.height).toBeGreaterThanOrEqual(
      anchor.y + anchor.height - 1,
    );
  }
  await tour.getByRole("button", { name: "上一步" }).click();
  await expect(tour.getByRole("heading", { name: "切换主题" })).toBeFocused();
  await tour.getByRole("button", { name: "下一步" }).click();
  await tour.getByRole("button", { name: "开始使用" }).click();
  await expect(tour).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveClass(/scroll-locked/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "一键接入", exact: true }),
  ).toBeVisible();
  await expect(tour).toHaveCount(0);
});

test("可跳过引导，并从顶部帮助图标重新打开", async ({ page }) => {
  const tour = page.getByRole("dialog");
  await tour.getByRole("button", { name: "跳过" }).click();
  await expect(tour).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "一键接入", exact: true }),
  ).toBeVisible();
  await expect(tour).toHaveCount(0);
  const help = page.getByRole("button", { name: "查看工作台引导" });
  await help.click();
  await expect(tour.getByRole("heading", { name: "浏览工作台" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tour).toHaveCount(0);
  await expect(help).toBeFocused();
});
