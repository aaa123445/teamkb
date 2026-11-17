<script setup>
import AppSelect from "../components/ui/AppSelect.vue";
import {
  computed,
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { useRoute } from "vue-router";
import {
  PlugZap,
  Copy,
  Check,
  ArrowRight,
  KeyRound,
  LoaderCircle,
  RefreshCw,
} from "lucide-vue-next";
import { currentUser } from "../composables/session";
import { apiKey, notify } from "../composables/workspace";
import { takeConnectionKey } from "../composables/connection";
import { post } from "../services/api";
import {
  connectionPrompt,
  installationCommand,
  modes,
  scopes,
} from "../services/connectionPrompt";
import "../styles/connect.css";
const route = useRoute();
const mode = ref(
  modes.some((m) => m.id === route.query.mode)
    ? route.query.mode
    : "recommended",
);
const agent = ref(
  ["codex", "claudecode", "other", "dsh"].includes(route.query.agent)
    ? route.query.agent
    : "codex",
);
const dshProfile = ref("web");
const platform = ref("posix");
const availableModes = computed(() =>
  modes.filter(
    (m) => m.id !== "plugin" || ["codex", "claudecode"].includes(agent.value),
  ),
);
const availableScopes = computed(() =>
  scopes.filter(
    (s) =>
      !(
        mode.value === "plugin" &&
        agent.value === "codex" &&
        s.id === "project"
      ),
  ),
);
watch([agent, mode], () => {
  if (mode.value === "plugin" && !["codex", "claudecode"].includes(agent.value))
    mode.value = "recommended";
  if (mode.value === "plugin" && agent.value === "codex") scope.value = "user";
});
const commandMode = computed(() => agent.value !== "other");
const instructionMode = computed(
  () => !["mcp", "recommended"].includes(mode.value),
);
const scope = ref(
  route.query.scope === "project" &&
    !(mode.value === "plugin" && agent.value === "codex")
    ? "project"
    : "user",
);
const key = ref(takeConnectionKey()),
  includeKey = ref(!!key.value),
  autoSubmit = ref(true);
const manifest = ref(null),
  loading = ref(false),
  error = ref(""),
  creating = ref(false),
  copied = ref(false);
const keyName = ref("本地 Agent 接入"),
  role = ref("reader");
const canCreate = computed(() => currentUser.value?.status === "approved");
const canWrite = computed(() =>
  ["writer", "admin"].includes(currentUser.value?.role),
);
const origin = window.location.origin;
const prompt = computed(() =>
  agent.value === "dsh"
    ? `dsh plugin --profile ${dshProfile.value} add ${origin}/static/downloads/dsh-teamkb-0.1.4.tgz`
    : manifest.value
      ? commandMode.value
        ? installationCommand({
            origin,
            agent: agent.value,
            scope: scope.value,
            mode: mode.value,
            autoSubmit: autoSubmit.value,
            manifest: manifest.value,
            platform: platform.value,
          })
        : connectionPrompt({
            origin,
            mode: mode.value,
            scope: scope.value,
            manifest: manifest.value,
            key: includeKey.value ? key.value.trim() : "",
            autoSubmit: autoSubmit.value,
          })
      : "",
);
const preview = computed(() =>
  !commandMode.value && includeKey.value && key.value.trim()
    ? prompt.value.replace(
        JSON.stringify(key.value.trim()),
        '"[个人 Key 已隐藏，复制时包含]"',
      )
    : prompt.value,
);
const controller = new AbortController();
let copyTimer;
async function loadManifest() {
  loading.value = true;
  error.value = "";
  try {
    const response = await fetch("/static/downloads/manifest.json", {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("无法读取客户端校验清单，请稍后重试。");
    const data = await response.json();
    // Validate all modes before enabling copy.
    connectionPrompt({ origin, mode: "recommended", manifest: data });
    installationCommand({
      origin,
      agent: "codex",
      scope: "user",
      mode: "cli",
      manifest: data,
    });
    manifest.value = data;
  } catch (e) {
    if (e.name !== "AbortError") error.value = e.message;
  } finally {
    loading.value = false;
  }
}
async function createKey() {
  creating.value = true;
  try {
    const result = await post(
      "/account/keys",
      { name: keyName.value.trim(), role: role.value },
      { key: "" },
    );
    key.value = result.key;
    includeKey.value = true;
    notify("专用 Key 已创建，复制提示词即可交给本地 Agent");
  } catch (e) {
    notify(e.message, "error");
  } finally {
    creating.value = false;
  }
}
async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(prompt.value);
    copied.value = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 3000);
    notify(
      commandMode.value
        ? "安装命令已复制，请在本机终端执行并按提示输入个人 Key"
        : includeKey.value && key.value.trim()
          ? "已复制含个人 Key 的安装提示词，请交给你信任的本地 Agent"
          : "安装提示词已复制，本地 Agent 会引导填写 Key",
    );
  } catch {
    notify("剪贴板不可用，请使用下方“选中提示词”手动复制", "error");
  }
}
const manualText = ref(null),
  manualCopy = ref(false);
