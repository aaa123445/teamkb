import { setTimeout as pause } from 'node:timers/promises';

export class TeamKBError extends Error {
  constructor(message) { super(message); this.name = 'TeamKBError'; }
}

export function validateEndpoint(value) {
  let url;
  try { url = new URL(value); } catch { throw new TeamKBError('TeamKB 服务地址无效'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
    throw new TeamKBError('服务地址必须是不含凭据、查询参数和片段的 HTTP(S) URL');
  return url.href.replace(/\/$/, '');
}

export async function request(config, path, { method = 'GET', body, signal, readOnly = true, fetcher = fetch, sleep = pause } = {}) {
  const base = validateEndpoint(config.serverUrl);
  const key = config.apiKey || process.env.TEAMKB_KEY || '';
  if (!key) throw new TeamKBError('请在 TeamKB 插件设置中填写个人 API Key，或在 Harness 宿主设置 TEAMKB_KEY');
  if (/[\r\n]/.test(key)) throw new TeamKBError('个人 Key 格式无效');
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    signal?.throwIfAborted();
    const timeout = AbortSignal.timeout(config.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    let response;
    try {
      response = await fetcher(base + path, {
        method, headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'X-V8WB-Client': 'api' },
        body: body === undefined ? undefined : JSON.stringify(body), signal: combined, redirect: 'error',
      });
    } catch {
      signal?.throwIfAborted();
      if (readOnly && attempt < config.maxRetries) {
        await sleep(2 ** attempt * 1000, undefined, { signal });
        continue;
      }
      throw new TeamKBError(readOnly ? '连接失败，已完成有限重试；请检查 Harness 宿主网络、代理与证书' : '提交未确认，请先用 kb_contributions 检查状态；为避免重复提交，未自动重发');
    }
    if ([502, 503, 504].includes(response.status) && readOnly && attempt < config.maxRetries) {
      await response.body?.cancel();
      await sleep(2 ** attempt * 1000, undefined, { signal });
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      const hints = {401: '个人 Key 无效或已吊销', 403: '账号尚未批准或 Key 权限不足', 429: '调用额度已用尽，请稍后重试', 409: '知识版本冲突，请重新读取原文', 422: '提交字段不完整，请核对分类、正文和验证材料'};
      throw new TeamKBError(`TeamKB HTTP ${response.status}：${hints[response.status] || '请求失败，请检查服务状态'}`);
    }
    try { return await response.json(); } catch { throw new TeamKBError('TeamKB 返回的内容不是有效 JSON'); }
  }
}
