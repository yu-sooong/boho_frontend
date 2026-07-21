<script setup lang="ts">
import type { PenaltyRecord } from '@/types'
import { ChevronDown, ShieldAlert } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps<{
  penalties: PenaltyRecord[]
  years?: number
}>()

const open = ref(false)
</script>

<template>
  <div class="rounded-md border border-amber-200 bg-amber-50">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      @click="open = !open"
    >
      <span class="flex items-center gap-2 text-amber-700">
        <ShieldAlert :size="18" class="shrink-0" />
        <span class="text-sm font-medium">
          近 {{ years ?? 3 }} 年 {{ props.penalties.length }} 筆稽查紀錄
        </span>
      </span>
      <ChevronDown
        :size="18"
        class="shrink-0 text-amber-700 transition-transform"
        :class="{ 'rotate-180': open }"
      />
    </button>
    <div v-if="open" class="space-y-3 border-t border-amber-200 px-4 py-3">
      <div v-for="p in props.penalties" :key="p.id" class="space-y-1 text-sm">
        <p class="font-medium text-gray-800">{{ p.date }}</p>
        <p class="text-gray-700">{{ p.content }}</p>
        <p class="text-gray-500">處理情形：{{ p.handling }}</p>
        <a :href="p.sourceUrl" target="_blank" rel="noopener" class="text-primary-700 underline">
          查看來源
        </a>
      </div>
      <p class="pt-1 text-xs text-gray-400">
        內容轉載自主管機關公告，以最新公告為準；原始連結可能因改版而失效。本平台不自行作成裁罰認定。
      </p>
    </div>
  </div>
</template>
