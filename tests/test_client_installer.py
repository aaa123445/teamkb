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

@pytest.mark.parametrize('reason', ['python', 'agent'])
def test_preflight_explains_failure_without_touching_config(tmp_path, monkeypatch, capsys, reason):
    monkeypatch.setattr(installer.sys, 'argv', ['install.py', '--agent', 'codex', '--mode', 'mcp', '--url', 'https://team.example'])
    monkeypatch.setattr(installer.Path, 'home', lambda: tmp_path)
    if reason == 'python':
        monkeypatch.setattr(installer.sys, 'version_info', (3, 10))
    else:
        monkeypatch.setattr(installer.shutil, 'which', lambda _: None)
    assert installer.entrypoint() == 1
    error = capsys.readouterr().err
    assert ('Python' if reason == 'python' else 'PATH') in error
    assert 'ValueError' not in error
    assert not list(tmp_path.iterdir())


def test_environment_key_works_without_interactive_stdin(tmp_path, monkeypatch):
    monkeypatch.setenv('TEAMKB_KEY', 'private-key-from-environment')
    monkeypatch.setattr(installer.sys, 'argv', ['install.py', '--agent', 'codex', '--mode', 'cli', '--url', 'https://team.example'])
    monkeypatch.setattr(installer.sys, 'stdin', SimpleNamespace(isatty=lambda: False))
    monkeypatch.setattr(installer.Path, 'home', lambda: tmp_path)
    class Response:
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def read(self): return b'{"documents": 1}'
    monkeypatch.setattr(installer, 'urlopen', lambda *a, **kw: Response())
    monkeypatch.setattr(installer, 'download', lambda _: b'{}')
    block = (installer.BEGIN + '\n{{TEAMKB_CONTRIBUTION_POLICY}}\n' + installer.END).encode()
    monkeypatch.setattr(installer, 'verified_download', lambda o, n, m: block if n.endswith('.md') else b'wheel')
    monkeypatch.setattr(installer.venv.EnvBuilder, 'create', lambda *a: None)
    monkeypatch.setattr(installer.subprocess, 'run', lambda *a, **kw: None)
    monkeypatch.setattr(installer.getpass, 'getpass', lambda _: pytest.fail('must not prompt when key is already supplied'))
    installer.main()
    assert 'private-key-from-environment' not in (tmp_path / '.codex/AGENTS.md').read_text()


def test_check_only_never_reads_key_or_writes_config(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(installer.sys, 'argv', ['install.py', '--agent', 'codex', '--mode', 'cli', '--url', 'https://team.example', '--check-only'])
    monkeypatch.setattr(installer.Path, 'home', lambda: tmp_path)
    monkeypatch.setattr(installer.shutil, 'which', lambda _: None)
    monkeypatch.setattr(installer.getpass, 'getpass', lambda _: pytest.fail('check-only cannot request credentials'))
    monkeypatch.setattr(installer, 'download', lambda _: json.dumps({'sha256': {installer.WHEEL: 'a'*64, installer.SKILL: 'b'*64}}).encode())
    assert installer.entrypoint() == 0
    assert '环境检测通过' in capsys.readouterr().out
    assert not list(tmp_path.iterdir())
