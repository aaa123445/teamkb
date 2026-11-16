import { UIStyle } from "./ui-style.js";
import React, { useState, useEffect, useRef } from "react";
const h = React.createElement;
const css = {
  shell: {
    height: "100%",
    overflowY: "auto",
    boxSizing: "border-box",
    fontFamily: "var(--dsw-font-family,inherit)",
    color: "var(--dsw-alias-label-primary,inherit)",
    background: "var(--dsw-alias-bg-canvas,transparent)",
  },
  content: {
    width: "min(1180px,100%)",
    margin: "0 auto",
    padding: "30px clamp(20px,4vw,56px) 56px",
    boxSizing: "border-box",
  },
  button: {
    minHeight: 36,
    padding: "0 14px",
    border: "1px solid var(--dsw-alias-border-l3,#80808044)",
    borderRadius: 8,
    background: "var(--dsw-alias-bg-layer-1,transparent)",
    color: "inherit",
    cursor: "pointer",
    font: "inherit",
    transition: "background .15s,border-color .15s",
  },
  panel: {
    border: "1px solid var(--dsw-alias-border-l4,#80808033)",
    borderRadius: 14,
    background: "var(--dsw-alias-bg-layer-1,transparent)",
    padding: 20,
  },
  input: {
    minHeight: 42,
    padding: "0 13px",
    border: "1px solid var(--dsw-alias-border-l3,#80808055)",
    borderRadius: 8,
    background: "var(--dsw-alias-bg-layer-2,transparent)",
    color: "inherit",
    font: "inherit",
    boxSizing: "border-box",
  },
  muted: { color: "var(--dsw-alias-label-secondary,#929292)" },
};
const action = (label, onClick, disabled = false, active = false) =>
  h(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      style: {
        ...css.button,
        ...(active
          ? {
              background: "var(--dsw-static-blue-500,#3b82f6)",
              borderColor: "var(--dsw-static-blue-500,#3b82f6)",
              color: "#fff",
            }
          : {}),
      },
    },
    label,
  );
