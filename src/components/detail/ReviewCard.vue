<script setup lang="ts">
import RatingStars from '@/components/common/RatingStars.vue'
import Tag from '@/components/common/Tag.vue'
import { identityLabel, periodLabel } from '@/data/reviewConstants'
import type { Review } from '@/types'

defineProps<{
  review: Review
}>()
</script>

<template>
  <article class="space-y-2 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm font-medium text-gray-900">
          {{ identityLabel(review.identity) }}
          <span class="font-normal text-gray-400">・</span>
          <span class="font-normal text-gray-500">{{ periodLabel(review.period) }}</span>
        </p>
        <p class="mt-0.5 text-xs text-gray-400">{{ review.date }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <span
          v-if="review.status === 'pending'"
          class="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
          title="審核通過後會公開"
        >
          審核中
        </span>
        <RatingStars :rating="review.rating" :size="14" />
      </div>
    </div>

    <p class="text-sm leading-relaxed text-gray-700">{{ review.content }}</p>

    <div v-if="review.tags.length" class="flex flex-wrap gap-1.5">
      <Tag v-for="tag in review.tags" :key="tag">{{ tag }}</Tag>
    </div>
  </article>
</template>
