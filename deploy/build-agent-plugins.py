"""Build reproducible, domain-distributed local plugin marketplaces (no credentials)."""
import hashlib,json,pathlib,sys,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
dest=root/'web/public/downloads';dest.mkdir(parents=True,exist_ok=True)
version='0.1.1';hashes={}
for agent in ('codex','claude'):
    entries={}
    base=root/'plugins'/f'{agent}-teamkb'
    for p in base.rglob('*'):
        if p.is_file():entries['plugins/teamkb/'+p.relative_to(base).as_posix()]=p.read_bytes()
    for p in (root/'skill/team-knowledge').rglob('*'):
        if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.py':
            entries['plugins/teamkb/skills/team-knowledge/'+p.relative_to(root/'skill/team-knowledge').as_posix()]=p.read_bytes()
    if agent=='codex':
        market={'name':'teamkb-native','interface':{'displayName':'TeamKB 团队知识库'},'plugins':[{'name':'teamkb','source':{'source':'local','path':'./plugins/teamkb'},'policy':{'installation':'AVAILABLE','authentication':'ON_INSTALL'},'category':'Productivity'}]}
        path='.agents/plugins/marketplace.json'
    else:
        market={'name':'teamkb-native','owner':{'name':'TeamKB'},'plugins':[{'name':'teamkb','source':'./plugins/teamkb','description':'TeamKB 团队知识库','version':version}]}
        path='.claude-plugin/marketplace.json'
    entries[path]=(json.dumps(market,ensure_ascii=False,indent=2)+'\n').encode()
    name=f'teamkb-{agent}-plugin-{version}.zip'
    import io
    buf=io.BytesIO()
    with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED) as z:
        for path,data in sorted(entries.items()):
            info=zipfile.ZipInfo(path,date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,data)
    data=buf.getvalue();sha=hashlib.sha256(data).hexdigest();target=dest/name
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()!=sha:raise SystemExit(f'{name} changed; bump plugin version')
    target.write_bytes(data);hashes[name]=sha
p=dest/'plugin-manifest.json';temp=p.with_suffix('.json.tmp');temp.write_text(json.dumps({'version':version,'sha256':hashes},indent=2)+'\n');temp.replace(p)
mf=dest/'manifest.json'
if mf.exists():
    data=json.loads(mf.read_text());data['sha256'].update(hashes);temp=mf.with_suffix('.json.tmp');temp.write_text(json.dumps(data,indent=2)+'\n');temp.replace(mf)
print('Built Codex and Claude Code plugin marketplaces')
