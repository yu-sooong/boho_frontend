<script setup lang="ts">
import { trackEvent } from '@/analytics'
import Tag from '@/components/common/Tag.vue'
import { useFavorites } from '@/composables/useFavorites'
import type { School } from '@/types'
import { ChevronRight, Heart, MapPin, ShieldAlert } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    school: School
    selected?: boolean
  }>(),
  { selected: false },
)

const emit = defineEmits<{ hover: [id: string | null] }>()

const { isFavorite, toggleFavorite } = useFavorites()

const hasPenalty = computed(
  () => (props.school.penaltyCount ?? 0) > 0 || props.school.penalties.length > 0,
)

const favorited = computed(() => isFavorite(props.school.id))

function onNavigate() {
  emit('hover', props.school.id)
  trackEvent('select_school', { school_id: props.school.id, source: 'list' })
}

function onToggleFavorite() {
  toggleFavorite(props.school.id)
}
</script>

<template>
  <div
    class="relative rounded-md border p-4 transition-colors"
    :class="
      selected
        ? 'border-primary-600 bg-primary-50/40'
        : 'border-gray-200 hover:border-primary-300'
    "
    @mouseenter="$emit('hover', school.id)"
    @mouseleave="$emit('hover', null)"
  >
    <button
      type="button"
      class="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-primary-700"
      :aria-label="favorited ? '取消收藏' : '加入收藏'"
      :aria-pressed="favorited"
      data-testid="school-card-favorite"
      @click="onToggleFavorite"
    >
      <Heart
        :size="18"
        :class="favorited ? 'fill-primary-700 text-primary-700' : ''"
      />
    </button>

    <RouterLink
      :to="`/schools/${school.id}`"
      class="block pr-10"
      @click="onNavigate"
    >
      <div class="flex items-start justify-between gap-2">
        <h3 class="min-w-0 flex-1 font-heading text-base font-bold text-gray-900">{{ school.name }}</h3>
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
          title="有公開稽查紀錄（轉載主管機關公告）"
        >
          <ShieldAlert :size="12" class="shrink-0" />
          公開稽查
        </span>
        <Tag v-for="tag in school.categoryTags" :key="tag" active>{{ tag }}</Tag>
        <Tag v-for="tag in [...school.levelTags, ...school.extraTags]" :key="tag">{{ tag }}</Tag>
      </div>
      <div class="mt-2 flex items-center justify-end gap-0.5 text-sm font-medium text-primary-700 md:hidden">
        查看詳情
        <ChevronRight :size="16" />
      </div>
    </RouterLink>
  </div>
</template>
