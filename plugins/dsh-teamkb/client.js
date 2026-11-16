window.__ModuleLoader__.load({id:"dsh-teamkb",factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// plugins/dsh-teamkb/client-source.js
var client_source_exports = {};
__export(client_source_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_source_exports);

// plugins/dsh-teamkb/ui-style.js
var import_react = __toESM(require("react"), 1);
var css = `
.teamkb-ui{font-size:14px;line-height:1.5;width:100%;min-width:0;box-sizing:border-box}
.teamkb-ui *,.teamkb-ui *:before,.teamkb-ui *:after{box-sizing:border-box}
.teamkb-ui h1,.teamkb-ui h2,.teamkb-ui h3,.teamkb-ui p{max-width:none}
.teamkb-ui button,.teamkb-ui input{font-family:inherit;line-height:1.4;min-width:0}
.teamkb-ui button{flex-shrink:0;white-space:nowrap;transition:background .15s,border-color .15s,box-shadow .15s}
.teamkb-ui button:hover:not(:disabled){filter:brightness(.95);box-shadow:0 0 0 1px var(--dsw-alias-border-l3,#80808033)}
.teamkb-ui button:disabled{opacity:.45;cursor:not-allowed}
.teamkb-ui button:focus-visible,.teamkb-ui input:focus-visible{outline:2px solid #60a5fa;outline-offset:3px}
.teamkb-ui input:focus{border-color:#60a5fa!important}
.teamkb-ui .tkb-directory-list button{text-overflow:ellipsis;overflow:hidden;text-align:left;width:100%;display:block}
.teamkb-ui .tkb-directory input{width:100%}
.teamkb-ui .tkb-directory{min-width:0}
.teamkb-ui .tkb-entry{min-width:0;overflow-wrap:anywhere}
.teamkb-ui .tkb-log-summary{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-width:0}
.teamkb-ui .tkb-log-row:hover{background:var(--dsw-alias-bg-layer-2,#8080800b)!important}
.teamkb-ui .tkb-tab:hover{background:var(--dsw-alias-bg-layer-2,#8080800b)!important}
.teamkb-ui .tkb-pill{display:inline-flex;align-items:center;gap:6px;border-radius:6px;padding:3px 7px;font-size:11px;background:#22c55e15;color:light-dark(#16733c,#73db9b);border:1px solid #22c55e30}
.teamkb-ui .tkb-pill[data-failed=true]{background:#ef444415;color:light-dark(#b42332,#f89696);border-color:#ef444430}
@container teamkb (max-width:720px){.teamkb-ui .tkb-search-layout{grid-template-columns:minmax(0,1fr)!important}.teamkb-ui .tkb-directory{position:static!important}.teamkb-ui .tkb-directory-list{max-height:170px!important}.teamkb-ui .tkb-log-row{grid-template-columns:minmax(0,1fr) auto!important}.teamkb-ui .tkb-log-summary{grid-column:1/-1;grid-row:2}}
@media(prefers-reduced-motion:reduce){.teamkb-ui *{transition:none!important}}
`;
function UIStyle() {
  return import_react.default.createElement("style", null, css);
}

// plugins/dsh-teamkb/workbench-client.js
var import_react2 = __toESM(require("react"), 1);
var h = import_react2.default.createElement;
var css2 = {
  shell: {
    height: "100%",
    overflowY: "auto",
    boxSizing: "border-box",
    fontFamily: "var(--dsw-font-family,inherit)",
    color: "var(--dsw-alias-label-primary,inherit)",
    background: "var(--dsw-alias-bg-canvas,transparent)"
  },
  content: {
    width: "min(1180px,100%)",
    margin: "0 auto",
    padding: "30px clamp(20px,4vw,56px) 56px",
    boxSizing: "border-box"
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
    transition: "background .15s,border-color .15s"
  },
  panel: {
    border: "1px solid var(--dsw-alias-border-l4,#80808033)",
    borderRadius: 14,
    background: "var(--dsw-alias-bg-layer-1,transparent)",
    padding: 20
  },
  input: {
    minHeight: 42,
    padding: "0 13px",
    border: "1px solid var(--dsw-alias-border-l3,#80808055)",
    borderRadius: 8,
    background: "var(--dsw-alias-bg-layer-2,transparent)",
    color: "inherit",
    font: "inherit",
    boxSizing: "border-box"
  },
  muted: { color: "var(--dsw-alias-label-secondary,#929292)" }
};
var action = (label, onClick, disabled = false, active = false) => h(
  "button",
  {
    type: "button",
    onClick,
    disabled,
    style: {
      ...css2.button,
      ...active ? {
        background: "var(--dsw-static-blue-500,#3b82f6)",
        borderColor: "var(--dsw-static-blue-500,#3b82f6)",
        color: "#fff"
      } : {}
    }
  },
  label
);
function Workbench({ query, Settings }) {
  const [tab, setTab] = (0, import_react2.useState)("search"), [categories, setCategories] = (0, import_react2.useState)([]), [category, setCategory] = (0, import_react2.useState)(""), [categoryFilter, setCategoryFilter] = (0, import_react2.useState)(""), [text, setText] = (0, import_react2.useState)(""), [stats, setStats] = (0, import_react2.useState)(null), [results, setResults] = (0, import_react2.useState)(null), [document, setDocument] = (0, import_react2.useState)(null), [logs, setLogs] = (0, import_react2.useState)(null), [detail, setDetail] = (0, import_react2.useState)(null), [page, setPage] = (0, import_react2.useState)(1), [error, setError] = (0, import_react2.useState)(""), [busy, setBusy] = (0, import_react2.useState)(false);
  const controller = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => () => controller.current?.abort(), []);
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
      if (!abort.signal.aborted) setError(e.message || "\u5BBF\u4E3B\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  const loadLogs = (n) => run({ action: "calls", page: n }, (v) => {
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
  const visibleCategories = categories.filter(
    (x) => (x.path || x.name || "").toLowerCase().includes(categoryFilter.toLowerCase())
  );
  return h(
    "section",
    {
      className: "teamkb-ui",
      style: {
        ...css2.shell,
        containerType: "inline-size",
        containerName: "teamkb"
      }
    },
    h(UIStyle),
    h(
      "div",
      { style: css2.content },
      h(
        "header",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            alignItems: "flex-start",
            marginBottom: 24,
            flexWrap: "wrap"
          }
        },
        h(
          "div",
          null,
          h(
            "div",
            {
              style: {
                ...css2.muted,
                fontSize: 12,
                letterSpacing: ".08em",
                textTransform: "uppercase"
              }
            },
            "Team knowledge workspace"
          ),
          h(
            "h1",
            {
              style: {
                fontSize: "clamp(24px,3vw,32px)",
                lineHeight: 1.15,
                margin: "7px 0 8px",
                fontWeight: 700
              }
            },
            "TeamKB \u5DE5\u4F5C\u53F0"
          ),
          h(
            "p",
            { style: { ...css2.muted, margin: 0, fontSize: 15 } },
            "\u68C0\u7D22\u56E2\u961F\u77E5\u8BC6\uFF0C\u6838\u5BF9\u539F\u6587\uFF0C\u8FFD\u8E2A\u4E2A\u4EBA\u8C03\u7528\u3002"
          )
        ),
        stats ? h(
          "div",
          { style: { ...css2.panel, padding: "12px 16px", minWidth: 180 } },
          h("div", { style: { ...css2.muted, fontSize: 12 } }, "\u77E5\u8BC6\u5E93\u89C4\u6A21"),
          h(
            "strong",
            { style: { fontSize: 21 } },
            `${stats.documents ?? "\u2014"} \u7BC7`
          ),
          h(
            "div",
            { style: { ...css2.muted, fontSize: 12 } },
            `${stats.terms ?? "\u2014"} \u4E2A\u8BCD\u6761`
          )
        ) : null
      ),
      h(
        "nav",
        {
          "aria-label": "TeamKB \u529F\u80FD",
          style: {
            display: "flex",
            gap: 6,
            borderBottom: "1px solid var(--dsw-alias-border-l4,#80808033)",
            marginBottom: 20
          }
        },
        ...[
          ["search", "\u77E5\u8BC6\u67E5\u8BE2"],
          ["logs", "\u8C03\u7528\u65E5\u5FD7"],
          ["settings", "\u8FDE\u63A5\u914D\u7F6E"]
        ].map(
          ([id, label]) => h(
            "button",
            {
              type: "button",
              onClick: () => switchTab(id),
              "aria-pressed": tab === id,
              className: "tkb-tab",
              key: id,
              style: {
                ...css2.button,
                border: "0",
                borderRadius: "8px 8px 0 0",
                background: "transparent",
                minHeight: 42,
                color: tab === id ? "var(--dsw-static-blue-400,#60a5fa)" : "inherit",
                borderBottom: tab === id ? "2px solid var(--dsw-static-blue-400,#60a5fa)" : "2px solid transparent"
              }
            },
            label
          )
        )
      ),
      error ? h(
        "div",
        {
          role: "alert",
          style: {
            ...css2.panel,
            color: "var(--dsw-static-red-400,#f87171)",
            marginBottom: 16
          }
        },
        error
      ) : null,
      busy ? h(
        "div",
        { role: "status", style: { ...css2.muted, marginBottom: 12 } },
        "\u6B63\u5728\u901A\u8FC7\u5BBF\u4E3B\u67E5\u8BE2\u2026"
      ) : null,
      tab === "settings" ? h(Settings) : null,
      tab === "search" ? h(
        "div",
        {
          className: "tkb-search-layout",
          style: {
            display: "grid",
            gridTemplateColumns: "minmax(190px,230px) minmax(0,1fr)",
            gap: 16,
            alignItems: "start"
          }
        },
        h(
          "aside",
          {
            className: "tkb-directory",
            style: {
              ...css2.panel,
              display: "grid",
              gap: 12,
              position: "sticky",
              top: 0
            }
          },
          h(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }
            },
            h("strong", { style: { whiteSpace: "nowrap" } }, "\u77E5\u8BC6\u5206\u7C7B"),
            action(
              "\u5237\u65B0",
              () => run(
                { action: "categories" },
                (v) => setCategories(v.categories || [])
              )
            )
          ),
          h("input", {
            style: css2.input,
            "aria-label": "\u7B5B\u9009\u5206\u7C7B",
            placeholder: "\u7B5B\u9009\u5206\u7C7B",
            value: categoryFilter,
            onChange: (e) => setCategoryFilter(e.target.value)
          }),
          h(
            "div",
            {
              className: "tkb-directory-list",
              style: {
                display: "grid",
                gap: 4,
                maxHeight: 440,
                overflowY: "auto"
              }
            },
            action("\u5168\u90E8\u77E5\u8BC6", () => setCategory(""), false, !category),
            ...visibleCategories.map(
              (item) => h(
                "button",
                {
                  type: "button",
                  key: item.id,
                  title: item.path || item.name,
                  "aria-pressed": category === item.id,
                  onClick: () => setCategory(item.id),
                  style: {
                    ...css2.button,
                    textAlign: "left",
                    paddingLeft: 10 + Math.min(
                      4,
                      (item.path || "").split(" / ").length - 1
                    ) * 10,
                    minHeight: 34,
                    padding: "0 10px",
                    fontSize: 13,
                    background: category === item.id ? "var(--dsw-static-blue-500,#3b82f6)" : "transparent",
                    color: category === item.id ? "#fff" : "inherit"
                  }
                },
                item.name || item.path
              )
            )
          )
        ),
        h(
          "div",
          { className: "tkb-entry", style: { display: "grid", gap: 16 } },
          h(
            "div",
            { style: css2.panel },
            h(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 12,
                  flexWrap: "wrap"
                }
              },
              h(
                "strong",
                null,
                selectedCategory ? `\u641C\u7D22 \xB7 ${selectedCategory.name || selectedCategory.path}` : "\u641C\u7D22\u77E5\u8BC6"
              ),
              action("\u8FDE\u63A5\u6D4B\u8BD5", () => run({ action: "stats" }, setStats))
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
                      category_id: category
                    },
                    setResults
                  );
                },
                style: {
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 8
                }
              },
              h("input", {
                style: css2.input,
                "aria-label": "\u77E5\u8BC6\u5173\u952E\u8BCD",
                placeholder: "\u8F93\u5165\u5173\u952E\u8BCD\uFF0C\u4F8B\u5982\uFF1A\u63A5\u53E3\u8D85\u65F6\u3001\u90E8\u7F72\u89C4\u8303",
                value: text,
                onChange: (e) => setText(e.target.value),
                required: true,
                maxLength: 500
              }),
              h(
                "button",
                {
                  type: "submit",
                  style: {
                    ...css2.button,
                    background: "var(--dsw-static-blue-500,#3b82f6)",
                    borderColor: "var(--dsw-static-blue-500,#3b82f6)",
                    color: "#fff"
                  },
                  disabled: busy
                },
                "\u641C\u7D22"
              )
            )
          ),
          !results && !document ? h(
            "div",
            {
              style: {
                ...css2.panel,
                padding: "48px 24px",
                textAlign: "center",
                borderStyle: "dashed"
              }
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
                  placeItems: "center"
                }
              },
              h(WorkbenchIcon)
            ),
            h(
              "h2",
              { style: { fontSize: 17, margin: "0 0 7px" } },
              "\u4ECE\u4E00\u4E2A\u95EE\u9898\u5F00\u59CB"
            ),
            h(
              "p",
              { style: { ...css2.muted, fontSize: 13, margin: 0 } },
              "\u641C\u7D22\u89E3\u51B3\u65B9\u6848\u3001\u5F00\u53D1\u89C4\u8303\u6216\u6280\u672F\u6587\u6863\u3002\u9009\u62E9\u5206\u7C7B\u53EF\u4EE5\u7F29\u5C0F\u8303\u56F4\u3002"
            )
          ) : null,
          results ? h(
            "div",
            { style: { display: "grid", gap: 8 } },
            h(
              "div",
              { style: { ...css2.muted, fontSize: 13 } },
              `\u627E\u5230 ${results.count ?? results.results?.length ?? 0} \u6761\u7ED3\u679C`
            ),
            ...(results.results || []).map(
              (item) => h(
                "article",
                { key: item.id, style: { ...css2.panel, padding: 16 } },
                h(
                  "button",
                  {
                    type: "button",
                    onClick: () => run({ action: "read", id: item.id }, setDocument),
                    style: {
                      border: 0,
                      padding: 0,
                      background: "transparent",
                      color: "var(--dsw-static-blue-400,#60a5fa)",
                      font: "inherit",
                      fontWeight: 650,
                      cursor: "pointer",
                      textAlign: "left"
                    }
                  },
                  item.title || item.id
                ),
                h(
                  "div",
                  {
                    style: { ...css2.muted, fontSize: 12, marginTop: 6 }
                  },
                  item.id
                ),
                h(
                  "p",
                  { style: { margin: "9px 0 0", fontSize: 13 } },
                  item.snippet || item.summary || item.path || ""
                )
              )
            )
          ) : null,
          document ? h(
            "article",
            { style: css2.panel, "aria-label": "\u77E5\u8BC6\u6B63\u6587" },
            h(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "start"
                }
              },
              h(
                "div",
                null,
                h(
                  "h2",
                  { style: { margin: "0 0 6px", fontSize: 20 } },
                  document.title
                ),
                h(
                  "small",
                  { style: css2.muted },
                  `${document.id} \xB7 \u7248\u672C ${document.knowledge_version ?? "\u2014"}`
                )
              ),
              document.truncated ? action(
                "\u7EE7\u7EED\u9605\u8BFB",
                () => run(
                  {
                    action: "read",
                    id: document.id,
                    offset: document.next_offset
                  },
                  (v) => setDocument({
                    ...v,
                    content: document.content + v.content
                  })
                )
              ) : null
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
                  margin: "18px 0 0"
                }
              },
              document.content
            )
          ) : null
        )
      ) : null,
      tab === "logs" ? h(
        "div",
        { style: { display: "grid", gap: 12 } },
        h(
          "div",
          {
            style: {
              ...css2.panel,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap"
            }
          },
          h("strong", null, "\u4E2A\u4EBA\u8C03\u7528\u65E5\u5FD7"),
          h(
            "span",
            { style: css2.muted },
            `\u7B2C ${page} \u9875 \xB7 \u5171 ${logs?.total ?? 0} \u6761`
          ),
          action("\u5237\u65B0", () => loadLogs(page)),
          action("\u4E0A\u4E00\u9875", () => loadLogs(page - 1), page <= 1),
          action(
            "\u4E0B\u4E00\u9875",
            () => loadLogs(page + 1),
            !logs || page * 10 >= logs.total
          )
        ),
        h(
          "p",
          { style: { ...css2.muted, fontSize: 13, margin: "-2px 0 0" } },
          "\u4EC5\u663E\u793A\u5F53\u524D\u4E2A\u4EBA Key \u6709\u6743\u67E5\u770B\u7684\u8BB0\u5F55\u3002"
        ),
        logs?.logs?.length === 0 ? h("div", { style: css2.panel }, "\u6682\u65E0\u8C03\u7528\u8BB0\u5F55\u3002") : null,
        ...(logs?.logs || []).map(
          (log) => h(
            "button",
            {
              type: "button",
              className: "tkb-log-row",
              key: log.id,
              onClick: () => run({ action: "call", id: log.id }, setDetail),
              style: {
                ...css2.panel,
                color: "inherit",
                font: "inherit",
                textAlign: "left",
                display: "grid",
                gridTemplateColumns: "minmax(150px,.35fr) minmax(0,1fr) auto",
                gap: 12,
                alignItems: "center",
                cursor: "pointer",
                padding: "13px 16px"
              }
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
                    "data-failed": log.status_code >= 400
                  },
                  `HTTP ${log.status_code}`
                )
              )
            ),
            h(
              "span",
              {
                className: "tkb-log-summary",
                style: { ...css2.muted, fontSize: 13 }
              },
              log.result_summary || log.request_summary || "\u77E5\u8BC6\u8C03\u7528"
            ),
            h(
              "small",
              { style: { ...css2.muted, textAlign: "right", fontSize: 11 } },
              new Date(log.ts * 1e3).toLocaleString(),
              h("br"),
              `${Math.round(log.duration_ms)} ms \u2192`
            )
          )
        ),
        detail ? h(
          "aside",
          { style: css2.panel, "aria-label": "\u8C03\u7528\u8BE6\u60C5" },
          h(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "space-between"
              }
            },
            h("strong", null, "\u8C03\u7528\u8BE6\u60C5"),
            action("\u5173\u95ED", () => setDetail(null))
          ),
          h(
            "pre",
            {
              style: {
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                fontFamily: "var(--ds-font-family-code,monospace)",
                fontSize: 12
              }
            },
            JSON.stringify(detail, null, 2)
          )
        ) : null
      ) : null
    )
  );
}
function WorkbenchIcon() {
  return h(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: 20,
      height: 20,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.7,
      "aria-hidden": true
    },
    h("path", {
      d: "M3 5c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1V5Zm9 1v15"
    })
  );
}

