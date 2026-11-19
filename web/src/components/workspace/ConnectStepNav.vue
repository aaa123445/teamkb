<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { ListOrdered } from "lucide-vue-next";

const props = defineProps({ steps: { type: Array, required: true } });
const nav = ref(null);
const active = ref(props.steps[0].id);
let scrollArea, resizeObserver, frame, selectedTop;

function stepPanel(id) {
  return nav.value.parentElement.querySelector(`#${id}`);
}

function viewportTop() {
  const style = getComputedStyle(nav.value);
  const offset =
    parseFloat(style.top) +
    (style.getPropertyValue("--connect-nav-inline").trim() === "1"
      ? nav.value.offsetHeight + 12
      : 0);
  const top =
    scrollArea === document.scrollingElement
      ? 0
      : scrollArea.getBoundingClientRect().top;
  return top + offset;
}

function jump(id) {
  const panel = stepPanel(id);
  if (!panel) return;
  scrollArea.scrollTo({
    top:
      scrollArea.scrollTop + panel.getBoundingClientRect().top - viewportTop(),
    behavior: "instant",
  });
  selectedTop = scrollArea.scrollTop;
  active.value = id;
  panel.querySelector("h2")?.focus({ preventScroll: true });
}

function syncActive() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const top = scrollArea.scrollTop;
    if (top === selectedTop) return;
    selectedTop = undefined;
    const max = scrollArea.scrollHeight - scrollArea.clientHeight;
    if (max > 0 && top >= max - 2) {
      active.value = props.steps.at(-1).id;
      return;
    }
    const line = viewportTop() + 4;
    let current = props.steps[0].id;
    for (const { id } of props.steps) {
      const panel = stepPanel(id);
      if (panel && panel.getBoundingClientRect().top <= line) current = id;
    }
    active.value = current;
  });
}

watch(
  () => props.steps,
  () => {
    if (!props.steps.some(({ id }) => id === active.value)) {
      selectedTop = undefined;
      active.value = props.steps[0].id;
    }
    syncActive();
  },
  { flush: "post" },
);

onMounted(() => {
  scrollArea =
    nav.value.closest(".workspace-scroll") || document.scrollingElement;
  const scrollTarget =
    scrollArea === document.scrollingElement ? window : scrollArea;
  scrollTarget.addEventListener("scroll", syncActive, { passive: true });
  window.addEventListener("resize", syncActive);
  resizeObserver = new ResizeObserver(syncActive);
  resizeObserver.observe(nav.value);
  resizeObserver.observe(nav.value.parentElement);
  syncActive();
});

onBeforeUnmount(() => {
  const scrollTarget =
    scrollArea === document.scrollingElement ? window : scrollArea;
  scrollTarget?.removeEventListener("scroll", syncActive);
  window.removeEventListener("resize", syncActive);
  resizeObserver?.disconnect();
  cancelAnimationFrame(frame);
});
</script>

<template>
  <nav ref="nav" class="connect-step-nav" aria-label="接入步骤">
    <div class="connect-step-nav-title">
      <ListOrdered :size="16" aria-hidden="true" />接入步骤
    </div>
    <ol>
      <li v-for="(step, index) in steps" :key="step.id">
        <button
          type="button"
          :aria-current="active === step.id ? 'step' : undefined"
          :aria-controls="step.id"
          @click="jump(step.id)"
        >
          <span class="connect-step-index" aria-hidden="true">{{
            index + 1
          }}</span>
          {{ step.label }}
        </button>
      </li>
    </ol>
  </nav>
</template>

<style>
.connect-step-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 860px);
  gap: 24px;
  align-items: start;
}
.connect-step-layout > .connect-layout {
  grid-area: 1 / 2;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
}
.connect-step-nav {
  position: sticky;
  top: var(--sticky-top, 89px);
  grid-area: 1 / 1;
  z-index: 2;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
}
.connect-step-nav-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 10px;
  color: var(--muted-foreground);
  font-size: 12px;
  font-weight: 600;
}
.connect-step-nav ol {
  display: grid;
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.connect-step-nav button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 38px;
  padding: 6px 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--muted-foreground);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.connect-step-nav button:hover {
  background: var(--night-soft, #f2f4f7);
  color: var(--foreground);
}
.connect-step-nav button[aria-current="step"] {
  background: var(--primary-soft);
  color: var(--primary);
}
.connect-step-index {
  display: inline-grid;
  place-items: center;
  flex: 0 0 22px;
  height: 22px;
  border: 1px solid currentColor;
  border-radius: 6px;
  font-size: 11px;
}
.connect-step-layout h2[tabindex="-1"] {
  scroll-margin-top: 16px;
}
@media (max-width: 1179px) {
  .connect-step-layout {
    grid-template-columns: minmax(0, 860px);
    gap: 12px;
  }
  .connect-step-layout > .connect-layout {
    grid-area: 2 / 1;
  }
  .connect-step-nav {
    --connect-nav-inline: 1;
    padding: 6px;
  }
  .connect-step-nav-title {
    display: none;
  }
  .connect-step-nav ol {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .connect-step-layout h2[tabindex="-1"] {
    scroll-margin-top: 116px;
  }
}
</style>
