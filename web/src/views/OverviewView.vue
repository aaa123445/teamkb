<script setup>
import { computed } from "vue";
import {
  ArrowRight,
  BookOpen,
  Bot,
  FileText,
  Layers,
  ListTree,
  RefreshCw,
} from "lucide-vue-next";
import { api } from "../services/api";
import { refreshStats, sourceLabel } from "../composables/workspace";
import { useResource } from "../composables/useResource";
import AsyncState from "../components/AsyncState.vue";
import "../styles/overview.css";

const stats = useResource(refreshStats);
const recent = useResource(() => api("/recent?limit=6"));
const formatNumber = new Intl.NumberFormat("zh-CN").format;
const formatDate = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" })
  .format;
const domains = computed(() =>
  Object.entries(stats.data.value?.by_domain || {}).sort((a, b) => b[1] - a[1]),
);
const metrics = computed(() => {
  const data = stats.data.value;
  return [
    { label: "知识文档", value: data.documents, icon: BookOpen },
    { label: "知识领域", value: domains.value.length, icon: Layers },
    { label: "索引词条", value: data.terms, icon: ListTree },
    { label: "Agent 沉淀", value: data.by_source?.agent ?? 0, icon: Bot },
  ];
});
const sources = computed(() => {
  const counts = new Map();
  for (const [source, count] of Object.entries(
    stats.data.value?.by_source || {},
  )) {
    const label = sourceLabel(source);
    counts.set(label, (counts.get(label) || 0) + count);
  }
  return [...counts]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], index) => ({
      label,
      count,
      color: `var(--overview-series-${Math.min(index + 1, 6)})`,
    }));
});
const sourceTotal = computed(() =>
  sources.value.reduce((total, source) => total + source.count, 0),
);
const sourceGradient = computed(() => {
  let offset = 0;
  const segments = sources.value.map(({ color, count }) => {
    const start = offset;
    offset += count;
    return `${color} ${(start / sourceTotal.value) * 100}% ${(offset / sourceTotal.value) * 100}%`;
  });
  return `conic-gradient(${segments.join(", ")})`;
});
const { data, loading, error, reload } = stats;
const {
  data: recentData,
  loading: recentLoading,
  error: recentError,
  reload: reloadRecent,
} = recent;

function refresh() {
  reload();
  reloadRecent();
}
</script>

<template>
  <section class="overview">
    <div class="page-heading overview-heading">
      <h1>知识总览</h1>
      <div class="overview-actions">
        <button
          class="icon-button overview-refresh"
          aria-label="刷新数据"
          title="刷新数据"
          :disabled="loading || recentLoading"
          @click="refresh"
        >
          <RefreshCw
            :size="17"
            :class="{ spin: loading || recentLoading }"
            aria-hidden="true"
          />
        </button>
        <RouterLink to="/library" class="button overview-library">
          团队知识库 <ArrowRight :size="16" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>

    <AsyncState :loading="loading" :error="error" @retry="reload">
      <template v-if="data">
        <dl class="overview-metrics">
          <div
            v-for="item in metrics"
            :key="item.label"
            class="overview-metric"
          >
            <span class="overview-metric-icon" aria-hidden="true">
              <component :is="item.icon" :size="20" />
            </span>
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value == null ? "—" : formatNumber(item.value) }}</dd>
          </div>
        </dl>

        <div class="overview-charts">
          <section class="overview-panel" aria-labelledby="overview-domains">
            <div class="overview-section-heading">
              <h2 id="overview-domains">知识领域分布</h2>
              <span>文档数</span>
            </div>
            <ul v-if="domains.length" class="overview-bars">
              <li v-for="[name, count] in domains" :key="name">
                <span>{{ name }}</span>
                <strong>{{ formatNumber(count) }}</strong>
                <div class="overview-bar" aria-hidden="true">
                  <span
                    :style="{
                      width: `${(100 * count) / Math.max(1, domains[0][1])}%`,
                    }"
                  />
                </div>
              </li>
            </ul>
            <p v-else class="overview-empty">暂无领域数据</p>
          </section>

          <section class="overview-panel" aria-labelledby="overview-sources">
            <div class="overview-section-heading">
              <h2 id="overview-sources">知识来源</h2>
            </div>
            <template v-if="sources.length">
              <div
                class="overview-ring"
                :style="{ background: sourceGradient }"
                aria-hidden="true"
              >
                <div>
                  <strong>{{ formatNumber(sourceTotal) }}</strong
                  ><span>文档</span>
                </div>
              </div>
              <ul class="overview-legend">
                <li v-for="source in sources" :key="source.label">
                  <i :style="{ background: source.color }" aria-hidden="true" />
                  <span>{{ source.label }}</span>
                  <strong>{{ formatNumber(source.count) }}</strong>
                </li>
              </ul>
            </template>
            <p v-else class="overview-empty">暂无来源数据</p>
          </section>
        </div>

        <section
          class="overview-panel overview-recent"
          aria-labelledby="overview-updates"
        >
          <div class="overview-section-heading">
            <h2 id="overview-updates">最近更新</h2>
          </div>
          <AsyncState
            :loading="recentLoading"
            :error="recentError"
            :empty="!recentData?.recent?.length"
            title="暂无文档更新"
            @retry="reloadRecent"
          >
            <table class="overview-table" aria-labelledby="overview-updates">
              <thead>
                <tr>
                  <th scope="col">文档</th>
                  <th scope="col">来源</th>
                  <th scope="col">更新时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in recentData.recent" :key="doc.id">
                  <td>
                    <RouterLink
                      :to="{ name: 'document', params: { id: doc.id } }"
                    >
                      <FileText :size="16" aria-hidden="true" />
                      <span>{{ doc.title }}</span>
                    </RouterLink>
                  </td>
                  <td>{{ sourceLabel(doc.source) }}</td>
                  <td>
                    {{
                      doc.updated_at ? formatDate(doc.updated_at * 1000) : "—"
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </AsyncState>
        </section>
      </template>
    </AsyncState>
  </section>
</template>
