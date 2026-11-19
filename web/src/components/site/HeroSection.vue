<script setup>
// Adapted from leoMirandaa/shadcn-vue-landing-page/src/components/Hero.vue (MIT).
import { ArrowRight, ArrowUpRight, Check } from "lucide-vue-next";
import { currentUser, hasAccess } from "../../composables/session";
import { serviceHealth } from "../../composables/workspace";
import WorkbenchPreview from "./WorkbenchPreview.vue";
</script>
<template>
  <section class="site-hero">
    <div class="hero-grid-bg" aria-hidden="true" />
    <div class="site-container hero-container">
      <h1>
        让知识流动，<br />让每一次开发<span class="gradient-text"
          >都有依据。</span
        >
      </h1>
      <p class="hero-description">
        连接分类知识、团队规范与验证过的解决方案。<br
          class="desktop-break"
        />让你和 AI Agent，共用一个可靠的知识工作空间。
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
      <div class="hero-facts">
        <span><Check :size="14" />注册审批后使用</span
        ><span><Check :size="14" />个人 API Key</span
        ><span><Check :size="14" />MCP · Skill · CLI</span>
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
