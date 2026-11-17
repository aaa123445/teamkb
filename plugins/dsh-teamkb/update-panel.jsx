import React, { useEffect, useState, useRef } from "react";
export function UpdatePanel({ query }) {
  const [release, setRelease] = useState(null),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [result, setResult] = useState(null);
  const control = useRef(null),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    check();
    return () => {
      mounted.current = false;
      control.current?.abort();
    };
  }, []);
  async function check() {
    if (!query) return;
    const c = new AbortController();
    control.current = c;
    setBusy("checking");
    setError("");
    try {
      const v = await query({ action: "check-update" }, c.signal);
      if (mounted.current) setRelease(v);
    } catch (e) {
      if (mounted.current && !c.signal.aborted) setError(e.message);
    } finally {
      if (mounted.current) setBusy("");
    }
  }
  async function update() {
    if (!release || busy) return;
    setBusy("installing");
    setError("");
    try {
      const v = await query({
        action: "install-update",
        version: release.latest_version,
        sha256: release.sha256,
      });
      if (mounted.current) setResult(v);
    } catch (e) {
      if (mounted.current)
        setError(
          e.message || "更新结果未确认，请重新打开插件页检查；不要重复更新",
        );
    } finally {
      if (mounted.current) setBusy("");
    }
  }
  return (
    <section className="tkb-update-panel" aria-label="插件更新">
      <div className="tkb-section-head">
        <div>
          <h2>插件更新</h2>
          <p className="tkb-muted">
            当前运行 {release?.current_version || "0.1.7"}
            {release?.latest_version && ` · 最新 ${release.latest_version}`}
          </p>
        </div>
        <button
          type="button"
          className="tkb-button"
          onClick={check}
          disabled={!!busy}
        >
          {busy === "checking" ? "检查中…" : "检查更新"}
        </button>
      </div>
      {error && (
        <p role="alert" className="tkb-update-error">
          {error}
        </p>
      )}
      {release?.restart_pending && !result ? (
        <p role="status">
          版本 {release.installed_version} 已安装，请重启当前宿主后生效。
        </p>
      ) : result?.application === "restart-required" ? (
        <p role="status">{result.message}</p>
      ) : (
        <>
          {release?.available ? (
            <>
              <p>
                发现新版本 {release.latest_version}。{release.notes}
              </p>
              <button
                type="button"
                className="tkb-button tkb-primary"
                disabled={!!busy || !release.can_update}
                onClick={update}
              >
                {busy === "installing" ? "正在安装，请勿关闭…" : "立即更新"}
              </button>
              {!release.can_update && (
                <p className="tkb-muted">
                  当前宿主没有可管理的 profile，请从宿主插件页更新。
                </p>
              )}
            </>
          ) : (
            release && (
              <p role="status" className="tkb-muted">
                当前已是最新版本。
              </p>
            )
          )}
        </>
      )}
      <p className="tkb-muted">
        从本站下载并校验。保留 Key
        与设置，安装后重启当前宿主生效，不会自动中断会话。
      </p>
    </section>
  );
}
