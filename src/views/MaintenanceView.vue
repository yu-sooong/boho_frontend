<script setup lang="ts">
import { CONTACT_EMAIL, mailto } from '@/config/site'
import { usePageSeo } from '@/composables/usePageSeo'
import { Wrench } from 'lucide-vue-next'

usePageSeo({
  title: '維護中 | 補亦樂乎',
  description: '補亦樂乎目前進行系統維護，請稍後再訪。',
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
    <h1 class="mt-5 font-heading text-xl font-bold text-gray-900">網站維護中</h1>
    <p class="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
      我們正在升級服務，請稍後再回來。造成不便，敬請見諒。
    </p>
    <p class="mt-6 text-sm text-gray-500">如需協助，請來信：</p>
    <a
      :href="mailto('【維護中】詢問')"
      class="mt-1 text-sm font-medium text-primary-700 hover:underline"
    >
      {{ CONTACT_EMAIL }}
    </a>
  </div>
</template>
