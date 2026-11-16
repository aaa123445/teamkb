import hashlib,json,os,pathlib,subprocess,tempfile,threading,http.server,shutil,sys
real_codex=shutil.which('codex')
root=pathlib.Path(__file__).resolve().parents[1];binary=pathlib.Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root/'web/public/downloads/teamkb-0.6.2-linux-arm64'
# Only isolated fixture server and temporary HOME. No production keys or writes.
with tempfile.TemporaryDirectory(prefix='teamkb-native-test-') as td:
 home=pathlib.Path(td); artifact=binary.read_bytes(); instruction=(root/'skill/team-knowledge/references/agent-instructions.md').read_bytes()
 files={binary.name:artifact,'agent-instructions-0.6.2.md':instruction}
 for kind in ['codex','claude']:
  name=f'teamkb-{kind}-plugin-0.1.1.zip';files[name]=(root/'web/public/downloads'/name).read_bytes()
 files['plugin-manifest.json']=(root/'web/public/downloads/plugin-manifest.json').read_bytes()
 mf=json.dumps({'version':'0.6.2','sha256':{n:hashlib.sha256(v).hexdigest() for n,v in files.items()}},indent=2).encode()
 class Handler(http.server.BaseHTTPRequestHandler):
  def log_message(self,*a): pass
  def do_GET(self):
   p=self.path.split('?')[0]
   if p in ['/health','/api/v1/stats']:
    if p.endswith('stats') and self.headers.get('Authorization')!='Bearer fixture-only-key': self.send_error(401);return
    b=b'{"documents":1398}'
   elif p.endswith('/go-manifest.json'): b=mf
   else:
    b=files.get(p.rsplit('/',1)[-1]);
    if b is None:self.send_error(404);return
   self.send_response(200);self.end_headers();self.wfile.write(b)
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}'
 env={**os.environ,'HOME':str(home),'TEAMKB_KEY':'fixture-only-key','TEAMKB_URL':url,'SHELL':'/bin/zsh'}
 for k in ['V8WB_KEY','V8WB_URL','CODEX_HOME']:env.pop(k,None)
 (home/'.codex').mkdir();(home/'.codex/AGENTS.md').write_text('User rule: preserve this.\n')
 def run(args,**kw):
  r=subprocess.run(args,env=env,cwd=home,text=True,capture_output=True,**kw)
  if r.returncode:raise RuntimeError(r.stdout+r.stderr)
  assert 'fixture-only-key' not in r.stdout+r.stderr
  return r
 cmd=['bash',str(root/'deploy/client/install-go.sh'),'codex','cli','user','--url',url]
 run(cmd);run(cmd)
 assert (home/'.codex/AGENTS.md').read_text().count('TEAMKB:BEGIN')==1
 assert 'User rule: preserve this.' in (home/'.codex/AGENTS.md').read_text()
 assert (home/'.teamkb/client.json').stat().st_mode&0o777==0o600
 wb=home/'.local/bin/wb';assert wb.exists()
 env.pop('TEAMKB_KEY');env.pop('TEAMKB_URL');assert '1398' in run([str(wb),'stats']).stdout
 # Native stdio MCP subprocess negotiation, tools/list and nonexistent-ID error.
 proc=subprocess.Popen([str(wb),'mcp'],env=env,cwd=home,text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 def rpc(v):proc.stdin.write(json.dumps(v)+'\n');proc.stdin.flush();return json.loads(proc.stdout.readline())
 result=rpc({'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2024-11-05','capabilities':{},'clientInfo':{'name':'fixture','version':'1'}}});assert result['result']['serverInfo']['version']=='0.6.2'
 proc.stdin.write(json.dumps({'jsonrpc':'2.0','method':'notifications/initialized'})+'\n');proc.stdin.flush()
 result=rpc({'jsonrpc':'2.0','id':2,'method':'tools/list','params':{}});assert len(result['result']['tools'])==9
 result=rpc({'jsonrpc':'2.0','id':3,'method':'tools/call','params':{'name':'kb_stats','arguments':{}}});assert not result['result'].get('isError')
 proc.stdin.close();proc.wait(timeout=10)
 # MCP registration through a fake Codex CLI: must not touch instruction file.
 bindir=home/'fake-bin';bindir.mkdir();fake=bindir/'codex';fake.write_text('#!/bin/sh\nprintf "%s\\n" "$@" > "$HOME/codex-registration"\n');fake.chmod(0o700);env['PATH']=str(bindir)+':'+env['PATH'];before=(home/'.codex/AGENTS.md').read_bytes()
 run(['bash',str(root/'deploy/client/install-go.sh'),'codex','mcp','user','--url',url]);assert before==(home/'.codex/AGENTS.md').read_bytes()
 assert '/.local/bin/teamkb' in (home/'codex-registration').read_text()
 # Real Codex plugin install using isolated home and fixture credentials.
 if real_codex:
  env['PATH']=os.environ['PATH'];env['CODEX_HOME']=str(home/'codex-plugin-home');pathlib.Path(env['CODEX_HOME']).mkdir()
  run(['bash',str(root/'deploy/client/install-go.sh'),'codex','plugin','user','--url',url,'--no-contribute'])
  plugin_config=home/'.teamkb/plugins/codex/user/plugins/teamkb/.mcp.json'
  cfg=json.loads(plugin_config.read_text());assert cfg['mcpServers']['teamkb']['command']==str(home/'.local/bin/teamkb')
  assert 'fixture-only-key' not in plugin_config.read_text()
  cache=list(pathlib.Path(env['CODEX_HOME']).glob('plugins/cache/**/.codex-plugin/plugin.json'));assert cache
  assert json.loads(cache[0].read_text())['version']=='0.1.1'
  assert (home/'.codex/AGENTS.md').read_bytes()==before
  run(['bash',str(root/'deploy/client/install-go.sh'),'codex','plugin','user','--url',url])
  installed_skill=cache[0].parent.parent/'skills/team-knowledge/SKILL.md'
  assert 'Task-end contribution is enabled' in installed_skill.read_text(), 'cached plugin policy not refreshed'
 # Tampering must stop before creating any config.
 files[binary.name]=b'broken artifact';other=home/'clean-home';other.mkdir();env['HOME']=str(other)
 r=subprocess.run(cmd,env=env,cwd=other,text=True,capture_output=True);assert r.returncode and 'SHA-256' in r.stderr;assert not (other/'.teamkb').exists()
 server.shutdown();print('PASS: native bootstrap, repeated CLI install, private config, persistent stats, stdio MCP, MCP prompt isolation, real Codex plugin install/reinstall, SHA tamper rejection')
