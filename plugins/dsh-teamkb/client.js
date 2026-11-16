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

// plugins/dsh-teamkb/workbench-client.js
var import_react = __toESM(require("react"), 1);
var h = import_react.default.createElement;
var button = { padding: "8px 14px", border: "1px solid #80808055", borderRadius: 8, background: "transparent", color: "inherit", cursor: "pointer" };
var card = { border: "1px solid #80808044", borderRadius: 12, padding: 18, marginBottom: 12 };
var inputStyle = { ...button, width: "100%", boxSizing: "border-box" };
function Workbench({ query, Settings }) {
  const [tab, setTab] = (0, import_react.useState)("search");
  const [categories, setCategories] = (0, import_react.useState)([]);
  const [category, setCategory] = (0, import_react.useState)("");
  const [text, setText] = (0, import_react.useState)("");
  const [stats, setStats] = (0, import_react.useState)(null);
  const [results, setResults] = (0, import_react.useState)(null);
  const [document, setDocument] = (0, import_react.useState)(null);
  const [logs, setLogs] = (0, import_react.useState)(null);
  const [detail, setDetail] = (0, import_react.useState)(null);
  const [page, setPage] = (0, import_react.useState)(1);
  const [error, setError] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)(false);
  const controller = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => () => controller.current?.abort(), []);
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
      if (!abort.signal.aborted) setError(e.message || "Harness \u5BBF\u4E3B\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  const btn = (label, onClick, props = {}) => h("button", { type: "button", style: button, onClick, disabled: busy, ...props }, label);
  const loadLogs = (number) => run({ action: "calls", page: number }, (value) => {
    setLogs(value);
    setPage(number);
    setDetail(null);
  });
  return h(
    "section",
    { style: { padding: 24, maxWidth: 1040, margin: "0 auto", height: "100%", overflowY: "auto", boxSizing: "border-box" } },
    h("header", { style: { marginBottom: 24 } }, h("h1", null, "TeamKB \u5DE5\u4F5C\u53F0"), h("p", null, "\u68C0\u7D22\u56E2\u961F\u77E5\u8BC6\u3001\u6838\u5BF9\u539F\u6587\uFF0C\u67E5\u770B\u5F53\u524D Key \u7684\u8C03\u7528\u8BB0\u5F55\u3002")),
    h(
      "nav",
      { "aria-label": "TeamKB \u529F\u80FD", style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 } },
      ...[["search", "\u77E5\u8BC6\u67E5\u8BE2"], ["logs", "\u8C03\u7528\u65E5\u5FD7"], ["settings", "\u8FDE\u63A5\u914D\u7F6E"]].map(([id, label]) => btn(label, () => {
        controller.current?.abort();
        setBusy(false);
        setError("");
        setTab(id);
        if (id === "logs") loadLogs(1);
      }, { key: id, "aria-pressed": tab === id, style: { ...button, background: tab === id ? "#2563eb" : "transparent", color: tab === id ? "white" : "inherit" } }))
    ),
    error ? h("p", { role: "alert", style: { ...card, color: "#d45454" } }, error) : null,
    busy ? h("p", { role: "status" }, "\u6B63\u5728\u901A\u8FC7\u5BBF\u4E3B\u67E5\u8BE2\u2026") : null,
    tab === "settings" ? h(Settings) : null,
    tab === "search" ? h(
      import_react.default.Fragment,
      null,
      h(
        "div",
        { style: card },
        h("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, btn("\u8FDE\u63A5\u6D4B\u8BD5 / \u7EDF\u8BA1", () => run({ action: "stats" }, setStats)), stats ? h("span", null, `\u6587\u6863 ${stats.documents} \xB7 \u8BCD\u6761 ${stats.terms ?? "\u2014"}`) : null),
        h("div", { style: { marginTop: 14 } }, btn("\u52A0\u8F7D\u5206\u7C7B", () => run({ action: "categories" }, (value) => setCategories(value.categories || []))), h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", maxHeight: 160, overflowY: "auto", marginTop: 10 }, "aria-label": "\u77E5\u8BC6\u5206\u7C7B" }, ...[{ id: "", path: "\u5168\u90E8\u5206\u7C7B" }, ...categories].map((item) => btn(item.path || item.name, () => setCategory(item.id), { key: item.id, "aria-pressed": category === item.id, style: { ...button, fontWeight: category === item.id ? 700 : 400 } })))),
        h(
          "form",
          { onSubmit: (e) => {
            e.preventDefault();
            setDocument(null);
            run({ action: "search", query: text, category_id: category }, setResults);
          }, style: { display: "flex", gap: 8, marginTop: 14 } },
          h("input", { style: inputStyle, "aria-label": "\u77E5\u8BC6\u5173\u952E\u8BCD", placeholder: "\u8F93\u5165\u5173\u952E\u8BCD\u641C\u7D22\u77E5\u8BC6", value: text, onChange: (e) => setText(e.target.value), required: true, maxLength: 500 }),
          h("button", { style: button, disabled: busy, type: "submit" }, "\u641C\u7D22")
        )
      ),
      results ? h("div", null, h("p", null, `\u627E\u5230 ${results.count ?? results.results?.length ?? 0} \u6761\u7ED3\u679C`), ...(results.results || []).map((item) => h("article", { key: item.id, style: card }, h("h3", null, btn(item.title || item.id, () => run({ action: "read", id: item.id }, setDocument))), h("small", null, item.id), h("p", null, item.snippet || item.summary || item.path || "")))) : null,
      document ? h("article", { style: card, "aria-label": "\u77E5\u8BC6\u6B63\u6587" }, h("h2", null, document.title), h("small", null, `${document.id} \xB7 \u7248\u672C ${document.knowledge_version ?? "\u2014"}`), h("pre", { style: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit", lineHeight: 1.8 } }, document.content), document.truncated ? btn("\u7EE7\u7EED\u9605\u8BFB", () => run({ action: "read", id: document.id, offset: document.next_offset }, (value) => setDocument({ ...value, content: document.content + value.content }))) : null) : null
    ) : null,
    tab === "logs" ? h(
      "div",
      null,
      h("div", { style: { display: "flex", gap: 8, marginBottom: 16 } }, btn("\u5237\u65B0\u65E5\u5FD7", () => loadLogs(page)), btn("\u4E0A\u4E00\u9875", () => loadLogs(page - 1), { disabled: busy || page <= 1 }), h("span", null, `\u7B2C ${page} \u9875 \xB7 \u5171 ${logs?.total ?? 0} \u6761`), btn("\u4E0B\u4E00\u9875", () => loadLogs(page + 1), { disabled: busy || !logs || page * 10 >= logs.total })),
      h("p", null, "\u6309\u5F53\u524D\u4E2A\u4EBA Key \u9694\u79BB\uFF1B\u65E5\u5FD7\u4FDD\u7559\u671F\u9650\u4E0E\u670D\u52A1\u7AEF\u4E00\u81F4\u3002"),
      logs?.logs?.length === 0 ? h("p", null, "\u6682\u65E0\u8C03\u7528\u8BB0\u5F55\u3002") : null,
      ...(logs?.logs || []).map((log) => h("article", { style: card, key: log.id }, h("div", null, btn(`${log.operation} \xB7 HTTP ${log.status_code}`, () => run({ action: "call", id: log.id }, setDetail))), h("small", null, `${new Date(log.ts * 1e3).toLocaleString()} \xB7 ${Math.round(log.duration_ms)} ms`), h("p", null, log.request_summary), h("p", null, log.result_summary))),
      detail ? h("article", { style: card, "aria-label": "\u8C03\u7528\u8BE6\u60C5" }, h("h3", null, "\u8C03\u7528\u8BE6\u60C5"), h("pre", { style: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } }, JSON.stringify(detail, null, 2))) : null
    ) : null
  );
}
function WorkbenchIcon() {
  return h("svg", { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.7, "aria-hidden": true }, h("path", { d: "M3 5c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1V5Zm9 1v15" }));
}

// plugins/dsh-teamkb/client-source.js
var import_react2 = __toESM(require("react"), 1);
var name = "teamkb-settings";
var inject = ["slots", "configForms", "connection"];
var h2 = import_react2.default.createElement;
var style = { display: "grid", gap: 16, maxWidth: 640, padding: 20 };
function TeamKBSettings({ form, view }) {
  const [url, setUrl] = (0, import_react2.useState)(null);
  const [key, setKey] = (0, import_react2.useState)("");
  const [clearKey, setClearKey] = (0, import_react2.useState)(false);
  const [contribute, setContribute] = (0, import_react2.useState)(null);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [message, setMessage] = (0, import_react2.useState)("");
  if (view === "summary") return "\u56E2\u961F\u77E5\u8BC6\u68C0\u7D22\u3001\u89C4\u8303\u4E0E\u5DF2\u9A8C\u8BC1\u7ECF\u9A8C\u6C89\u6DC0";
  const state = form?.state;
  const value = state?.value ?? {};
  async function save(event) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setMessage("");
    const ops = [];
    if (url !== null) ops.push({ op: "set", path: ["serverUrl"], value: url.trim() });
    if (contribute !== null) ops.push({ op: "set", path: ["allowContributions"], value: contribute });
    if (clearKey || key) ops.push({ op: "set", path: ["apiKey"], value: clearKey ? "" : key.trim() });
    try {
      const result = await form.mutate(ops, state.revision);
      if (result === false) throw new Error("\u4FDD\u5B58\u88AB\u62D2\u7EDD");
      setKey("");
      setClearKey(false);
      setUrl(null);
      setContribute(null);
      setMessage("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002\u65B0\u5EFA\u4F1A\u8BDD\uFF0C\u7528 kb_stats \u6D4B\u8BD5\u771F\u5B9E\u8FDE\u63A5\uFF1B\u4FDD\u5B58\u6210\u529F\u4E0D\u4EE3\u8868\u8054\u7F51\u6210\u529F\u3002");
    } catch {
      setMessage("\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u63D2\u4EF6\u8BBE\u7F6E\u5E76\u91CD\u8BD5\uFF1B\u672A\u8986\u76D6\u5176\u4ED6\u914D\u7F6E\u3002");
    } finally {
      setBusy(false);
    }
  }
  const field = (title, input) => h2("label", { style: { display: "grid", gap: 8 } }, title, input);
  return h2(
    "form",
    { style, onSubmit: save },
    h2("h3", null, "TeamKB \u56E2\u961F\u77E5\u8BC6\u5E93"),
    h2("p", null, "Desktop \u4E0E Web \u5171\u7528\u5BBF\u4E3B\u8FDE\u63A5\uFF1B\u65E0\u9700 Python\u3001MCP \u6216\u9879\u76EE\u521D\u59CB\u5316\u3002"),
    field("\u670D\u52A1\u5730\u5740", h2("input", { type: "url", value: url ?? value.serverUrl ?? "https://www.ljc.monster", onChange: (e) => setUrl(e.target.value), required: true })),
    field("\u4E2A\u4EBA API Key", h2("input", { type: "password", autoComplete: "new-password", value: key, onChange: (e) => {
      setKey(e.target.value);
      setClearKey(false);
    }, placeholder: "\u7559\u7A7A\u4FDD\u7559\u5DF2\u6709 Key\uFF1B\u5BBF\u4E3B\u4E5F\u53EF\u4F7F\u7528 TEAMKB_KEY" })),
    field("\u6E05\u9664\u5DF2\u4FDD\u5B58\u7684 Key\uFF08\u6E05\u9664\u540E\u53EF\u8BFB\u53D6\u5BBF\u4E3B\u73AF\u5883\u53D8\u91CF\uFF09", h2("input", { type: "checkbox", checked: clearKey, onChange: (e) => {
      setClearKey(e.target.checked);
      setKey("");
    } })),
    field("\u4EFB\u52A1\u5B8C\u6210\u540E\u5141\u8BB8\u6309\u9700\u63D0\u4EA4\u5DF2\u9A8C\u8BC1\u77E5\u8BC6\uFF08\u9700\u8981 writer \u6743\u9650\uFF09", h2("input", { type: "checkbox", checked: contribute ?? value.allowContributions ?? false, onChange: (e) => setContribute(e.target.checked) })),
    h2("p", null, "\u63D0\u4EA4\u9ED8\u8BA4\u5F85\u7BA1\u7406\u5458\u5BA1\u6838\uFF1B\u4EC5\u4E0A\u4F20\u8131\u654F\u3001\u5DF2\u9A8C\u8BC1\u4E14\u53EF\u590D\u7528\u7684\u77E5\u8BC6\u3002Key \u901A\u8FC7 Harness \u7684 secret \u914D\u7F6E\u5B57\u6BB5\u4FDD\u5B58\uFF0C\u4E0D\u5199\u5165\u6D4F\u89C8\u5668 localStorage\u3002\u8FDC\u7A0B Web \u7528\u6237\u8BF7\u4F7F\u7528\u5404\u81EA\u72EC\u7ACB\u7684 Harness profile\u3002"),
    h2("button", { type: "submit", disabled: busy || !state?.writable }, busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u8BBE\u7F6E"),
    h2("p", { role: "status" }, message),
    h2("a", { href: "https://www.ljc.monster/#/guide", target: "_blank", rel: "noreferrer" }, "\u4F7F\u7528\u8BF4\u660E")
  );
}
function apply(ctx) {
  const controller = ctx.configForms.get("teamkb");
  const subscribe = (listener) => controller.subscribe(listener);
  const snapshot = () => controller.getSnapshot();
  function BundleSettings(props) {
    const state = (0, import_react2.useSyncExternalStore)(subscribe, snapshot, snapshot);
    return h2(TeamKBSettings, { ...props, form: { state, mutate: (ops, revision) => controller.mutate(ops, revision) } });
  }
  const query = async (input, signal) => {
    const result = await ctx.connection.rpc.call("/api", "teamkb/query", input, signal);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  };
  ctx.slots.inject("main", () => ctx.slots.register({
    name: "main",
    key: "teamkb-workbench",
    inject: () => ({ query, Settings: BundleSettings })
  }, Workbench));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
    name: "sidebar.panellist",
    id: "teamkb-workbench",
    order: 15,
    label: () => "TeamKB \u77E5\u8BC6\u5E93"
  }, WorkbenchIcon));
  ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
    name: "plugins.bundle.config",
    key: "dsh-teamkb"
  }, BundleSettings));
  ctx.slots.inject("plugins.row.config", () => ctx.slots.register({
    name: "plugins.row.config",
    key: "dsh-teamkb#teamkb"
  }, TeamKBSettings));
}

return module.exports;}});