export function Workbench({ query, Settings }) {
  const [tab, setTab] = useState("search"),
    [categories, setCategories] = useState([]),
    [category, setCategory] = useState(""),
    [categoryFilter, setCategoryFilter] = useState(""),
    [text, setText] = useState(""),
    [stats, setStats] = useState(null),
    [results, setResults] = useState(null),
    [document, setDocument] = useState(null),
    [logs, setLogs] = useState(null),
    [detail, setDetail] = useState(null),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function run(input, accept) {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError("");
    try {
      const value = await query(input, abort.signal);
      if (!abort.signal.aborted) accept(value);
    } catch (e) {
      if (!abort.signal.aborted) setError(e.message || "宿主连接失败，请重试");
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  const loadLogs = (n) =>
    run({ action: "calls", page: n }, (v) => {
      setLogs(v);
      setPage(n);
      setDetail(null);
    });
  const switchTab = (id) => {
    controller.current?.abort();
    setBusy(false);
    setError("");
    setTab(id);
    if (id === "logs") loadLogs(1);
  };
  const selectedCategory = categories.find((x) => x.id === category);
  const visibleCategories = categories.filter((x) =>
    (x.path || x.name || "")
      .toLowerCase()
      .includes(categoryFilter.toLowerCase()),
  );
  return h(
    "section",
    {
      className: "teamkb-ui",
      style: {
        ...css.shell,
        containerType: "inline-size",
        containerName: "teamkb",
      },
    },
    h(UIStyle),
    h(
      "div",
      { style: css.content },
      h(
        "header",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            alignItems: "flex-start",
            marginBottom: 24,
            flexWrap: "wrap",
          },
        },
        h(
          "div",
          null,
          h(
            "div",
            {
              style: {
                ...css.muted,
                fontSize: 12,
                letterSpacing: ".08em",
                textTransform: "uppercase",
              },
            },
            "Team knowledge workspace",
          ),
          h(
            "h1",
            {
              style: {
                fontSize: "clamp(24px,3vw,32px)",
                lineHeight: 1.15,
                margin: "7px 0 8px",
                fontWeight: 700,
              },
            },
            "TeamKB 工作台",
          ),
          h(
            "p",
            { style: { ...css.muted, margin: 0, fontSize: 15 } },
            "检索团队知识，核对原文，追踪个人调用。",
          ),
        ),
        stats
          ? h(
              "div",
              { style: { ...css.panel, padding: "12px 16px", minWidth: 180 } },
              h("div", { style: { ...css.muted, fontSize: 12 } }, "知识库规模"),
              h(
                "strong",
                { style: { fontSize: 21 } },
                `${stats.documents ?? "—"} 篇`,
              ),
              h(
                "div",
                { style: { ...css.muted, fontSize: 12 } },
                `${stats.terms ?? "—"} 个词条`,
              ),
            )
          : null,
      ),
      h(
        "nav",
        {
          "aria-label": "TeamKB 功能",
          style: {
            display: "flex",
            gap: 6,
            borderBottom: "1px solid var(--dsw-alias-border-l4,#80808033)",
            marginBottom: 20,
          },
        },
        ...[
          ["search", "知识查询"],
          ["logs", "调用日志"],
          ["settings", "连接配置"],
        ].map(([id, label]) =>
          h(
            "button",
            {
              type: "button",
              onClick: () => switchTab(id),
              "aria-pressed": tab === id,
              className: "tkb-tab",
              key: id,
              style: {
                ...css.button,
                border: "0",
                borderRadius: "8px 8px 0 0",
                background: "transparent",
                minHeight: 42,
                color:
                  tab === id ? "var(--dsw-static-blue-400,#60a5fa)" : "inherit",
                borderBottom:
                  tab === id
                    ? "2px solid var(--dsw-static-blue-400,#60a5fa)"
                    : "2px solid transparent",
              },
            },
            label,
          ),
        ),
      ),
      error
        ? h(
            "div",
            {
              role: "alert",
              style: {
                ...css.panel,
                color: "var(--dsw-static-red-400,#f87171)",
                marginBottom: 16,
              },
            },
            error,
          )
        : null,
      busy
        ? h(
            "div",
            { role: "status", style: { ...css.muted, marginBottom: 12 } },
            "正在通过宿主查询…",
          )
        : null,
      tab === "settings" ? h(Settings) : null,
      tab === "search"
        ? h(
            "div",
            {
              className: "tkb-search-layout",
              style: {
                display: "grid",
                gridTemplateColumns: "minmax(190px,230px) minmax(0,1fr)",
                gap: 16,
                alignItems: "start",
              },
            },
            h(
              "aside",
              {
                className: "tkb-directory",
                style: {
                  ...css.panel,
                  display: "grid",
                  gap: 12,
                  position: "sticky",
                  top: 0,
                },
              },
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  },
                },
                h("strong", { style: { whiteSpace: "nowrap" } }, "知识分类"),
                action("刷新", () =>
                  run({ action: "categories" }, (v) =>
                    setCategories(v.categories || []),
                  ),
                ),
              ),
              h("input", {
                style: css.input,
                "aria-label": "筛选分类",
                placeholder: "筛选分类",
                value: categoryFilter,
                onChange: (e) => setCategoryFilter(e.target.value),
              }),
              h(
                "div",
                {
                  className: "tkb-directory-list",
                  style: {
                    display: "grid",
                    gap: 4,
                    maxHeight: 440,
                    overflowY: "auto",
                  },
                },
                action("全部知识", () => setCategory(""), false, !category),
                ...visibleCategories.map((item) =>
                  h(
                    "button",
                    {
                      type: "button",
                      key: item.id,
                      title: item.path || item.name,
                      "aria-pressed": category === item.id,
                      onClick: () => setCategory(item.id),
                      style: {
                        ...css.button,
                        textAlign: "left",
                        paddingLeft:
                          10 +
                          Math.min(
                            4,
                            (item.path || "").split(" / ").length - 1,
                          ) *
                            10,
                        minHeight: 34,
                        padding: "0 10px",
                        fontSize: 13,
                        background:
                          category === item.id
                            ? "var(--dsw-static-blue-500,#3b82f6)"
                            : "transparent",
                        color: category === item.id ? "#fff" : "inherit",
                      },
                    },
                    item.name || item.path,
                  ),
                ),
              ),
            ),
            h(
              "div",
              { className: "tkb-entry", style: { display: "grid", gap: 16 } },
              h(
                "div",
                { style: css.panel },
                h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      marginBottom: 12,
                      flexWrap: "wrap",
                    },
                  },
                  h(
                    "strong",
                    null,
                    selectedCategory
                      ? `搜索 · ${selectedCategory.name || selectedCategory.path}`
                      : "搜索知识",
                  ),
                  action("连接测试", () => run({ action: "stats" }, setStats)),
                ),
                h(
                  "form",
                  {
                    onSubmit: (e) => {
                      e.preventDefault();
                      setDocument(null);
                      run(
                        {
                          action: "search",
                          query: text,
                          category_id: category,
                        },
                        setResults,
                      );
                    },
                    style: {
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1fr) auto",
                      gap: 8,
                    },
                  },
                  h("input", {
                    style: css.input,
                    "aria-label": "知识关键词",
                    placeholder: "输入关键词，例如：接口超时、部署规范",
                    value: text,
                    onChange: (e) => setText(e.target.value),
                    required: true,
                    maxLength: 500,
                  }),
                  h(
                    "button",
                    {
                      type: "submit",
                      style: {
                        ...css.button,
                        background: "var(--dsw-static-blue-500,#3b82f6)",
                        borderColor: "var(--dsw-static-blue-500,#3b82f6)",
                        color: "#fff",
                      },
                      disabled: busy,
                    },
                    "搜索",
                  ),
                ),
              ),
              !results && !document
                ? h(
                    "div",
                    {
                      style: {
                        ...css.panel,
                        padding: "48px 24px",
                        textAlign: "center",
                        borderStyle: "dashed",
                      },
                    },
                    h(
                      "div",
                      {
                        style: {
                          width: 46,
                          height: 46,
                          margin: "0 auto 14px",
                          borderRadius: 12,
                          background: "var(--dsw-alias-bg-layer-2,#80808015)",
                          display: "grid",
                          placeItems: "center",
                        },
                      },
                      h(WorkbenchIcon),
                    ),
                    h(
                      "h2",
                      { style: { fontSize: 17, margin: "0 0 7px" } },
                      "从一个问题开始",
                    ),
                    h(
                      "p",
                      { style: { ...css.muted, fontSize: 13, margin: 0 } },
                      "搜索解决方案、开发规范或技术文档。选择分类可以缩小范围。",
                    ),
                  )
                : null,
              results
                ? h(
                    "div",
                    { style: { display: "grid", gap: 8 } },
                    h(
                      "div",
                      { style: { ...css.muted, fontSize: 13 } },
                      `找到 ${results.count ?? results.results?.length ?? 0} 条结果`,
                    ),
                    ...(results.results || []).map((item) =>
                      h(
                        "article",
                        { key: item.id, style: { ...css.panel, padding: 16 } },
                        h(
                          "button",
                          {
                            type: "button",
                            onClick: () =>
                              run({ action: "read", id: item.id }, setDocument),
                            style: {
                              border: 0,
                              padding: 0,
                              background: "transparent",
                              color: "var(--dsw-static-blue-400,#60a5fa)",
                              font: "inherit",
                              fontWeight: 650,
                              cursor: "pointer",
                              textAlign: "left",
                            },
                          },
                          item.title || item.id,
                        ),
                        h(
                          "div",
                          {
                            style: { ...css.muted, fontSize: 12, marginTop: 6 },
                          },
                          item.id,
                        ),
                        h(
                          "p",
                          { style: { margin: "9px 0 0", fontSize: 13 } },
                          item.snippet || item.summary || item.path || "",
                        ),
                      ),
                    ),
                  )
                : null,
              document
                ? h(
                    "article",
                    { style: css.panel, "aria-label": "知识正文" },
                    h(
                      "div",
                      {
                        style: {
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "start",
                        },
                      },
                      h(
                        "div",
                        null,
                        h(
                          "h2",
                          { style: { margin: "0 0 6px", fontSize: 20 } },
                          document.title,
                        ),
                        h(
                          "small",
                          { style: css.muted },
                          `${document.id} · 版本 ${document.knowledge_version ?? "—"}`,
                        ),
                      ),
                      document.truncated
                        ? action("继续阅读", () =>
                            run(
                              {
                                action: "read",
                                id: document.id,
                                offset: document.next_offset,
                              },
                              (v) =>
                                setDocument({
                                  ...v,
                                  content: document.content + v.content,
                                }),
                            ),
                          )
                        : null,
                    ),
                    h(
                      "pre",
                      {
                        style: {
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                          fontFamily: "var(--ds-font-family-code,monospace)",
                          lineHeight: 1.7,
                          fontSize: 13,
                          margin: "18px 0 0",
                        },
                      },
                      document.content,
                    ),
                  )
                : null,
            ),
          )
        : null,
      tab === "logs"
        ? h(
            "div",
            { style: { display: "grid", gap: 12 } },
            h(
              "div",
              {
                style: {
                  ...css.panel,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                },
              },
              h("strong", null, "个人调用日志"),
              h(
                "span",
                { style: css.muted },
                `第 ${page} 页 · 共 ${logs?.total ?? 0} 条`,
              ),
              action("刷新", () => loadLogs(page)),
              action("上一页", () => loadLogs(page - 1), page <= 1),
              action(
                "下一页",
                () => loadLogs(page + 1),
                !logs || page * 10 >= logs.total,
              ),
            ),
            h(
              "p",
              { style: { ...css.muted, fontSize: 13, margin: "-2px 0 0" } },
              "仅显示当前个人 Key 有权查看的记录。",
            ),
            logs?.logs?.length === 0
              ? h("div", { style: css.panel }, "暂无调用记录。")
              : null,
            ...(logs?.logs || []).map((log) =>
              h(
                "button",
                {
                  type: "button",
                  className: "tkb-log-row",
                  key: log.id,
                  onClick: () => run({ action: "call", id: log.id }, setDetail),
                  style: {
                    ...css.panel,
                    color: "inherit",
                    font: "inherit",
                    textAlign: "left",
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(150px,.35fr) minmax(0,1fr) auto",
                    gap: 12,
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "13px 16px",
                  },
                },
                h(
                  "div",
                  null,
                  h("strong", { style: { fontSize: 13 } }, log.operation),
                  h(
                    "div",
                    null,
                    h(
                      "span",
                      {
                        className: "tkb-pill",
                        "data-failed": log.status_code >= 400,
                      },
                      `HTTP ${log.status_code}`,
                    ),
                  ),
                ),
                h(
                  "span",
                  {
                    className: "tkb-log-summary",
                    style: { ...css.muted, fontSize: 13 },
                  },
                  log.result_summary || log.request_summary || "知识调用",
                ),
                h(
                  "small",
                  { style: { ...css.muted, textAlign: "right", fontSize: 11 } },
                  new Date(log.ts * 1000).toLocaleString(),
                  h("br"),
                  `${Math.round(log.duration_ms)} ms →`,
                ),
              ),
            ),
            detail
              ? h(
                  "aside",
                  { style: css.panel, "aria-label": "调用详情" },
                  h(
                    "div",
                    {
                      style: {
                        display: "flex",
                        justifyContent: "space-between",
                      },
                    },
                    h("strong", null, "调用详情"),
                    action("关闭", () => setDetail(null)),
                  ),
                  h(
                    "pre",
                    {
                      style: {
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        fontFamily: "var(--ds-font-family-code,monospace)",
                        fontSize: 12,
                      },
                    },
                    JSON.stringify(detail, null, 2),
                  ),
                )
              : null,
          )
        : null,
    ),
  );
}
export function WorkbenchIcon() {
  return h(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: 20,
      height: 20,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.7,
      "aria-hidden": true,
    },
    h("path", {
      d: "M3 5c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1V5Zm9 1v15",
    }),
  );
}
