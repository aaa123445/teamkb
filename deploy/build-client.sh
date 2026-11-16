#!/usr/bin/env bash
# Publish versioned client and skill bundles matching the deployed source.
set -euo pipefail
APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
CLIENT_PYTHON=${CLIENT_PYTHON:-"$APP_DIR/.venv/bin/python"}
CLIENT_BUILD_DIR=$(mktemp -d)
trap 'rm -rf "$CLIENT_BUILD_DIR"' EXIT
"$CLIENT_PYTHON" -m pip wheel "$APP_DIR" --no-deps --wheel-dir "$CLIENT_BUILD_DIR" --quiet
mkdir -p "$APP_DIR/web/public/downloads"
cp "$CLIENT_BUILD_DIR"/*.whl "$APP_DIR/web/public/downloads/"
bash "$APP_DIR/deploy/build-dsh-plugin.sh"
"$CLIENT_PYTHON" - "$APP_DIR" <<'PY'
import hashlib
import json
import sys
import zipfile
from pathlib import Path
root=Path(sys.argv[1]);target=root/'web/public/downloads'
with zipfile.ZipFile(target/'team-knowledge-0.5.6.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for path in sorted((root/'skill/team-knowledge').rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts:
            archive.write(path,path.relative_to(root/'skill'))
(target/'install-teamkb-0.5.6.py').write_bytes((root/'deploy/client/install.py').read_bytes())
(target/'agent-instructions-0.5.6.md').write_bytes((root/'skill/team-knowledge/references/agent-instructions.md').read_bytes())
(target/'install-teamkb-0.5.6.sh').write_bytes((root/'deploy/client/install.sh').read_bytes())
files={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in target.iterdir() if p.suffix in {'.whl','.zip','.py','.md','.sh','.tgz'}}
(target/'manifest.json').write_text(json.dumps({'version':'0.5.6','sha256':files},indent=2)+'\n')
PY
