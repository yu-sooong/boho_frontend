<script setup lang="ts">
import { CONTACT_EMAIL, mailto } from '@/config/site'
import { usePageSeo } from '@/composables/usePageSeo'
import { Wrench } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

usePageSeo({
  title: '服務暫停中 | 補亦樂乎',
  description: '補亦樂乎地圖與列表服務目前暫停，靜態說明頁仍可瀏覽。',
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
    <h1 class="mt-5 font-heading text-xl font-bold text-gray-900">服務暫停中</h1>
    <p class="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
      地圖、列表、地區情報與評價相關功能目前暫停維運，資料查詢暫時無法使用。造成不便，敬請見諒。
    </p>
    <div class="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium">
      <RouterLink to="/more/about" class="text-primary-700 hover:underline">關於我們</RouterLink>
      <RouterLink to="/more/contact" class="text-primary-700 hover:underline">聯絡我們</RouterLink>
      <RouterLink to="/more" class="text-primary-700 hover:underline">更多</RouterLink>
    </div>
    <p class="mt-8 text-sm text-gray-500">如需協助，請來信：</p>
    <a
      :href="mailto('【服務暫停】詢問')"
      class="mt-1 text-sm font-medium text-primary-700 hover:underline"
    >
      {{ CONTACT_EMAIL }}
    </a>
  </div>
</template>
