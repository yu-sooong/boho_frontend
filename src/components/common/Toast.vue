<script setup lang="ts">
import { CheckCircle2, Info } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    /** success：完成提示；info：一般說明（如尚未開放） */
    tone?: 'success' | 'info'
  }>(),
  { tone: 'success' },
)
</script>

<template>
  <div class="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8">
    <div
      class="flex items-center gap-2 rounded-md px-4 py-3 text-sm text-white shadow-lg"
      :class="tone === 'info' ? 'bg-gray-800' : 'bg-gray-900'"
    >
      <Info v-if="tone === 'info'" :size="18" class="shrink-0 text-primary-300" />
      <CheckCircle2 v-else :size="18" class="shrink-0 text-primary-300" />
      <slot />
    </div>
  </div>
</template>
