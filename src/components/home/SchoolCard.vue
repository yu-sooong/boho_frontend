<script setup lang="ts">
import { trackEvent } from '@/analytics'
import Tag from '@/components/common/Tag.vue'
import type { School } from '@/types'
import { ChevronRight, MapPin, ShieldAlert } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    school: School
    selected?: boolean
  }>(),
  { selected: false },
)

defineEmits<{ hover: [id: string | null] }>()

const hasPenalty = computed(
  () => (props.school.penaltyCount ?? 0) > 0 || props.school.penalties.length > 0,
)

function onNavigate() {
  trackEvent('select_school', { school_id: props.school.id, source: 'list' })
}
</script>

<template>
  <RouterLink
    :to="`/schools/${school.id}`"
    class="block rounded-md border p-4 transition-colors"
    :class="
      selected
        ? 'border-primary-600 bg-primary-50/40'
        : 'border-gray-200 hover:border-primary-300'
    "
    @click="onNavigate"
    @mouseenter="$emit('hover', school.id)"
    @mouseleave="$emit('hover', null)"
  >
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-heading text-base font-bold text-gray-900">{{ school.name }}</h3>
      <span v-if="school.distanceKm > 0" class="shrink-0 text-sm font-medium text-primary-700">
        {{
          school.distanceKm < 1
            ? `${Math.round(school.distanceKm * 1000)} 公尺`
            : `${school.distanceKm.toFixed(1)} 公里`
        }}
      </span>
    </div>
    <p class="mt-1 flex items-center gap-1 text-sm text-gray-500">
      <MapPin :size="14" class="shrink-0" />
      {{ school.address }}
    </p>
    <div class="mt-3 flex flex-wrap items-center gap-1.5">
      <span
        v-if="hasPenalty"
        class="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
        title="有稽查紀錄"
      >
        <ShieldAlert :size="12" class="shrink-0" />
        有稽查
      </span>
      <Tag v-for="tag in school.categoryTags" :key="tag" active>{{ tag }}</Tag>
      <Tag v-for="tag in [...school.levelTags, ...school.extraTags]" :key="tag">{{ tag }}</Tag>
    </div>
    <div class="mt-2 flex items-center justify-end gap-0.5 text-sm font-medium text-primary-700 md:hidden">
      查看詳情
      <ChevronRight :size="16" />
    </div>
  </RouterLink>
</template>
