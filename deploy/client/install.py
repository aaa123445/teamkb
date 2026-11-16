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

VERSION = "0.5.2"
WHEEL = f"v8_workbench-{VERSION}-py3-none-any.whl"
SKILL = f"team-knowledge-{VERSION}.zip"
BEGIN, END = "<!-- TEAMKB:BEGIN -->", "<!-- TEAMKB:END -->"


def download(url):
    with urlopen(Request(url, headers={"User-Agent": "TeamKB-Installer/" + VERSION}), timeout=60) as response:
        return response.read()


def verified_download(origin, name, manifest):
    digest = manifest.get("sha256", {}).get(name, "")
    if not re.fullmatch(r"[a-f0-9]{64}", digest):
        raise ValueError(f"缺少有效校验值：{name}")
    data = download(f"{origin}/static/downloads/{name}?sha256={digest}")
    if hashlib.sha256(data).hexdigest() != digest:
        raise ValueError(f"SHA-256 不匹配，停止安装：{name}")
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
        raise ValueError(f"指令管理区块损坏，请检查 {path}")
    if BEGIN in old:
        start, end = old.index(BEGIN), old.index(END) + len(END)
        if end < start:
            raise ValueError("指令区块顺序错误")
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
            raise ValueError("TeamKB 使用特殊 TOML 格式，请手动合并，未覆盖现有配置")
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
    args = parser.parse_args()
    if sys.version_info < (3, 11):
        raise ValueError("需要 Python 3.11+")
    origin = (args.url or input("TeamKB 服务地址: ")).strip().rstrip("/")
    parsed = urlsplit(origin)
    if parsed.scheme not in {"https", "http"} or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("服务地址必须是不含凭据的 HTTP(S) URL")
    project = None
    if args.scope == "project":
        project = Path(input(f"项目绝对路径 [{Path.cwd()}]: ").strip() or Path.cwd()).expanduser().resolve()
        if not project.is_dir():
            raise ValueError("项目目录不存在")
    uses_mcp = args.mode in {"mcp", "recommended"}
    if uses_mcp and not shutil.which("codex" if args.agent == "codex" else "claude"):
        raise ValueError("未找到所选 Agent 的 CLI，请先安装并确认其在 PATH 中")
    if not sys.stdin.isatty():
        raise ValueError("请在交互终端运行安装命令，以隐藏输入个人 API Key")
    key = getpass.getpass("个人 API Key（输入隐藏，需已审批账号的 Key）: ").strip()
    if not key or key == "YOUR_PERSONAL_KEY" or any(c in key for c in "\r\n"):
        raise ValueError("请提供有效的个人 API Key")
    # Verify access before changing client, instructions or MCP configuration.
    with urlopen(Request(origin + "/api/v1/stats", headers={"Authorization": "Bearer " + key}), timeout=30) as response:
        json.load(response)
    manifest = json.loads(download(origin + "/static/downloads/manifest.json?installer=" + VERSION))
    wheel = verified_download(origin, WHEEL, manifest)
    skill_data = verified_download(origin, SKILL, manifest) if args.mode in {"recommended", "skill"} else None
    template = None
    if args.mode in {"cli", "skill"}:
        template_data = verified_download(origin, "agent-instructions-" + VERSION + ".md", manifest)
        template = template_data.decode("utf-8")
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
                    raise ValueError("Skill ZIP 包含非法路径")
            for member in archive.infolist():
                if member.is_dir():
                    continue
                path = target / member.filename
                save_with_backup(path, archive.read(member).decode("utf-8"))
        print(f"Skill 已安装：{target / 'team-knowledge'}")
    print("安装完成；地址与 Key 已验证，凭据未写入 Agent 指令。")


if __name__ == "__main__":
    try:
        main()
    except (Exception, KeyboardInterrupt) as exc:
        # Never echo HTTP bodies, credential-bearing requests or subprocess environment.
        print(f"安装未完成：{type(exc).__name__}；请检查网络、个人 Key 和本机配置。", file=sys.stderr)
        sys.exit(1)
