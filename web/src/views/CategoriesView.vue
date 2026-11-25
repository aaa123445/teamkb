<script setup>
import { ask } from "../composables/confirmation";
import { computed, nextTick, onDeactivated, reactive, ref } from "vue";
import { Folder, Pencil, Plus, Trash2 } from "lucide-vue-next";
import { api } from "../services/api";
import { useResource } from "../composables/useResource";
import { notify } from "../composables/workspace";
import AsyncState from "../components/AsyncState.vue";
const { data, loading, error, reload } = useResource(() => api("/categories"));
const categories = computed(() => data.value?.categories ?? []);
const byId = computed(() => new Map(categories.value.map((c) => [c.id, c])));
const form = reactive({ id: "", name: "", parent_id: "" });
const busy = ref(false);
const formError = ref("");
const dialog = ref(null);
const addButton = ref(null);

function ancestors(category) {
  const chain = new Set();
  let parent = category.parent_id;
  while (parent && !chain.has(parent) && byId.value.has(parent)) {
    chain.add(parent);
    parent = byId.value.get(parent).parent_id;
  }
  return chain;
}
const rows = computed(() =>
  categories.value.map((category) => ({
    category,
    ancestors: ancestors(category),
  })),
);
const parents = computed(() =>
  rows.value.filter(
    ({ category, ancestors }) =>
      category.id !== form.id && !ancestors.has(form.id),
  ),
);

function openEditor(category) {
  Object.assign(form, {
    id: category?.id ?? "",
    name: category?.name ?? "",
    parent_id: category?.parent_id ?? "",
  });
  formError.value = "";
  dialog.value.showModal();
}
onDeactivated(() => dialog.value?.close());

async function save() {
  if (busy.value) return;
  formError.value = "";
  busy.value = true;
  try {
    await api("/categories" + (form.id ? "/" + form.id : ""), {
      method: form.id ? "PUT" : "POST",
      body: { name: form.name, parent_id: form.parent_id || null },
    });
    dialog.value?.close();
    notify("分类已保存");
    await reload();
    await nextTick();
    if (document.activeElement === document.body)
      addButton.value?.focus({ preventScroll: true });
  } catch (e) {
    formError.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function remove(c) {
  if (!(await ask("删除空分类“" + c.name + "”？"))) return;
  try {
    await api("/categories/" + c.id, { method: "DELETE" });
    reload();
  } catch (e) {
    notify(e.message, "error");
  }
}
</script>
<template>
  <section class="panel category-panel" aria-labelledby="category-list-title">
    <div class="category-toolbar">
      <h2 id="category-list-title">分类目录</h2>
      <button
        ref="addButton"
        class="button primary small"
        :disabled="loading || !!error"
        @click="openEditor()"
      >
        <Plus :size="16" aria-hidden="true" />新增分类
      </button>
    </div>
    <AsyncState
      :loading="loading"
      :error="error"
      :empty="!rows.length"
      title="暂无分类"
      @retry="reload"
    >
      <ul class="category-list" aria-labelledby="category-list-title">
        <li
          v-for="{ category: c, ancestors } in rows"
          :key="c.id"
          class="category-row"
        >
          <div
            class="category-name"
            :style="{ '--depth': Math.min(ancestors.size, 4) }"
          >
            <Folder :size="16" aria-hidden="true" />
            <div>
              <strong :title="c.path">{{ c.name }}</strong>
              <small :title="c.id">{{ c.id }}</small>
            </div>
          </div>
          <span class="category-documents">{{ c.documents }} 篇</span>
          <div class="category-actions">
            <button
              type="button"
              class="icon-button"
              :aria-label="'编辑 ' + c.path"
              title="编辑分类"
              @click="openEditor(c)"
            >
              <Pencil :size="16" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="icon-button category-delete"
              :aria-label="'删除 ' + c.path"
              title="删除分类"
              @click="remove(c)"
            >
              <Trash2 :size="16" aria-hidden="true" />
            </button>
          </div>
        </li>
      </ul>
    </AsyncState>
    <dialog
      ref="dialog"
      class="category-dialog"
      aria-modal="true"
      aria-labelledby="category-editor-title"
      @cancel="busy && $event.preventDefault()"
    >
      <form @submit.prevent="save">
        <h2 id="category-editor-title">
          {{ form.id ? "编辑分类" : "新增分类" }}
        </h2>
        <label class="field">
          名称
          <input
            v-model.trim="form.name"
            required
            maxlength="60"
            autofocus
            :disabled="busy"
          />
        </label>
        <label class="field">
          上级分类
          <select v-model="form.parent_id" :disabled="busy">
            <option value="">顶级分类</option>
            <option
              v-for="{ category } in parents"
              :key="category.id"
              :value="category.id"
            >
              {{ category.path }}
            </option>
          </select>
        </label>
        <p v-if="formError" class="error-text" role="alert">{{ formError }}</p>
        <div class="category-actions">
          <button
            class="button"
            type="button"
            :disabled="busy"
            @click="dialog.close()"
          >
            取消
          </button>
          <button class="button primary" :disabled="busy || !form.name">
            {{ busy ? "保存中…" : "保存" }}
          </button>
        </div>
      </form>
    </dialog>
  </section>
</template>

<style scoped>
.category-panel {
  padding: 0;
}
.category-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
}
.category-toolbar h2 {
  margin: 0;
}
.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.category-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 70px auto;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 8px 18px;
  border-top: 1px solid var(--border);
}
.category-row:hover {
  background: color-mix(in srgb, var(--foreground) 3%, transparent);
}
.category-name {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-inline-start: calc(var(--depth) * 18px);
  min-width: 0;
}
.category-name svg {
  flex: none;
  color: var(--muted-foreground);
}
.category-name > div {
  min-width: 0;
}
.category-name strong,
.category-name small {
  display: block;
  overflow-wrap: anywhere;
}
.category-name small,
.category-documents {
  color: var(--muted-foreground);
  font-size: 12px;
}
.category-documents {
  text-align: end;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.category-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}
.category-actions .icon-button {
  width: 34px;
  height: 34px;
}
.category-panel .category-delete:hover {
  color: var(--night-b64f55, #b64f55);
}
.category-dialog {
  width: min(440px, calc(100vw - 28px));
  max-height: calc(100dvh - 28px);
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--card-foreground);
  overscroll-behavior: contain;
}
.category-dialog::backdrop {
  background: #16191e80;
}
.category-dialog .category-actions {
  gap: 8px;
  margin-top: 18px;
}
@media (max-width: 560px) {
  .category-toolbar,
  .category-row {
    padding-inline: 10px;
  }
  .category-row {
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 5px;
  }
  .category-name {
    gap: 5px;
    padding-inline-start: calc(var(--depth) * 8px);
  }
  .category-actions {
    gap: 0;
  }
  .category-actions .icon-button {
    width: 30px;
  }
}
</style>
