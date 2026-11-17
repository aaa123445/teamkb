import { UIStyle } from "./ui-style.js";
import React, { useState, useEffect, useRef } from "react";

export function WorkbenchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1V5Zm9 1v15" />
    </svg>
  );
}
function LogDetail({ value, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    const previousFocus = document.activeElement;
    node.showModal();
    return () => {
      if (node.open) node.close();
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="tkb-detail-dialog"
      aria-labelledby="tkb-detail-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <header className="tkb-detail-head">
        <div>
          <h2 id="tkb-detail-title">调用详情</h2>
          <p className="tkb-muted">记录 #{value.id ?? "—"}</p>
        </div>
        <Button onClick={onClose} autoFocus>
          关闭
        </Button>
      </header>
      <div className="tkb-detail-body">
        <pre>{JSON.stringify(value, null, 2)}</pre>
      </div>
    </dialog>
  );
}
const Button = ({ children, primary = false, ...props }) => (
  <button
    type="button"
    className={`tkb-button${primary ? " tkb-primary" : ""}`}
    {...props}
  >
    {children}
  </button>
);
export function Workbench({ query, Settings }) {
  const [tab, setTab] = useState("search"),
    [categories, setCategories] = useState([]),
    [category, setCategory] = useState(""),
    [filter, setFilter] = useState(""),
    [text, setText] = useState(""),
    [stats, setStats] = useState(null),
    [results, setResults] = useState(null),
    [doc, setDoc] = useState(null),
    [logs, setLogs] = useState(null),
    [detail, setDetail] = useState(null),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const controller = useRef(null);
  async function run(input, accept) {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError("");
    try {
      const value = await query(input, abort.signal);
      if (!abort.signal.aborted) accept(value);
    } catch (e) {
      if (!abort.signal.aborted) setError(e.message || "宿主连接失败，请重试");
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  // The first view loads classifications once, without extra user clicks or repeated calls on tab switches.
  useEffect(() => {
    run({ action: "categories" }, (v) => setCategories(v.categories || []));
    return () => controller.current?.abort();
  }, []);
  const loadLogs = (n) =>
    run({ action: "calls", page: n }, (v) => {
      setLogs(v);
      setPage(n);
      setDetail(null);
    });
  function switchTab(id) {
    controller.current?.abort();
    setBusy(false);
    setError("");
    setTab(id);
    if (id === "logs" && !logs) loadLogs(1);
  }
  const selected = categories.find((x) => x.id === category),
    visible = categories.filter((x) =>
      (x.path || x.name || "").toLowerCase().includes(filter.toLowerCase()),
    );
  return (
    <section className="teamkb-ui tkb-workbench" aria-label="TeamKB 工作台">
      <UIStyle />
      <header className="tkb-header">
        <div className="tkb-brand">
          <span className="tkb-brand-icon">
            <WorkbenchIcon />
          </span>
          <div>
            <h1>TeamKB 工作台</h1>
            <p>团队知识，随手可得</p>
          </div>
        </div>
        <div className="tkb-header-actions">
          {stats && (
            <span className="tkb-stat">
              <strong>{stats.documents ?? "—"}</strong> 篇文档
            </span>
          )}
          <Button
            onClick={() => run({ action: "stats" }, setStats)}
            disabled={busy}
          >
            连接测试
          </Button>
        </div>
      </header>
      <nav className="tkb-tabs" aria-label="TeamKB 功能">
        {[
          ["search", "知识查询"],
          ["logs", "调用日志"],
          ["settings", "连接配置"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => switchTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="tkb-scroll">
        <div className="tkb-body">
          {error && (
            <div className="tkb-alert" role="alert">
              {error}
            </div>
          )}
          {busy && (
            <div className="tkb-loading" role="status">
              <span />
              正在查询…
            </div>
          )}
          {tab === "settings" && (
            <div className="tkb-settings">
              <Settings />
            </div>
          )}
          {tab === "search" && (
            <div className="tkb-search-layout">
              <aside className="tkb-directory">
                <div className="tkb-section-head">
                  <h2>知识分类</h2>
                  <button
                    className="tkb-text-button"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run({ action: "categories" }, (v) =>
                        setCategories(v.categories || []),
                      )
                    }
                  >
                    刷新
                  </button>
                </div>
                <input
                  aria-label="筛选分类"
                  placeholder="查找分类…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <div className="tkb-directory-list">
                  <button
                    type="button"
                    aria-pressed={!category}
                    onClick={() => {
                      setCategory("");
                      setDoc(null);
                      setResults(null);
                    }}
                  >
                    全部知识<span>{categories.length}</span>
                  </button>
                  {visible.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      title={item.path || item.name}
                      aria-pressed={category === item.id}
                      style={{
                        paddingInlineStart:
                          12 +
                          Math.min(
                            3,
                            Math.max(
                              0,
                              (item.path || "").split(" / ").length - 1,
                            ),
                          ) *
                            10,
                      }}
                      onClick={() => {
                        setCategory(item.id);
                        setDoc(null);
                        setResults(null);
                      }}
                    >
                      <span className="tkb-category-name">
                        {item.name || item.path}
                      </span>
                      {item.doc_count != null && <span>{item.doc_count}</span>}
                    </button>
                  ))}
                  {filter && !visible.length && (
                    <p className="tkb-muted">没有匹配的分类</p>
                  )}
                </div>
              </aside>
              <main className="tkb-entry">
                <section className="tkb-search-card">
                  <div className="tkb-section-head">
                    <h2>
                      {selected
                        ? selected.name || selected.path
                        : "搜索团队知识"}
                    </h2>
                    <span className="tkb-muted">关键词检索</span>
                  </div>
                  <form
                    className="tkb-search-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setDoc(null);
                      run(
                        {
                          action: "search",
                          query: text,
                          category_id: category,
                        },
                        setResults,
                      );
                    }}
                  >
                    <input
                      aria-label="知识关键词"
                      placeholder="搜索解决方案、开发规范、技术文档…"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      required
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      className="tkb-button tkb-primary"
                      disabled={busy}
                    >
                      搜索
                    </button>
                  </form>
                </section>
                {!results && !doc && (
                  <div className="tkb-empty">
                    <span className="tkb-empty-icon">
                      <WorkbenchIcon />
                    </span>
                    <h2>让经验成为下一次的答案</h2>
                    <p>
                      输入关键词，从团队已经验证的知识开始。
                      <br />
                      左侧分类帮助你缩小搜索范围。
                    </p>
                  </div>
                )}
                {results && !doc && (
                  <section aria-label="搜索结果">
                    <div className="tkb-results-heading">
                      找到 {results.count ?? results.results?.length ?? 0}{" "}
                      条结果
                    </div>
                    <div className="tkb-results">
                      {(results.results || []).map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          className="tkb-result"
                          onClick={() =>
                            run({ action: "read", id: item.id }, setDoc)
                          }
                        >
                          <span className="tkb-result-title">
                            {item.title || item.id}
                            <span aria-hidden="true">↗</span>
                          </span>
                          <span className="tkb-result-summary">
                            {item.snippet ||
                              item.summary ||
                              item.path ||
                              "查看文档原文"}
                          </span>
                          <span className="tkb-result-id">{item.id}</span>
                        </button>
                      ))}
                    </div>
                    {!results.results?.length && (
                      <div className="tkb-empty">
                        <h2>没有找到相关知识</h2>
                        <p>换一组关键词，或选择其他分类再试。</p>
                      </div>
                    )}
                  </section>
                )}
                {doc && (
                  <article className="tkb-document" aria-label="知识正文">
                    <div className="tkb-section-head">
                      <button
                        type="button"
                        className="tkb-text-button"
                        onClick={() => setDoc(null)}
                      >
                        ← 返回结果
                      </button>
                      <span className="tkb-muted">
                        版本 {doc.knowledge_version ?? "—"}
                      </span>
                    </div>
                    <h2>{doc.title}</h2>
                    <p className="tkb-result-id">{doc.id}</p>
                    <pre>{doc.content}</pre>
                    {doc.truncated && (
                      <Button
                        onClick={() =>
                          run(
                            {
                              action: "read",
                              id: doc.id,
                              offset: doc.next_offset,
                            },
                            (v) =>
                              setDoc({
                                ...v,
                                content: doc.content + v.content,
                              }),
                          )
                        }
                        disabled={busy}
                      >
                        继续阅读
                      </Button>
                    )}
                  </article>
                )}
              </main>
            </div>
          )}
          {tab === "logs" && (
            <section className="tkb-logs">
              <div className="tkb-section-head">
                <div>
                  <h2>个人调用记录</h2>
                  <p className="tkb-muted">仅显示当前个人 Key 有权查看的记录</p>
                </div>
                <Button onClick={() => loadLogs(page)} disabled={busy}>
                  刷新
                </Button>
              </div>
              <div className="tkb-log-list">
                {logs?.logs?.length === 0 && (
                  <div className="tkb-empty">
                    <h2>暂无调用记录</h2>
                    <p>检索或阅读知识后，可在这里查看调用结果。</p>
                  </div>
                )}
                {(logs?.logs || []).map((log) => (
                  <button
                    type="button"
                    className="tkb-log-row"
                    key={log.id}
                    aria-haspopup="dialog"
                    onClick={() =>
                      run({ action: "call", id: log.id }, setDetail)
                    }
                  >
                    <span className="tkb-log-operation">
                      {log.operation}
                      <span
                        className="tkb-pill"
                        data-failed={log.status_code >= 400}
                      >
                        HTTP {log.status_code}
                      </span>
                    </span>
                    <span className="tkb-log-summary">
                      {log.result_summary || log.request_summary || "知识调用"}
                    </span>
                    <span className="tkb-log-time">
                      {new Date(log.ts * 1000).toLocaleString()}
                      <br />
                      {Math.round(log.duration_ms)} ms →
                    </span>
                  </button>
                ))}
              </div>
              <div className="tkb-pagination">
                <span className="tkb-muted">
                  第 {page} 页 · 共 {logs?.total ?? 0} 条
                </span>
                <div>
                  <Button
                    onClick={() => loadLogs(page - 1)}
                    disabled={busy || page <= 1}
                  >
                    上一页
                  </Button>
                  <Button
                    onClick={() => loadLogs(page + 1)}
                    disabled={busy || !logs || page * 10 >= logs.total}
                  >
                    下一页
                  </Button>
                </div>
              </div>
              {detail && (
                <LogDetail value={detail} onClose={() => setDetail(null)} />
              )}
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
