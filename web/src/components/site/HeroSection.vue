<script setup>
// Adapted from leoMirandaa/shadcn-vue-landing-page/src/components/Hero.vue (MIT).
import { ArrowRight, ArrowUpRight } from "lucide-vue-next";
import { currentUser, hasAccess } from "../../composables/session";
import { serviceHealth } from "../../composables/workspace";
import WorkbenchPreview from "./WorkbenchPreview.vue";
import KnowledgeWaves from "./KnowledgeWaves.vue";
</script>
<template>
  <section class="site-hero">
    <KnowledgeWaves />
    <div class="site-container hero-container">
      <h1>TeamKB <span>团队知识库</span></h1>
      <p class="hero-description">
        搜索团队文档、核对开发规范，把验证过的经验带进下一次开发。
      </p>
      <div class="hero-actions">
        <RouterLink
          :to="
            !currentUser ? '/register' : hasAccess ? '/workspace' : '/account'
          "
          class="button primary large"
          >{{
            !currentUser
              ? "注册入网"
              : hasAccess
                ? "打开我的工作台"
                : "查看入网状态"
          }}<ArrowRight :size="18" /></RouterLink
        ><RouterLink to="/guide" class="button large"
          >阅读接入指南<ArrowUpRight :size="17"
        /></RouterLink>
      </div>
      <WorkbenchPreview />
      <div class="hero-bottom-stats">
        <div>
          <strong
            >{{ serviceHealth?.documents?.toLocaleString() ?? "—"
            }}<small>篇</small></strong
          ><span>知识文档</span>
        </div>
        <div>
          <strong>8<small>类</small></strong
          ><span>知识分类</span>
        </div>
        <div>
          <strong>3<small>种</small></strong
          ><span>接入方式</span>
        </div>
      </div>
    </div>
  </section>
</template>
