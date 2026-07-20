<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import { usePageSeo } from '@/composables/usePageSeo'
import { Sparkles } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
  }>(),
  {
    description: '內容與功能還在準備中，開放後會第一時間更新。',
  },
)

usePageSeo({
  title: `${props.title} | 補亦樂乎`,
  description: `補亦樂乎「${props.title}」即將開放。${props.description}`,
  robots: 'noindex',
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <div class="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-24 text-center">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700"
      >
        <Sparkles :size="22" />
      </div>
      <h1 class="font-heading text-xl font-bold text-gray-900">{{ title }}</h1>
      <p class="max-w-sm text-sm leading-relaxed text-gray-500">{{ description }}</p>
      <p class="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">即將開放</p>
      <RouterLink to="/" class="mt-2 text-sm font-medium text-primary-700 hover:underline">
        回首頁找補習班
      </RouterLink>
    </div>
    <BottomTabBar />
  </div>
</template>
