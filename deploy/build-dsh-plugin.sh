#!/usr/bin/env bash
set -euo pipefail
APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# Browser module was prebuilt for Harness __ModuleLoader__; no client-side build on install.
mkdir -p "$APP_DIR/web/public/downloads"
npm pack "$APP_DIR/plugins/dsh-teamkb" --ignore-scripts --pack-destination "$APP_DIR/web/public/downloads" --quiet
"${CLIENT_PYTHON:-$APP_DIR/.venv/bin/python}" - "$APP_DIR" <<'PY'
import pathlib,json,hashlib,sys
root=pathlib.Path(sys.argv[1]);pkg=json.loads((root/'plugins/dsh-teamkb/package.json').read_text());dest=root/'web/public/downloads';name=f'dsh-teamkb-{pkg["version"]}.tgz'
m={'name':pkg['name'],'version':pkg['version'],'file':name,'sha256':hashlib.sha256((dest/name).read_bytes()).hexdigest(),'notes':'插件内检查更新与一键安装；安装后重启当前宿主生效。'}
p=dest/'dsh-release.json.tmp';p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');p.replace(dest/'dsh-release.json')
PY
