#!/usr/bin/env bash
set -euo pipefail
APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
GO_BIN=${GO_BIN:-go}
if ! command -v "$GO_BIN" >/dev/null 2>&1 && [ -x /opt/teamkb-toolchain/go/bin/go ]; then GO_BIN=/opt/teamkb-toolchain/go/bin/go; fi
BUILD_PYTHON=${CLIENT_PYTHON:-"$APP_DIR/.venv/bin/python"}
TARGET="$APP_DIR/web/public/downloads"
mkdir -p "$TARGET"
BUILD_DIR=$(mktemp -d)
export GOMAXPROCS=${GOMAXPROCS:-2}
trap 'rm -rf "$BUILD_DIR"' EXIT
cd "$APP_DIR/client-go"
"$GO_BIN" test ./...
for PLATFORM in linux/arm64 linux/amd64 darwin/arm64 darwin/amd64 windows/arm64 windows/amd64; do
  OS=${PLATFORM%/*}; ARCH=${PLATFORM#*/}; EXT=''
  if [ "$OS" = windows ]; then EXT=.exe; fi
  CGO_ENABLED=0 GOOS="$OS" GOARCH="$ARCH" "$GO_BIN" build -buildvcs=false -trimpath -ldflags='-s -w' -o "$BUILD_DIR/teamkb-0.6.0-$OS-$ARCH$EXT" ./cmd/teamkb
  printf 'Built %s\n' "$PLATFORM"
done
"$BUILD_PYTHON" - "$APP_DIR" "$BUILD_DIR" <<'PY'
import hashlib,json,sys,zipfile,shutil
from pathlib import Path
root,stage=map(Path,sys.argv[1:]); dest=root/'web/public/downloads'
# Native skill intentionally excludes legacy Python completion hooks.
with zipfile.ZipFile(stage/'team-knowledge-0.6.0.zip','w',zipfile.ZIP_DEFLATED) as z:
    for path in sorted((root/'skill/team-knowledge').rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts and path.suffix!='.py':
            z.write(path,path.relative_to(root/'skill'))
for src,name in [('skill/team-knowledge/references/agent-instructions.md','agent-instructions-0.6.0.md'),('deploy/client/install-go.sh','install-teamkb-0.6.0.sh'),('deploy/client/install-go.ps1','install-teamkb-0.6.0.ps1')]:
    shutil.copyfile(root/src,stage/name)
files={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in stage.iterdir() if p.is_file()}
# Existing versioned artifacts are immutable. Source changes require a new version.
for name,sha in files.items():
    p=dest/name
    if p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()!=sha:
        raise SystemExit(f'{name} already published with a different SHA; bump the native version')
for name in files: shutil.copyfile(stage/name,dest/name)
value={'version':'0.6.0','sha256':files}
p=dest/'go-manifest.json.tmp';p.write_text(json.dumps(value,indent=2)+'\n');p.replace(dest/'go-manifest.json')
# Preserve legacy packages for clients still on Python.
mf=dest/'manifest.json'
old=json.loads(mf.read_text()) if mf.exists() else {'version':'0.5.6','sha256':{}}
old['native_version']='0.6.0';old['sha256'].update(files)
p=dest/'manifest.json.tmp';p.write_text(json.dumps(old,indent=2)+'\n');p.replace(mf)
PY
