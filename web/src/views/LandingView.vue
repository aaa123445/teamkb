<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import { ArrowRight, BookOpen } from "lucide-vue-next";
import HeroSection from "../components/site/HeroSection.vue";
import FeaturesSection from "../components/site/FeaturesSection.vue";
import WorkflowSection from "../components/site/WorkflowSection.vue";
import IntegrationsSection from "../components/site/IntegrationsSection.vue";
import FaqSection from "../components/site/FaqSection.vue";
import { hasAccess, currentUser } from "../composables/session";
import "../styles/landing.css";

const page = ref(null);
let observer;
onMounted(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.classList.add("site-enter");
        observer.unobserve(target);
      }
    },
    { rootMargin: "0px 0px -50px 0px" },
  );
  for (const item of page.value.querySelectorAll(
    ".site-section-heading, .site-feature-card, .workflow-step, .integration-intro, .integration-detail, .faq-list, .site-cta",
  )) {
    observer.observe(item);
  }
});
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <div ref="page" class="landing-page">
    <HeroSection />
    <FeaturesSection /><WorkflowSection /><IntegrationsSection /><FaqSection />
    <section class="site-cta-wrap site-container">
      <div class="site-cta">
        <h2>开始使用 TeamKB</h2>
        <div>
          <RouterLink
            :to="
              !currentUser ? '/register' : hasAccess ? '/workspace' : '/account'
            "
            class="button primary large"
            >{{
              !currentUser
                ? "注册并申请入网"
                : hasAccess
                  ? "进入工作台"
                  : "查看账号状态"
            }}<ArrowRight :size="17" /></RouterLink
          ><RouterLink to="/guide" class="button large"
            ><BookOpen :size="17" />阅读使用说明</RouterLink
          >
        </div>
      </div>
    </section>
  </div>
</template>
