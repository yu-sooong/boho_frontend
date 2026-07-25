<script setup lang="ts">
import { CONTACT_EMAIL, mailto } from '@/config/site'
import { usePageSeo } from '@/composables/usePageSeo'
import { Wrench } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

usePageSeo({
  title: '目前暫停服務 | 補亦樂乎',
  description: '補亦樂乎目前暫停提供地圖與相關查詢服務。若未來重新開放，會再另行公告。',
  robots: 'noindex',
})
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-50/80 via-white to-amber-50/40 px-6 py-16 text-center"
  >
    <p class="font-heading text-2xl font-bold tracking-tight text-primary-800">補亦樂乎</p>
    <div
      class="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary-700 shadow-sm ring-1 ring-primary-100"
    >
      <Wrench :size="24" />
    </div>
    <h1 class="mt-5 font-heading text-xl font-bold text-gray-900">目前暫停服務</h1>
    <p class="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
      謝謝你來訪補亦樂乎。<br />
      網站目前暫停提供地圖與相關查詢服務。<br />
      若未來重新開放，我們會再另行公告。
    </p>
    <div class="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium">
      <RouterLink to="/more/about" class="text-primary-700 hover:underline">關於我們</RouterLink>
      <RouterLink to="/more/contact" class="text-primary-700 hover:underline">聯絡我們</RouterLink>
      <RouterLink to="/more" class="text-primary-700 hover:underline">更多</RouterLink>
    </div>
    <p class="mt-8 text-sm text-gray-500">如有其他事項，歡迎來信：</p>
    <a
      :href="mailto('【補亦樂乎】詢問')"
      class="mt-1 text-sm font-medium text-primary-700 hover:underline"
    >
      {{ CONTACT_EMAIL }}
    </a>
  </div>
</template>
