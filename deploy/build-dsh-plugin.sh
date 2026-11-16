#!/usr/bin/env bash
set -euo pipefail
APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# Browser module was prebuilt for Harness __ModuleLoader__; no client-side build on install.
mkdir -p "$APP_DIR/web/public/downloads"
npm pack "$APP_DIR/plugins/dsh-teamkb" --ignore-scripts --pack-destination "$APP_DIR/web/public/downloads" --quiet
