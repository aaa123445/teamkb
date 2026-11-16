"""Persistent CLI/MCP connection setup, separate from contribution opt-in."""
from __future__ import annotations

import getpass
import json
import os
from pathlib import Path
from urllib.parse import urlsplit

LOCAL_URL = "http://127.0.0.1:8770"


def user_config():
    return Path.home() / ".teamkb" / "client.json"


def project_config(project=None):
    if project:
        return Path(project).expanduser().resolve() / ".teamkb" / "client.json"
    current = Path.cwd().resolve()
    for root in (current, *current.parents):
        candidate = root / ".teamkb" / "client.json"
        if candidate.is_file():
            return candidate
    return None


def read_config(path):
    if not path or not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or not isinstance(data.get("url", ""), str) or not isinstance(data.get("key", ""), str):
            raise ValueError()
        return data
    except (ValueError, OSError) as exc:
        raise ValueError(f"无法读取接入配置 {path}，请检查 JSON 或重新运行 wb init") from exc


def validate_url(value):
    url = value.strip().rstrip("/")
    parsed = urlsplit(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("服务地址必须是不含凭据、查询和片段的 HTTP(S) URL")
    return url


def resolve_connection(url=None, key=None, project=None):
    # A project config replaces the user pair; never borrow a user credential
    # for another server. CLI/environment overrides are still supported.
    path = project_config(project)
    if project and not Path(project).expanduser().resolve().is_dir():
        raise ValueError("项目目录不存在，请检查 --project 路径")
    if project and (not path or not path.exists()):
        raise ValueError("该项目尚未初始化，请先执行 wb --project PROJECT_ROOT init --scope project")
    if not path or not path.exists():
        path = user_config()
    saved = read_config(path)
    env_url = os.environ.get("TEAMKB_URL") or os.environ.get("V8WB_URL")
    env_key = os.environ.get("TEAMKB_KEY") or os.environ.get("V8WB_KEY")
    target = (url or env_url or saved.get("url") or LOCAL_URL).rstrip("/")
    saved_key = saved.get("key", "") if target == saved.get("url", "").rstrip("/") else ""
    return target, key if key is not None else (env_key or saved_key)


def initialize(args):
    root = Path(args.project or Path.cwd()).expanduser().resolve()
    if args.scope == "project" and not root.is_dir():
        raise ValueError("项目目录不存在，请先创建目录，或使用 --project 指定已有项目根目录")
    path = root / ".teamkb" / "client.json" if args.scope == "project" else user_config()
    old = read_config(path)
    if args.scope == "user":
        url = args.url or os.environ.get("TEAMKB_URL") or os.environ.get("V8WB_URL") or old.get("url", "")
        key = args.key if args.key is not None else (os.environ.get("TEAMKB_KEY") or os.environ.get("V8WB_KEY"))
    else:
        if old:
            url, key = resolve_connection(args.url, args.key, str(root))
        else:
            saved = read_config(user_config())
            url = (args.url or os.environ.get("TEAMKB_URL") or os.environ.get("V8WB_URL") or saved.get("url") or LOCAL_URL).rstrip("/")
            key = args.key if args.key is not None else (os.environ.get("TEAMKB_KEY") or os.environ.get("V8WB_KEY") or (saved.get("key", "") if url == saved.get("url", "") else ""))
        if url == LOCAL_URL and not old and not args.url and not (os.environ.get("TEAMKB_URL") or os.environ.get("V8WB_URL")):
            url = ""
    if not url:
        url = input("TeamKB 服务地址: ").strip()
    url = validate_url(url)
    if not key:
        # Reusing a key is allowed only when reinitializing the same server.
        key = old.get("key", "") if url == old.get("url", "") else ""
    if not key:
        if not os.isatty(0):
            raise ValueError("请在本机安全设置 TEAMKB_KEY 后运行 wb init，或在交互式终端填写个人 Key")
        key = getpass.getpass("个人 API Key（输入隐藏）: ").strip()
    if not key or key == "YOUR_PERSONAL_KEY" or any(c in key for c in "\r\n"):
        raise ValueError("请填写真实的个人 API Key")
    if args.scope == "project":
        # Exclude credentials before writing them. Keep all existing rules.
        ignore = root / ".gitignore"
        existing = ignore.read_text(encoding="utf-8") if ignore.exists() else ""
        if "/.teamkb/client.json" not in existing.splitlines():
            with ignore.open("a", encoding="utf-8") as stream:
                stream.write(("\n" if existing and not existing.endswith("\n") else "") + "/.teamkb/client.json\n")
    from cli.knowledge import write_json
    write_json(path, {**old, "url": url, "key": key})
    os.chmod(path, 0o600)
    return {"initialized": True, "scope": args.scope, "config_path": str(path), "url": url, "key_configured": True, "next": "wb stats（项目接入需在项目内执行，或使用 wb --project PROJECT_ROOT stats）"}
