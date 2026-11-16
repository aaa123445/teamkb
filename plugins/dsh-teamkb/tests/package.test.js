import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createContext, runInContext} from 'node:vm';
const root=new URL('../', import.meta.url);
const read=path=>readFileSync(new URL(path, root),'utf8');
test('display resources and translated detail documents are exported and present',()=>{
  const pkg=JSON.parse(read('package.json'));
  for(const resource of ['./locale/*.json','./docs/*.md','./icon']) assert.ok(pkg.exports[resource]);
  assert.ok(pkg.files.includes('locale/*.json'));assert.ok(pkg.files.includes('docs/*.md'));assert.ok(pkg.files.includes('icon.svg'));
  assert.ok(existsSync(new URL(pkg.icon,root)));
  for(const lang of ['en','zh']){
    const {meta}=JSON.parse(read(`locale/${lang}.json`));
    assert.ok(meta.title);assert.ok(meta.description);assert.match(read(meta.detail),/^# /);
  }
});
test('shipped browser module exposes both settings entries and supplies a live bundle form',()=>{
  let client;const registered=[];
  const state={value:{serverUrl:'https://example.org'},revision:7,writable:true};
  const mutations=[];const controller={getSnapshot:()=>state,subscribe:()=>()=>{},mutate:(...args)=>mutations.push(args)};
  const react={createElement:(type,props)=>({type,props}),useSyncExternalStore:(_,get)=>get()};
  const sandbox=createContext({window:{__ModuleLoader__:{load:module=>{client=module.factory(name=>{assert.equal(name,'react');return react;});}}}});
  runInContext(read('client.js'),sandbox);
  assert.ok(client.inject.includes('configForms'));
  client.apply({connection:{rpc:{}},configForms:{get:id=>{assert.equal(id,'teamkb');return controller;}},slots:{inject:(_,fn)=>fn(),register:(entry,component)=>registered.push({entry,component})}});
  const bundle=registered.find(r=>r.entry.name==='plugins.bundle.config');
  assert.equal(bundle.entry.key,'dsh-teamkb');
  const form=bundle.component({view:'page'}).props.form;
  assert.equal(form.state,state);form.mutate([],7);assert.equal(mutations[0][1],7);
  assert.equal(registered.find(r=>r.entry.name==='plugins.row.config').entry.key,'dsh-teamkb#teamkb');
});
