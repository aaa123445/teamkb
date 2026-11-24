<script setup>
import { lockBodyScroll } from "../composables/scrollLock";
// TailAdmin Vue AppSidebar / AppHeader composition, adapted under MIT.
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Search,
  BookOpen,
  Plus,
  ChartNoAxesCombined,
  Settings2,
  ArrowUpRight,
  ChevronRight,
  KeyRound,
  Menu,
  X,
  UserRound,
  LogIn,
  LogOut,
  LifeBuoy,
  House,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  FolderTree,
  Files,
  ShieldCheck,
  Layers,
  PlugZap,
  Network,
  Bot,
} from "lucide-vue-next";
import {
  currentUser,
  sessionReady,
  isAdmin,
  logout,
  statusLabel,
} from "../composables/session";
import { apiKey, keyDialogOpen, notice, stats } from "../composables/workspace";
import { focusMain, trapFocus } from "../composables/accessibility";
import BrandMark from "../components/ui/BrandMark.vue";
import CommandPalette from "../components/workspace/CommandPalette.vue";
import WorkspaceTour from "../components/workspace/WorkspaceTour.vue";
import ThemeSwitcher from "../components/workspace/ThemeSwitcher.vue";
import "../styles/workspace.css";
import "../styles/knowledge.css";
import "../styles/studio.css";
const props = defineProps({ online: Boolean }),
  route = useRoute(),
  router = useRouter();
const tourSeenKey = "v8wb_workspace_tour";
const mobileOpen = ref(false),
  collapsed = ref(localStorage.getItem("v8wb_sidebar_collapsed") === "true"),
  paletteOpen = ref(false),
  trigger = ref(null),
  sidebarEl = ref(null),
  scrollArea = ref(null),
  tourOpen = ref(false);
