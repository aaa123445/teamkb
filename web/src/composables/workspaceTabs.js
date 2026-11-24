import {
  computed,
  defineComponent,
  h,
  provide,
  shallowRef,
  shallowReactive,
  watch,
} from "vue";
import { RouterView, routeLocationKey } from "vue-router";

export const workspaceTabsKey = Symbol("workspaceTabs");

export function contributionId(route) {
  return ["/contributions", "/review"].includes(route.path) &&
    typeof route.query.contribution === "string"
    ? route.query.contribution
    : "";
}

function pageKey(route) {
  if (route.path === "/contribute")
    return JSON.stringify([route.path, route.query.edit, route.query.target]);
  return route.name === "search" ? "/workspace" : route.path;
}

export function contributionTabKey(path, id) {
  return JSON.stringify([path, id]);
}

export function tabKey(route) {
  const id = contributionId(route);
  return id ? contributionTabKey(route.path, id) : pageKey(route);
}

function tabLabel(route) {
  if (contributionId(route)) return "贡献详情";
  if (route.path === "/contribute") {
    if (route.query.edit) return "编辑贡献";
    if (route.query.target) return "更新建议";
  }
  return route.meta.title;
}

export function useWorkspaceTabs(
  route,
  router,
  identity,
  apiKey,
  ready,
  scrollArea,
) {
  const storageKey = "teamkb_workspace_tabs";
  const tabs = shallowReactive([]);
  const pages = new Map();
  const positions = new Map();
  const closeGuards = new Map();
  const contributionUpdate = shallowRef(null);
  const active = computed(() => tabKey(route));
  const cacheNames = computed(() => tabs.map((tab) => tab.page.name));
  let nextPage = 0;
  let owner;
  let credential;

  function register(location, fromStorage = false) {
    const key = tabKey(location);
    const existing = tabs.find((tab) => tab.key === key);
    if (existing) {
      existing.url = location.fullPath;
      return existing;
    }
    const id = pageKey(location);
    let page = pages.get(id);
    if (!page) {
      // Keep inactive pages on their own route snapshot, including async loads.
      page = defineComponent({
        name: "WorkspacePage" + ++nextPage,
        props: { location: Object },
        setup(props) {
          const snapshot = shallowReactive({ ...props.location });
          provide(routeLocationKey, snapshot);
          watch(
            () => props.location,
            (value) => Object.assign(snapshot, value),
          );
          return () =>
            h("div", { class: "route-page" }, [
              h(RouterView, { route: snapshot }),
            ]);
        },
      });
      pages.set(id, page);
    }
    const tab = shallowReactive({
      key,
      page,
      url: location.fullPath,
      label: tabLabel(location),
    });
    if (contributionId(location) && !fromStorage) {
      const list = router.resolve({ path: location.path });
      if (!tabs.some((tab) => tab.key === tabKey(list))) register(list);
    }
    tabs.push(tab);
    return tab;
  }

  function persist() {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          owner,
          urls: tabs.map((tab) => tab.url),
        }),
      );
    } catch {}
  }

  const currentPage = computed(
    () => tabs.find((tab) => tab.key === active.value)?.page,
  );
  watch(
    [ready, identity, apiKey, () => route.fullPath],
    ([loaded, user, key, url], [, , , previousUrl]) => {
      if (!loaded || !route.meta.title || route.meta.layout === "public")
        return;
      const previous =
        previousUrl && url !== previousUrl && router.resolve(previousUrl);
      const previousKey = previous && tabKey(previous);
      if (scrollArea.value && previousKey && previousKey !== active.value)
        positions.set(previousKey, scrollArea.value.scrollTop);
      if (owner !== user || credential !== key) {
        const restoring = owner === undefined;
        tabs.splice(0);
        pages.clear();
        closeGuards.clear();
        contributionUpdate.value = null;
        positions.clear();
        owner = user;
        credential = key;
        if (restoring)
          try {
            const saved = JSON.parse(sessionStorage.getItem(storageKey));
            if (saved?.owner === owner && Array.isArray(saved.urls)) {
              for (const url of saved.urls) {
                if (typeof url !== "string" || !url.startsWith("/")) continue;
                const location = router.resolve(url);
                if (location.meta.title && location.meta.layout !== "public")
                  register(location, true);
              }
            }
          } catch {}
      }
      register(route);
      persist();
    },
    { immediate: true, flush: "sync" },
  );

  function setTitle(key, title) {
    const tab = tabs.find((item) => item.key === key);
    if (tab && title) tab.label = title;
  }

  async function close(tab) {
    if (tabs.length < 2 || !(await (closeGuards.get(tab.key)?.() ?? true)))
      return false;
    if (tab.key === active.value) {
      const index = tabs.indexOf(tab);
      const neighbor = tabs[index - 1] ?? tabs[index + 1];
      if (!neighbor || (await router.replace(neighbor.url))) return false;
    }
    const index = tabs.indexOf(tab);
    if (index < 0 || tab.key === active.value) return false;
    tabs.splice(index, 1);
    positions.delete(tab.key);
    closeGuards.delete(tab.key);
    if (!tabs.some((item) => item.page === tab.page)) {
      const key = pageKey(router.resolve(tab.url));
      pages.delete(key);
    }
    persist();
    return true;
  }

  return {
    tabs,
    active,
    cacheNames,
    currentPage,
    positions,
    closeGuards,
    contributionUpdate,
    setTitle,
    close,
  };
}