async function selectPrompt() {
  manualCopy.value = true;
  await nextTick();
  manualText.value?.focus();
  manualText.value?.select();
}
watch(
  [agent, dshProfile, platform, mode, scope, key, includeKey, autoSubmit],
  () => {
    copied.value = false;
    manualCopy.value = false;
  },
);
onMounted(loadManifest);
onBeforeUnmount(() => {
  controller.abort();
  clearTimeout(copyTimer);
  key.value = "";
});
</script>
<template>
  <section class="connect-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow section-eyebrow">CONNECT YOUR LOCAL AGENT</div>
        <h1>一键接入</h1>
        <p>
          Codex / Claude Code 复制命令在终端安装，其他智能体使用安装提示词。
        </p>
      </div>
      <RouterLink to="/guide" class="button"
        >完整使用说明 <ArrowRight :size="15"
      /></RouterLink>
    </div>
    <div class="connect-banner">
      <span class="connect-logo"><PlugZap :size="30" /></span>
      <div>
        <h2>把团队知识带到你的开发现场</h2>
        <p>
          1 选择接入方式 <ArrowRight :size="13" /> 2 选择范围并配置 Key
          <ArrowRight :size="13" /> 3 执行命令或交给 Agent 安装
        </p>
      </div>
    </div>
    <div class="connect-layout">
      <div class="connect-settings">
        <section class="panel connect-panel">
          <h2><span class="connect-number">1</span>选择接入方式</h2>
          <label class="field"
            >本地智能体<AppSelect v-model="agent">
              <option value="codex">Codex · 一键安装命令</option>
              <option value="claudecode">Claude Code · 一键安装命令</option>
              <option value="dsh">DeepSeek Harness · GUI / Web 插件</option>
              <option value="other">其他智能体 · 提示词安装</option>
            </AppSelect></label
          >
          <label v-if="commandMode && agent !== 'dsh'" class="field"
            >终端系统<AppSelect v-model="platform">
              <option value="posix">macOS / Linux</option>
              <option value="windows">Windows PowerShell</option>
            </AppSelect></label
          >
          <div v-if="agent !== 'dsh'" class="connect-modes">
            <button
              v-for="item in availableModes"
              :key="item.id"
              :class="['connect-mode', { active: mode === item.id }]"
              :aria-pressed="mode === item.id"
              @click="mode = item.id"
            >
              <span
                ><strong>{{ item.title }}</strong
                ><Check v-if="mode === item.id" :size="17" /></span
              ><small>{{ item.description }}</small>
            </button>
          </div>
          <section v-if="agent === 'dsh'" class="connect-help">
            <h3>原生 Harness 插件</h3>
            <label class="field"
              >Harness profile<AppSelect v-model="dshProfile">
                <option value="web">Web</option>
                <option value="desktop">Desktop / GUI</option>
              </AppSelect></label
            >
            <p>
              复制安装命令，或在 Harness「插件 →
              添加插件」粘贴下面的域名包地址。安装后打开「TeamKB
              团队知识库」详情页配置，填写个人 Key。无需 Python 或项目初始化。
            </p>
            <a
              :href="origin + '/static/downloads/dsh-teamkb-0.1.4.tgz'"
              class="text-link"
              >下载 TeamKB 插件包 →</a
            >
            <p>地址：{{ origin }}/static/downloads/dsh-teamkb-0.1.4.tgz</p>
            <p>
              支持官方预览版 0.2.2 rc 系列；Desktop 和 Web 安装到各自实际使用的
              profile，提示重启时重启对应应用。贡献开关在 Harness
              插件设置中开启。
            </p>
          </section>
          <p v-if="mode === 'plugin'" class="connect-help">
            插件由宿主统一启停与管理，包含 9 个知识工具和工作流。与已有同名 MCP
            重复时，请先在宿主中禁用旧配置，避免重复启动。
          </p>
          <h3 v-if="agent !== 'dsh'" class="connect-scope-title">接入范围</h3>
          <div
            v-if="agent !== 'dsh'"
            class="connect-modes"
            role="group"
            aria-label="接入范围"
          >
            <button
              v-for="item in availableScopes"
              :key="item.id"
              :class="['connect-mode', { active: scope === item.id }]"
              :aria-pressed="scope === item.id"
              @click="scope = item.id"
            >
              <span
                ><strong>{{ item.title }}</strong
                ><Check v-if="scope === item.id" :size="17" /></span
              ><small>{{ item.description }}</small>
            </button>
          </div>
          <p v-if="agent !== 'dsh'" class="connect-help connect-init-note">
            {{
              scope === "user"
                ? "先运行 wb init --scope user 初始化用户配置，再注册全局 MCP / Skill。"
                : "先在项目根目录运行 wb init --scope project，再注册项目级 MCP / Skill。"
            }}连接范围与知识沉淀独立，提交知识无需开启项目候选或 Hook。
          </p>
          <div class="connect-server">
            <span>当前团队服务</span><code>{{ origin }}</code>
          </div>
        </section>
        <section v-if="agent !== 'dsh'" class="panel connect-panel">
          <h2><span class="connect-number">2</span>个人访问凭据</h2>
          <RouterLink v-if="commandMode" to="/account" class="text-link"
            >前往个人中心创建 Key →</RouterLink
          >
          <p v-if="commandMode" class="connect-help">
            安装命令不包含 Key。执行后在本机终端隐藏输入个人 API
            Key；项目接入还会询问项目路径。请先在个人中心创建 Key 并安全保存。
          </p>
          <template v-else>
            <p class="connect-help">
              可以先复制提示词，在本机填写 Key；也可在这里配置，随提示词一起交给
              Agent。
            </p>
            <label class="field"
              >已有个人 Key<input
                v-model="key"
                type="password"
                autocomplete="off"
                spellcheck="false"
                placeholder="粘贴个人 Key（可留空）"
            /></label>
            <button
              v-if="apiKey && !currentUser"
              class="text-link"
              @click="
                key = apiKey;
                includeKey = true;
              "
            >
              使用当前访问 Key
            </button>
            <label class="connect-check"
              ><input
                v-model="includeKey"
                type="checkbox"
                :disabled="!key.trim()"
              /><span
                >复制时包含个人 Key<small
                  >预览中隐藏；仅交给你信任的本地 Agent。页面不保存这里填写的
                  Key。</small
                ></span
              ></label
            >
            <details v-if="canCreate" class="connect-create">
              <summary><KeyRound :size="15" />创建接入专用 Key</summary>
              <form @submit.prevent="createKey">
                <label class="field"
                  >名称<input
                    v-model="keyName"
                    required
                    maxlength="80" /></label
                ><label class="field"
                  >权限<AppSelect v-model="role">
                    <option value="reader">reader · 检索与阅读</option>
                    <option v-if="canWrite" value="writer">
                      writer · 可提交经验
                    </option>
                  </AppSelect></label
                ><button class="button" :disabled="creating || !keyName.trim()">
                  <LoaderCircle
                    v-if="creating"
                    :size="15"
                    class="spin"
                  />创建并用于提示词
                </button>
                <p class="connect-help">
                  创建后勾选“包含个人
                  Key”。之后可在个人中心再次查看、复制或吊销。
                </p>
                <input
                  v-if="key"
                  :value="key"
                  type="password"
                  readonly
                  aria-label="本次接入 Key"
                />
              </form>
            </details>
            <RouterLink v-else to="/account" class="text-link"
              >{{
                currentUser
                  ? "账号审批通过后可创建个人 Key"
                  : "前往个人中心创建 Key"
              }}
              <ArrowRight :size="14"
            /></RouterLink>
          </template>
        </section>
        <section
          v-if="agent !== 'dsh' && !['mcp', 'recommended'].includes(mode)"
          class="panel connect-panel"
        >
          <h2>经验沉淀</h2>
          <label class="connect-check"
            ><input v-model="autoSubmit" type="checkbox" /><span
              >任务完成后按需提交知识<small
                >需要 writer 权限。写入 Agent
                持久化指令，无需项目初始化；仅提交验证、脱敏后的可复用知识，默认待审核。</small
              ></span
            ></label
          >
        </section>
      </div>
      <section class="panel connect-output">
        <div class="connect-output-heading">
          <div>
            <span class="eyebrow">READY FOR YOUR AGENT</span>
            <h2>
              <span class="connect-number">3</span
              >{{ commandMode ? "一键安装命令" : "安装提示词" }}
            </h2>
          </div>
          <span class="badge">{{
            agent === "dsh"
              ? "原生 GUI / Web 插件"
              : modes.find((m) => m.id === mode)?.title
          }}</span>
        </div>
        <p class="connect-help">
          {{
            agent === "dsh"
              ? "在 Harness 插件页粘贴包地址，或运行下面的 profile 安装命令。Key 在插件设置中填写；无需 Python、MCP 或项目初始化。"
              : mode === "plugin"
                ? "从本站下载并校验插件目录，自动安装到所选 Agent。包含 MCP 与 Skill，无需 Python，不修改系统提示词；重启 Agent 会话后验证工具。Codex 插件仅支持全局，Claude Code 支持全局或项目。"
                : commandMode
                  ? "在本机交互终端执行下方命令。安装器会检测系统、CPU、Agent 命令和网络，下载并校验 Go 原生客户端；不需要 Python 或 Node。macOS/Linux 追加 --check-only 仅检测；Windows 使用 -CheckOnly。CLI 直接合并 Agent 指令；MCP 仅注册工具，不修改系统提示词。"
                  : "复制提示词交给本地 Agent，它会识别系统与客户端、保留已有配置并验证连接。"
          }}
        </p>
        <div v-if="loading" class="connect-loading">
          <LoaderCircle :size="20" class="spin" />正在读取客户端校验信息…
        </div>
        <div v-else-if="error" role="alert" class="connect-error">
          <p>{{ error }}</p>
          <button class="button" @click="loadManifest">
            <RefreshCw :size="14" />重新加载
          </button>
        </div>
        <template v-else>
          <pre class="connect-preview" aria-label="安装提示词预览">{{
            preview
          }}</pre>
          <div class="connect-copy-actions">
            <button
              class="button primary"
              :disabled="!prompt"
              @click="copyPrompt"
            >
              <Check v-if="copied" :size="17" /><Copy v-else :size="17" />{{
                copied
                  ? "已复制"
                  : commandMode
                    ? "复制安装命令"
                    : "复制安装提示词"
              }}</button
            ><button class="text-link" @click="selectPrompt">选中提示词</button>
          </div>
          <div v-if="manualCopy" class="connect-manual">
            <p class="connect-help">
              {{
                includeKey && key.trim()
                  ? "下方包含完整个人 Key，请仅复制给本地 Agent。"
                  : "点击文本框即可全选，再手动复制。"
              }}
            </p>
            <textarea
              ref="manualText"
              :value="prompt"
              readonly
              aria-label="手动复制安装提示词"
              @focus="$event.target.select()"
              @click="$event.target.select()"
            />
          </div>
          <p class="connect-help connect-bottom-note">
            {{
              commandMode
                ? "命令不包含个人 Key，安装时在终端输入。"
                : includeKey && key.trim()
                  ? "复制内容包含个人 Key。"
                  : "未包含 Key，本地 Agent 会引导你在本机配置。"
            }}安装完成后，以 Agent 返回的鉴权和工具调用结果确认接入。
          </p></template
        >
      </section>
    </div>
  </section>
</template>
