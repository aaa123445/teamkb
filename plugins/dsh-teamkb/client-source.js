import { UIStyle } from "./ui-style.js";
import { Workbench, WorkbenchIcon } from "./workbench-client.js";
import React, { useState, useSyncExternalStore } from "react";

export const name = "teamkb-settings";
export const inject = ["slots", "configForms", "connection"];
const h = React.createElement;
const palette = {
  fg: "var(--dsw-alias-label-primary, inherit)",
  muted: "var(--dsw-alias-label-secondary, #929292)",
  line: "var(--dsw-alias-border-l3, #80808055)",
  surface: "var(--dsw-alias-card-fill, var(--dsw-alias-bg-layer-1, #f7f8fa))",
  input: "var(--dsw-alias-bg-base, #fff)",
  accent: "var(--dsw-static-blue-500, #3b82f6)",
};
const formStyle = {
  display: "grid",
  gap: 14,
  width: "100%",
  maxWidth: 760,
  color: palette.fg,
};
const textInput = {
  boxSizing: "border-box",
  width: "100%",
  minHeight: 40,
  padding: "9px 12px",
  border: `1px solid ${palette.line}`,
  borderRadius: 8,
  background: palette.input,
  color: palette.fg,
  font: "inherit",
};
const primaryButton = {
  minHeight: 40,
  padding: "0 18px",
  border: 0,
  borderRadius: 8,
  background: palette.accent,
  color: "#fff",
  font: "inherit",
  fontWeight: 600,
  cursor: "pointer",
};

function TeamKBSettings({ form, view }) {
  const [url, setUrl] = useState(null);
  const [key, setKey] = useState("");
  const [clearKey, setClearKey] = useState(false);
  const [contribute, setContribute] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (view === "summary") return "团队知识检索、规范与已验证经验沉淀";
  const state = form?.state;
  const value = state?.value ?? {};
  async function save(event) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setMessage("");
    const ops = [];
    if (url !== null)
      ops.push({ op: "set", path: ["serverUrl"], value: url.trim() });
    if (contribute !== null)
      ops.push({ op: "set", path: ["allowContributions"], value: contribute });
    if (clearKey || key)
      ops.push({
        op: "set",
        path: ["apiKey"],
        value: clearKey ? "" : key.trim(),
      });
    try {
      const result = await form.mutate(ops, state.revision);
      if (result === false) throw new Error("保存被拒绝");
      setKey("");
      setClearKey(false);
      setUrl(null);
      setContribute(null);
      setMessage(
        "设置已保存。新建会话，用 kb_stats 测试真实连接；保存成功不代表联网成功。",
      );
    } catch {
      setMessage("保存失败，请刷新插件设置并重试；未覆盖其他配置。");
    } finally {
      setBusy(false);
    }
  }
  const field = (title, input) =>
    h("label", { style: { display: "grid", gap: 8 } }, title, input);
  const settingSection = (title, description, ...children) =>
    h(
      "section",
      {
        style: {
          display: "grid",
          gap: 12,
          padding: 16,
          border: `1px solid ${palette.line}`,
          borderRadius: 10,
          background: palette.surface,
        },
      },
      h(
        "div",
        null,
        h("strong", { style: { fontSize: 14 } }, title),
        description
          ? h(
              "p",
              {
                style: {
                  margin: "4px 0 0",
                  color: palette.muted,
                  fontSize: 12,
                },
              },
              description,
            )
          : null,
      ),
      ...children,
    );
  const checkbox = (text, checked, onChange) =>
    h(
      "label",
      {
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          lineHeight: 1.5,
          cursor: "pointer",
        },
      },
      h("input", {
        type: "checkbox",
        checked,
        onChange,
        style: { marginTop: 4, accentColor: palette.accent },
      }),
      h("span", null, text),
    );
  return h(
    "form",
    {
      className: "teamkb-ui",
      style: { ...formStyle, containerType: "inline-size" },
      onSubmit: save,
    },
    h(UIStyle),
    h(
      "header",
      null,
      h("h2", { style: { margin: 0, fontSize: 22 } }, "连接设置"),
      h(
        "p",
        { style: { margin: "6px 0 0", color: palette.muted, fontSize: 13 } },
        "Desktop 与 Web 共用宿主连接。",
      ),
    ),
    settingSection(
      "服务",
      "团队知识服务的 HTTP(S) 根地址。",
      field(
        "服务地址",
        h("input", {
          style: textInput,
          type: "url",
          value: url ?? value.serverUrl ?? "https://www.ljc.monster",
          onChange: (e) => setUrl(e.target.value),
          required: true,
        }),
      ),
    ),
    settingSection(
      "个人凭据",
      "保存在当前 Harness profile；留空保留当前凭据。",
      field(
        "个人 API Key",
        h("input", {
          style: textInput,
          type: "password",
          autoComplete: "new-password",
          value: key,
          onChange: (e) => {
            setKey(e.target.value);
            setClearKey(false);
          },
          placeholder: "留空保留当前 Key",
        }),
      ),
      checkbox(
        "清除已保存的 Key，之后读取宿主环境变量 TEAMKB_KEY",
        clearKey,
        (e) => {
          setClearKey(e.target.checked);
          setKey("");
        },
      ),
    ),
    settingSection(
      "知识沉淀",
      "提交前需确认内容已验证、可复用并完成脱敏。",
      checkbox(
        "允许 Agent 在任务结束后按需提交知识（需要 writer 权限）",
        contribute ?? value.allowContributions ?? false,
        (e) => setContribute(e.target.checked),
      ),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        },
      },
      h(
        "button",
        {
          type: "submit",
          disabled: busy || !state?.writable,
          style: {
            ...primaryButton,
            opacity: busy || !state?.writable ? 0.55 : 1,
          },
        },
        busy ? "保存中…" : "保存设置",
      ),
      h(
        "p",
        {
          role: "status",
          style: { margin: 0, color: palette.muted, fontSize: 12 },
        },
        message,
      ),
    ),
    h(
      "a",
      {
        href: "https://www.ljc.monster/#/guide",
        target: "_blank",
        rel: "noreferrer",
        style: { color: "var(--dsw-static-blue-400, #60a5fa)", fontSize: 13 },
      },
      "使用说明",
    ),
  );
}

