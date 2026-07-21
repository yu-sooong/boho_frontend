<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    decimals?: number
    suffix?: string
    duration?: number
  }>(),
  {
    decimals: 0,
    suffix: '',
    duration: 780,
  },
)

const reduceMotion = ref(false)
const current = ref(props.value)
const flipping = ref(false)
let raf = 0
let flipTimer = 0

onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.clearTimeout(flipTimer)
})

function format(n: number) {
  const fixed = props.decimals > 0 ? Number(n.toFixed(props.decimals)) : Math.round(n)
  return fixed.toLocaleString('zh-TW', {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  })
}

function animateTo(next: number, from = current.value) {
  cancelAnimationFrame(raf)
  window.clearTimeout(flipTimer)

  if (reduceMotion.value) {
    current.value = next
    return
  }

  if (from === next) {
    current.value = next
    return
  }

  flipping.value = true
  flipTimer = window.setTimeout(() => {
    flipping.value = false
  }, props.duration)

  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    // ease-out expo：前段狂跳、尾端收斂（儀表板感）
    const eased = t === 1 ? 1 : 1 - 2 ** (-10 * t)
    current.value = from + (next - from) * eased
    if (t < 1) raf = requestAnimationFrame(tick)
    else current.value = next
  }
  raf = requestAnimationFrame(tick)
}

watch(
  () => props.value,
  (next, prev) => {
    // 首次掛載從 0 跳到目標；之後從目前值跳到新值
    const from = prev === undefined ? 0 : current.value
    if (prev === undefined) current.value = 0
    animateTo(next, from)
  },
  { immediate: true },
)

const label = computed(() => `${format(current.value)}${props.suffix}`)
</script>

<template>
  <span
    class="inline-block font-mono tabular-nums leading-none"
    :class="flipping ? 'num-tick' : ''"
    :aria-label="label"
  >
    {{ format(current) }}{{ suffix }}
  </span>
</template>

<style scoped>
.num-tick {
  animation: num-tick-flash 780ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes num-tick-flash {
  0% {
    filter: blur(2px);
    opacity: 0.55;
    transform: translateY(0.12em);
  }
  35% {
    filter: blur(0.6px);
    opacity: 0.85;
  }
  100% {
    filter: blur(0);
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .num-tick {
    animation: none;
  }
}
</style>
