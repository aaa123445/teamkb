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
.teamkb-ui{--tkb-fg:var(--dsw-alias-label-primary,#202532);--tkb-muted:var(--dsw-alias-label-secondary,#737b8a);--tkb-line:var(--dsw-alias-border-l3,#dfe3e9);--tkb-bg:var(--dsw-alias-bg-base,#fff);--tkb-card:var(--dsw-alias-card-fill,var(--dsw-alias-bg-layer-1,#f7f8fa));--tkb-hover:var(--dsw-alias-interactive-bg-hover,#eef1f6);--tkb-accent:var(--dsw-static-deepseek-500,#4176e6);font-family:var(--dsw-font-family,system-ui,sans-serif);font-size:13px;line-height:1.5;color:var(--tkb-fg);min-width:0;box-sizing:border-box;text-align:start}
.teamkb-ui *,.teamkb-ui *::before,.teamkb-ui *::after{box-sizing:border-box;min-width:0}
.teamkb-ui :is(h1,h2,h3,p,pre){margin:0;max-width:none}.teamkb-ui h2{font-size:14px;font-weight:600}.teamkb-ui :is(button,input){font:inherit;color:inherit}.teamkb-ui button{cursor:pointer;line-height:1.4;transition:background .15s,color .15s,border-color .15s}.teamkb-ui button:disabled{cursor:not-allowed;opacity:.45}.teamkb-ui :is(button,input):focus-visible{outline:2px solid var(--tkb-accent);outline-offset:3px}.teamkb-ui input:not([type=checkbox]){width:100%;height:38px;padding:0 12px;border:1px solid var(--tkb-line);border-radius:8px;background:var(--tkb-bg);color:var(--tkb-fg);box-shadow:none}.teamkb-ui input::placeholder{color:var(--tkb-muted)}
.teamkb-ui.tkb-workbench{display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;background:var(--tkb-bg);container:teamkb / inline-size}.teamkb-ui .tkb-header{flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:24px clamp(16px,3vw,40px) 18px}.teamkb-ui .tkb-brand{display:flex;gap:12px;align-items:center}.teamkb-ui .tkb-brand-icon{display:grid;place-items:center;width:38px;height:38px;background:color-mix(in srgb,var(--tkb-accent) 10%,transparent);border-radius:11px;color:var(--tkb-accent);flex:none}.teamkb-ui .tkb-header h1{font-size:20px;font-weight:600;line-height:1.4;letter-spacing:-.4px}.teamkb-ui .tkb-header p{font-size:12px;color:var(--tkb-muted);margin-top:2px}.teamkb-ui .tkb-header-actions{display:flex;align-items:center;gap:14px}.teamkb-ui .tkb-stat{color:var(--tkb-muted);white-space:nowrap;font-size:12px}.teamkb-ui .tkb-stat strong{font-size:16px;color:var(--tkb-fg);font-variant-numeric:tabular-nums}
.teamkb-ui .tkb-button{display:inline-flex;align-items:center;justify-content:center;flex:none;min-height:34px;white-space:nowrap;padding:6px 13px;border:1px solid var(--tkb-line);background:var(--tkb-bg);border-radius:8px;font-size:12px;font-weight:500}.teamkb-ui .tkb-primary{background:var(--tkb-accent);border-color:var(--tkb-accent);color:#fff}.teamkb-ui .tkb-text-button{border:0;background:transparent;color:var(--tkb-muted);font-size:12px;padding:4px;border-radius:5px;white-space:nowrap}
.teamkb-ui .tkb-tabs{flex:none;display:flex;gap:24px;padding:0 clamp(16px,3vw,40px);border-bottom:1px solid var(--tkb-line)}.teamkb-ui .tkb-tabs button{padding:10px 0;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--tkb-muted);font-weight:500;white-space:nowrap}.teamkb-ui .tkb-tabs button[aria-pressed=true]{color:var(--tkb-fg);border-bottom-color:var(--tkb-accent)}.teamkb-ui .tkb-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-gutter:stable}.teamkb-ui .tkb-body{width:100%;max-width:1200px;margin:0 auto;padding:24px clamp(16px,3vw,40px) 40px}.teamkb-ui .tkb-search-layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:28px;align-items:start}.teamkb-ui .tkb-directory{position:sticky;top:0;display:grid;gap:12px}.teamkb-ui .tkb-section-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.teamkb-ui .tkb-directory .tkb-section-head{margin-bottom:0}.teamkb-ui .tkb-muted{color:var(--tkb-muted);font-size:12px}.teamkb-ui .tkb-directory-list{display:flex;flex-direction:column;gap:3px;max-height:min(58vh,520px);overflow-y:auto;overscroll-behavior:contain;padding-right:4px}.teamkb-ui .tkb-directory-list button{display:flex;justify-content:space-between;align-items:center;gap:8px;flex:none;width:100%;padding:8px 12px;text-align:left;border:0;border-radius:7px;background:transparent;font-size:12px;line-height:20px}.teamkb-ui .tkb-directory-list button>span:last-child:not(:first-child){color:var(--tkb-muted);font-variant-numeric:tabular-nums}.teamkb-ui .tkb-category-name{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.teamkb-ui .tkb-directory-list button[aria-pressed=true]{background:color-mix(in srgb,var(--tkb-accent) 10%,var(--tkb-bg));color:var(--tkb-accent);font-weight:600}
.teamkb-ui .tkb-entry{display:grid;gap:20px}.teamkb-ui .tkb-search-card{padding:18px;border:1px solid var(--tkb-line);border-radius:12px;background:var(--tkb-card)}.teamkb-ui .tkb-search-form{display:flex;gap:8px}.teamkb-ui .tkb-search-form input{flex:1;width:0;height:40px}.teamkb-ui .tkb-search-form .tkb-button{min-width:66px}.teamkb-ui .tkb-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:66px 20px;color:var(--tkb-muted)}.teamkb-ui .tkb-empty-icon{display:grid;place-items:center;width:48px;height:48px;background:var(--tkb-card);border:1px solid var(--tkb-line);border-radius:14px;margin-bottom:18px}.teamkb-ui .tkb-empty h2{font-size:15px;color:var(--tkb-fg);margin-bottom:8px}.teamkb-ui .tkb-empty p{font-size:12px;line-height:1.8}.teamkb-ui .tkb-results-heading{color:var(--tkb-muted);font-size:12px;margin-bottom:8px}.teamkb-ui .tkb-results{border:1px solid var(--tkb-line);border-radius:12px;overflow:hidden}.teamkb-ui .tkb-result{display:flex;flex-direction:column;gap:8px;text-align:left;width:100%;padding:18px;background:transparent;border:0;border-bottom:1px solid var(--tkb-line)}.teamkb-ui .tkb-result:last-child{border-bottom:0}.teamkb-ui .tkb-result-title{display:flex;justify-content:space-between;gap:12px;width:100%;font-size:14px;font-weight:600;overflow-wrap:anywhere}.teamkb-ui .tkb-result-title>span{color:var(--tkb-muted)}.teamkb-ui .tkb-result-summary{color:var(--tkb-muted);font-size:12px;overflow-wrap:anywhere}.teamkb-ui .tkb-result-id{color:var(--tkb-muted);font-size:11px;overflow-wrap:anywhere}.teamkb-ui .tkb-document{padding:20px;border:1px solid var(--tkb-line);border-radius:12px}.teamkb-ui .tkb-document>h2{font-size:20px;margin-bottom:8px}.teamkb-ui pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.8 var(--ds-font-family-code,monospace);margin:20px 0}.teamkb-ui .tkb-settings{max-width:720px;margin:0 auto}.teamkb-ui .tkb-settings>.teamkb-ui{width:100%}
.teamkb-ui .tkb-logs{max-width:960px;margin:auto}.teamkb-ui .tkb-logs>.tkb-section-head p{margin-top:4px}.teamkb-ui .tkb-log-list{border:1px solid var(--tkb-line);border-radius:12px;overflow:hidden}.teamkb-ui .tkb-log-row{display:grid;grid-template-columns:minmax(110px,.35fr) minmax(0,1fr) auto;align-items:center;gap:16px;padding:16px;width:100%;background:transparent;border:0;border-bottom:1px solid var(--tkb-line);text-align:left}.teamkb-ui .tkb-log-row:last-child{border-bottom:0}.teamkb-ui .tkb-log-operation{display:grid;justify-items:start;gap:6px;font-size:12px;font-weight:600}.teamkb-ui .tkb-log-summary{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;color:var(--tkb-muted);font-size:12px}.teamkb-ui .tkb-log-time{color:var(--tkb-muted);font-size:11px;text-align:right}.teamkb-ui .tkb-pill{font-size:10px;font-weight:500;border-radius:5px;padding:2px 6px;background:color-mix(in srgb,var(--tkb-accent) 10%,transparent);color:var(--tkb-accent)}.teamkb-ui .tkb-pill[data-failed=true]{color:var(--dsw-static-red-500,#dc4545);background:#ef444415}.teamkb-ui .tkb-pagination{display:flex;align-items:center;justify-content:space-between;margin-top:16px;gap:12px}.teamkb-ui .tkb-pagination>div{display:flex;gap:6px}.teamkb-ui .tkb-detail{margin-top:20px;padding:18px;border:1px solid var(--tkb-line);border-radius:12px}.teamkb-ui .tkb-alert{border:1px solid #ef444440;background:#ef44440c;border-radius:8px;padding:12px 14px;margin-bottom:16px;color:var(--dsw-static-red-500,#dc4545);overflow-wrap:anywhere}.teamkb-ui .tkb-loading{display:flex;align-items:center;gap:8px;margin-bottom:12px;color:var(--tkb-muted);font-size:12px}.teamkb-ui .tkb-loading>span{width:6px;height:6px;border-radius:50%;background:var(--tkb-accent)}
.teamkb-ui .tkb-detail-dialog{position:fixed;inset:0;margin:auto;width:min(760px,calc(100vw - 32px));height:min(680px,calc(100dvh - 48px));max-width:none;max-height:none;padding:0;border:1px solid var(--tkb-line);border-radius:14px;background:var(--tkb-bg);color:var(--tkb-fg);box-shadow:0 20px 70px #0005;overflow:hidden}.teamkb-ui .tkb-detail-dialog[open]{display:flex;flex-direction:column}.teamkb-ui .tkb-detail-dialog::backdrop{background:rgb(0 0 0 / 42%)}.teamkb-ui .tkb-detail-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid var(--tkb-line)}.teamkb-ui .tkb-detail-head p{margin-top:3px}.teamkb-ui .tkb-detail-body{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:16px 20px}.teamkb-ui .tkb-detail-body pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
@media(hover:hover){.teamkb-ui :is(.tkb-button:not(.tkb-primary),.tkb-text-button,.tkb-result,.tkb-log-row,.tkb-directory-list button):hover:not(:disabled){background:var(--tkb-hover)}.teamkb-ui .tkb-primary:hover:not(:disabled){filter:brightness(.94)}}
@container teamkb (max-width:700px){.teamkb-ui .tkb-search-layout{grid-template-columns:minmax(0,1fr);gap:20px}.teamkb-ui .tkb-directory{position:static}.teamkb-ui .tkb-directory-list{max-height:150px}.teamkb-ui .tkb-header{padding-top:18px}.teamkb-ui .tkb-header h1{font-size:18px}.teamkb-ui .tkb-stat{display:none}.teamkb-ui .tkb-log-row{grid-template-columns:minmax(0,1fr) auto}.teamkb-ui .tkb-log-summary{grid-row:2;grid-column:1/-1}.teamkb-ui .tkb-empty{padding:40px 12px}}
@media(pointer:coarse){.teamkb-ui input:not([type=checkbox]){font-size:16px}}
@media(prefers-reduced-motion:reduce){.teamkb-ui *{transition:none!important}}
`;
function UIStyle() {
  return import_react.default.createElement("style", null, css);
}

// plugins/dsh-teamkb/workbench-client.jsx
var import_react2 = __toESM(require("react"), 1);
function WorkbenchIcon() {
  return /* @__PURE__ */ import_react2.default.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: "20",
      height: "20",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.7",
      "aria-hidden": "true"
    },
    /* @__PURE__ */ import_react2.default.createElement("path", { d: "M3 5c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1V5Zm9 1v15" })
  );
}
function LogDetail({ value, onClose }) {
  const dialog = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    const node = dialog.current;
    const previousFocus = document.activeElement;
    node.showModal();
    return () => {
      if (node.open) node.close();
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return /* @__PURE__ */ import_react2.default.createElement(
    "dialog",
    {
      ref: dialog,
      className: "tkb-detail-dialog",
      "aria-labelledby": "tkb-detail-title",
      onCancel: (event) => {
        event.preventDefault();
        onClose();
      },
      onClick: (event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
          onClose();
      }
    },
    /* @__PURE__ */ import_react2.default.createElement("header", { className: "tkb-detail-head" }, /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("h2", { id: "tkb-detail-title" }, "\u8C03\u7528\u8BE6\u60C5"), /* @__PURE__ */ import_react2.default.createElement("p", { className: "tkb-muted" }, "\u8BB0\u5F55 #", value.id ?? "\u2014")), /* @__PURE__ */ import_react2.default.createElement(Button, { onClick: onClose, autoFocus: true }, "\u5173\u95ED")),
    /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-detail-body" }, /* @__PURE__ */ import_react2.default.createElement("pre", null, JSON.stringify(value, null, 2)))
  );
}
var Button = ({ children, primary = false, ...props }) => /* @__PURE__ */ import_react2.default.createElement(
  "button",
  {
    type: "button",
    className: `tkb-button${primary ? " tkb-primary" : ""}`,
    ...props
  },
  children
);
function Workbench({ query, Settings }) {
  const [tab, setTab] = (0, import_react2.useState)("search"), [categories, setCategories] = (0, import_react2.useState)([]), [category, setCategory] = (0, import_react2.useState)(""), [filter, setFilter] = (0, import_react2.useState)(""), [text, setText] = (0, import_react2.useState)(""), [stats, setStats] = (0, import_react2.useState)(null), [results, setResults] = (0, import_react2.useState)(null), [doc, setDoc] = (0, import_react2.useState)(null), [logs, setLogs] = (0, import_react2.useState)(null), [detail, setDetail] = (0, import_react2.useState)(null), [page, setPage] = (0, import_react2.useState)(1), [error, setError] = (0, import_react2.useState)(""), [busy, setBusy] = (0, import_react2.useState)(false);
  const controller = (0, import_react2.useRef)(null);
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
  (0, import_react2.useEffect)(() => {
    run({ action: "categories" }, (v) => setCategories(v.categories || []));
    return () => controller.current?.abort();
  }, []);
  const loadLogs = (n) => run({ action: "calls", page: n }, (v) => {
    setLogs(v);
    setPage(n);
    setDetail(null);
  });
  function switchTab(id) {
    controller.current?.abort();
    setBusy(false);
    setError("");
    setTab(id);
    if (id === "logs" && !logs) loadLogs(1);
  }
  const selected = categories.find((x) => x.id === category), visible = categories.filter(
    (x) => (x.path || x.name || "").toLowerCase().includes(filter.toLowerCase())
  );
  return /* @__PURE__ */ import_react2.default.createElement("section", { className: "teamkb-ui tkb-workbench", "aria-label": "TeamKB \u5DE5\u4F5C\u53F0" }, /* @__PURE__ */ import_react2.default.createElement(UIStyle, null), /* @__PURE__ */ import_react2.default.createElement("header", { className: "tkb-header" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-brand" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-brand-icon" }, /* @__PURE__ */ import_react2.default.createElement(WorkbenchIcon, null)), /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("h1", null, "TeamKB \u5DE5\u4F5C\u53F0"), /* @__PURE__ */ import_react2.default.createElement("p", null, "\u56E2\u961F\u77E5\u8BC6\uFF0C\u968F\u624B\u53EF\u5F97"))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-header-actions" }, stats && /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-stat" }, /* @__PURE__ */ import_react2.default.createElement("strong", null, stats.documents ?? "\u2014"), " \u7BC7\u6587\u6863"), /* @__PURE__ */ import_react2.default.createElement(
    Button,
    {
      onClick: () => run({ action: "stats" }, setStats),
      disabled: busy
    },
    "\u8FDE\u63A5\u6D4B\u8BD5"
  ))), /* @__PURE__ */ import_react2.default.createElement("nav", { className: "tkb-tabs", "aria-label": "TeamKB \u529F\u80FD" }, [
    ["search", "\u77E5\u8BC6\u67E5\u8BE2"],
    ["logs", "\u8C03\u7528\u65E5\u5FD7"],
    ["settings", "\u8FDE\u63A5\u914D\u7F6E"]
  ].map(([id, label]) => /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      key: id,
      type: "button",
      "aria-pressed": tab === id,
      onClick: () => switchTab(id)
    },
    label
  ))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-scroll" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-body" }, error && /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-alert", role: "alert" }, error), busy && /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-loading", role: "status" }, /* @__PURE__ */ import_react2.default.createElement("span", null), "\u6B63\u5728\u67E5\u8BE2\u2026"), tab === "settings" && /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-settings" }, /* @__PURE__ */ import_react2.default.createElement(Settings, null)), tab === "search" && /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-search-layout" }, /* @__PURE__ */ import_react2.default.createElement("aside", { className: "tkb-directory" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-section-head" }, /* @__PURE__ */ import_react2.default.createElement("h2", null, "\u77E5\u8BC6\u5206\u7C7B"), /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      className: "tkb-text-button",
      type: "button",
      disabled: busy,
      onClick: () => run(
        { action: "categories" },
        (v) => setCategories(v.categories || [])
      )
    },
    "\u5237\u65B0"
  )), /* @__PURE__ */ import_react2.default.createElement(
    "input",
    {
      "aria-label": "\u7B5B\u9009\u5206\u7C7B",
      placeholder: "\u67E5\u627E\u5206\u7C7B\u2026",
      value: filter,
      onChange: (e) => setFilter(e.target.value)
    }
  ), /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-directory-list" }, /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      "aria-pressed": !category,
      onClick: () => {
        setCategory("");
        setDoc(null);
        setResults(null);
      }
    },
    "\u5168\u90E8\u77E5\u8BC6",
    /* @__PURE__ */ import_react2.default.createElement("span", null, categories.length)
  ), visible.map((item) => /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      key: item.id,
      title: item.path || item.name,
      "aria-pressed": category === item.id,
      style: {
        paddingInlineStart: 12 + Math.min(
          3,
          Math.max(
            0,
            (item.path || "").split(" / ").length - 1
          )
        ) * 10
      },
      onClick: () => {
        setCategory(item.id);
        setDoc(null);
        setResults(null);
      }
    },
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-category-name" }, item.name || item.path),
    item.doc_count != null && /* @__PURE__ */ import_react2.default.createElement("span", null, item.doc_count)
  )), filter && !visible.length && /* @__PURE__ */ import_react2.default.createElement("p", { className: "tkb-muted" }, "\u6CA1\u6709\u5339\u914D\u7684\u5206\u7C7B"))), /* @__PURE__ */ import_react2.default.createElement("main", { className: "tkb-entry" }, /* @__PURE__ */ import_react2.default.createElement("section", { className: "tkb-search-card" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-section-head" }, /* @__PURE__ */ import_react2.default.createElement("h2", null, selected ? selected.name || selected.path : "\u641C\u7D22\u56E2\u961F\u77E5\u8BC6"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-muted" }, "\u5173\u952E\u8BCD\u68C0\u7D22")), /* @__PURE__ */ import_react2.default.createElement(
    "form",
    {
      className: "tkb-search-form",
      onSubmit: (e) => {
        e.preventDefault();
        setDoc(null);
        run(
          {
            action: "search",
            query: text,
            category_id: category
          },
          setResults
        );
      }
    },
    /* @__PURE__ */ import_react2.default.createElement(
      "input",
      {
        "aria-label": "\u77E5\u8BC6\u5173\u952E\u8BCD",
        placeholder: "\u641C\u7D22\u89E3\u51B3\u65B9\u6848\u3001\u5F00\u53D1\u89C4\u8303\u3001\u6280\u672F\u6587\u6863\u2026",
        value: text,
        onChange: (e) => setText(e.target.value),
        required: true,
        maxLength: 500
      }
    ),
    /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        type: "submit",
        className: "tkb-button tkb-primary",
        disabled: busy
      },
      "\u641C\u7D22"
    )
  )), !results && !doc && /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-empty" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-empty-icon" }, /* @__PURE__ */ import_react2.default.createElement(WorkbenchIcon, null)), /* @__PURE__ */ import_react2.default.createElement("h2", null, "\u8BA9\u7ECF\u9A8C\u6210\u4E3A\u4E0B\u4E00\u6B21\u7684\u7B54\u6848"), /* @__PURE__ */ import_react2.default.createElement("p", null, "\u8F93\u5165\u5173\u952E\u8BCD\uFF0C\u4ECE\u56E2\u961F\u5DF2\u7ECF\u9A8C\u8BC1\u7684\u77E5\u8BC6\u5F00\u59CB\u3002", /* @__PURE__ */ import_react2.default.createElement("br", null), "\u5DE6\u4FA7\u5206\u7C7B\u5E2E\u52A9\u4F60\u7F29\u5C0F\u641C\u7D22\u8303\u56F4\u3002")), results && !doc && /* @__PURE__ */ import_react2.default.createElement("section", { "aria-label": "\u641C\u7D22\u7ED3\u679C" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-results-heading" }, "\u627E\u5230 ", results.count ?? results.results?.length ?? 0, " ", "\u6761\u7ED3\u679C"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-results" }, (results.results || []).map((item) => /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      key: item.id,
      className: "tkb-result",
      onClick: () => run({ action: "read", id: item.id }, setDoc)
    },
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-result-title" }, item.title || item.id, /* @__PURE__ */ import_react2.default.createElement("span", { "aria-hidden": "true" }, "\u2197")),
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-result-summary" }, item.snippet || item.summary || item.path || "\u67E5\u770B\u6587\u6863\u539F\u6587"),
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-result-id" }, item.id)
  ))), !results.results?.length && /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-empty" }, /* @__PURE__ */ import_react2.default.createElement("h2", null, "\u6CA1\u6709\u627E\u5230\u76F8\u5173\u77E5\u8BC6"), /* @__PURE__ */ import_react2.default.createElement("p", null, "\u6362\u4E00\u7EC4\u5173\u952E\u8BCD\uFF0C\u6216\u9009\u62E9\u5176\u4ED6\u5206\u7C7B\u518D\u8BD5\u3002"))), doc && /* @__PURE__ */ import_react2.default.createElement("article", { className: "tkb-document", "aria-label": "\u77E5\u8BC6\u6B63\u6587" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-section-head" }, /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      className: "tkb-text-button",
      onClick: () => setDoc(null)
    },
    "\u2190 \u8FD4\u56DE\u7ED3\u679C"
  ), /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-muted" }, "\u7248\u672C ", doc.knowledge_version ?? "\u2014")), /* @__PURE__ */ import_react2.default.createElement("h2", null, doc.title), /* @__PURE__ */ import_react2.default.createElement("p", { className: "tkb-result-id" }, doc.id), /* @__PURE__ */ import_react2.default.createElement("pre", null, doc.content), doc.truncated && /* @__PURE__ */ import_react2.default.createElement(
    Button,
    {
      onClick: () => run(
        {
          action: "read",
          id: doc.id,
          offset: doc.next_offset
        },
        (v) => setDoc({
          ...v,
          content: doc.content + v.content
        })
      ),
      disabled: busy
    },
    "\u7EE7\u7EED\u9605\u8BFB"
  )))), tab === "logs" && /* @__PURE__ */ import_react2.default.createElement("section", { className: "tkb-logs" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-section-head" }, /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("h2", null, "\u4E2A\u4EBA\u8C03\u7528\u8BB0\u5F55"), /* @__PURE__ */ import_react2.default.createElement("p", { className: "tkb-muted" }, "\u4EC5\u663E\u793A\u5F53\u524D\u4E2A\u4EBA Key \u6709\u6743\u67E5\u770B\u7684\u8BB0\u5F55")), /* @__PURE__ */ import_react2.default.createElement(Button, { onClick: () => loadLogs(page), disabled: busy }, "\u5237\u65B0")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-log-list" }, logs?.logs?.length === 0 && /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-empty" }, /* @__PURE__ */ import_react2.default.createElement("h2", null, "\u6682\u65E0\u8C03\u7528\u8BB0\u5F55"), /* @__PURE__ */ import_react2.default.createElement("p", null, "\u68C0\u7D22\u6216\u9605\u8BFB\u77E5\u8BC6\u540E\uFF0C\u53EF\u5728\u8FD9\u91CC\u67E5\u770B\u8C03\u7528\u7ED3\u679C\u3002")), (logs?.logs || []).map((log) => /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      className: "tkb-log-row",
      key: log.id,
      "aria-haspopup": "dialog",
      onClick: () => run({ action: "call", id: log.id }, setDetail)
    },
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-log-operation" }, log.operation, /* @__PURE__ */ import_react2.default.createElement(
      "span",
      {
        className: "tkb-pill",
        "data-failed": log.status_code >= 400
      },
      "HTTP ",
      log.status_code
    )),
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-log-summary" }, log.result_summary || log.request_summary || "\u77E5\u8BC6\u8C03\u7528"),
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-log-time" }, new Date(log.ts * 1e3).toLocaleString(), /* @__PURE__ */ import_react2.default.createElement("br", null), Math.round(log.duration_ms), " ms \u2192")
  ))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "tkb-pagination" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "tkb-muted" }, "\u7B2C ", page, " \u9875 \xB7 \u5171 ", logs?.total ?? 0, " \u6761"), /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement(
    Button,
    {
      onClick: () => loadLogs(page - 1),
      disabled: busy || page <= 1
    },
    "\u4E0A\u4E00\u9875"
  ), /* @__PURE__ */ import_react2.default.createElement(
    Button,
    {
      onClick: () => loadLogs(page + 1),
      disabled: busy || !logs || page * 10 >= logs.total
    },
    "\u4E0B\u4E00\u9875"
  ))), detail && /* @__PURE__ */ import_react2.default.createElement(LogDetail, { value: detail, onClose: () => setDetail(null) })))));
}

// plugins/dsh-teamkb/client-source.js
var import_react3 = __toESM(require("react"), 1);
var name = "teamkb-settings";
var inject = ["slots", "configForms", "connection"];
var h = import_react3.default.createElement;
var palette = {
  fg: "var(--dsw-alias-label-primary, inherit)",
  muted: "var(--dsw-alias-label-secondary, #929292)",
  line: "var(--dsw-alias-border-l3, #80808055)",
  surface: "var(--dsw-alias-card-fill, var(--dsw-alias-bg-layer-1, #f7f8fa))",
  input: "var(--dsw-alias-bg-base, #fff)",
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
  const field = (title, input) => h("label", { style: { display: "grid", gap: 8 } }, title, input);
  const settingSection = (title, description, ...children) => h(
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
    h(
      "div",
      null,
      h("strong", { style: { fontSize: 14 } }, title),
      description ? h(
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
  const checkbox = (text, checked, onChange) => h(
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
    h("input", {
      type: "checkbox",
      checked,
      onChange,
      style: { marginTop: 4, accentColor: palette.accent }
    }),
    h("span", null, text)
  );
  return h(
    "form",
    {
      className: "teamkb-ui",
      style: { ...formStyle, containerType: "inline-size" },
      onSubmit: save
    },
    h(UIStyle),
    h(
      "header",
      null,
      h("h2", { style: { margin: 0, fontSize: 22 } }, "\u8FDE\u63A5\u8BBE\u7F6E"),
      h(
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
        h("input", {
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
        h("input", {
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
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap"
        }
      },
      h(
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
      h(
        "p",
        {
          role: "status",
          style: { margin: 0, color: palette.muted, fontSize: 12 }
        },
        message
      )
    ),
    h(
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
    return h(TeamKBSettings, {
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
