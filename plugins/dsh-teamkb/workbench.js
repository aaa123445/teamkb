// Owner-only Harness RPC; credentials and outbound requests remain on the Host.
export async function workbenchQuery(api, input, signal) {
  if (!input || typeof input !== 'object') throw new Error('请求格式无效');
  switch (input.action) {
    case 'stats': return api('/api/v1/stats', {signal});
    case 'categories': return api('/api/v1/categories', {signal});
    case 'search': {
      const query = String(input.query || '').trim();
      if (!query || query.length > 500) throw new Error('请输入 1–500 字符的检索词');
      return api('/api/v1/search', {method:'POST', body:{query, category_id:String(input.category_id || ''), limit:10}, signal});
    }
    case 'read': {
      const id = String(input.id || '').trim();
      if (!id || id.length > 500) throw new Error('请输入有效的文档 ID');
      const offset = input.offset ?? 0;
      if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('阅读偏移量无效');
      return api('/api/v1/read', {method:'POST', body:{id, offset}, signal});
    }
    case 'calls': {
      const page = input.page ?? 1;
      if (!Number.isInteger(page) || page < 1 || page > 100000) throw new Error('日志页码无效');
      return api('/api/v1/account/calls?' + new URLSearchParams({page:String(page), page_size:'10'}), {signal});
    }
    case 'call': {
      if (!Number.isSafeInteger(input.id) || input.id < 1) throw new Error('日志 ID 无效');
      return api('/api/v1/account/calls/' + input.id, {signal});
    }
    default: throw new Error('不支持的工作台操作');
  }
}

export function registerWorkbench(ctx, api) {
  ctx.inject(['connection'], child => {
    // Exact Connection routes require an authenticated owner on Desktop and Web.
    child.effect(() => child.connection.fetch.register({
      path:'/api/teamkb/query', methods:['POST'], requestBody:'buffered',
      fetch: async request => {
        let envelope;
        try { envelope = await request.json(); } catch { return new Response('Invalid JSON', {status:400}); }
        if (envelope?.type !== 'client-request' || envelope.method !== 'teamkb/query' || typeof envelope.rpcId !== 'string')
          return new Response('Invalid request', {status:400});
        let result;
        try { result = {ok:true, value:await workbenchQuery(api, envelope.payload, request.signal)}; }
        catch (error) { result = {ok:false, error:{code:'teamkb/request-failed', message:error.message || 'TeamKB 请求失败', details:{}}}; }
        return Response.json({type:'server-response',rpcId:envelope.rpcId,result}, {headers:{'Cache-Control':'no-store'}});
      },
    }), 'TeamKB: owner-only workbench');
  });
}
