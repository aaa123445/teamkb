import { test, expect } from "@playwright/test";

test("长对话和历史记录不撑开聊天页，输入框始终可见", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("v8wb_key", "layout-test"),
  );
  const conversations = Array.from({ length: 60 }, (_, i) => ({
    id: `chat-${i}`,
    title: `历史对话 ${i}`,
  }));
  const content =
    Array.from(
      { length: 80 },
      (_, i) => `段落 ${i}：这是用于检查高度的长回答。`,
    ).join("\n\n") +
    "\n\n```text\n" +
    "LONG_CODE_".repeat(800) +
    "\n```\n\n" +
    "|" +
    Array.from({ length: 20 }, (_, i) => `列${i}`).join("|") +
    "|\n|" +
    Array(20).fill("---").join("|") +
    "|\n|" +
    Array(20).fill("长单元格内容").join("|") +
    "|\n\n" +
    "https://example.com/" +
    "long-url".repeat(300);
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/v1", "");
    if (path === "/auth/me") return route.fulfill({ status: 401, json: {} });
    let data = {};
    if (path === "/assistant/status") data = { ready: true };
    if (path === "/categories") data = { categories: [] };
    if (path === "/stats")
      data = { documents: 10, by_domain: {}, by_source: {} };
    if (path === "/assistant/conversations") data = { conversations };
    if (path.startsWith("/assistant/conversations/"))
      data = {
        ...conversations[0],
        messages: [
          { role: "user", content: "长对话测试", time: 1 },
          { role: "assistant", content, time: 2 },
        ],
      };
    if (path === "/assistant/ask") data = { answer: content, citations: [] };
    return route.fulfill({ json: data });
  });
  await page.goto("/#/assistant");
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 640 },
    { width: 952, height: 828 },
    { width: 390, height: 640 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.reload();
    await expect(page.locator(".assistant-bubble")).toContainText("段落 79");
    await expect(page.getByRole("dialog", { name: "对话历史" })).toBeHidden();
    const checkLayout = async () => {
      const result = await page.evaluate(() => {
        const pane = document.querySelector(".workspace-scroll");
        const messages = document.querySelector(".assistant-chat-messages");
        const composer = document
          .querySelector(".assistant-chat-composer")
          .getBoundingClientRect();
        return {
          outerScroll: pane.scrollHeight > pane.clientHeight + 1,
          windowScroll: window.scrollY,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          composerVisible: composer.top >= 0 && composer.bottom <= innerHeight,
          messageScroll: messages.scrollHeight > messages.clientHeight,
          messageHeight: messages.clientHeight,
          composerHeight: composer.height,
          messageWidth: document.querySelector(".assistant-bubble").clientWidth,
        };
      });
      expect(result, JSON.stringify(viewport)).toMatchObject({
        outerScroll: false,
        windowScroll: 0,
        horizontalOverflow: false,
        composerVisible: true,
        messageScroll: true,
      });
      expect(result.messageHeight).toBeGreaterThan(60);
      expect(result.composerHeight).toBeLessThan(108);
      if (viewport.width === 952)
        expect(result.messageWidth).toBeGreaterThan(600);
    };
    await checkLayout();
    const wide = await page
      .locator(".assistant-chat-messages .prose pre")
      .first()
      .evaluate((el) => ({
        canScroll: el.scrollWidth > el.clientWidth,
        max: el.getBoundingClientRect().right <= innerWidth,
        overflow: getComputedStyle(el).overflowX,
      }));
    expect(wide).toMatchObject({
      canScroll: true,
      max: true,
      overflow: "auto",
    });
    const composerBox = await page
      .locator(".assistant-chat-composer")
      .boundingBox();
    await page
      .locator(".assistant-chat-messages")
      .evaluate((el) => el.scrollTo({ top: 0, behavior: "instant" }));
    expect(
      await page.locator(".assistant-chat-composer").boundingBox(),
    ).toEqual(composerBox);
    await page.getByLabel("知识问答问题").fill("继续测试长回答");
    await page.getByRole("button", { name: "发送", exact: true }).click();
    await expect(page.locator(".assistant-bubble")).toHaveCount(2);
    await checkLayout();
    await expect
      .poll(() =>
        page
          .locator(".assistant-chat-messages")
          .evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop),
      )
      .toBeLessThan(5);
    await page.getByRole("button", { name: "新对话", exact: true }).click();
    await expect(page.locator(".assistant-chat-welcome")).toBeVisible();
    expect(
      await page
        .locator(".assistant-chat-messages")
        .evaluate(
          (el) =>
            el.firstElementChild.getBoundingClientRect().top >=
            el.getBoundingClientRect().top - 1,
        ),
    ).toBe(true);
  }
  await page.evaluate(() => (location.hash = "#/library"));
  await expect(page.locator(".workspace-chat")).toHaveCount(0);
});
