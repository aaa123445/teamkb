<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { MonitorCog, Moon, Sun, Palette } from "lucide-vue-next";
import { themeMode } from "../../composables/theme";

const open = ref(false);
const root = ref(null);
const trigger = ref(null);
function dismiss() {
  open.value = false;
  trigger.value?.focus();
}
const modes = [
  { value: "light", label: "白天", icon: Sun },
  { value: "dark", label: "黑夜", icon: Moon },
  { value: "system", label: "跟随系统", icon: MonitorCog },
];
function close(event) {
  if (!root.value?.contains(event.target)) open.value = false;
}
function choose(value) {
  themeMode.value = value;
  dismiss();
}
onMounted(() => document.addEventListener("pointerdown", close));
onBeforeUnmount(() => document.removeEventListener("pointerdown", close));
</script>

<template>
  <div ref="root" class="theme-switcher" @keydown.esc.stop.prevent="dismiss">
    <button
      ref="trigger"
      class="icon-button"
      data-tour="theme"
      aria-label="切换界面主题"
      title="切换界面主题"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Palette :size="19" />
    </button>
    <div v-if="open" class="theme-menu" role="group" aria-label="界面主题">
      <div class="theme-menu-title">界面主题</div>
      <button
        v-for="mode in modes"
        :key="mode.value"
        class="theme-option"
        :class="{ selected: themeMode === mode.value }"
        :aria-pressed="themeMode === mode.value"
        @click="choose(mode.value)"
      >
        <component :is="mode.icon" :size="16" />
        <span>{{ mode.label }}</span>
        <span v-if="themeMode === mode.value" class="theme-check">✓</span>
      </button>
    </div>
  </div>
</template>
