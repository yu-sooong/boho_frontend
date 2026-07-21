<script setup lang="ts">
import { taichungDistricts, taichungViewBox } from '@/data/taichungDistricts'
import { densityScale } from '@/utils/dataVizColors'
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    selectedId: string
    /** 行政區名 → 班數（真實 API） */
    countsByName?: Record<string, number>
    /** 行政區名 → 0~1 密度 */
    densityByName?: Record<string, number>
    cityAverage?: number
  }>(),
  {
    countsByName: () => ({}),
    densityByName: () => ({}),
    cityAverage: 0,
  },
)

const emit = defineEmits<{ select: [id: string] }>()

function densityColor(density: number) {
  const idx = Math.min(densityScale.length - 1, Math.round(density * (densityScale.length - 1)))
  return densityScale[idx]
}

function densityLabel(density: number) {
  if (density >= 0.75) return '密度最高'
  if (density >= 0.5) return '密度偏高'
  if (density >= 0.25) return '密度中等'
  return '密度偏低'
}

function centroidOf(path: string): { x: number; y: number } {
  const nums = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  let sx = 0
  let sy = 0
  let count = 0
  for (let i = 0; i + 1 < nums.length; i += 2) {
    sx += nums[i]
    sy += nums[i + 1]
    count++
  }
  return count ? { x: sx / count, y: sy / count } : { x: 0, y: 0 }
}

const districts = computed(() =>
  taichungDistricts.map((d) => {
    const centroid = centroidOf(d.path)
    const schoolCount = props.countsByName[d.name] ?? 0
    const density = props.densityByName[d.name] ?? 0
    const avg = props.cityAverage > 0 ? props.cityAverage : 1
    return {
      ...d,
      cx: centroid.x,
      cy: centroid.y,
      schoolCount,
      density,
      ratio: Math.round((schoolCount / avg) * 10) / 10,
    }
  }),
)

const hoverId = ref<string | null>(null)
const activeHover = computed(() =>
  hoverId.value && hoverId.value !== props.selectedId ? hoverId.value : null,
)
const activeDistrict = computed(
  () => districts.value.find((d) => d.id === activeHover.value) ?? null,
)

function onEnter(id: string) {
  hoverId.value = id
}
function onLeave() {
  hoverId.value = null
}
function onClick(id: string) {
  emit('select', id)
}

const [vbMinX, vbMinY, vbW, vbH] = taichungViewBox.split(' ').map(Number)
const tooltipStyle = computed(() => {
  if (!activeDistrict.value) return {}
  const left = ((activeDistrict.value.cx - vbMinX) / vbW) * 100
  const top = ((activeDistrict.value.cy - vbMinY) / vbH) * 100
  return { left: `${left}%`, top: `${top}%` }
})

const selectedDistrict = computed(() => districts.value.find((d) => d.id === props.selectedId))
const unselectedDistricts = computed(() =>
  districts.value.filter((d) => d.id !== props.selectedId),
)

function liftTransform(d: { cx: number; cy: number }) {
  return `translate(${d.cx}, ${d.cy}) scale(1.06) translate(${-d.cx}, ${-d.cy}) translate(0, -3)`
}
</script>

<template>
  <div class="relative mx-auto w-full max-w-3xl select-none">
    <svg
      :viewBox="taichungViewBox"
      class="h-auto w-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="district-selected-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2d7a45" />
          <stop offset="100%" stop-color="#0f3d1e" />
        </linearGradient>
        <filter id="district-lift-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#062a12" flood-opacity="0.45" />
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#1f6b2b" flood-opacity="0.35" />
        </filter>
      </defs>

      <path
        v-for="d in unselectedDistricts"
        :key="d.id"
        :d="d.path"
        :fill="densityColor(d.density)"
        stroke="#ffffff"
        stroke-width="0.8"
        :opacity="activeHover === d.id ? 0.92 : 0.72"
        class="cursor-pointer transition-opacity duration-200"
        :style="{ filter: activeHover === d.id ? 'brightness(0.94)' : 'none' }"
        @mouseenter="onEnter(d.id)"
        @mouseleave="onLeave"
        @click="onClick(d.id)"
      />

      <g v-if="selectedDistrict">
        <g :transform="liftTransform(selectedDistrict)" class="pointer-events-none">
          <path
            :d="selectedDistrict.path"
            fill="#062a12"
            opacity="0.35"
            transform="translate(3, 5)"
          />
        </g>
        <g
          :transform="liftTransform(selectedDistrict)"
          class="cursor-pointer"
          filter="url(#district-lift-shadow)"
          @click="onClick(selectedDistrict.id)"
        >
          <path
            :d="selectedDistrict.path"
            fill="url(#district-selected-gradient)"
            stroke="#ffffff"
            stroke-width="3"
          />
          <path
            :d="selectedDistrict.path"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            stroke-width="1.2"
            transform="translate(0, -1)"
          />
        </g>
        <text
          :x="selectedDistrict.cx"
          :y="selectedDistrict.cy - 3"
          text-anchor="middle"
          dominant-baseline="middle"
          class="pointer-events-none fill-white text-xs font-semibold sm:text-[10px]"
          style="paint-order: stroke; stroke: #0f3d1e; stroke-width: 2.5px"
        >
          {{ selectedDistrict.name.replace('區', '') }}
        </text>
      </g>
    </svg>

    <div
      v-if="activeDistrict"
      class="pointer-events-none absolute z-10 w-44 -translate-x-1/2 -translate-y-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg"
      :style="tooltipStyle"
    >
      <p class="font-medium text-gray-900">{{ activeDistrict.name }}</p>
      <p class="mt-1 text-gray-500">{{ densityLabel(activeDistrict.density) }}</p>
      <p class="mt-0.5 text-gray-500">{{ activeDistrict.schoolCount }} 間立案補習班</p>
      <p class="mt-0.5 text-gray-500">為全市平均的 {{ activeDistrict.ratio }} 倍</p>
      <p class="mt-1.5 text-[10px] text-primary-600">點選切換至該區情報</p>
    </div>
  </div>
</template>
