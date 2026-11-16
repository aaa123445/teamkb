import test from 'node:test';
import assert from 'node:assert/strict';
import {workbenchQuery,registerWorkbench} from '../workbench.js';
test('workbench only dispatches bounded read operations using the host credentials',async()=>{
  const calls=[];const api=async(...args)=>{calls.push(args);return {ok:true};};
  await workbenchQuery(api,{action:'search',query:' test ',url:'https://evil.example',key:'injected'});
  assert.equal(calls[0][0],'/api/v1/search');assert.deepEqual(calls[0][1].body,{query:'test',category_id:'',limit:10});
  await workbenchQuery(api,{action:'calls',page:2});assert.match(calls[1][0],/page=2&page_size=10/);
  await assert.rejects(workbenchQuery(api,{action:'propose'}),/不支持/);
  await assert.rejects(workbenchQuery(api,{action:'read',id:'doc',offset:-1}),/偏移量/);
  await assert.rejects(workbenchQuery(api,{action:'calls',page:0}),/页码/);
});
test('workbench mounts through the owner-only Connection fetch registry',async()=>{
  let route;let calls=0;
  registerWorkbench({inject:(_,fn)=>fn({effect:fn=>fn(),connection:{fetch:{register:value=>{route=value;}}}})},async()=>{calls++;return {documents:1};});
  assert.equal(route.path,'/api/teamkb/query');assert.deepEqual(route.methods,['POST']);
  const send=body=>route.fetch(new Request('http://localhost/api/teamkb/query',{method:'POST',body:JSON.stringify(body)}));
  assert.equal((await send({})).status,400);assert.equal(calls,0);
  const response=await send({type:'client-request',method:'teamkb/query',rpcId:'test',payload:{action:'stats'}});
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(await response.json(),{type:'server-response',rpcId:'test',result:{ok:true,value:{documents:1}}});
});
