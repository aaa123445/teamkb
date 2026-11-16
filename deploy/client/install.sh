#!/usr/bin/env bash
# TeamKB bootstrap: inspect environment before installing anything.
set -euo pipefail
origin='https://www.ljc.monster'
agent=''
check_only=false
# Short form: bash install.sh codex cli user [--check-only]
if [[ "${1:-}" == codex || "${1:-}" == claudecode ]]; then
  selected_agent="$1"; shift
  selected_mode="${1:-cli}"
  if (($#)); then shift; fi
  selected_scope="${1:-user}"
  if (($#)) && [[ "$1" != --* ]]; then shift; else selected_scope=user; fi
  set -- --agent "$selected_agent" --mode "$selected_mode" --scope "$selected_scope" "$@"
fi
args=("$@")
while (($#)); do
  case "$1" in
    --url) origin="${2:?缺少服务地址}"; shift 2 ;;
    --agent) agent="${2:?缺少智能体名称}"; shift 2 ;;
    --check-only) check_only=true; shift ;;
    *) shift ;;
  esac
done
args+=(--url "$origin")
printf '[环境检测] 操作系统：%s；架构：%s\n' "$(uname -s)" "$(uname -m)"
command -v curl >/dev/null || { echo '缺少 curl，请先安装 curl。' >&2; exit 1; }
python_cmd=''
for candidate in python3.14 python3.13 python3.12 python3.11 python3 python; do
  if command -v "$candidate" >/dev/null && "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)' 2>/dev/null; then
    python_cmd="$candidate"
    break
  fi
done
[[ -n "$python_cmd" ]] || { echo '未找到 Python 3.11+。请先安装新版 Python，再重新运行；无需修改系统默认 Python。' >&2; exit 1; }
printf '[环境检测] Python：%s\n' "$("$python_cmd" --version)"
"$python_cmd" -c 'import venv,ensurepip,ssl; print("[环境检测] venv、ensurepip、TLS：正常")' || { echo '缺少 venv/ensurepip；Debian/Ubuntu 请安装对应版本 python3-venv。' >&2; exit 1; }
case "$agent" in
  codex) agent_cmd=codex ;;
  claudecode) agent_cmd=claude ;;
  *) echo '请指定 --agent codex 或 --agent claudecode。' >&2; exit 1 ;;
esac
if command -v "$agent_cmd" >/dev/null; then
  "$agent_cmd" --version || { echo 'Agent CLI 无法运行，请修复后重试。' >&2; exit 1; }
else
  # CLI-only access can write agent instructions before the agent CLI is installed.
  printf '[环境检测] 未找到 %s；CLI 接入可继续，MCP 接入需要先安装该命令。\n' "$agent_cmd"
fi
[[ "$origin" == https://* || "$origin" == http://* ]] || { echo '服务地址需为 HTTP(S) URL。' >&2; exit 1; }
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
# Retry only read-only downloads; keep certificate errors fatal.
curl_download() {
  local url="$1" output="$2" attempt=1 rc=0 delay=1
  while ((attempt <= 4)); do
    if curl --fail --silent --show-error --location --connect-timeout 15 --max-time 60 --http1.1 "$url" -o "$output"; then
      return 0
    else
      rc=$?
    fi
    case "$rc" in
      35|92) ;;
      5|6|7|18|22|28|52|55|56) ;;
      *) echo "下载失败（curl $rc）；请检查系统证书或代理配置，TLS 校验未关闭。" >&2; return "$rc" ;;
    esac
    if ((attempt == 4)); then
      echo "下载失败，已尝试 4 次（curl $rc）。请稍后重试。" >&2
      return "$rc"
    fi
    printf '网络暂时失败（curl %s），%s 秒后重试（%s/4）…\n' "$rc" "$delay" "$((attempt + 1))" >&2
    sleep "$delay"
    delay=$((delay * 2)); attempt=$((attempt + 1))
  done
}
printf '[环境检测] 正在检查站点连通性与下载服务…\n'
curl_download "$origin/static/downloads/manifest.json?installer=0.5.6" "$tmpdir/manifest.json"
# Use the same working curl transport for every network operation.
"$python_cmd" - "$tmpdir" <<'PYCODE'
import json,pathlib,re,sys
p=pathlib.Path(sys.argv[1]);m=json.loads((p/'manifest.json').read_text())
sha=m.get('sha256',{}).get('install-teamkb-0.5.6.py','')
if not re.fullmatch('[a-f0-9]{64}',sha):
    raise SystemExit('安装器 SHA-256 清单无效，请刷新接入页。')
(p/'expected.sha256').write_text(sha)
PYCODE
installer_hash=$(cat "$tmpdir/expected.sha256")
curl_download "$origin/static/downloads/install-teamkb-0.5.6.py?sha256=$installer_hash" "$tmpdir/install.py"
"$python_cmd" - "$tmpdir" <<'PYCODE'
import hashlib,pathlib,sys
p=pathlib.Path(sys.argv[1])
if hashlib.sha256((p/'install.py').read_bytes()).hexdigest()!=(p/'expected.sha256').read_text():
    raise SystemExit('安装器 SHA-256 不匹配，停止安装。')
print('[环境检测] curl 网络访问与安装器校验：正常')
PYCODE
TEAMKB_DOWNLOAD_TRANSPORT=curl "$python_cmd" "$tmpdir/install.py" "${args[@]}"
