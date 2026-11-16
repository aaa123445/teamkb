#!/usr/bin/env python3
"""Interactive, stdlib-only TeamKB client installer. Requires Python 3.11+."""
from __future__ import annotations

import argparse
import datetime
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import venv
import zipfile

VERSION = "0.5.4"
WHEEL = f"v8_workbench-{VERSION}-py3-none-any.whl"
SKILL = f"team-knowledge-{VERSION}.zip"
class InstallError(Exception):
    """Safe, actionable installer-authored message; never a server response."""


BEGIN, END = "<!-- TEAMKB:BEGIN -->", "<!-- TEAMKB:END -->"


def request_bytes(url, key=""):
    if os.environ.get("TEAMKB_DOWNLOAD_TRANSPORT") == "curl":
        # Feed credential headers through stdin, never argv or temporary files.
        headers = ("Authorization: Bearer " + key + "\n") if key else ""
        result = subprocess.run(
            ["curl", "--silent", "--show-error", "--max-time", "60",
             "--user-agent", "TeamKB-Installer/" + VERSION,
             "--header", "@-", "--write-out", "\n%{http_code}", url],
            input=headers.encode(), capture_output=True,
        )
        if result.returncode:
            raise InstallError(f"curl 网络连接失败（退出码 {result.returncode}）；请检查系统代理与证书。未关闭 TLS 校验")
        body, _, raw_status = result.stdout.rpartition(b"\n")
        status = int(raw_status)
        if not 200 <= status < 300:
            from urllib.error import HTTPError
            raise HTTPError(url, status, "Request failed", {}, None)
        return body
    headers = {"User-Agent": "TeamKB-Installer/" + VERSION}
    if key:
        headers["Authorization"] = "Bearer " + key
    with urlopen(Request(url, headers=headers), timeout=60) as response:
        return response.read()


def download(url):
    return request_bytes(url)


def verified_download(origin, name, manifest):
    digest = manifest.get("sha256", {}).get(name, "")
    if not re.fullmatch(r"[a-f0-9]{64}", digest):
        raise InstallError(f"缺少有效校验值：{name}")
    data = download(f"{origin}/static/downloads/{name}?sha256={digest}")
    if hashlib.sha256(data).hexdigest() != digest:
        raise InstallError(f"SHA-256 不匹配，停止安装：{name}")
    return data


