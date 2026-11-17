import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { Config, apply } from '../index.js';
import { registerTools } from '../tools.js';
import { request, validateEndpoint } from '../network.js';
const config = {serverUrl: 'https://team.example', apiKey: 'private-key', allowContributions: false, timeoutMs: 1000, maxRetries: 3};

test('official defineTool validates input and plugin registers tools and runtime prompt', async () => {
  const tools = new Map(); let section;
  const ctx = {inject: () => {}, tools: {register: t => tools.set(t.name, t)}, systemPrompt: {section: s => {section = s;}}};
  apply(ctx, config);
  assert.equal(tools.size, 8);
  assert.match(section.text(), /贡献当前关闭/);
  config.allowContributions = true;
  assert.match(section.text(), /无需项目初始化/);
  config.allowContributions = false;
  await assert.rejects(tools.get('kb_search').execute({}, {}));
  const schema = Config.toJSON();
  assert.ok(JSON.stringify(schema).includes('secret'));
});

test('tools use reviewed API, block disabled submission, do not require project', async () => {
  const tools = new Map(); const calls = [];
  registerTools({tools: {register: t => tools.set(t.name, t)}}, defineTool,
    async (path, options) => {calls.push({path, options}); return {status: 'pending'};}, () => config);
  const candidate = {title: 'Reusable database solution', category_id: 'backend', content: 'x'.repeat(100), problem: 'p'.repeat(12), solution: 's'.repeat(25), verification: 'v'.repeat(15), limitations: 'l'.repeat(8), verified: true, reusable: true};
  await assert.rejects(tools.get('kb_propose').execute(candidate, {}), /已关闭/);
  config.allowContributions = true;
  assert.equal(JSON.parse(await tools.get('kb_propose').execute(candidate, {})).status, 'pending');
  assert.equal(calls[0].options.readOnly, false);
  assert.equal(calls[0].options.body.source, 'agent');
  await tools.get('kb_read').execute({doc_id: 'note:1'}, {});
  assert.deepEqual(calls[1].options.body, {id: 'note:1', offset: 0});
  config.allowContributions = false;
});

test('real HTTP request keeps key in header and retries read-only failures', async t => {
  let count = 0;
  const server = createServer((req, res) => {
    assert.equal(req.headers.authorization, 'Bearer private-key');
    assert.ok(!req.url.includes('private-key'));
    count++;
    res.writeHead(count === 1 ? 503 : 200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({documents: 1398}));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => server.close());
  const result = await request({...config, serverUrl: `http://127.0.0.1:${server.address().port}`}, '/api/v1/stats', {sleep: async () => {}});
  assert.equal(result.documents, 1398); assert.equal(count, 2);
});

test('writes do not retry, errors redact body and key, cancellation propagates', async () => {
  let count = 0;
  await assert.rejects(request(config, '/api/v1/contributions', {method: 'POST', readOnly: false, fetcher: async () => {count++; throw new Error('private-key');}}), /提交未确认/);
  assert.equal(count, 1);
  await assert.rejects(request(config, '/api/v1/stats', {fetcher: async () => new Response('private-key', {status: 403})}), error => /HTTP 403/.test(error.message) && !error.message.includes('private-key'));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(request(config, '/api/v1/stats', {signal: controller.signal}), {name: 'AbortError'});
  assert.throws(() => validateEndpoint('https://key:password@team.example'), /凭据/);
});

test('400 document-not-found explains ID correction without retry or exposing body', async()=>{
  let count=0;
  await assert.rejects(request(config,'/api/v1/read',{fetcher:async()=>{count++;return new Response(JSON.stringify({error:'not_found',message:'private-key'}),{status:400});}}),e=>/文档 ID 不存在/.test(e.message)&&/kb_search/.test(e.message)&&!e.message.includes('private-key'));
  assert.equal(count,1);
  await assert.rejects(request(config,'/api/v1/search',{fetcher:async()=>new Response('{}',{status:400})}),/请求参数无效/);
});

test('contribution status is fetched each time and rejected entries leave the review queue', async () => {
  const tools=new Map();let status='pending',calls=0;
  registerTools({tools:{register:t=>tools.set(t.name,t)}},defineTool,async(path)=>{
    calls++;assert.equal(path,'/api/v1/contributions/con_test');return {id:'con_test',status,review_note:status==='rejected'?'测试用':'',events:[{action:status==='rejected'?'reject':'submit'}]};
  },()=>config);
  const lookup=async()=>JSON.parse(await tools.get('kb_contributions').execute({contribution_id:'con_test'},{}));
  const first=await lookup();assert.equal(first.in_review_queue,true);
  status='rejected';const next=await lookup();assert.equal(calls,2);assert.equal(next.status,'rejected');assert.equal(next.status_label,'已拒绝');assert.equal(next.in_review_queue,false);assert.equal(next.review_note,'测试用');assert.equal(next.events[0].action,'reject');assert.ok(next.checked_at);
});
test('contribution list distinguishes pending from final states',async()=>{
 const tools=new Map();registerTools({tools:{register:t=>tools.set(t.name,t)}},defineTool,async()=>({total:3,items:[{status:'pending'},{status:'rejected'},{status:'published'}]}),()=>config);
 const out=JSON.parse(await tools.get('kb_contributions').execute({},{}));assert.deepEqual(out.items.map(v=>v.in_review_queue),[true,false,false]);assert.equal(out.total,3);
});
