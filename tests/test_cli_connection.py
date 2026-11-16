"""Initialization must survive a fresh shell and isolate project credentials."""
import json
import os
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

from cli.connection import initialize, resolve_connection
from cli.wb import build_parser


@pytest.fixture
def local_env(tmp_path, monkeypatch):
    home, project = tmp_path / "home", tmp_path / "project"
    home.mkdir(); project.mkdir()
    monkeypatch.setenv("HOME", str(home))
    monkeypatch.chdir(project)
    for name in ["TEAMKB_URL", "V8WB_URL", "TEAMKB_KEY", "V8WB_KEY"]:
        monkeypatch.delenv(name, raising=False)
    return home, project


def args(scope, url="https://team.example", key="personal-test-key", project=None):
    return SimpleNamespace(scope=scope, url=url, key=key, project=project)


def test_init_persists_user_settings_without_env(local_env):
    home, project = local_env
    result = initialize(args("user"))
    assert "personal-test-key" not in json.dumps(result)
    assert resolve_connection() == ("https://team.example", "personal-test-key")
    assert (home / ".teamkb/client.json").stat().st_mode & 0o777 == 0o600
    # Re-run from outside the working project in a new process, with no exports.
    repo = Path(__file__).resolve().parents[1]
    env = {**os.environ, "PYTHONPATH": str(repo)}
    out = subprocess.check_output([sys.executable, "-c", "from cli.connection import resolve_connection; print(resolve_connection()[0])"], cwd=home, env=env, text=True)
    assert out.strip() == "https://team.example"
    assert not (project / ".teamkb/config.json").exists()


def test_project_overrides_user_and_works_in_subdirs(local_env, monkeypatch):
    home, project = local_env
    initialize(args("user"))
    (project / ".gitignore").write_text("build/")
    initialize(args("project", "http://project.example:8000", "project-test-key"))
    nested = project / "src"; nested.mkdir(); monkeypatch.chdir(nested)
    assert resolve_connection() == ("http://project.example:8000", "project-test-key")
    assert resolve_connection(url="https://different.example")[1] == ""
    monkeypatch.chdir(home)
    assert resolve_connection() == ("https://team.example", "personal-test-key")
    assert resolve_connection(project=str(project)) == ("http://project.example:8000", "project-test-key")
    assert (project / ".gitignore").read_text() == "build/\n/.teamkb/client.json\n"
    initialize(args("project", "http://project.example:8000", "rotated-key", project=str(project)))
    assert (project / ".gitignore").read_text().count("/.teamkb/client.json") == 1
    assert not (project / ".teamkb/config.json").exists()


def test_env_and_flags_take_precedence_and_config_errors_are_explicit(local_env, monkeypatch):
    home, project = local_env
    initialize(args("user"))
    monkeypatch.setenv("V8WB_URL", "https://legacy.example")
    monkeypatch.setenv("V8WB_KEY", "legacy-key")
    monkeypatch.setenv("TEAMKB_URL", "https://env.example")
    monkeypatch.setenv("TEAMKB_KEY", "env-key")
    assert resolve_connection() == ("https://env.example", "env-key")
    assert resolve_connection("https://flag.example", "flag-key") == ("https://flag.example", "flag-key")
    (project / ".teamkb").mkdir()
    (project / ".teamkb/client.json").write_text("broken")
    with pytest.raises(ValueError, match="wb init"):
        resolve_connection()


def test_cli_and_mcp_use_initialized_pair(local_env, monkeypatch):
    from cli import wb
    initialize(args("project", "https://project.example", "project-key"))
    calls = []
    monkeypatch.setattr(wb, "cmd_mcp", lambda a: calls.append((a.url, a.key, a.project)))
    wb.main(["--project", str(local_env[1]), "mcp"])
    assert calls == [("https://project.example", "project-key", str(local_env[1]))]
    parser = build_parser()
    assert parser.parse_args(["agent", "init", "--project", "/tmp/example"]).project == "/tmp/example"
    assert parser.parse_args(["push", "notes", "--project", "customer-name"]).project == "customer-name"


def test_placeholder_and_invalid_urls_are_rejected(local_env):
    with pytest.raises(ValueError, match="真实"):
        initialize(args("user", key="YOUR_PERSONAL_KEY"))
    with pytest.raises(ValueError, match="HTTP"):
        initialize(args("user", url="file:///etc/passwd"))


def test_explicit_project_does_not_silently_fall_back_to_global(local_env):
    _, project = local_env
    initialize(args("user"))
    with pytest.raises(ValueError, match="尚未初始化"):
        resolve_connection(project=str(project))
    initialize(args("project", project=str(project)))
    assert resolve_connection(project=str(project))[0] == "https://team.example"
