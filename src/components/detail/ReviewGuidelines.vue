<script setup lang="ts">
import { REVIEW_POLICY } from '@/data/reviewConstants'
import { RouterLink } from 'vue-router'

withDefaults(
  defineProps<{
    /** sheet 內用精簡版；完整頁用完整版 */
    compact?: boolean
  }>(),
  { compact: false },
)

const emit = defineEmits<{ navigate: [] }>()
</script>

<template>
  <div class="space-y-3 text-sm text-gray-600">
    <p class="leading-relaxed text-gray-700">{{ REVIEW_POLICY.intro }}</p>

    <ul class="space-y-2 border-t border-gray-100 pt-3">
      <li
        v-for="(point, i) in REVIEW_POLICY.points"
        :key="i"
        class="flex gap-2 leading-relaxed"
      >
        <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary-600" />
        <span>{{ point }}</span>
      </li>
    </ul>

    <p class="border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
      {{ REVIEW_POLICY.privacyNote }}
    </p>

    <RouterLink
      v-if="compact"
      to="/more/review-policy"
      class="inline-block text-xs font-medium text-primary-700 hover:underline"
      @click="emit('navigate')"
    >
      查看完整說明
    </RouterLink>
  </div>
</template>
