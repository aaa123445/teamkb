import { test, expect } from "@playwright/test";
const secret = "test-personal-connection-key";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copiedPrompt = text;
        },
      },
      configurable: true,
    });
  });
  await page.route("**/health", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith("/auth/me")
      ? {
          user: {
            id: "test",
            display_name: "测试成员",
            username: "tester",
            role: "writer",
            status: "approved",
          },
        }
      : path.endsWith("/account/keys")
        ? { key: secret, keys: [] }
        : { documents: 1397, by_source: {} };
    return route.fulfill({ json: data });
  });
});

test("generates installation modes and explicit task-end contribution policy", async ({
  page,
}) => {
  await page.goto("/#/connect?agent=other");
  const preview = page.getByLabel("安装提示词预览");
  await expect(preview).toContainText("SHA-256:");
  await expect(preview).toContainText("team-knowledge-0.5.6.zip");
  await expect(preview).toContainText("YOUR_PERSONAL_KEY");
  await expect(preview).toContainText("MCP 模式不写入");
  await expect(preview).not.toContainText("TEAMKB:BEGIN");
  await page.getByRole("button", { name: "仅 CLI", exact: false }).click();
  await expect(preview).toContainText("TEAMKB:BEGIN");
  await expect(preview).toContainText("dsh --help");
  await page.getByLabel("任务完成后按需提交知识").uncheck();
  await expect(preview).toContainText("已关闭：只检索");
  await expect(preview).toContainText("不启用任务后自主提交");
  await page
    .getByRole("button", { name: "复制安装提示词", exact: true })
    .click();
  expect(await page.evaluate(() => window.copiedPrompt)).toContain(
    "/static/downloads/v8_workbench",
  );
  await page.getByRole("button", { name: "仅 CLI", exact: false }).click();
  await expect(preview).not.toContainText("team-knowledge-0.5.6.zip");
  await expect(preview).not.toContainText('args=["mcp"]');
  await page.getByRole("button", { name: "仅 Skill", exact: false }).click();
  await expect(preview).toContainText("team-knowledge-0.5.6.zip");
  await expect(preview).not.toContainText('args=["mcp"]');
  await page.getByRole("button", { name: "仅 MCP", exact: false }).click();
  await expect(preview).toContainText('args=["mcp"]');
  await expect(preview).not.toContainText("team-knowledge-0.5.6.zip");
  await page.getByRole("button", { name: "仅 CLI", exact: false }).click();
  await page.getByLabel("任务完成后按需提交知识").check();
  await expect(preview).toContainText("已授权任务完成后按需提交");
  await expect(preview).not.toContainText("wb agent init --project");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("personal key is explicit, masked, copied and cleared on leaving", async ({
  page,
}) => {
  await page.goto("/#/connect?agent=other");
  const input = page.getByLabel("已有个人 Key", { exact: true });
  await input.fill(secret);
  await page
    .getByRole("button", { name: "复制安装提示词", exact: true })
    .click();
  expect(await page.evaluate(() => window.copiedPrompt)).not.toContain(secret);
  await page.getByLabel("复制时包含个人 Key").check();
  await expect(page.getByLabel("安装提示词预览")).not.toContainText(secret);
  await page
    .getByRole("button", { name: "复制安装提示词", exact: true })
    .click();
  expect(await page.evaluate(() => window.copiedPrompt)).toContain(secret);
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain(secret);
  await page.getByRole("link", { name: "完整使用说明", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "使用说明", exact: true }),
  ).toBeVisible();
  await page.goto("/#/connect?agent=other");
  await expect(input).toHaveValue("");
  await page.getByText("创建接入专用 Key", { exact: true }).click();
  await page.getByRole("button", { name: "创建并用于提示词" }).click();
  await expect(input).toHaveValue(secret);
  await expect(page.getByLabel("复制时包含个人 Key")).toBeChecked();
});

test("invalid download manifest blocks prompt generation and can retry", async ({
  page,
}) => {
  await page.route("**/static/downloads/manifest.json", (route) =>
    route.fulfill({ json: { sha256: {} } }),
  );
  await page.goto("/#/connect?agent=other");
  await expect(page.getByRole("alert")).toContainText("校验信息尚未就绪");
  await expect(
    page.getByRole("button", { name: "复制安装提示词", exact: true }),
  ).toHaveCount(0);
  await page.unroute("**/static/downloads/manifest.json");
  await page.getByRole("button", { name: "重新加载", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "复制安装提示词", exact: true }),
  ).toBeEnabled();
});

