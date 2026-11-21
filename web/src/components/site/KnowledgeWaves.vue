<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const canvas = ref(null);
const introDuration = 4300;
const lanes = Array.from({ length: 23 }, (_, index) => index - 11);
let context, sizeObserver, themeObserver, motion, frame, started, width, height;
let stroke;

function draw(time) {
  if (!width || !height) return;
  context.clearRect(0, 0, width, height);
  const step = width < 650 ? 14 : 22;
  context.strokeStyle = stroke;
  for (const lane of lanes) {
    context.beginPath();
    for (let x = 0; x <= width + step; x += step) {
      const progress = x / width;
      const spread = 8 + 13 * Math.abs(progress - 0.5);
      const y =
        height * 0.49 +
        lane * spread +
        height * 0.22 * Math.sin(progress * 5.2 + lane * 0.026 + time) +
        28 * Math.cos(progress * 9 - lane * 0.034);
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.globalAlpha = 0.18 - Math.abs(lane) * 0.008;
    context.lineWidth = lane % 5 === 0 ? 1.5 : 1;
    context.stroke();
  }
}

function animate(now) {
  started ??= now;
  const progress = Math.min((now - started) / introDuration, 1);
  draw((1 - progress) ** 3 * 1.08);
  frame = progress < 1 ? requestAnimationFrame(animate) : undefined;
}

function resize() {
  const element = canvas.value;
  width = element.clientWidth;
  height = element.clientHeight;
  if (!width || !height) return;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  element.width = Math.round(width * scale);
  element.height = Math.round(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  draw(0);
}

function freeze() {
  cancelAnimationFrame(frame);
  frame = undefined;
  draw(0);
}

onMounted(() => {
  context = canvas.value.getContext("2d");
  if (!context) return;
  const root = document.documentElement;
  const updateColor = () => {
    stroke = getComputedStyle(canvas.value)
      .getPropertyValue("--landing-accent")
      .trim();
    if (!frame) draw(0);
  };
  updateColor();
  motion = matchMedia("(prefers-reduced-motion: reduce)");
  motion.addEventListener("change", freeze);
  resize();
  sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas.value);
  themeObserver = new MutationObserver(updateColor);
  themeObserver.observe(root, { attributeFilter: ["data-theme"] });
  if (!motion.matches) frame = requestAnimationFrame(animate);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  sizeObserver?.disconnect();
  themeObserver?.disconnect();
  motion?.removeEventListener("change", freeze);
});
</script>

<template>
  <canvas ref="canvas" class="knowledge-waves" aria-hidden="true" />
</template>