export function apply(ctx) {
  // The owner passes its live form, revision fence and mutation channel.
  const controller = ctx.configForms.get("teamkb");
  const subscribe = (listener) => controller.subscribe(listener);
  const snapshot = () => controller.getSnapshot();
  function BundleSettings(props) {
    const state = useSyncExternalStore(subscribe, snapshot, snapshot);
    return h(TeamKBSettings, {
      ...props,
      form: {
        state,
        mutate: (ops, revision) => controller.mutate(ops, revision),
      },
    });
  }
  const query = async (input, signal) => {
    const result = await ctx.connection.rpc.call(
      "/api",
      "teamkb/query",
      input,
      signal,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  };
  ctx.slots.inject("main", () =>
    ctx.slots.register(
      {
        name: "main",
        key: "teamkb-workbench",
        inject: () => ({ query, Settings: BundleSettings }),
      },
      Workbench,
    ),
  );
  ctx.slots.inject("sidebar.panellist", () =>
    ctx.slots.register(
      {
        name: "sidebar.panellist",
        id: "teamkb-workbench",
        order: 15,
        label: () => "TeamKB 知识库",
      },
      WorkbenchIcon,
    ),
  );
  // Expose settings on the bundle page as well as its individual row.
  ctx.slots.inject("plugins.bundle.config", () =>
    ctx.slots.register(
      {
        name: "plugins.bundle.config",
        key: "dsh-teamkb",
      },
      BundleSettings,
    ),
  );
  ctx.slots.inject("plugins.row.config", () =>
    ctx.slots.register(
      {
        name: "plugins.row.config",
        key: "dsh-teamkb#teamkb",
      },
      TeamKBSettings,
    ),
  );
}
