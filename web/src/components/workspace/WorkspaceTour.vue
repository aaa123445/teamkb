<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { ArrowLeft, ArrowRight, X } from "lucide-vue-next";
import { lockBodyScroll } from "../../composables/scrollLock";
import { trapFocus } from "../../composables/accessibility";

const emit = defineEmits(["close"]);
const steps = [
  {
    target: ".sidebar",
    mobileTarget: ".mobile-toggle",
    title: "浏览工作台",
    text: "在侧栏打开团队知识库、云端智能体或其他功能。",
  },
  {
    target: '[data-tour="search"]',
    title: "快速找知识",
    text: "打开搜索，输入文档名称或问题关键词，也能跳转到常用功能。",
  },
  {
    target: '[data-tour="theme"]',
    title: "切换主题",
    text: "选择白天、黑夜或跟随系统。",
  },
  {
    target: '[data-tour="connect"]',
    mobileTarget: ".mobile-toggle",
    title: "接入本地智能体",
    text: "从侧栏打开「一键接入」，按步骤生成安装命令或提示词。",
  },
];
const index = ref(0);
const current = computed(() => steps[index.value]);
const dialog = ref(null);
const panel = ref(null);
const title = ref(null);
const spotlight = ref(null);
const panelPosition = ref(null);
let sidebar, sidebarScroll, releaseScroll, observer;

function position() {
  const mobile = matchMedia("(max-width: 900px)").matches;
  const target = document.querySelector(
    (mobile && current.value.mobileTarget) || current.value.target,
  );
  if (target && sidebar?.contains(target) && target.getClientRects().length) {
    target.scrollIntoView({ block: "nearest", behavior: "instant" });
  }
  const rect = target?.getBoundingClientRect();
  const { clientWidth: width, clientHeight: height } = document.documentElement;
  const padding = 5;
  const left = Math.max(0, (rect?.left ?? 0) - padding);
  const right = Math.min(width, (rect?.right ?? 0) + padding);
  const top = Math.max(0, (rect?.top ?? 0) - padding);
  const bottom = Math.min(height, (rect?.bottom ?? 0) + padding);
  const visible = rect?.width > 0 && right > left && bottom > top;
  spotlight.value = visible
    ? {
        left: left + "px",
        top: top + "px",
        width: right - left + "px",
        height: bottom - top + "px",
      }
    : null;

  const margin = 16;
  const gap = 12;
  const card = panel.value.getBoundingClientRect();
  const beside =
    visible && !mobile && right + gap + card.width <= width - margin;
  const x = visible
    ? beside
      ? right + gap
      : right - card.width
    : (width - card.width) / 2;
  const y = visible
    ? beside
      ? top
      : bottom + gap + card.height <= height - margin
        ? bottom + gap
        : top - gap - card.height
    : (height - card.height) / 2;
  panelPosition.value = {
    left: Math.max(margin, Math.min(x, width - margin - card.width)) + "px",
    top: Math.max(margin, Math.min(y, height - margin - card.height)) + "px",
  };
}

async function showStep(step) {
  index.value = step;
  await nextTick();
  if (!dialog.value?.open) return;
  position();
  title.value.focus({ preventScroll: true });
}

onMounted(() => {
  sidebar = document.querySelector(".sidebar-body");
  sidebarScroll = sidebar?.scrollTop;
  releaseScroll = lockBodyScroll();
  dialog.value.showModal();
  showStep(0);
  window.addEventListener("resize", position);
  observer = new ResizeObserver(position);
  observer.observe(panel.value);
  observer.observe(document.querySelector(".topbar-right"));
  observer.observe(document.querySelector(".sidebar"));
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", position);
  observer?.disconnect();
  if (sidebar) sidebar.scrollTop = sidebarScroll;
  dialog.value?.close();
  releaseScroll?.();
});
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="workspace-tour"
      :class="{ 'has-spotlight': spotlight }"
      aria-modal="true"
      aria-labelledby="workspace-tour-title"
      aria-describedby="workspace-tour-description"
      @cancel.prevent="emit('close')"
      @keydown="trapFocus($event, dialog)"
    >
      <div
        v-if="spotlight"
        class="workspace-tour-spotlight"
        :style="spotlight"
        aria-hidden="true"
      />
      <div ref="panel" class="workspace-tour-panel" :style="panelPosition">
        <button
          class="icon-button workspace-tour-close"
          type="button"
          aria-label="关闭引导"
          title="关闭引导"
          @click="emit('close')"
        >
          <X :size="17" aria-hidden="true" />
        </button>
        <p class="workspace-tour-progress">
          工作台引导 · {{ index + 1 }}/{{ steps.length }}
        </p>
        <h2 id="workspace-tour-title" ref="title" tabindex="-1">
          {{ current.title }}
        </h2>
        <p id="workspace-tour-description">{{ current.text }}</p>
        <div class="workspace-tour-actions">
          <button class="text-link" type="button" @click="emit('close')">
            跳过
          </button>
          <button
            v-if="index > 0"
            class="button"
            type="button"
            @click="showStep(index - 1)"
          >
            <ArrowLeft :size="15" aria-hidden="true" />上一步
          </button>
          <button
            v-if="index + 1 < steps.length"
            class="button primary"
            type="button"
            @click="showStep(index + 1)"
          >
            下一步<ArrowRight :size="15" aria-hidden="true" />
          </button>
          <button
            v-else
            class="button primary"
            type="button"
            @click="emit('close')"
          >
            开始使用
          </button>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.workspace-tour {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  overflow: hidden;
  background: #101828bd;
}
.workspace-tour.has-spotlight {
  background: transparent;
}
.workspace-tour::backdrop {
  background: transparent;
}
.workspace-tour-spotlight {
  position: absolute;
  border: 2px solid var(--night-465fff, #465fff);
  border-radius: 8px;
  box-shadow: 0 0 0 max(100vw, 100vh) #101828bd;
  pointer-events: none;
}
.workspace-tour-panel {
  position: absolute;
  inset: 16px auto auto 16px;
  width: min(360px, calc(100% - 32px));
  max-height: calc(100% - 32px);
  overflow: auto;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  color: var(--card-foreground);
  box-shadow: 0 12px 32px #10182838;
}
.workspace-tour-panel h2 {
  margin: 0 0 6px;
  letter-spacing: 0;
}
.workspace-tour-panel h2:focus {
  outline: none;
}
.workspace-tour-panel p {
  margin: 0 0 16px;
  color: var(--muted-foreground);
  font-size: 13px;
}
.workspace-tour-panel .workspace-tour-progress {
  margin: 0 36px 10px 0;
  font-size: 12px;
}
.workspace-tour-close {
  position: absolute;
  top: 10px;
  right: 10px;
}
.workspace-tour-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.workspace-tour-actions .text-link {
  margin-right: auto;
}
.workspace-tour-actions .button {
  min-height: 36px;
  padding: 7px 10px;
  font-size: 12px;
}
</style>
