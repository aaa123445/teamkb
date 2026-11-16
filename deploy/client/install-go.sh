#!/usr/bin/env bash
# Bash 3.2 compatible. Only curl + a SHA-256 utility are required.
set -eu
TEAMKB_SITE=${TEAMKB_URL:-https://www.ljc.monster}
TEAMKB_VERSION=0.6.0
TEAMKB_AGENT=${1:-codex}
TEAMKB_MODE=${2:-cli}
TEAMKB_SCOPE=${3:-user}
if [ "$#" -gt 0 ]; then shift; fi
if [ "$#" -gt 0 ]; then shift; fi
if [ "$#" -gt 0 ]; then shift; fi
# Preserve options for the Go installer, but determine its download origin first.
TEAMKB_WANT_URL=0
for TEAMKB_ARG in "$@"; do
  if [ "$TEAMKB_WANT_URL" -eq 1 ]; then TEAMKB_SITE=$TEAMKB_ARG; TEAMKB_WANT_URL=0; fi
  case "$TEAMKB_ARG" in --url) TEAMKB_WANT_URL=1 ;; --url=*) TEAMKB_SITE=${TEAMKB_ARG#--url=} ;; esac
done
TEAMKB_SITE=${TEAMKB_SITE%/}
case "$TEAMKB_SITE" in https://*|http://*) ;; *) echo '无效的服务地址' >&2; exit 1 ;; esac
case "$TEAMKB_AGENT" in codex|claude|claudecode|other) ;; *) echo 'Agent 须为 codex、claudecode 或 other' >&2; exit 1 ;; esac
case "$TEAMKB_MODE" in cli|mcp|recommended|skill) ;; *) echo '不支持的安装模式' >&2; exit 1 ;; esac
case "$TEAMKB_SCOPE" in user|project) ;; *) echo '范围须为 user 或 project' >&2; exit 1 ;; esac
case "$(uname -s)" in Darwin) TEAMKB_OS=darwin ;; Linux) TEAMKB_OS=linux ;; *) echo '此系统请使用 PowerShell 安装器' >&2; exit 1 ;; esac
case "$(uname -m)" in arm64|aarch64) TEAMKB_ARCH=arm64 ;; x86_64|amd64) TEAMKB_ARCH=amd64 ;; *) echo '暂不支持此 CPU 架构' >&2; exit 1 ;; esac
command -v curl >/dev/null 2>&1 || { echo '请先安装 curl' >&2; exit 1; }
if command -v sha256sum >/dev/null 2>&1; then TEAMKB_HASH=sha256sum
elif command -v shasum >/dev/null 2>&1; then TEAMKB_HASH=shasum
elif command -v openssl >/dev/null 2>&1; then TEAMKB_HASH=openssl
else echo '请安装 sha256sum、shasum 或 openssl' >&2; exit 1; fi
printf '[环境检测] %s/%s；原生 Go 客户端，无需 Python / Node\n' "$TEAMKB_OS" "$TEAMKB_ARCH"
TEAMKB_TMP=$(mktemp -d)
trap 'rm -rf "$TEAMKB_TMP"' EXIT
teamkb_download() {
  TEAMKB_TRY=0
  while [ "$TEAMKB_TRY" -lt 4 ]; do
    if curl --http1.1 --connect-timeout 15 --max-time 180 -fsSL "$1" -o "$2"; then return 0; fi
    TEAMKB_TRY=$((TEAMKB_TRY + 1))
    if [ "$TEAMKB_TRY" -lt 4 ]; then sleep "$TEAMKB_TRY"; fi
  done
  echo '下载失败，已有限重试；请检查代理、网络和系统 TLS 证书。未关闭证书校验。' >&2
  return 1
}
TEAMKB_FILE=teamkb-${TEAMKB_VERSION}-${TEAMKB_OS}-${TEAMKB_ARCH}
teamkb_download "$TEAMKB_SITE/static/downloads/go-manifest.json" "$TEAMKB_TMP/manifest.json"
TEAMKB_SHA=$(sed -n 's/^[[:space:]]*"'"$TEAMKB_FILE"'"[[:space:]]*:[[:space:]]*"\([a-f0-9]*\)".*/\1/p' "$TEAMKB_TMP/manifest.json")
case "$TEAMKB_SHA" in ''|*[!a-f0-9]*) echo '站点缺少原生客户端校验信息' >&2; exit 1 ;; esac
[ "${#TEAMKB_SHA}" -eq 64 ] || { echo 'SHA-256 校验信息无效' >&2; exit 1; }
teamkb_download "$TEAMKB_SITE/static/downloads/$TEAMKB_FILE?sha256=$TEAMKB_SHA" "$TEAMKB_TMP/teamkb"
case "$TEAMKB_HASH" in
 sha256sum) TEAMKB_ACTUAL=$(sha256sum "$TEAMKB_TMP/teamkb" | awk '{print $1}') ;;
 shasum) TEAMKB_ACTUAL=$(shasum -a 256 "$TEAMKB_TMP/teamkb" | awk '{print $1}') ;;
 openssl) TEAMKB_ACTUAL=$(openssl dgst -sha256 "$TEAMKB_TMP/teamkb" | awk '{print $NF}') ;;
esac
[ "$TEAMKB_ACTUAL" = "$TEAMKB_SHA" ] || { echo '客户端 SHA-256 不匹配，已停止；未写入凭据或 Agent 配置。' >&2; exit 1; }
chmod 700 "$TEAMKB_TMP/teamkb"
"$TEAMKB_TMP/teamkb" setup --agent "$TEAMKB_AGENT" --mode "$TEAMKB_MODE" --scope "$TEAMKB_SCOPE" --url "$TEAMKB_SITE" "$@"
