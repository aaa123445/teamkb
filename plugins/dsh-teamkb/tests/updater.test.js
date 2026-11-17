import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {createUpdater,CURRENT_VERSION,RELEASE_ORIGIN,newer} from '../updater.js';
const archive=Buffer.from('fixture archive');const sha=createHash('sha256').update(archive).digest('hex');
const release={name:'dsh-teamkb',version:'0.1.8',file:'dsh-teamkb-0.1.8.tgz',sha256:sha};
function transport(meta=release,bytes=archive){return async(address,options)=>{assert.ok(address.startsWith(RELEASE_ORIGIN+'/static/downloads/'));assert.equal(options.headers,undefined);return new Response(address.includes('dsh-release.json')?JSON.stringify(meta):bytes)}}
test('version checking uses fixed origin without credentials and handles same/newer versions',async()=>{
 assert.equal(newer('0.1.10','0.1.9'),true);assert.equal(newer('0.1.6',CURRENT_VERSION),false);
 const u=createUpdater({get:()=>undefined},{fetcher:transport()});const r=await u.check();assert.equal(r.available,true);assert.equal(r.can_update,false);
 const same=createUpdater({}, {fetcher:transport({...release,version:CURRENT_VERSION,file:`dsh-teamkb-${CURRENT_VERSION}.tgz`})});assert.equal((await same.check()).available,false);
 await assert.rejects(createUpdater({}, {fetcher:transport({...release,file:'https://evil.test/a.tgz'})}).check(),/清单/);
});
test('verified update uses public Harness operation and retains settings, serializes and requires restart',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'teamkb-update-'));t.after(()=>rm(dir,{recursive:true,force:true}));const patch=join(dir,'cordis.patch.yml');await writeFile(patch,'fixture settings remain');
 const profile={name:'web',dir,installAnchor:'/app/anchor.json',packageManager:{command:'fixture-pnpm'}};
 let finish;const gate=new Promise(r=>finish=r);let called=false;
 const runPackage=async(context,args,options)=>{called=true;assert.equal(context.profile,'web');assert.equal(context.dir,dir);assert.equal(options.command,'fixture-pnpm');assert.deepEqual(options.expected,{name:'dsh-teamkb',version:'0.1.8'});assert.ok(args.includes('--ignore-scripts'));assert.equal(options.activateNewBundles,false);assert.equal(createHash('sha256').update(await readFile(args[1])).digest('hex'),sha);await gate;await mkdir(join(dir,'node_modules/dsh-teamkb'),{recursive:true});await writeFile(join(dir,'node_modules/dsh-teamkb/package.json'),JSON.stringify({name:'dsh-teamkb',version:'0.1.8'}));return {exitCode:0}};
 const u=createUpdater({get:()=>profile},{fetcher:transport(),runPackage});
 const updating=u.install({version:release.version,sha256:sha});while(!called)await new Promise(r=>setTimeout(r,1));await assert.rejects(u.install({version:release.version,sha256:sha}),/进行/);finish();const result=await updating;
 assert.equal(result.application,'restart-required');assert.equal(result.installed_version,'0.1.8');assert.equal(await readFile(patch,'utf8'),'fixture settings remain');
});
test('wrong SHA, stale version and unsupported profile never invoke installation',async()=>{
 let calls=0;const ctx={get:()=>({dir:'/unused',installAnchor:'anchor'})},runPackage=async()=>{calls++;return {exitCode:0}};
 const bad=createUpdater(ctx,{fetcher:transport(release,Buffer.from('tampered')),runPackage});await assert.rejects(bad.install({version:release.version,sha256:sha}),/SHA-256/);
 const u=createUpdater(ctx,{fetcher:transport(),runPackage});await assert.rejects(u.install({version:'0.1.6',sha256:sha}),/变化/);assert.equal(calls,0);
 const missing=createUpdater({get:()=>undefined},{fetcher:transport(),runPackage});await assert.rejects(missing.install({version:release.version,sha256:sha}),/profile/);
});
