<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    rating: number
    size?: number
    interactive?: boolean
    /** amber：評價投稿用黃星；neutral：列表／摘要用中性色 */
    tone?: 'amber' | 'neutral'
  }>(),
  { size: 16, interactive: false, tone: 'neutral' },
)

const emit = defineEmits<{ 'update:rating': [value: number] }>()

const stars = computed(() => [1, 2, 3, 4, 5].map((n) => n <= Math.round(props.rating)))

const filledClass = computed(() =>
  props.tone === 'amber' ? 'fill-amber-400 text-amber-400' : 'fill-gray-800 text-gray-800',
)
const emptyClass = computed(() =>
  props.tone === 'amber' ? 'fill-transparent text-amber-200' : 'fill-transparent text-gray-300',
)

function onClick(n: number) {
  if (props.interactive) emit('update:rating', n)
}
</script>

<template>
  <span class="inline-flex items-center gap-0.5">
    <button
      v-for="(filled, i) in stars"
      :key="i"
      type="button"
      class="rounded-sm transition-transform"
      :class="interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'"
      :tabindex="interactive ? 0 : -1"
      :aria-label="interactive ? `評分 ${i + 1} 星` : undefined"
      @click="onClick(i + 1)"
    >
      <Star
        :size="size"
        :stroke-width="interactive ? 1.75 : 2"
        :class="filled ? filledClass : emptyClass"
      />
    </button>
  </span>
</template>
