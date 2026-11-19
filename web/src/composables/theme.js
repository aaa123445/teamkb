import { computed, ref, watch } from "vue";

const storageKey = "v8wb_theme";
const modes = ["light", "dark", "system"];
const media = window.matchMedia("(prefers-color-scheme: dark)");
function readPreference() {
  try {
    const value = localStorage.getItem(storageKey);
    return modes.includes(value) ? value : "system";
  } catch {
    return "system";
  }
}
export const themeMode = ref(readPreference());
const systemDark = ref(media.matches);
function syncSystemPreference() {
  systemDark.value = media.matches;
}
export const isDark = computed(
  () =>
    themeMode.value === "dark" ||
    (themeMode.value === "system" && systemDark.value),
);
if (typeof media.addEventListener === "function")
  media.addEventListener("change", syncSystemPreference);
else media.addListener(syncSystemPreference);
// Recheck when returning from system settings or restoring a cached page.
window.addEventListener("focus", syncSystemPreference);
window.addEventListener("pageshow", syncSystemPreference);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) syncSystemPreference();
});
window.addEventListener("storage", (event) => {
  if (event.key === storageKey || event.key === null)
    themeMode.value = readPreference();
});
watch(themeMode, (value) => {
  if (value === "system") syncSystemPreference();
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    /* Theme works without storage. */
  }
});
watch(
  isDark,
  (dark) => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#10131a" : "#ffffff");
  },
  { immediate: true },
);
