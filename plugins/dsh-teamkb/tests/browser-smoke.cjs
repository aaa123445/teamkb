// Optional integration: launch an isolated Harness Web profile, then set TEAMKB_DSH_LOG.
const { chromium } = require(
  require("path").resolve(__dirname, "../../../web/node_modules/playwright"),
);
const fs = require("fs");
const assert = require("assert/strict");
(async () => {
  const upstream = require("http").createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    let v = {};
    if (req.url === "/api/v1/stats") v = { documents: 1398, terms: 122286 };
    if (req.url === "/api/v1/categories")
      v = {
        categories: Array.from({ length: 40 }, (_, i) => ({
          id: "cat" + i,
          name: i ? "长分类名称 · 技术开发与部署 " + i : "技术平台",
          path: "技术平台 / 测试分类 " + i,
          doc_count: 30,
        })),
      };
    if (req.url === "/api/v1/search")
      v = {
        count: 1,
        results: [
          {
            id: "test:doc",
            title: "数据库连接超时排查",
            summary: "已验证的连接池配置与排查步骤",
          },
        ],
      };
    if (req.url === "/api/v1/read")
      v = {
        id: "test:doc",
        title: "数据库连接超时排查",
        content: "验证后的知识正文\n" + "阅读内容。".repeat(300),
        knowledge_version: 2,
      };
    if (req.url.startsWith("/api/v1/account/calls?"))
      v = {
        total: 1,
        logs: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          operation: i ? "read" : "search",
          status_code: 200,
          ts: 1700000000,
          duration_ms: 24,
          result_summary: "找到相关团队知识，返回已脱敏的查询结果",
        })),
      };
    if (req.url === "/api/v1/account/calls/1")
      v = { id: 1, response: { content: "日志结果已脱敏".repeat(800) } };
    res.end(JSON.stringify(v));
  });
  await new Promise((r) => upstream.listen(0, "127.0.0.1", r));
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    const url = fs
      .readFileSync(
        process.env.TEAMKB_DSH_LOG || "/tmp/teamkb-dsh-web-current.log",
        "utf8",
      )
      .match(/http:\/\/127\.0\.0\.1:3098\/\?token=\S+/)[0];
    p.setDefaultTimeout(15000);
    await p.goto(url);
    console.log("opened");
    await p.waitForTimeout(700);
    await p.keyboard.press("Escape");
    await p
      .locator("[role=dialog]")
      .evaluateAll((ds) =>
        ds.forEach((d) => d.querySelector("button")?.click()),
      );
    console.log("dialogs dismissed");
    await p.getByText("TeamKB 知识库", { exact: true }).first().click();
    console.log("workbench");
    await p.getByRole("button", { name: "连接配置", exact: true }).click();
    await p
      .locator("input[type=url]")
      .fill("http://127.0.0.1:" + upstream.address().port);
    await p.locator("input[type=password]").fill("fixture-only-key");
    console.log("settings filled");
    await p.getByRole("button", { name: "保存设置", exact: true }).click();
    await p.getByRole("status").filter({ hasText: "设置已保存" }).waitFor();
    await p.getByRole("button", { name: "知识查询", exact: true }).click();
    await p.getByRole("button", { name: "刷新", exact: true }).click();
    await p
      .locator(".tkb-directory-list button")
      .filter({ hasText: "技术平台" })
      .first()
      .waitFor();
    await p.getByRole("button", { name: "连接测试", exact: true }).click();
    await p.getByText("1398", { exact: true }).waitFor();
    await p.keyboard.press("Escape");
    for (const dark of [true, false]) {
      await p.evaluate((d) => {
        document.body.toggleAttribute("data-ds-dark-theme", d);
        document.documentElement.style.colorScheme = d ? "dark" : "light";
      }, dark);
      await p.waitForTimeout(500);
      await p.screenshot({
        path: "/tmp/teamkb-014-" + (dark ? "dark" : "light") + ".png",
      });
      console.log(
        "theme",
        dark,
        await p
          .locator(".tkb-directory-list button")
          .nth(1)
          .evaluate((e) => ({
            fg: getComputedStyle(e).color,
            bg: getComputedStyle(e.closest(".tkb-workbench")).backgroundColor,
            card: getComputedStyle(document.querySelector(".tkb-search-card"))
              .backgroundColor,
          })),
      );
      const bg = await p
        .locator(".tkb-search-card")
        .evaluate((e) => getComputedStyle(e).backgroundColor);
      if (dark) assert.notEqual(bg, "rgb(247, 248, 250)");
    }
    await p.getByLabel("知识关键词").fill("连接池");
    console.log("settings/categories/stats ready");
    await p.getByRole("button", { name: "搜索", exact: true }).click();
    await p.getByRole("button", { name: /数据库连接超时排查/ }).click();
    await p
      .getByLabel("知识正文")
      .getByText(/验证后的知识正文/)
      .waitFor();
    await p.getByRole("button", { name: "← 返回结果", exact: true }).click();
    await p.getByRole("button", { name: /数据库连接超时排查/ }).waitFor();
    await p.getByRole("button", { name: "调用日志", exact: true }).click();
    const log = p.getByRole("button", { name: /search HTTP 200/ });
    const scrollBefore = await p
      .locator(".tkb-scroll")
      .evaluate((e) => e.scrollTop);
    for (const width of [1440, 600]) {
      await p.setViewportSize({ width, height: 900 });
      await log.click();
      const dialog = p.getByRole("dialog", { name: "调用详情", exact: true });
      await dialog.waitFor();
      await dialog.getByText(/日志结果已脱敏/).waitFor();
      assert(
        await dialog.evaluate((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.top >= 0 &&
            r.bottom <= innerHeight &&
            r.left >= 0 &&
            r.right <= innerWidth
          );
        }),
      );
      assert(
        await dialog
          .locator(".tkb-detail-body")
          .evaluate((e) => e.scrollHeight > e.clientHeight),
      );
      assert(
        await dialog
          .getByRole("button", { name: "关闭", exact: true })
          .evaluate((e) => e === document.activeElement),
      );
      await p.keyboard.press("Escape");
      await dialog.waitFor({ state: "detached" });
      assert(await log.evaluate((e) => e === document.activeElement));
      await log.click();
      await dialog.getByRole("button", { name: "关闭", exact: true }).click();
      await log.click();
      await dialog.waitFor();
      await p.mouse.click(1, 1);
      await dialog.waitFor({ state: "detached" });
    }
    assert.equal(
      await p.locator(".tkb-scroll").evaluate((e) => e.scrollTop),
      scrollBefore,
    );
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.getByRole("button", { name: "知识查询", exact: true }).click();
    await p.evaluate(() => {
      document.body.setAttribute("data-ds-dark-theme", "");
      document.documentElement.style.colorScheme = "dark";
    });
    for (const width of [850, 600]) {
      await p.setViewportSize({ width, height: 900 });
      await p.screenshot({ path: "/tmp/teamkb-014-" + width + ".png" });
      assert(
        await p
          .locator(".tkb-workbench")
          .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      );
      if (width === 600)
        assert.equal(
          await p
            .locator(".tkb-search-layout")
            .evaluate(
              (e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
            ),
          1,
        );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS Harness Web: real host RPC, settings, classification scroll, search/read/back, logs/modal bounds, independent scrolling, Escape/close/backdrop/focus restoration, dark/light and 850/600px layout; no JS errors",
    );
  } finally {
    await b.close();
    upstream.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
