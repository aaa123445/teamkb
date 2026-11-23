<script setup>
import AppSelect from "../components/ui/AppSelect.vue";
import { ref, computed, onBeforeUnmount, watch, nextTick } from "vue";
import {
  Bot,
  Send,
  Network,
  ArrowRight,
  Plus,
  History,
  Check,
  X,
  StopCircle,
  RotateCcw,
} from "lucide-vue-next";
import { api, post } from "../services/api";
import { hasAccess } from "../composables/session";
import { authVersion } from "../composables/workspace";
import { useResource } from "../composables/useResource";
import MarkdownContent from "../components/MarkdownContent.vue";
import "../styles/intelligence.css";
const {
  data: status,
  error: statusError,
  reload: reloadStatus,
} = useResource(() => api("/assistant/status"));
const { data: categories } = useResource(() => api("/categories"));
const question = ref(""),
  category = ref(""),
  scenario = ref("auto"),
  mode = ref("auto"),
  busy = ref(false),
  error = ref(""),
  messages = ref([]),
  asked = ref("");
const conversations = ref([]),
  conversationId = ref(""),
  historyLoading = ref(false),
  saveError = ref("");
let historyGeneration = 0,
  saveQueue = Promise.resolve();
const scroll = ref(null);
const questionInput = ref(null);
const historyDialog = ref(null);
const historyTrigger = ref(null);

function openHistory() {
  historyDialog.value.showModal();
}

function closeHistory() {
  historyDialog.value?.close();
}

function useExample(example) {
  question.value = example;
  questionInput.value?.focus({ preventScroll: true });
}
let controller;
const labels = {
  explore: "知识探索",
  troubleshoot: "排障溯源",
  develop: "开发实施",
  compare: "方案对比",
  learn: "学习路线",
};
const examples = [
  "如何排查组织同步失败？",
  "V5 和 V8 的扩展开发有哪些区别？",
  "我想学习移动开发，应该先看哪些知识？",
];
const hasConversation = computed(() => messages.value.length > 0);
async function saveConversation() {
  if (!messages.value.length || !hasAccess.value) return;
  if (!conversationId.value) conversationId.value = crypto.randomUUID();
  const id = conversationId.value,
    generation = historyGeneration;
  const body = JSON.parse(
    JSON.stringify({
      messages: messages.value,
      category_id: category.value,
      mode: mode.value,
    }),
  );
  saveQueue = saveQueue
    .catch(() => {})
    .then(async () => {
      if (generation !== historyGeneration) return;
      try {
        const saved = await api(
          "/assistant/conversations/" + encodeURIComponent(id),
          { method: "PUT", body },
        );
        if (generation !== historyGeneration) return;
        conversations.value = [
          saved,
          ...conversations.value.filter((c) => c.id !== id),
        ];
        saveError.value = "";
      } catch (e) {
        if (generation === historyGeneration)
          saveError.value = "对话尚未保存：" + e.message;
      }
    });
  await saveQueue;
}
async function selectHistory(item) {
  if (busy.value || historyLoading.value) return;
  const generation = historyGeneration;
  historyLoading.value = true;
  try {
    await saveQueue.catch(() => {});
    if (generation !== historyGeneration) return;
    const data = await api(
      "/assistant/conversations/" + encodeURIComponent(item.id),
    );
    if (generation !== historyGeneration) return;
    conversationId.value = item.id;
    messages.value = data.messages || [];
    category.value = data.category_id || "";
    mode.value = data.mode || "auto";
    question.value = "";
    error.value = "";
    saveError.value = "";
    closeHistory();
  } catch (e) {
    if (generation === historyGeneration) saveError.value = e.message;
  } finally {
    if (generation === historyGeneration) historyLoading.value = false;
  }
}
async function restoreHistory() {
  const generation = ++historyGeneration;
  controller?.abort();
  busy.value = false;
  messages.value = [];
  conversations.value = [];
  conversationId.value = "";
  question.value = "";
  error.value = "";
  saveError.value = "";
  historyLoading.value = false;
  if (!hasAccess.value) return;
  historyLoading.value = true;
  try {
    const data = await api("/assistant/conversations");
    if (generation !== historyGeneration) return;
    conversations.value = data.conversations || [];
    if (conversations.value.length) {
      const item = conversations.value[0];
      const saved = await api(
        "/assistant/conversations/" + encodeURIComponent(item.id),
      );
      if (generation !== historyGeneration) return;
      conversationId.value = item.id;
      messages.value = saved.messages || [];
      category.value = saved.category_id || "";
      mode.value = saved.mode || "auto";
    }
  } catch (e) {
    if (generation === historyGeneration)
      saveError.value = "历史记录加载失败：" + e.message;
  } finally {
    if (generation === historyGeneration) historyLoading.value = false;
  }
}

async function scrollToLatest() {
  await nextTick();
  // Markdown renders its tables and code-copy controls in a post-flush watcher.
  // Measure on the next frame, after those children have their final dimensions.
  requestAnimationFrame(() => {
    scroll.value?.scrollTo({
      top: messages.value.length ? scroll.value.scrollHeight : 0,
      behavior: "instant",
    });
  });
}

