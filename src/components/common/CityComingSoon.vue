<script setup lang="ts">
import { useCityStore } from '@/stores/cityStore'

defineProps<{
  /** 區塊高度佔滿父層時用 */
  fill?: boolean
}>()

const cityStore = useCityStore()

function backToTaichung() {
  cityStore.setCity('taichung')
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center px-6 text-center"
    :class="fill ? 'h-full min-h-[280px]' : 'py-16'"
  >
    <p class="text-xs font-medium tracking-wide text-gray-400">即將開放</p>
    <h2 class="mt-2 font-heading text-lg font-bold text-gray-900">
      {{ cityStore.city?.name ?? '此縣市' }}資料準備中
    </h2>
    <p class="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
      目前先開放台中市查詢。新北、高雄的立案資料與地圖範圍還在匯入，開放後會直接在這裡可用。
    </p>
    <button
      type="button"
      class="mt-5 min-h-10 rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
      @click="backToTaichung"
    >
      先看台中市
    </button>
  </div>
</template>
