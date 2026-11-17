// Optional: boot an isolated Harness Web profile and set TEAMKB_DSH_LOG. Uses mocked owner RPC responses.
const { chromium } = require(
  require("path").resolve(__dirname, "../../../web/node_modules/playwright"),
);
const fs = require("fs");
const assert = require("assert/strict");
(async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage();
    let updates = 0,
      mode = "new";
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.route("**/api/teamkb/query", async (route) => {
      const env = route.request().postDataJSON();
      let value;
      if (env.payload.action === "check-update")
        value = {
          current_version: "0.1.7",
          latest_version: mode === "new" ? "0.1.8" : "0.1.7",
          available: mode === "new",
          can_update: true,
          sha256: "a".repeat(64),
        };
      else if (env.payload.action === "install-update") {
        updates++;
        value = {
          application: "restart-required",
          message: "安装完成，请重启当前宿主后生效。",
        };
      } else value = { categories: [] };
      return route.fulfill({
        json: {
          type: "server-response",
          rpcId: env.rpcId,
          result: { ok: true, value },
        },
      });
    });
    const url = fs
      .readFileSync(
        process.env.TEAMKB_DSH_LOG || "/tmp/teamkb-dsh-web-current.log",
        "utf8",
      )
      .match(/http:\/\/127\.0\.0\.1:3098\/\?token=\S+/)[0];
    await p.goto(url);
    await p.waitForTimeout(1500);
    const cont = p.getByRole("button", { name: "Continue", exact: true });
    if (await cont.isVisible()) await cont.click();
    await p.keyboard.press("Escape");
    await p
      .locator("[role=dialog]")
      .evaluateAll((ds) =>
        ds.forEach((d) => d.querySelector("button")?.click()),
      );
    await p.keyboard.press("Escape");
    await p.getByText("TeamKB 知识库", { exact: true }).first().click();
    await p.getByRole("button", { name: "连接配置", exact: true }).click();
    const panel = p.getByRole("region", { name: "插件更新" });
    await panel
      .getByRole("button", { name: "立即更新", exact: true })
      .waitFor();
    await panel.getByRole("button", { name: "立即更新", exact: true }).click();
    await panel.getByRole("status").filter({ hasText: "安装完成" }).waitFor();
    assert.equal(updates, 1);
    assert.equal(
      await panel
        .getByRole("button", { name: "立即更新", exact: true })
        .count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS Harness plugin UI auto check, one-click update, restart reminder, no errors",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
