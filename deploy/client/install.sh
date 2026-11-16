#!/usr/bin/env bash
# TeamKB bootstrap: inspect environment before installing anything.
set -euo pipefail
origin='https://www.ljc.monster'
agent=''
check_only=false
args=("$@")
while (($#)); do
  case "$1" in
    --url) origin="${2:?缺少服务地址}"; shift 2 ;;
    --agent) agent="${2:?缺少智能体名称}"; shift 2 ;;
    --check-only) check_only=true; shift ;;
    *) shift ;;
  esac
done
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
printf '[环境检测] 正在检查站点连通性与下载服务…\n'
curl --fail --silent --show-error --location --max-time 60 "$origin/static/downloads/manifest.json?installer=0.5.3" -o "$tmpdir/manifest.json"
# Verify installer bytes before execution. All downloads stay on the site domain.
"$python_cmd" - "$origin" "$tmpdir" <<'PY'
import hashlib,json,pathlib,re,sys,urllib.request
origin,target=sys.argv[1],pathlib.Path(sys.argv[2])
manifest=json.loads((target/'manifest.json').read_text())
name='install-teamkb-0.5.3.py'
sha=manifest.get('sha256',{}).get(name,'')
if not re.fullmatch('[a-f0-9]{64}',sha):
    raise SystemExit('安装器 SHA-256 清单无效，请刷新接入页。')
try:
    data=urllib.request.urlopen(urllib.request.Request(origin+'/static/downloads/'+name+'?sha256='+sha,headers={'User-Agent':'TeamKB-Installer/0.5.3'}),timeout=60).read()
except Exception as exc:
    raise SystemExit('无法下载安装器：'+type(exc).__name__+'；请检查代理、TLS证书与网络。')
if hashlib.sha256(data).hexdigest()!=sha:
    raise SystemExit('安装器 SHA-256 不匹配，停止安装。')
(target/'install.py').write_bytes(data)
print('[环境检测] 域名下载、TLS 与安装器校验：正常')
PY
"$python_cmd" "$tmpdir/install.py" "${args[@]}"
