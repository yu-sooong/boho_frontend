<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'

withDefaults(
  defineProps<{
    icon: Component
    title: string
    description?: string
    ctaLabel?: string
    ctaTo?: string
    /** 嵌在卡片內時用精簡版 */
    compact?: boolean
  }>(),
  {
    description: '',
    ctaLabel: '',
    ctaTo: '',
    compact: false,
  },
)
</script>

<template>
  <div
    class="flex flex-col items-center text-center"
    :class="compact ? 'gap-2.5 px-2 py-6' : 'gap-4 px-4 py-12'"
  >
    <div
      class="flex items-center justify-center rounded-full bg-primary-50"
      :class="compact ? 'h-14 w-14' : 'h-20 w-20'"
    >
      <component :is="icon" :size="compact ? 24 : 32" class="text-primary-400" />
    </div>
    <div class="max-w-xs space-y-1.5">
      <p class="font-medium text-gray-800" :class="compact ? 'text-sm' : ''">{{ title }}</p>
      <p v-if="description" class="text-sm leading-relaxed text-gray-500">{{ description }}</p>
    </div>
    <RouterLink
      v-if="ctaLabel && ctaTo"
      :to="ctaTo"
      class="mt-1 text-sm font-medium text-primary-700 hover:underline"
    >
      {{ ctaLabel }}
    </RouterLink>
    <slot />
  </div>
</template>
