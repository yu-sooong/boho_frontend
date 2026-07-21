<script setup lang="ts">
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    floating?: boolean
    showBack?: boolean
    keyword?: string
    district?: string
    category?: string
    onlyHasPenalty?: boolean
  }>(),
  {
    floating: false,
    showBack: false,
    keyword: '',
    district: '',
    category: '',
    onlyHasPenalty: false,
  },
)

const emit = defineEmits<{
  back: []
  'update:keyword': [value: string]
  openFilter: []
}>()

const activeCount = computed(() => {
  const d = props.district ? props.district.split(',').filter(Boolean).length : 0
  const c = props.category ? props.category.split(',').filter(Boolean).length : 0
  return d + c + (props.onlyHasPenalty ? 1 : 0)
})
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      v-if="showBack"
      type="button"
      class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50"
      aria-label="返回"
      @click="$emit('back')"
    >
      <ArrowLeft :size="20" />
    </button>

    <!-- 搜尋框 -->
    <div
      data-tour="tour-search"
      class="flex min-h-10 flex-1 items-center gap-2 rounded-md border px-3 py-2.5"
      :class="
        floating
          ? 'border-white/40 bg-white/70 backdrop-blur-md'
          : 'border-gray-200 bg-white'
      "
    >
      <Search :size="16" class="shrink-0 text-gray-400" aria-hidden="true" />
      <input
        type="search"
        placeholder="搜尋補習班名稱或地址"
        aria-label="搜尋補習班名稱或地址"
        class="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none"
        :value="keyword"
        @input="$emit('update:keyword', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="keyword"
        type="button"
        class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        aria-label="清除搜尋"
        @click="$emit('update:keyword', '')"
      >
        <X :size="14" />
      </button>
    </div>

    <!-- 篩選按鈕 -->
    <button
      type="button"
      data-tour="tour-filter"
      aria-label="篩選"
      title="篩選"
      class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors"
      :class="
        activeCount > 0
          ? 'border-primary-500 bg-primary-50 text-primary-700'
          : floating
            ? 'border-white/40 bg-white/70 text-gray-600 backdrop-blur-md'
            : 'border-gray-200 bg-white text-gray-600'
      "
      @click="$emit('openFilter')"
    >
      <SlidersHorizontal :size="17" />
      <!-- 篩選數量徽章 -->
      <span
        v-if="activeCount > 0"
        class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-700 text-[10px] font-bold text-white"
      >
        {{ activeCount }}
      </span>
    </button>
  </div>
</template>