test("new personal key can be handed to the installer without URL or storage", async ({
  page,
}) => {
  await page.goto("/#/account");
  await page.getByLabel("Key 名称").fill("本地安装测试");
  await page.getByRole("button", { name: "创建个人 Key", exact: true }).click();
  await page.getByRole("button", { name: "用此 Key 生成安装提示词 →" }).click();
  await expect(page.getByLabel("已有个人 Key", { exact: true })).toHaveValue(
    secret,
  );
  expect(page.url()).not.toContain(secret);
  await page.getByRole("button", { name: "选中提示词", exact: true }).click();
  const manual = page.getByLabel("手动复制安装提示词");
  await expect(manual).toBeFocused();
  await expect(manual).toHaveValue(new RegExp(secret));
  expect(
    await manual.evaluate((el) => el.selectionEnd - el.selectionStart),
  ).toBeGreaterThan(100);
});

test("scope selection generates matching initialization, MCP and Skill setup", async ({
  page,
}) => {
  await page.goto("/#/connect?agent=other");
  const preview = page.getByLabel("安装提示词预览");
  await expect(preview).toContainText("wb init --scope user");
  await expect(preview).toContainText("~/.teamkb/client.json");
  await expect(preview).toContainText('args=["mcp"]');
  await page.getByRole("button", { name: "项目接入", exact: false }).click();
  await expect(preview).toContainText(
    "wb --project PROJECT_ROOT init --scope project",
  );
  await expect(preview).toContainText(
    'args=["--project", "PROJECT_ROOT", "mcp"]',
  );
  await expect(preview).toContainText("项目级 Skill 目录");
  await expect(preview).toContainText(".gitignore");
  await expect(preview).not.toContainText("wb init --scope user");
  await page
    .getByRole("button", { name: "复制安装提示词", exact: true })
    .click();
  expect(await page.evaluate(() => window.copiedPrompt)).toContain(
    "接入范围：项目接入",
  );
  await page.getByRole("button", { name: "仅 CLI", exact: false }).click();
  await expect(preview).toContainText(
    "wb --project PROJECT_ROOT init --scope project",
  );
  await expect(preview).not.toContainText("args=");
  await page.getByRole("button", { name: "全局接入", exact: false }).click();
  await expect(preview).toContainText("wb init --scope user");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Codex and Claude Code offer credential-free commands with mode and scope", async ({
  page,
}) => {
  await page.goto("/#/connect");
  const preview = page.getByLabel("安装提示词预览");
  await expect(
    page.getByRole("heading", { name: "一键安装命令" }),
  ).toBeVisible();
  await expect(preview).toContainText("/install.sh -o teamkb-install.sh");
  await expect(preview).toContainText("codex recommended user");
  await expect(preview).toContainText("curl -fsSL");
  await expect(page.getByLabel("已有个人 Key", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "仅 CLI", exact: false }).click();
  await expect(preview).toContainText("codex cli user");
  await page.getByLabel("任务完成后按需提交知识").uncheck();
  await expect(preview).toContainText("--no-contribute");
  await page.getByRole("button", { name: "项目接入", exact: false }).click();
  await expect(preview).toContainText("codex cli project");
  await page.getByRole("combobox", { name: "本地智能体" }).click();
  await page
    .getByRole("option", { name: "Claude Code · 一键安装命令", exact: true })
    .click();
  await expect(preview).toContainText("claudecode cli project");
  await page.getByRole("combobox", { name: "终端系统" }).click();
  await page
    .getByRole("option", { name: "Windows PowerShell", exact: true })
    .click();
  await expect(preview).toContainText("py -3 -c");
  await page.getByRole("button", { name: "复制安装命令", exact: true }).click();
  expect(await page.evaluate(() => window.copiedPrompt)).not.toContain(secret);
});
