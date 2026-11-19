import { test, expect } from "@playwright/test";
import { selectOption } from "./select-helper";

test("connection steps stay visible, track scrolling and match the selected agent", async ({
  page,
  isMobile,
}) => {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      json: {
        user: {
          id: "test",
          display_name: "测试成员",
          username: "tester",
          role: "writer",
          status: "approved",
        },
      },
    }),
  );
  await page.goto("/#/connect");

  const nav = page.getByRole("navigation", { name: "接入步骤" });
  const method = nav.getByRole("button", { name: "选择接入方式" });
  await expect(method).toHaveAttribute("aria-current", "step");
  const methodPanel = page.locator("#connect-method");
  const navBox = await nav.boundingBox();
  const methodBox = await methodPanel.boundingBox();
  if (isMobile) {
    expect(navBox.y + navBox.height).toBeLessThanOrEqual(methodBox.y);
  } else {
    expect(navBox.x + navBox.width).toBeLessThanOrEqual(methodBox.x);
  }

  await methodPanel.getByRole("button", { name: /仅 CLI/ }).click();
  const contribution = nav.getByRole("button", { name: /经验沉淀/ });
  await expect(contribution).toBeVisible();
  const output = nav.getByRole("button", { name: "一键安装命令" });
  await output.click();
  await expect(output).toHaveAttribute("aria-current", "step");
  await expect(page.locator("#connect-output h2")).toBeFocused();
  await expect(page.locator("#connect-output h2")).toBeInViewport();
  expect(new URL(page.url()).hash).toBe("#/connect");

  const stickyBox = await nav.boundingBox();
  const outputBox = await page.locator("#connect-output h2").boundingBox();
  if (isMobile)
    expect(outputBox.y).toBeGreaterThan(stickyBox.y + stickyBox.height);
  expect(stickyBox.y).toBeLessThan(navBox.y);

  await page.evaluate(() => {
    const area =
      document.querySelector(".workspace-scroll") || document.scrollingElement;
    area.scrollTop = 0;
  });
  await expect(method).toHaveAttribute("aria-current", "step");
  await method.click();
  await expect(methodPanel.getByRole("heading", { level: 2 })).toBeFocused();

  const agent = methodPanel.getByRole("combobox", { name: "本地智能体" });
  await selectOption(page, agent, "dsh");
  await expect(nav.getByRole("button")).toHaveCount(2);
  await expect(contribution).toHaveCount(0);
  await selectOption(page, agent, "other");
  await expect(nav.getByRole("button", { name: "个人访问凭据" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "安装提示词" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