const contributionRoute = computed(
  () => route.path === "/contributions" || route.path === "/review",
);
const backPath = computed(() => {
  // Read the router's history after each navigation.
  const { fullPath, name } = route;
  const previous = router.options.history.state.back;
  if (typeof previous === "string" && previous !== fullPath) return previous;
  return name === "document" ? "/library" : "";
});
function goBack() {
  if (typeof router.options.history.state.back === "string") router.back();
  else if (backPath.value) router.push(backPath.value);
}
const groups = computed(() => [
  {
    label: "知识空间",
    items: [
      { to: "/library", label: "团队知识库", icon: BookOpen },
      { to: "/graph", label: "知识链", icon: Network },
      { to: "/assistant", label: "云端智能体", icon: Bot },
      { to: "/workspace", label: "知识检索", icon: Search },
      { to: "/rules", label: "团队规范", icon: ShieldCheck },
      { to: "/overview", label: "知识总览", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "内容协作",
    items: [
      { to: "/contributions", label: "我的贡献", icon: Files },
      { to: "/contribute", label: "经验沉淀", icon: Plus },
      ...(isAdmin.value
        ? [
            { to: "/review", label: "贡献审核", icon: Layers },
            { to: "/categories", label: "分类管理", icon: FolderTree },
          ]
        : []),
    ],
  },
  {
    label: "连接与管理",
    items: [
      { to: "/connect", label: "一键接入", icon: PlugZap },
      { to: "/account/logs", label: "我的调用日志", icon: Activity },
      { to: "/account", label: "个人中心 / 我的 Key", icon: UserRound },
      { to: "/guide", label: "使用说明", icon: LifeBuoy },
      ...(isAdmin.value
        ? [{ to: "/admin", label: "工作台管理", icon: Settings2 }]
        : []),
    ],
  },
]);
function selected(to) {
  return route.path === to || (to === "/library" && route.name === "document");
}
watch(
  () => route.fullPath,
  async () => {
    mobileOpen.value = false;
    paletteOpen.value = false;
    await nextTick();
    scrollArea.value?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  },
);
watch(collapsed, (value) =>
  localStorage.setItem("v8wb_sidebar_collapsed", String(value)),
);
let releaseScroll;
watch(mobileOpen, async (value) => {
  if (value) releaseScroll ||= lockBodyScroll();
  else {
    releaseScroll?.();
    releaseScroll = null;
  }
  await nextTick();
  if (value) sidebarEl.value?.querySelector("a")?.focus();
  else if (trigger.value?.getClientRects().length) trigger.value.focus();
});
function resize() {
  if (window.innerWidth > 900) mobileOpen.value = false;
}
function closeTour() {
  tourOpen.value = false;
  try {
    localStorage.setItem(tourSeenKey, "done");
  } catch {}
}
watch(
  [sessionReady, keyDialogOpen, mobileOpen, paletteOpen],
  ([ready, keyOpen, sidebarOpen, searchOpen]) => {
    if (!ready || keyOpen || sidebarOpen || searchOpen) return;
    try {
      if (!localStorage.getItem(tourSeenKey)) tourOpen.value = true;
    } catch {}
  },
  { immediate: true, flush: "post" },
);
function key(event) {
  const dialog = document.querySelector('[aria-modal="true"]');
  if (
    dialog &&
    !dialog.classList.contains("sidebar") &&
    !dialog.classList.contains("command-dialog")
  )
    return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    mobileOpen.value = false;
    paletteOpen.value = !paletteOpen.value;
    return;
  }
  if (!mobileOpen.value) return;
  if (event.key === "Escape") {
    event.preventDefault();
    mobileOpen.value = false;
  } else trapFocus(event, sidebarEl.value);
}
onMounted(() => {
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", key);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  window.removeEventListener("keydown", key);
  releaseScroll?.();
  releaseScroll = null;
});
async function signOut() {
  try {
    await logout();
    router.push("/login");
  } catch (e) {
    notice.value = { message: e.message, kind: "error" };
  }
}
</script>
<template>
  <div
    class="workspace"
    :class="{
      'sidebar-collapsed': collapsed,
      'workspace-chat': route.path === '/assistant',
      'workspace-contributions': contributionRoute,
    }"
  >
    <a class="skip-link" href="#main" @click.prevent="focusMain"
      >跳转到主要内容</a
    >
    <div
      v-if="mobileOpen"
      class="sidebar-overlay"
      @click="mobileOpen = false"
    />
    <aside
      ref="sidebarEl"
      class="sidebar"
      :class="{ 'is-open': mobileOpen }"
      :role="mobileOpen ? 'dialog' : undefined"
      :aria-modal="mobileOpen || undefined"
      aria-label="工作台导航"
    >
      <div class="sidebar-header">
        <RouterLink to="/" class="brand" aria-label="TeamKB 官网"
          ><BrandMark :compact="collapsed" /></RouterLink
        ><button
          type="button"
          class="icon-button sidebar-toggle"
          :aria-label="collapsed ? '展开侧栏' : '收起侧栏'"
          :title="collapsed ? '展开侧栏' : '收起侧栏'"
          :aria-expanded="!collapsed"
          @click="collapsed = !collapsed"
        >
          <PanelLeftOpen v-if="collapsed" :size="18" aria-hidden="true" />
          <PanelLeftClose v-else :size="18" aria-hidden="true" /></button
        ><button
          class="icon-button sidebar-mobile-close"
          aria-label="关闭导航"
          @click="mobileOpen = false"
        >
          <X :size="19" />
        </button>
      </div>
      <div class="sidebar-body">
        <nav
          v-for="group in groups"
          :key="group.label"
          :aria-label="group.label"
        >
          <div class="nav-label">{{ group.label }}</div>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :data-tour="item.to === '/connect' ? 'connect' : undefined"
            :title="collapsed ? item.label : undefined"
            :aria-label="item.label"
            :class="{ selected: selected(item.to) }"
            ><component :is="item.icon" :size="18" /><span>{{
              item.label
            }}</span
            ><small v-if="item.to === '/library' && stats" class="nav-count">{{
              stats.documents
            }}</small></RouterLink
          >
        </nav>
      </div>
      <div class="sidebar-bottom">
        <RouterLink to="/" class="back-to-site" title="返回官网"
          ><House :size="16" /><span>返回官网</span><ArrowUpRight :size="14"
        /></RouterLink>
        <div class="service-status">
          <span :class="['status-dot', { online: props.online }]" /><span>{{
            props.online ? "知识服务已连接" : "服务连接异常"
          }}</span>
        </div>
      </div>
    </aside>
    <div class="workspace-main" :inert="mobileOpen || undefined">
      <header class="topbar">
        <button
          ref="trigger"
          class="icon-button mobile-toggle"
          aria-label="打开导航"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <Menu :size="21" />
        </button>
        <div class="breadcrumb">
          <span>{{ route.meta.section }}</span><ChevronRight
            :size="14"
            aria-hidden="true"
          />
          <component
            :is="
              route.name === 'document' || route.path === '/contribute'
                ? 'strong'
                : 'h1'
            "
            id="workspace-page-title"
          >
            <button
              v-if="backPath"
              type="button"
              class="breadcrumb-tab breadcrumb-default"
              title="返回上一页"
              @click="goBack"
            >
              {{ route.meta.title }}
            </button>
            <span v-else class="breadcrumb-default">{{
              route.meta.title
            }}</span>
          </component>
        </div>
        <div class="topbar-right">
          <button
            type="button"
            class="icon-button"
            data-tour="search"
            aria-label="打开全局搜索"
            title="打开全局搜索"
            aria-keyshortcuts="Control+K Meta+K"
            @click="paletteOpen = true"
          >
            <Search :size="19" aria-hidden="true" /></button
          ><button
            type="button"
            class="icon-button"
            aria-label="查看工作台引导"
            title="查看工作台引导"
            aria-haspopup="dialog"
            @click="tourOpen = true"
          >
            <LifeBuoy :size="20" aria-hidden="true" /></button
          ><ThemeSwitcher /><span class="header-divider account-divider" />
          <template v-if="currentUser"
            ><RouterLink to="/account" class="account-chip"
              ><span class="avatar-small">{{
                currentUser.display_name.slice(0, 1)
              }}</span
              ><span
                ><strong>{{ currentUser.display_name }}</strong
                ><small>{{ statusLabel(currentUser.status) }}</small></span
              ></RouterLink
            ><button class="icon-button" aria-label="退出登录" @click="signOut">
              <LogOut :size="18" /></button
          ></template>
          <template v-else
            ><RouterLink v-if="!apiKey" to="/login" class="button key-button"
              ><LogIn :size="16" />登录 / 注册</RouterLink
            ><button
              class="button key-button legacy-key-button"
              @click="keyDialogOpen = true"
            >
              <KeyRound :size="16" />{{
                apiKey ? "访问凭据" : "使用 API Key"
              }}</button
            ><span
              v-if="apiKey"
              class="avatar-small key-avatar"
              title="API Key 已连接"
              ><UserRound :size="18" /></span
          ></template>
        </div>
      </header>
      <div ref="scrollArea" class="workspace-scroll">
        <main id="main" class="content" tabindex="-1">
          <div v-if="!sessionReady" class="async-state" role="status">
            正在恢复工作空间…
          </div>
          <slot v-else />
        </main>
        <footer class="page-footer">
          <span>TeamKB</span
          ><a href="/docs" target="_blank" rel="noopener"
            >API 文档 <ArrowUpRight :size="13"
          /></a>
        </footer>
      </div>
    </div>
    <CommandPalette :open="paletteOpen" @close="paletteOpen = false" />
    <WorkspaceTour v-if="tourOpen" @close="closeTour" />
  </div>
</template>
