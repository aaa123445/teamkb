// Owner-only, fixed-origin updates through Harness's public package-operation API.
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
export const CURRENT_VERSION = "0.1.7";
export const RELEASE_ORIGIN = "https://www.ljc.monster";
const version = (v) => /^\d+\.\d+\.\d+$/.test(v);
export function newer(a, b) {
  const x = a.split(".").map(Number),
    y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] > y[i];
  }
  return false;
}
async function download(address, limit, signal, fetcher) {
  for (let attempt = 0; attempt < 3; attempt++) {
    signal?.throwIfAborted();
    try {
      const r = await fetcher(address, {
        redirect: "error",
        cache: "no-store",
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(30000)])
          : AbortSignal.timeout(30000),
      });
      if (!r.ok) {
        await r.body?.cancel();
        if (r.status < 500 && r.status !== 429) throw new Error("permanent");
        throw new Error("retry");
      }
      const parts = [];
      let size = 0;
      for await (const part of r.body) {
        size += part.length;
        if (size > limit) throw new Error("oversize");
        parts.push(part);
      }
      return Buffer.concat(parts);
    } catch (e) {
      signal?.throwIfAborted();
      if (e.message === "oversize") throw new Error("更新文件超过大小限制");
      if (attempt === 2 || e.message === "permanent")
        throw new Error("无法下载更新，请检查宿主网络、代理或证书，未修改插件");
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
}
export function createUpdater(ctx, { fetcher = fetch, runPackage } = {}) {
  let running = false;
  async function check(signal) {
    const raw = await download(
      RELEASE_ORIGIN + "/static/downloads/dsh-release.json",
      65536,
      signal,
      fetcher,
    );
    let m;
    try {
      m = JSON.parse(raw);
    } catch {
      throw new Error("更新清单格式无效");
    }
    if (
      m.name !== "dsh-teamkb" ||
      !version(m.version) ||
      m.file !== `dsh-teamkb-${m.version}.tgz` ||
      !/^[a-f0-9]{64}$/.test(m.sha256)
    )
      throw new Error("更新清单校验信息无效");
    const profile = ctx.get?.("profileContext");
    let installedVersion = CURRENT_VERSION;
    if (profile?.dir)
      try {
        const saved = JSON.parse(
          await readFile(
            join(profile.dir, "node_modules/dsh-teamkb/package.json"),
            "utf8",
          ),
        );
        if (saved.name === "dsh-teamkb" && version(saved.version))
          installedVersion = saved.version;
      } catch {}
    return {
      current_version: CURRENT_VERSION,
      installed_version: installedVersion,
      restart_pending: newer(installedVersion, CURRENT_VERSION),
      latest_version: m.version,
      available: newer(m.version, installedVersion),
      file: m.file,
      sha256: m.sha256,
      notes: typeof m.notes === "string" ? m.notes.slice(0, 1500) : "",
      checked_at: new Date().toISOString(),
      can_update: !!(profile?.dir && profile?.installAnchor),
      restart_required: true,
    };
  }
  async function install(input, signal) {
    if (running) throw new Error("更新正在进行，请勿重复点击");
    running = true;
    try {
      const m = await check(signal);
      if (!m.available)
        return {
          ...m,
          application: m.restart_pending ? "restart-required" : "up-to-date",
          message: m.restart_pending
            ? "更新已安装，请重启当前 Harness 宿主后生效。"
            : "当前已是最新版本",
        };
      if (input.version !== m.latest_version || input.sha256 !== m.sha256)
        throw new Error("版本信息已变化，请重新检查更新后再安装");
      const profile = ctx.get?.("profileContext");
      if (!m.can_update)
        throw new Error("当前宿主没有可管理的 profile，请从插件管理页更新");
      const bytes = await download(
        RELEASE_ORIGIN + "/static/downloads/" + m.file + "?sha256=" + m.sha256,
        8 * 1024 * 1024,
        signal,
        fetcher,
      );
      if (createHash("sha256").update(bytes).digest("hex") !== m.sha256)
        throw new Error("安装包 SHA-256 不匹配，已停止，未修改插件");
      // Keep verified packages: the profile dependency points to this private file on restart.
      const dir = join(profile.dir, ".teamkb-updates");
      await mkdir(dir, { recursive: true, mode: 0o700 });
      const target = join(dir, m.file);
      await writeFile(target, bytes, { mode: 0o600 });
      const run =
        runPackage ||
        (await import("@deepseek-ai/dsh-plugin-manager/operations"))
          .runProfilePnpm;
      const result = await run(
        { ...profile, profile: profile.name },
        ["add", target, "--save-exact", "--ignore-scripts"],
        {
          execution: "service",
          ...profile.packageManager,
          signal,
          outputBytes: 16384,
          activateNewBundles: false,
          idleTimeoutMs: 60000,
          lookupTimeoutMs: 30000,
          expected: { name: "dsh-teamkb", version: m.latest_version },
        },
      );
      if (result.exitCode !== 0)
        throw new Error(
          "宿主安装未完成，请到插件管理页查看诊断后重试；未标记更新成功",
        );
      const pkg = JSON.parse(
        await readFile(
          join(profile.dir, "node_modules/dsh-teamkb/package.json"),
          "utf8",
        ),
      );
      if (pkg.name !== "dsh-teamkb" || pkg.version !== m.latest_version)
        throw new Error("安装后的版本核对失败，请到插件管理页检查");
      return {
        ...m,
        application: "restart-required",
        installed_version: pkg.version,
        message:
          "安装完成。请保存任务并完全退出、重启当前 Harness Desktop 或 Web 服务后生效；Key 和插件设置保留。",
      };
    } finally {
      running = false;
    }
  }
  return { check, install };
}
