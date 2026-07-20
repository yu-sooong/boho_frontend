<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import { usePageSeo } from '@/composables/usePageSeo'
import { MapPinOff } from 'lucide-vue-next'

usePageSeo({
  title: '找不到頁面 | 補亦樂乎',
  description: '您要找的頁面不存在或已移除。',
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
        <MapPinOff :size="22" />
      </div>
      <p class="text-xs font-medium tracking-wide text-gray-400">404</p>
      <h1 class="font-heading text-xl font-bold text-gray-900">找不到這個頁面</h1>
      <p class="max-w-sm text-sm leading-relaxed text-gray-500">
        網址可能打錯，或內容已經移除。回首頁繼續找台中補習班吧。
      </p>
      <div class="mt-2 flex flex-wrap items-center justify-center gap-3">
        <RouterLink
          to="/"
          class="rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
        >
          回首頁
        </RouterLink>
        <RouterLink to="/more/contact" class="text-sm font-medium text-primary-700 hover:underline">
          聯絡我們
        </RouterLink>
      </div>
    </div>
    <BottomTabBar />
  </div>
</template>