watch(
  () => [messages.value, messages.value.length, busy.value],
  scrollToLatest,
);
async function ask(value = question.value) {
  const text = value.trim();
  if (!text || busy.value || historyLoading.value) return;
  question.value = "";
  asked.value = text;
  error.value = "";
  busy.value = true;
  controller = new AbortController();
  const requestController = controller;
  const previous = messages.value
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  messages.value.push({ role: "user", content: text, time: Date.now() });
  saveConversation();
  try {
    const answer = await post(
      "/assistant/ask",
      {
        question: text,
        category_id: category.value,
        scenario: scenario.value,
        mode: mode.value,
        history: previous,
      },
      { signal: requestController.signal },
    );
    if (requestController.signal.aborted) return;
    messages.value.push({
      role: "assistant",
      content: answer.answer,
      answer,
      time: Date.now(),
    });
  } catch (e) {
    if (e.name !== "AbortError") {
      error.value = e.message;
      messages.value.push({
        role: "error",
        content: e.message,
        time: Date.now(),
      });
    }
  } finally {
    if (controller === requestController) {
      busy.value = false;
      if (!requestController.signal.aborted) await saveConversation();
    }
  }
}
function cancel() {
  controller?.abort();
  busy.value = false;
  error.value = "已停止本次等待。";
}
function clearChat() {
  controller?.abort();
  busy.value = false;
  conversationId.value = "";
  messages.value = [];
  question.value = "";
  error.value = "";
}
function retry() {
  const last = [...messages.value].reverse().find((m) => m.role === "user");
  if (last) {
    messages.value = messages.value.filter(
      (m) => m !== last && m.role !== "error" && m.time < last.time,
    );
    ask(last.content);
  }
}
watch(authVersion, restoreHistory, { immediate: true });
onBeforeUnmount(() => controller?.abort());
</script>
<template>
  <section class="intelligence-page assistant-page assistant-chat-page">
    <header class="assistant-chat-heading">
      <h1>云端智能体</h1>
      <div class="assistant-heading-actions">
        <button
          ref="historyTrigger"
          type="button"
          class="icon-button"
          aria-label="对话历史"
          title="对话历史"
          aria-haspopup="dialog"
          @click="openHistory"
        >
          <History :size="18" aria-hidden="true" /></button
        ><button
          type="button"
          class="icon-button"
          aria-label="新对话"
          title="新对话"
          :disabled="historyLoading"
          @click="clearChat"
        >
          <Plus :size="19" aria-hidden="true" /></button
        ><RouterLink
          to="/graph"
          class="icon-button"
          aria-label="知识链"
          title="知识链"
          ><Network :size="18" aria-hidden="true"
        /></RouterLink>
      </div>
    </header>
    <dialog
      ref="historyDialog"
      class="assistant-history-dialog"
      aria-labelledby="assistant-history-label"
      @close="historyTrigger?.focus({ preventScroll: true })"
      @click.self="closeHistory"
    >
      <section class="assistant-history-panel">
        <div class="assistant-history-title">
          <h2 id="assistant-history-label">对话历史</h2>
          <button
            type="button"
            class="icon-button"
            aria-label="关闭对话历史"
            autofocus
            @click="closeHistory"
          >
            <X :size="18" aria-hidden="true" />
          </button>
        </div>
        <div class="assistant-history-section" :aria-busy="historyLoading">
          <button
            v-for="item in conversations"
            :key="item.id"
            type="button"
            class="assistant-history-item"
            @click="selectHistory(item)"
            :aria-current="item.id === conversationId ? 'true' : undefined"
            :disabled="busy || historyLoading"
          >
            <span>{{ item.title }}</span>
            <Check
              v-if="item.id === conversationId"
              :size="16"
              aria-hidden="true"
            />
          </button>
          <p v-if="!conversations.length" class="assistant-history-empty">
            {{ historyLoading ? "正在加载历史…" : "暂无历史对话" }}
          </p>
          <p v-if="saveError" class="assistant-history-empty" role="alert">
            {{ saveError }}
          </p>
        </div>
      </section>
    </dialog>
    <div class="assistant-chat-main">
      <div
        ref="scroll"
        class="assistant-chat-messages"
        tabindex="0"
        role="region"
        aria-label="对话消息"
        :class="{ 'is-empty': !hasConversation }"
      >
        <div v-if="!hasConversation" class="assistant-chat-welcome">
          <span class="assistant-welcome-icon"><Bot :size="30" /></span>
          <h2>今天想了解什么？</h2>
          <div class="assistant-welcome-prompts">
            <button v-for="q in examples" :key="q" @click="useExample(q)">
              {{ q }} <ArrowRight :size="13" aria-hidden="true" />
            </button>
          </div>
        </div>
        <template
          v-for="(message, index) in messages"
          :key="message.time + '-' + index"
        >
          <div
            v-if="message.role === 'user'"
            class="assistant-message user-message"
            :data-message-time="message.time"
          >
            <div class="message-bubble">{{ message.content }}</div>
          </div>
          <article
            v-else-if="message.role === 'assistant'"
            class="assistant-message"
          >
            <span class="message-avatar"><Bot :size="15" /></span>
            <div class="message-content">
              <div class="message-bubble assistant-bubble">
                <MarkdownContent :content="message.content" />
              </div>
              <details
                v-if="message.answer?.trace?.length"
                class="assistant-reasoning"
              >
                <summary>查看分析过程</summary>
                <div class="assistant-trace-list">
                  <div
                    v-for="(step, traceIndex) in message.answer.trace"
                    :key="traceIndex"
                    class="assistant-trace-step"
                  >
                    <span>{{ traceIndex + 1 }}</span>
                    <div>
                      <strong>{{ step.step }}</strong><small>{{
                        step.detail
                      }}</small>
                    </div>
                  </div>
                </div>
              </details>
              <div v-if="message.answer" class="message-sources">
                <span class="badge">{{
                  labels[message.answer.scenario] || "知识分析"
                }}</span><span class="badge">{{
                  message.answer.mode === "chain" ? "知识链分析" : "分类检索"
                }}</span>
                <details v-if="message.answer.citations?.length">
                  <summary>
                    查看 {{ message.answer.citations.length }} 条依据
                  </summary>
                  <div
                    v-for="c in message.answer.citations"
                    :key="c.id"
                    class="chat-citation"
                  >
                    <RouterLink :to="'/documents/' + encodeURIComponent(c.id)"
                      >[{{ c.number }}] {{ c.title }}</RouterLink
                    ><small
                      >v{{ c.version }} ·
                      {{ c.truncated ? "节选资料" : "完整资料" }}</small
                    ><RouterLink
                      :to="{ path: '/graph', query: { doc: c.id } }"
                      class="text-link"
                      >查看知识链 →</RouterLink
                    >
                  </div>
                </details>
                <RouterLink
                  v-if="message.answer.citations?.length"
                  :to="{
                    path: '/graph',
                    query: { doc: message.answer.citations[0].id },
                  }"
                  class="text-link chat-chain-link"
                  >查看知识链 →</RouterLink
                >
              </div>
            </div>
          </article>
          <div v-else class="assistant-message assistant-error">
            <span class="message-avatar"><Bot :size="15" /></span>
            <div class="message-bubble">
              {{ message.content
              }}<button
                class="text-link retry-chat"
                :disabled="busy"
                @click="retry"
              >
                <RotateCcw :size="13" />重试
              </button>
            </div>
          </div>
        </template>
        <div v-if="busy" class="assistant-message">
          <span class="message-avatar"><Bot :size="15" /></span>
          <div class="message-bubble thinking-bubble">
            <i></i><i></i><i></i><span>正在检索知识并整理依据…</span>
          </div>
        </div>
      </div>
      <div v-if="statusError" class="assistant-inline-error" role="alert">
        {{ statusError }}
        <button class="text-link" @click="reloadStatus">重新检查</button>
      </div>
      <div v-else-if="!status?.ready" class="assistant-inline-error">
        <h3>模型服务尚未启用</h3>
        请联系管理员在工作台管理中配置。
      </div>
      <p v-if="saveError" class="assistant-inline-error" role="alert">
        {{ saveError }}
        <button type="button" class="text-link" @click="saveConversation">
          重试保存
        </button>
      </p>
      <p
        v-if="error && !messages.some((m) => m.role === 'error')"
        class="assistant-inline-error"
        role="status"
      >
        {{ error }}
      </p>
      <form
        class="assistant-chat-composer"
        @submit.prevent="busy ? cancel() : ask()"
      >
        <textarea
          id="agent-question"
          ref="questionInput"
          v-model="question"
          required
          minlength="2"
          maxlength="1200"
          rows="2"
          :placeholder="hasConversation ? '继续提问…' : '输入你的问题…'"
          :disabled="busy"
          @keydown.enter.exact="
            !$event.isComposing &&
            ($event.preventDefault(),
            !busy && status?.ready && question.trim().length >= 2 && ask())
          "
          aria-label="知识问答问题"
        />
        <div class="assistant-composer-options">
          <AppSelect v-model="category" aria-label="知识范围"
            ><option value="">全部知识</option>
            <option
              v-for="c in categories?.categories || []"
              :key="c.id"
              :value="c.id"
            >
              {{ c.path }}
            </option></AppSelect
          ><AppSelect v-model="mode" aria-label="检索方式"
            ><option value="auto">智能检索</option>
            <option value="search">分类检索</option>
            <option value="chain">知识链分析</option></AppSelect
          >
        </div>
        <div class="assistant-composer-send">
          <button
            v-if="busy"
            type="button"
            class="button"
            aria-label="停止"
            title="停止"
            @click="cancel"
          >
            <StopCircle :size="18" aria-hidden="true" /></button
          ><button
            v-else
            type="submit"
            class="button primary"
            aria-label="发送"
            title="发送"
            :disabled="
              historyLoading || !status?.ready || question.trim().length < 2
            "
          >
            <Send :size="18" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
