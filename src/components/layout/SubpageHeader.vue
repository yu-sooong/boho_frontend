<script setup lang="ts">
import { goBackOrHome } from '@/utils/navigation'
import { ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

withDefaults(
  defineProps<{
    title: string
    /** 是否顯示底部底線 */
    bordered?: boolean
  }>(),
  { bordered: true },
)

const router = useRouter()

function goBack() {
  goBackOrHome(router)
}
</script>

<template>
  <div
    class="flex items-center gap-3 px-4 py-3.5 md:px-6"
    :class="bordered ? 'border-b border-gray-200 bg-white' : ''"
  >
    <button
      type="button"
      class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      aria-label="返回上一頁"
      @click="goBack"
    >
      <ArrowLeft :size="20" />
    </button>
    <h1 class="flex-1 text-center font-heading text-base font-bold text-gray-900 md:text-lg">
      {{ title }}
    </h1>
    <span class="inline-block h-10 w-10 shrink-0" aria-hidden="true" />
  </div>
</template>
