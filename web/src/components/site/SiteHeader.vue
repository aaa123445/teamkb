<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowUpRight, ArrowRight, Menu, X } from "lucide-vue-next";
import ThemeSwitcher from "../workspace/ThemeSwitcher.vue";
import BrandMark from "../ui/BrandMark.vue";
import { currentUser, hasAccess } from "../../composables/session";
const route = useRoute(),
  router = useRouter(),
  open = ref(false);
const scrolled = ref(false);
function updateHeader() {
  scrolled.value = window.scrollY > 36;
}
onMounted(() => {
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", updateHeader));
const links = [
  { label: "产品能力", section: "features" },
  { label: "使用流程", section: "workflow" },
  { label: "连接你的工具", section: "integrations" },
  { label: "常见问题", section: "faq" },
];
watch(
  () => route.fullPath,
  () => {
    open.value = false;
  },
);
async function go(section) {
  open.value = false;
  if (route.name !== "home") {
    await router.push("/");
    await nextTick();
  }
  document.getElementById(section)?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
}
</script>
<template>
  <header
    class="site-header"
    :class="{ 'is-scrolled': scrolled }"
    @keydown.esc="open = false"
  >
    <div class="site-header-inner">
      <RouterLink to="/" class="site-brand" aria-label="TeamKB 官网"
        ><BrandMark
      /></RouterLink>
      <nav class="site-nav" aria-label="官网导航">
        <button
          v-for="link in links"
          :key="link.section"
          @click="go(link.section)"
        >
          {{ link.label }}</button><RouterLink to="/guide"
          >使用文档 <ArrowUpRight :size="12"
        /></RouterLink>
      </nav>
      <div class="site-header-actions">
        <ThemeSwitcher />
        <RouterLink v-if="!currentUser" to="/login" class="site-login"
          >登录</RouterLink
        ><RouterLink
          v-else-if="hasAccess"
          to="/workspace"
          class="button primary"
          >进入工作台<ArrowUpRight :size="15" /></RouterLink
        ><button
          class="icon-button site-menu-toggle"
          :aria-expanded="open"
          aria-controls="site-mobile-nav"
          :aria-label="open ? '关闭官网导航' : '打开官网导航'"
          @click="open = !open"
        >
          <X v-if="open" :size="22" /><Menu v-else :size="22" />
        </button>
      </div>
    </div>
    <nav
      v-if="open"
      id="site-mobile-nav"
      class="site-mobile-nav"
      aria-label="移动官网导航"
    >
      <button
        v-for="link in links"
        :key="link.section"
        @click="go(link.section)"
      >
        {{ link.label }}<ArrowRight :size="15" /></button
      ><RouterLink to="/guide">使用文档<ArrowUpRight :size="15" /></RouterLink
      ><RouterLink :to="currentUser ? '/account' : '/register'"
        >{{ currentUser ? "我的账号" : "注册入网" }}<ArrowUpRight :size="15"
      /></RouterLink>
    </nav>
  </header>
</template>
