import {Workbench, WorkbenchIcon} from './workbench-client.js';
import React, { useState, useSyncExternalStore } from 'react';

export const name = 'teamkb-settings';
export const inject = ['slots', 'configForms', 'connection'];
const h = React.createElement;
const style = {display: 'grid', gap: 16, maxWidth: 640, padding: 20};

function TeamKBSettings({form, view}) {
  const [url, setUrl] = useState(null);
  const [key, setKey] = useState('');
  const [clearKey, setClearKey] = useState(false);
  const [contribute, setContribute] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (view === 'summary') return '团队知识检索、规范与已验证经验沉淀';
  const state = form?.state;
  const value = state?.value ?? {};
  async function save(event) {
    event.preventDefault();
    if (!form) return;
    setBusy(true); setMessage('');
    const ops = [];
    if (url !== null) ops.push({op: 'set', path: ['serverUrl'], value: url.trim()});
    if (contribute !== null) ops.push({op: 'set', path: ['allowContributions'], value: contribute});
    if (clearKey || key) ops.push({op: 'set', path: ['apiKey'], value: clearKey ? '' : key.trim()});
    try {
      const result = await form.mutate(ops, state.revision);
      if (result === false) throw new Error('保存被拒绝');
      setKey(''); setClearKey(false); setUrl(null); setContribute(null);
      setMessage('设置已保存。新建会话，用 kb_stats 测试真实连接；保存成功不代表联网成功。');
    } catch { setMessage('保存失败，请刷新插件设置并重试；未覆盖其他配置。'); }
    finally { setBusy(false); }
  }
  const field = (title, input) => h('label', {style: {display: 'grid', gap: 8}}, title, input);
  return h('form', {style, onSubmit: save},
    h('h3', null, 'TeamKB 团队知识库'),
    h('p', null, 'Desktop 与 Web 共用宿主连接；无需 Python、MCP 或项目初始化。'),
    field('服务地址', h('input', {type: 'url', value: url ?? value.serverUrl ?? 'https://www.ljc.monster', onChange: e => setUrl(e.target.value), required: true})),
    field('个人 API Key', h('input', {type: 'password', autoComplete: 'new-password', value: key, onChange: e => {setKey(e.target.value); setClearKey(false);}, placeholder: '留空保留已有 Key；宿主也可使用 TEAMKB_KEY'})),
    field('清除已保存的 Key（清除后可读取宿主环境变量）', h('input', {type: 'checkbox', checked: clearKey, onChange: e => {setClearKey(e.target.checked); setKey('');}})),
    field('任务完成后允许按需提交已验证知识（需要 writer 权限）', h('input', {type: 'checkbox', checked: contribute ?? value.allowContributions ?? false, onChange: e => setContribute(e.target.checked)})),
    h('p', null, '提交默认待管理员审核；仅上传脱敏、已验证且可复用的知识。Key 通过 Harness 的 secret 配置字段保存，不写入浏览器 localStorage。远程 Web 用户请使用各自独立的 Harness profile。'),
    h('button', {type: 'submit', disabled: busy || !state?.writable}, busy ? '保存中…' : '保存设置'),
    h('p', {role: 'status'}, message),
    h('a', {href: 'https://www.ljc.monster/#/guide', target: '_blank', rel: 'noreferrer'}, '使用说明'),
  );
}

export function apply(ctx) {
  // The owner passes its live form, revision fence and mutation channel.
  const controller = ctx.configForms.get('teamkb');
  const subscribe = listener => controller.subscribe(listener);
  const snapshot = () => controller.getSnapshot();
  function BundleSettings(props) {
    const state = useSyncExternalStore(subscribe, snapshot, snapshot);
    return h(TeamKBSettings, {...props, form: {state, mutate: (ops, revision) => controller.mutate(ops, revision)}});
  }
  const query = async (input, signal) => {
    const result = await ctx.connection.rpc.call('/api', 'teamkb/query', input, signal);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  };
  ctx.slots.inject('main', () => ctx.slots.register({
    name:'main', key:'teamkb-workbench', inject:()=>({query, Settings:BundleSettings}),
  }, Workbench));
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name:'sidebar.panellist', id:'teamkb-workbench', order:15, label:()=> 'TeamKB 知识库',
  }, WorkbenchIcon));
  // Expose settings on the bundle page as well as its individual row.
  ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
    name: 'plugins.bundle.config', key: 'dsh-teamkb',
  }, BundleSettings));
  ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
    name: 'plugins.row.config', key: 'dsh-teamkb#teamkb',
  }, TeamKBSettings));
}
