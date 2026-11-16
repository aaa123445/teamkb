import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace

import pytest

spec = importlib.util.spec_from_file_location('client_installer', Path(__file__).parents[1] / 'deploy/client/install.py')
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


def test_instruction_merge_preserves_rules_and_is_repeatable(tmp_path):
    path = tmp_path / 'AGENTS.md'
    path.write_text('Existing team instructions\n')
    block = installer.BEGIN + '\nTeamKB workflow\n' + installer.END
    installer.merge_instructions(path, block)
    installer.merge_instructions(path, block)
    assert path.read_text().count(installer.BEGIN) == 1
    assert path.read_text().startswith('Existing team instructions')
    assert len(list(tmp_path.glob('*.teamkb-backup-*'))) == 1


@pytest.mark.parametrize('agent', ['codex', 'claudecode'])
@pytest.mark.parametrize('mode', ['cli', 'mcp'])
def test_installer_interactive_credentials_and_mode_isolation(tmp_path, monkeypatch, mode, agent):
    monkeypatch.setattr(installer.Path, 'home', lambda: tmp_path)
    monkeypatch.setattr(installer.sys, 'argv', ['install.py', '--agent', agent, '--mode', mode, '--url', 'https://team.example'])
    monkeypatch.setattr(installer.sys, 'stdin', SimpleNamespace(isatty=lambda: True))
    monkeypatch.setattr(installer.getpass, 'getpass', lambda _: 'private-test-key')
    monkeypatch.setattr(installer.shutil, 'which', lambda _: '/bin/codex')
    class Response:
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def read(self): return b'{"documents": 1}'
    monkeypatch.setattr(installer, 'urlopen', lambda *a, **kw: Response())
    monkeypatch.setattr(installer, 'download', lambda _: b'{}')
    template = (installer.BEGIN + '\n{{TEAMKB_URL}} {{TEAMKB_COMMAND}} {{TEAMKB_CONTRIBUTION_POLICY}}\n' + installer.END).encode()
    monkeypatch.setattr(installer, 'verified_download', lambda o, n, m: template if n.endswith('.md') else b'wheel')
    monkeypatch.setattr(installer.venv.EnvBuilder, 'create', lambda *a: None)
    commands = []
    monkeypatch.setattr(installer.subprocess, 'run', lambda cmd, **kw: commands.append((cmd, kw)))
    installer.main()
    path = tmp_path / ('.codex/AGENTS.md' if agent == 'codex' else '.claude/CLAUDE.md')
    assert path.exists() == (mode == 'cli')
    if path.exists():
        assert 'private-test-key' not in path.read_text()
        assert '已启用' in path.read_text()
    assert any('init' in cmd and '--scope' in cmd for cmd, _ in commands)
    assert any(cmd[:3] == [('codex' if agent == 'codex' else 'claude'), 'mcp', 'add'] for cmd, _ in commands) == (mode == 'mcp')
    assert all('private-test-key' not in json.dumps(cmd) for cmd, _ in commands)
