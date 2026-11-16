"""Execute actual bootstrap with fake network failures and no user config changes."""
import os
from pathlib import Path
import subprocess


def test_bootstrap_retries_handshake_then_checks_environment(tmp_path):
    import hashlib
    import json
    root = Path(__file__).parents[1]
    source = (root / 'deploy/client/install.sh').read_text()
    # macOS ships Bash 3.2, where an empty array expansion with nounset fails.
    assert 'protocol[@]' not in source
    fake = tmp_path / 'bin'
    fake.mkdir()
    script = b'print("CHECK_ONLY_INSTALLER_REACHED")\n'
    (tmp_path / 'install.py').write_bytes(script)
    (tmp_path / 'manifest.json').write_text(json.dumps({'sha256': {'install-teamkb-0.5.6.py': hashlib.sha256(script).hexdigest()}}))
    curl = fake / 'curl'
    curl.write_text('''#!/bin/bash
set -eu
count=0
[ ! -f "$FIXTURE/count" ] || count=$(cat "$FIXTURE/count")
count=$((count+1)); echo "$count" > "$FIXTURE/count"
if [ "$count" -eq 1 ]; then exit 35; fi
url=; output=
while [ "$#" -gt 0 ]; do
 case "$1" in
   -o) output="$2"; shift 2;;
   http*) url="$1"; shift;;
   *) shift;;
 esac
done
case "$url" in
 *manifest.json*) cp "$FIXTURE/manifest.json" "$output";;
 *) cp "$FIXTURE/install.py" "$output";;
esac
''')
    curl.chmod(0o755)
    (fake / 'sleep').write_text('#!/bin/sh\nexit 0\n')
    (fake / 'sleep').chmod(0o755)
    env = {**os.environ, 'PATH': str(fake) + ':' + os.environ['PATH'], 'FIXTURE': str(tmp_path)}
    result = subprocess.run(['bash', str(root/'deploy/client/install.sh'), 'codex', 'cli', 'user', '--check-only'], env=env, text=True, capture_output=True)
    assert result.returncode == 0, result.stdout + result.stderr
    assert 'CHECK_ONLY_INSTALLER_REACHED' in result.stdout
    assert '35' in result.stderr
    assert int((tmp_path/'count').read_text()) == 3
