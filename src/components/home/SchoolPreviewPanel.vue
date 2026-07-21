<script setup lang="ts">
import type { School } from '@/types'
import { ArrowRight, ExternalLink, MapPin, Navigation, Phone, ShieldAlert, X } from 'lucide-vue-next'
import Tag from '@/components/common/Tag.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { computed } from 'vue'

const props = defineProps<{
  school: School
}>()

defineEmits<{
  close: []
  detail: [id: string]
}>()

const penaltyHint = computed(() => {
  const n = props.school.penalties.length || props.school.penaltyCount || 0
  return n > 0 ? n : 0
})

function openGoogleMaps() {
  const { lat, lng, address, name } = props.school
  const url =
    lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || name)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="flex h-full flex-col bg-white">
    <div class="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-4">
      <div class="min-w-0 flex-1">
        <h2 class="font-heading text-base font-bold leading-snug text-gray-900">
          {{ school.name }}
        </h2>
        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusBadge :status="school.status" />
          <Tag v-for="tag in school.categoryTags" :key="tag" active>{{ tag }}</Tag>
        </div>
      </div>
      <button
        type="button"
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="關閉預覽"
        @click="$emit('close')"
      >
        <X :size="18" />
      </button>
    </div>

    <div class="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      <div class="flex items-start gap-2 text-sm text-gray-700">
        <MapPin :size="15" class="mt-0.5 shrink-0 text-gray-400" />
        <span class="flex-1 leading-snug">{{ school.address }}</span>
        <button
          type="button"
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-primary-600"
          aria-label="在 Google 地圖開啟"
          @click="openGoogleMaps"
        >
          <ExternalLink :size="14" />
        </button>
      </div>

      <div v-if="school.phone" class="flex items-center gap-2 text-sm text-gray-700">
        <Phone :size="15" class="shrink-0 text-gray-400" />
        <a :href="`tel:${school.phone}`" class="hover:text-primary-600 hover:underline">
          {{ school.phone }}
        </a>
      </div>

      <div
        v-if="school.distanceKm > 0"
        class="flex items-center gap-2 text-sm font-medium text-primary-700"
      >
        <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50">
          <MapPin :size="13" class="text-primary-600" />
        </span>
        {{
          school.distanceKm < 1
            ? `距你 ${Math.round(school.distanceKm * 1000)} 公尺`
            : `距你 ${school.distanceKm.toFixed(1)} 公里`
        }}
      </div>

      <div
        v-if="penaltyHint > 0"
        class="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
      >
        <ShieldAlert :size="15" class="shrink-0 text-amber-700" />
        有 {{ penaltyHint }} 筆稽查紀錄，進詳情可查看內容
      </div>
    </div>

    <div class="shrink-0 space-y-2 border-t border-gray-100 px-4 py-4">
      <button
        type="button"
        class="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-50 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
        @click="openGoogleMaps"
      >
        <Navigation :size="14" />
        用 Google 地圖導航
      </button>
      <button
        type="button"
        class="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-700 py-2.5 text-sm font-medium text-white hover:bg-primary-800"
        @click="$emit('detail', school.id)"
      >
        查看完整資訊
        <ArrowRight :size="15" />
      </button>
    </div>
  </div>
</template>