// plugins/dsh-teamkb/client-source.js
var import_react3 = __toESM(require("react"), 1);
var name = "teamkb-settings";
var inject = ["slots", "configForms", "connection"];
var h2 = import_react3.default.createElement;
var palette = {
  fg: "var(--dsw-alias-label-primary, inherit)",
  muted: "var(--dsw-alias-label-secondary, #929292)",
  line: "var(--dsw-alias-border-l3, #80808055)",
  surface: "var(--dsw-alias-bg-layer-1, transparent)",
  input: "var(--dsw-alias-bg-layer-2, transparent)",
  accent: "var(--dsw-static-blue-500, #3b82f6)"
};
var formStyle = {
  display: "grid",
  gap: 14,
  width: "100%",
  maxWidth: 760,
  color: palette.fg
};
var textInput = {
  boxSizing: "border-box",
  width: "100%",
  minHeight: 40,
  padding: "9px 12px",
  border: `1px solid ${palette.line}`,
  borderRadius: 8,
  background: palette.input,
  color: palette.fg,
  font: "inherit"
};
var primaryButton = {
  minHeight: 40,
  padding: "0 18px",
  border: 0,
  borderRadius: 8,
  background: palette.accent,
  color: "#fff",
  font: "inherit",
  fontWeight: 600,
  cursor: "pointer"
};
function TeamKBSettings({ form, view }) {
  const [url, setUrl] = (0, import_react3.useState)(null);
  const [key, setKey] = (0, import_react3.useState)("");
  const [clearKey, setClearKey] = (0, import_react3.useState)(false);
  const [contribute, setContribute] = (0, import_react3.useState)(null);
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [message, setMessage] = (0, import_react3.useState)("");
  if (view === "summary") return "\u56E2\u961F\u77E5\u8BC6\u68C0\u7D22\u3001\u89C4\u8303\u4E0E\u5DF2\u9A8C\u8BC1\u7ECF\u9A8C\u6C89\u6DC0";
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
        value: clearKey ? "" : key.trim()
      });
    try {
      const result = await form.mutate(ops, state.revision);
      if (result === false) throw new Error("\u4FDD\u5B58\u88AB\u62D2\u7EDD");
      setKey("");
      setClearKey(false);
      setUrl(null);
      setContribute(null);
      setMessage(
        "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002\u65B0\u5EFA\u4F1A\u8BDD\uFF0C\u7528 kb_stats \u6D4B\u8BD5\u771F\u5B9E\u8FDE\u63A5\uFF1B\u4FDD\u5B58\u6210\u529F\u4E0D\u4EE3\u8868\u8054\u7F51\u6210\u529F\u3002"
      );
    } catch {
      setMessage("\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u63D2\u4EF6\u8BBE\u7F6E\u5E76\u91CD\u8BD5\uFF1B\u672A\u8986\u76D6\u5176\u4ED6\u914D\u7F6E\u3002");
    } finally {
      setBusy(false);
    }
  }
  const field = (title, input) => h2("label", { style: { display: "grid", gap: 8 } }, title, input);
  const settingSection = (title, description, ...children) => h2(
    "section",
    {
      style: {
        display: "grid",
        gap: 12,
        padding: 16,
        border: `1px solid ${palette.line}`,
        borderRadius: 10,
        background: palette.surface
      }
    },
    h2(
      "div",
      null,
      h2("strong", { style: { fontSize: 14 } }, title),
      description ? h2(
        "p",
        {
          style: {
            margin: "4px 0 0",
            color: palette.muted,
            fontSize: 12
          }
        },
        description
      ) : null
    ),
    ...children
  );
  const checkbox = (text, checked, onChange) => h2(
    "label",
    {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        lineHeight: 1.5,
        cursor: "pointer"
      }
    },
    h2("input", {
      type: "checkbox",
      checked,
      onChange,
      style: { marginTop: 4, accentColor: palette.accent }
    }),
    h2("span", null, text)
  );
  return h2(
    "form",
    {
      className: "teamkb-ui",
      style: { ...formStyle, containerType: "inline-size" },
      onSubmit: save
    },
    h2(UIStyle),
    h2(
      "header",
      null,
      h2("h2", { style: { margin: 0, fontSize: 22 } }, "\u8FDE\u63A5\u8BBE\u7F6E"),
      h2(
        "p",
        { style: { margin: "6px 0 0", color: palette.muted, fontSize: 13 } },
        "Desktop \u4E0E Web \u5171\u7528\u5BBF\u4E3B\u8FDE\u63A5\u3002"
      )
    ),
    settingSection(
      "\u670D\u52A1",
      "\u56E2\u961F\u77E5\u8BC6\u670D\u52A1\u7684 HTTP(S) \u6839\u5730\u5740\u3002",
      field(
        "\u670D\u52A1\u5730\u5740",
        h2("input", {
          style: textInput,
          type: "url",
          value: url ?? value.serverUrl ?? "https://www.ljc.monster",
          onChange: (e) => setUrl(e.target.value),
          required: true
        })
      )
    ),
    settingSection(
      "\u4E2A\u4EBA\u51ED\u636E",
      "\u4FDD\u5B58\u5728\u5F53\u524D Harness profile\uFF1B\u7559\u7A7A\u4FDD\u7559\u5F53\u524D\u51ED\u636E\u3002",
      field(
        "\u4E2A\u4EBA API Key",
        h2("input", {
          style: textInput,
          type: "password",
          autoComplete: "new-password",
          value: key,
          onChange: (e) => {
            setKey(e.target.value);
            setClearKey(false);
          },
          placeholder: "\u7559\u7A7A\u4FDD\u7559\u5F53\u524D Key"
        })
      ),
      checkbox(
        "\u6E05\u9664\u5DF2\u4FDD\u5B58\u7684 Key\uFF0C\u4E4B\u540E\u8BFB\u53D6\u5BBF\u4E3B\u73AF\u5883\u53D8\u91CF TEAMKB_KEY",
        clearKey,
        (e) => {
          setClearKey(e.target.checked);
          setKey("");
        }
      )
    ),
    settingSection(
      "\u77E5\u8BC6\u6C89\u6DC0",
      "\u63D0\u4EA4\u524D\u9700\u786E\u8BA4\u5185\u5BB9\u5DF2\u9A8C\u8BC1\u3001\u53EF\u590D\u7528\u5E76\u5B8C\u6210\u8131\u654F\u3002",
      checkbox(
        "\u5141\u8BB8 Agent \u5728\u4EFB\u52A1\u7ED3\u675F\u540E\u6309\u9700\u63D0\u4EA4\u77E5\u8BC6\uFF08\u9700\u8981 writer \u6743\u9650\uFF09",
        contribute ?? value.allowContributions ?? false,
        (e) => setContribute(e.target.checked)
      )
    ),
    h2(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap"
        }
      },
      h2(
        "button",
        {
          type: "submit",
          disabled: busy || !state?.writable,
          style: {
            ...primaryButton,
            opacity: busy || !state?.writable ? 0.55 : 1
          }
        },
        busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u8BBE\u7F6E"
      ),
      h2(
        "p",
        {
          role: "status",
          style: { margin: 0, color: palette.muted, fontSize: 12 }
        },
        message
      )
    ),
    h2(
      "a",
      {
        href: "https://www.ljc.monster/#/guide",
        target: "_blank",
        rel: "noreferrer",
        style: { color: "var(--dsw-static-blue-400, #60a5fa)", fontSize: 13 }
      },
      "\u4F7F\u7528\u8BF4\u660E"
    )
  );
}
function apply(ctx) {
  const controller = ctx.configForms.get("teamkb");
  const subscribe = (listener) => controller.subscribe(listener);
  const snapshot = () => controller.getSnapshot();
  function BundleSettings(props) {
    const state = (0, import_react3.useSyncExternalStore)(subscribe, snapshot, snapshot);
    return h2(TeamKBSettings, {
      ...props,
      form: {
        state,
        mutate: (ops, revision) => controller.mutate(ops, revision)
      }
    });
  }
  const query = async (input, signal) => {
    const result = await ctx.connection.rpc.call(
      "/api",
      "teamkb/query",
      input,
      signal
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  };
  ctx.slots.inject(
    "main",
    () => ctx.slots.register(
      {
        name: "main",
        key: "teamkb-workbench",
        inject: () => ({ query, Settings: BundleSettings })
      },
      Workbench
    )
  );
  ctx.slots.inject(
    "sidebar.panellist",
    () => ctx.slots.register(
      {
        name: "sidebar.panellist",
        id: "teamkb-workbench",
        order: 15,
        label: () => "TeamKB \u77E5\u8BC6\u5E93"
      },
      WorkbenchIcon
    )
  );
  ctx.slots.inject(
    "plugins.bundle.config",
    () => ctx.slots.register(
      {
        name: "plugins.bundle.config",
        key: "dsh-teamkb"
      },
      BundleSettings
    )
  );
  ctx.slots.inject(
    "plugins.row.config",
    () => ctx.slots.register(
      {
        name: "plugins.row.config",
        key: "dsh-teamkb#teamkb"
      },
      TeamKBSettings
    )
  );
}

return module.exports;}});
