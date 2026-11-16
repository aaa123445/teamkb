import React, {useState, useEffect, useRef} from 'react';
const h = React.createElement;
const button = {padding:'8px 14px', border:'1px solid #80808055', borderRadius:8, background:'transparent', color:'inherit', cursor:'pointer'};
const card = {border:'1px solid #80808044', borderRadius:12, padding:18, marginBottom:12};
const inputStyle = {...button, width:'100%', boxSizing:'border-box'};
export function Workbench({query, Settings}) {
  const [tab,setTab]=useState('search');
  const [categories,setCategories]=useState([]);
  const [category,setCategory]=useState('');
  const [text,setText]=useState('');
  const [stats,setStats]=useState(null);
  const [results,setResults]=useState(null);
  const [document,setDocument]=useState(null);
  const [logs,setLogs]=useState(null);
  const [detail,setDetail]=useState(null);
  const [page,setPage]=useState(1);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const controller=useRef(null);
  useEffect(()=>()=>controller.current?.abort(),[]);
  async function run(input, accept) {
    controller.current?.abort(); const abort=new AbortController();controller.current=abort;
    setBusy(true);setError('');
    try { const value=await query(input,abort.signal);if(!abort.signal.aborted)accept(value); }
    catch(e){if(!abort.signal.aborted)setError(e.message || 'Harness 宿主连接失败，请重试');}
    finally {if(!abort.signal.aborted)setBusy(false);}
  }
  const btn=(label,onClick,props={})=>h('button',{type:'button',style:button,onClick,disabled:busy,...props},label);
  const loadLogs=number=>run({action:'calls',page:number},value=>{setLogs(value);setPage(number);setDetail(null);});
  return h('section',{style:{padding:24,maxWidth:1040,margin:'0 auto',height:'100%',overflowY:'auto',boxSizing:'border-box'}},
    h('header',{style:{marginBottom:24}},h('h1',null,'TeamKB 工作台'),h('p',null,'检索团队知识、核对原文，查看当前 Key 的调用记录。')),
    h('nav',{'aria-label':'TeamKB 功能',style:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}},
      ...[['search','知识查询'],['logs','调用日志'],['settings','连接配置']].map(([id,label])=>btn(label,()=>{controller.current?.abort();setBusy(false);setError('');setTab(id);if(id==='logs')loadLogs(1);},{key:id,'aria-pressed':tab===id,style:{...button,background:tab===id?'#2563eb':'transparent',color:tab===id?'white':'inherit'}}))),
    error?h('p',{role:'alert',style:{...card,color:'#d45454'}},error):null,
    busy?h('p',{role:'status'},'正在通过宿主查询…'):null,
    tab==='settings'?h(Settings):null,
    tab==='search'?h(React.Fragment,null,
      h('div',{style:card},h('div',{style:{display:'flex',gap:8,alignItems:'center'}},btn('连接测试 / 统计',()=>run({action:'stats'},setStats)),stats?h('span',null,`文档 ${stats.documents} · 词条 ${stats.terms ?? '—'}`):null),
        h('div',{style:{marginTop:14}},btn('加载分类',()=>run({action:'categories'},value=>setCategories(value.categories||[]))),h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',maxHeight:160,overflowY:'auto',marginTop:10},'aria-label':'知识分类'},...([{id:'',path:'全部分类'},...categories]).map(item=>btn(item.path||item.name,()=>setCategory(item.id),{key:item.id,'aria-pressed':category===item.id,style:{...button,fontWeight:category===item.id?700:400}})))),
        h('form',{onSubmit:e=>{e.preventDefault();setDocument(null);run({action:'search',query:text,category_id:category},setResults);},style:{display:'flex',gap:8,marginTop:14}},
          h('input',{style:inputStyle,'aria-label':'知识关键词',placeholder:'输入关键词搜索知识',value:text,onChange:e=>setText(e.target.value),required:true,maxLength:500}),
          h('button',{style:button,disabled:busy,type:'submit'},'搜索'))),
      results?h('div',null,h('p',null,`找到 ${results.count ?? results.results?.length ?? 0} 条结果`),...(results.results||[]).map(item=>h('article',{key:item.id,style:card},h('h3',null,btn(item.title||item.id,()=>run({action:'read',id:item.id},setDocument))),h('small',null,item.id),h('p',null,item.snippet||item.summary||item.path||'')))):null,
      document?h('article',{style:card,'aria-label':'知识正文'},h('h2',null,document.title),h('small',null,`${document.id} · 版本 ${document.knowledge_version??'—'}`),h('pre',{style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:'inherit',lineHeight:1.8}},document.content),document.truncated?btn('继续阅读',()=>run({action:'read',id:document.id,offset:document.next_offset},value=>setDocument({...value,content:document.content+value.content}))):null):null
    ):null,
    tab==='logs'?h('div',null,
      h('div',{style:{display:'flex',gap:8,marginBottom:16}},btn('刷新日志',()=>loadLogs(page)),btn('上一页',()=>loadLogs(page-1),{disabled:busy||page<=1}),h('span',null,`第 ${page} 页 · 共 ${logs?.total??0} 条`),btn('下一页',()=>loadLogs(page+1),{disabled:busy||!logs||page*10>=logs.total})),
      h('p',null,'按当前个人 Key 隔离；日志保留期限与服务端一致。'),
      logs?.logs?.length===0?h('p',null,'暂无调用记录。'):null,
      ...(logs?.logs||[]).map(log=>h('article',{style:card,key:log.id},h('div',null,btn(`${log.operation} · HTTP ${log.status_code}`,()=>run({action:'call',id:log.id},setDetail))),h('small',null,`${new Date(log.ts*1000).toLocaleString()} · ${Math.round(log.duration_ms)} ms`),h('p',null,log.request_summary),h('p',null,log.result_summary))),
      detail?h('article',{style:card,'aria-label':'调用详情'},h('h3',null,'调用详情'),h('pre',{style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}},JSON.stringify(detail,null,2))):null
    ):null);
}
export function WorkbenchIcon(){return h('svg',{viewBox:'0 0 24 24',width:20,height:20,fill:'none',stroke:'currentColor',strokeWidth:1.7,'aria-hidden':true},h('path',{d:'M3 5c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1V5Zm9 1v15'}));}
