<script setup lang="ts">
import { dataVizGreens } from '@/utils/dataVizColors'
import { computed } from 'vue'

const props = defineProps<{
  segments: { label: string; percent: number }[]
}>()

const colors = dataVizGreens

const circumference = 2 * Math.PI * 40

const arcs = computed(() => {
  let cumulative = 0
  return props.segments.map((seg, i) => {
    const dash = (seg.percent / 100) * circumference
    const offset = (cumulative / 100) * circumference
    cumulative += seg.percent
    return { ...seg, dash, offset, color: colors[i % colors.length] }
  })
})
</script>

<template>
  <svg viewBox="0 0 100 100" class="h-32 w-32 shrink-0 -rotate-90">
    <circle
      v-for="(arc, i) in arcs"
      :key="i"
      cx="50"
      cy="50"
      r="40"
      fill="none"
      :stroke="arc.color"
      stroke-width="20"
      :stroke-dasharray="`${arc.dash} ${circumference - arc.dash}`"
      :stroke-dashoffset="-arc.offset"
    />
  </svg>
</template>
