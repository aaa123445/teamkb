import React from "react";
const css = `
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
export function UIStyle() {
  return React.createElement("style", null, css);
}