def save_with_backup(path, content, private=False):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        if path.read_text(encoding="utf-8") == content:
            return
        stamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S%f")
        shutil.copy2(path, path.with_name(path.name + ".teamkb-backup-" + stamp))
    fd, tmp = tempfile.mkstemp(prefix=".teamkb-", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(content)
        if path.exists() and not private:
            os.chmod(tmp, path.stat().st_mode & 0o777)
        os.replace(tmp, path)
    finally:
        Path(tmp).unlink(missing_ok=True)


def merge_instructions(path, block):
    path = Path(path)
    old = path.read_text(encoding="utf-8") if path.exists() else ""
    if old.count(BEGIN) != old.count(END) or old.count(BEGIN) > 1:
        raise InstallError(f"指令管理区块损坏，请检查 {path}")
    if BEGIN in old:
        start, end = old.index(BEGIN), old.index(END) + len(END)
        if end < start:
            raise InstallError("指令区块顺序错误")
        content = old[:start] + block.strip() + old[end:]
    else:
        content = old.rstrip() + ("\n\n" if old.strip() else "") + block.strip() + "\n"
    save_with_backup(path, content)


def register_mcp(agent, scope, project, wb):
    args = ["--project", str(project), "mcp"] if scope == "project" else ["mcp"]
    if agent == "claudecode":
        # Update only this named server in the requested scope; preserve all others.
        subprocess.run(["claude", "mcp", "remove", "--scope", scope, "teamkb"],
                       cwd=project, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["claude", "mcp", "add", "--transport", "stdio", "--scope", scope,
                        "teamkb", "--", str(wb), *args], cwd=project, check=True)
    elif scope == "user":
        subprocess.run(["codex", "mcp", "add", "teamkb", "--", str(wb), *args], check=True)
    else:
        import tomllib
        path = project / ".codex" / "config.toml"
        old = path.read_text(encoding="utf-8") if path.exists() else ""
        config = tomllib.loads(old)
        # Replace the entire named table, including stale env subtables, leaving other services intact.
        table = re.compile(r"(?m)^\[\[?([^\]\n]+)\]\]?[^\n]*\n?")
        matches = list(table.finditer(old))
        pieces, cursor = [], 0
        for i, match in enumerate(matches):
            name = match.group(1).strip()
            if name == "mcp_servers.teamkb" or name.startswith("mcp_servers.teamkb."):
                pieces.append(old[cursor:match.start()])
                cursor = matches[i + 1].start() if i + 1 < len(matches) else len(old)
        if "teamkb" in config.get("mcp_servers", {}) and not pieces:
            raise InstallError("TeamKB 使用特殊 TOML 格式，请手动合并，未覆盖现有配置")
        content = "".join(pieces) + old[cursor:]
        content = content.rstrip() + '\n\n[mcp_servers.teamkb]\ncommand = ' + json.dumps(str(wb)) + '\nargs = ' + json.dumps(args) + '\n'
        tomllib.loads(content)
        save_with_backup(path, content)


def main():
    parser = argparse.ArgumentParser(description="TeamKB 交互式一键接入")
    parser.add_argument("--agent", choices=["codex", "claudecode"], required=True)
    parser.add_argument("--mode", choices=["cli", "mcp", "recommended", "skill"], default="cli")
    parser.add_argument("--scope", choices=["user", "project"], default="user")
    parser.add_argument("--url", default="")
    parser.add_argument("--no-contribute", action="store_true")
    parser.add_argument("--check-only", action="store_true", help="仅检测环境，不询问 Key 或修改配置")
    args = parser.parse_args()
    if sys.version_info < (3, 11):
        raise InstallError(f"当前 Python 为 {sys.version.split()[0]}，需要 Python 3.11+；请用 python3.11 或更新版本重新执行安装命令")
    origin = (args.url or input("TeamKB 服务地址: ")).strip().rstrip("/")
    parsed = urlsplit(origin)
    if parsed.scheme not in {"https", "http"} or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise InstallError("服务地址必须是不含凭据的 HTTP(S) URL")
    print(f"[环境检测] Python {sys.version.split()[0]}；系统 {sys.platform}", flush=True)
    try:
        import ensurepip
        import ssl
    except ImportError:
        raise InstallError("缺少 venv/ensurepip/TLS 支持，请安装对应 Python venv 组件")
    if args.check_only:
        uses_mcp = args.mode in {"mcp", "recommended"}
        binary = "codex" if args.agent == "codex" else "claude"
        if uses_mcp and not shutil.which(binary):
            raise InstallError(f"未在 PATH 找到 {binary}；MCP 接入需要先安装 Agent CLI")
        if shutil.which(binary):
            subprocess.run([binary, "--version"], check=True)
        manifest = json.loads(download(origin + "/static/downloads/manifest.json?installer=" + VERSION))
        if not all(manifest.get("sha256", {}).get(name) for name in (WHEEL, SKILL)):
            raise InstallError("下载服务缺少当前版本客户端，请刷新接入页面")
        print("环境检测通过；未读取凭据，未安装客户端，未修改 Agent 配置。")
        return
    project = None
    if args.scope == "project":
        project = Path(input(f"项目绝对路径 [{Path.cwd()}]: ").strip() or Path.cwd()).expanduser().resolve()
        if not project.is_dir():
            raise InstallError("项目目录不存在")
    uses_mcp = args.mode in {"mcp", "recommended"}
    if uses_mcp and not shutil.which("codex" if args.agent == "codex" else "claude"):
        raise InstallError(f"未在 PATH 中找到 {'codex' if args.agent == 'codex' else 'claude'} 命令；请在能运行该命令的终端重新安装，或先安装对应 Agent CLI")
    key = os.environ.get("TEAMKB_KEY", "").strip()
    if not key:
        # getpass can use /dev/tty even when stdin is redirected (IDE/Agent shells).
        if not sys.stdin.isatty():
            try:
                with open("/dev/tty", "r+"):
                    pass
            except OSError:
                raise InstallError("当前进程没有可交互终端；请把安装命令粘贴到本机终端运行并隐藏输入 Key，或通过本机安全环境变量 TEAMKB_KEY 提供凭据")
        print("请输入个人 API Key（输入隐藏）；可在工作台个人中心创建。", flush=True)
        import warnings
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("error", getpass.GetPassWarning)
                key = getpass.getpass("个人 API Key: ").strip()
        except (getpass.GetPassWarning, EOFError):
            raise InstallError("无法隐藏读取 Key；请在本机交互终端重新运行，或使用本机安全环境变量 TEAMKB_KEY")
    if not key or key == "YOUR_PERSONAL_KEY" or any(c in key for c in "\r\n"):
        raise InstallError("请提供有效的个人 API Key")
    print("[1/4] 验证服务地址与个人 Key…", flush=True)
    # Verify access before changing client, instructions or MCP configuration.
    json.loads(request_bytes(origin + "/api/v1/stats", key))
    print("[2/4] 下载并校验客户端文件…", flush=True)
    manifest = json.loads(download(origin + "/static/downloads/manifest.json?installer=" + VERSION))
    wheel = verified_download(origin, WHEEL, manifest)
    skill_data = verified_download(origin, SKILL, manifest) if args.mode in {"recommended", "skill"} else None
    template = None
    if args.mode in {"cli", "skill"}:
        template_data = verified_download(origin, "agent-instructions-" + VERSION + ".md", manifest)
        template = template_data.decode("utf-8")
    print("[3/4] 安装独立 Python 环境并初始化连接…", flush=True)
    envdir = Path.home() / ".teamkb-venv"
    venv.EnvBuilder(with_pip=True).create(envdir)
    python = envdir / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    wb = envdir / ("Scripts/wb.exe" if os.name == "nt" else "bin/wb")
    with tempfile.TemporaryDirectory(prefix="teamkb-install-") as tmp:
        wheel_path = Path(tmp) / WHEEL
        wheel_path.write_bytes(wheel)
        subprocess.run([str(python), "-m", "pip", "install", "--upgrade", "--no-cache-dir", str(wheel_path)], check=True)
    env = {k: v for k, v in os.environ.items() if k not in {"TEAMKB_URL", "TEAMKB_KEY", "V8WB_URL", "V8WB_KEY"}}
    env.update(TEAMKB_URL=origin, TEAMKB_KEY=key)
    command = [str(wb)] + (["--project", str(project)] if project else [])
    subprocess.run([*command, "init", "--scope", args.scope], env=env, check=True)
    subprocess.run([*command, "stats"], env=env, check=True)
    print("[4/4] 配置所选 Agent…", flush=True)
    if uses_mcp:
        register_mcp(args.agent, args.scope, project, wb)
        print("MCP 已注册；没有修改 Agent 系统提示词。请重启 Agent 并验证 kb_categories 工具调用。")
    elif template is not None:
        if args.agent == "codex":
            root = project if project else Path(os.environ.get("CODEX_HOME", str(Path.home() / ".codex")))
            # Override files supersede AGENTS.md; merge into the actually loaded file.
            path = root / ("AGENTS.override.md" if (root / "AGENTS.override.md").exists() else "AGENTS.md")
        else:
            path = project / "CLAUDE.md" if project else Path.home() / ".claude" / "CLAUDE.md"
        import shlex
        absolute_command = subprocess.list2cmdline(command) if os.name == "nt" else shlex.join(command)
        block = template.replace("{{TEAMKB_URL}}", origin).replace("{{TEAMKB_COMMAND}}", absolute_command)
        block = block.replace("{{TEAMKB_CONTRIBUTION_POLICY}}", "已关闭：仅在用户明确要求后提交" if args.no_contribute else "已启用：任务后按需直接提交经过验证的知识，默认待审核")
        # Render every CLI example with the installed executable, including paths with spaces.
        block = block.replace("wb categories / wb standards", absolute_command + " categories / " + absolute_command + " standards")
        block = block.replace("wb propose", absolute_command + " propose").replace("wb queue", absolute_command + " queue")
        merge_instructions(path, block)
        print(f"Agent 指令已合并：{path}；请新开会话加载。")
    else:
        print("客户端已初始化；未修改 Agent 系统提示词（MCP 只注册工具）。")
    if skill_data:
        import io
        target = (project if project else Path.home()) / (".agents/skills" if args.agent == "codex" else ".claude/skills")
        with zipfile.ZipFile(io.BytesIO(skill_data)) as archive:
            for member in archive.infolist():
                dest = (target / member.filename).resolve()
                if not dest.is_relative_to(target.resolve()) or not member.filename.startswith("team-knowledge/"):
                    raise InstallError("Skill ZIP 包含非法路径")
            for member in archive.infolist():
                if member.is_dir():
                    continue
                path = target / member.filename
                save_with_backup(path, archive.read(member).decode("utf-8"))
        print(f"Skill 已安装：{target / 'team-knowledge'}")
    print("安装完成；地址与 Key 已验证，凭据未写入 Agent 指令。")


def entrypoint():
    from urllib.error import HTTPError, URLError
    try:
        main()
        return 0
    except InstallError as exc:
        print(f"安装未完成：{exc}", file=sys.stderr)
    except HTTPError as exc:
        hint = {401: "个人 Key 无效或已吊销", 403: "访问被拒绝，请检查账号审批、Key 权限或站点访问限制", 404: "下载文件或接口不存在，请刷新一键接入页获取新命令"}.get(exc.code, "请检查服务状态后重试")
        print(f"安装未完成：HTTP {exc.code}；{hint}。", file=sys.stderr)
    except (URLError, TimeoutError):
        print("安装未完成：连接失败或超时；请检查本机网络和工作台域名访问。", file=sys.stderr)
    except subprocess.CalledProcessError as exc:
        print(f"安装未完成：子命令退出码 {exc.returncode}；请查看上方 pip、wb 或 Agent CLI 输出。", file=sys.stderr)
    except KeyboardInterrupt:
        print("安装已由用户取消。", file=sys.stderr)
    except Exception as exc:
        # Never echo arbitrary HTTP bodies, credential-bearing requests or environment.
        print(f"安装未完成：{type(exc).__name__}；请记录上方最后一个步骤，检查本机文件权限和配置格式。", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(entrypoint())
