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
var import_react = __toESM(require("react"), 1);
var name = "teamkb-settings";
var inject = ["slots", "configForms"];
var h = import_react.default.createElement;
var style = { display: "grid", gap: 16, maxWidth: 640, padding: 20 };
function TeamKBSettings({ form, view }) {
  const [url, setUrl] = (0, import_react.useState)(null);
  const [key, setKey] = (0, import_react.useState)("");
  const [clearKey, setClearKey] = (0, import_react.useState)(false);
  const [contribute, setContribute] = (0, import_react.useState)(null);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [message, setMessage] = (0, import_react.useState)("");
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
  const field = (title, input) => h("label", { style: { display: "grid", gap: 8 } }, title, input);
  return h(
    "form",
    { style, onSubmit: save },
    h("h3", null, "TeamKB \u56E2\u961F\u77E5\u8BC6\u5E93"),
    h("p", null, "Desktop \u4E0E Web \u5171\u7528\u5BBF\u4E3B\u8FDE\u63A5\uFF1B\u65E0\u9700 Python\u3001MCP \u6216\u9879\u76EE\u521D\u59CB\u5316\u3002"),
    field("\u670D\u52A1\u5730\u5740", h("input", { type: "url", value: url ?? value.serverUrl ?? "https://www.ljc.monster", onChange: (e) => setUrl(e.target.value), required: true })),
    field("\u4E2A\u4EBA API Key", h("input", { type: "password", autoComplete: "new-password", value: key, onChange: (e) => {
      setKey(e.target.value);
      setClearKey(false);
    }, placeholder: "\u7559\u7A7A\u4FDD\u7559\u5DF2\u6709 Key\uFF1B\u5BBF\u4E3B\u4E5F\u53EF\u4F7F\u7528 TEAMKB_KEY" })),
    field("\u6E05\u9664\u5DF2\u4FDD\u5B58\u7684 Key\uFF08\u6E05\u9664\u540E\u53EF\u8BFB\u53D6\u5BBF\u4E3B\u73AF\u5883\u53D8\u91CF\uFF09", h("input", { type: "checkbox", checked: clearKey, onChange: (e) => {
      setClearKey(e.target.checked);
      setKey("");
    } })),
    field("\u4EFB\u52A1\u5B8C\u6210\u540E\u5141\u8BB8\u6309\u9700\u63D0\u4EA4\u5DF2\u9A8C\u8BC1\u77E5\u8BC6\uFF08\u9700\u8981 writer \u6743\u9650\uFF09", h("input", { type: "checkbox", checked: contribute ?? value.allowContributions ?? false, onChange: (e) => setContribute(e.target.checked) })),
    h("p", null, "\u63D0\u4EA4\u9ED8\u8BA4\u5F85\u7BA1\u7406\u5458\u5BA1\u6838\uFF1B\u4EC5\u4E0A\u4F20\u8131\u654F\u3001\u5DF2\u9A8C\u8BC1\u4E14\u53EF\u590D\u7528\u7684\u77E5\u8BC6\u3002Key \u901A\u8FC7 Harness \u7684 secret \u914D\u7F6E\u5B57\u6BB5\u4FDD\u5B58\uFF0C\u4E0D\u5199\u5165\u6D4F\u89C8\u5668 localStorage\u3002\u8FDC\u7A0B Web \u7528\u6237\u8BF7\u4F7F\u7528\u5404\u81EA\u72EC\u7ACB\u7684 Harness profile\u3002"),
    h("button", { type: "submit", disabled: busy || !state?.writable }, busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u8BBE\u7F6E"),
    h("p", { role: "status" }, message),
    h("a", { href: "https://www.ljc.monster/#/guide", target: "_blank", rel: "noreferrer" }, "\u4F7F\u7528\u8BF4\u660E")
  );
}
function apply(ctx) {
  const controller = ctx.configForms.get("teamkb");
  const subscribe = (listener) => controller.subscribe(listener);
  const snapshot = () => controller.getSnapshot();
  function BundleSettings(props) {
    const state = (0, import_react.useSyncExternalStore)(subscribe, snapshot, snapshot);
    return h(TeamKBSettings, { ...props, form: { state, mutate: (ops, revision) => controller.mutate(ops, revision) } });
  }
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
