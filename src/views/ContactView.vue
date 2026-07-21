<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import { CONTACT_EMAIL, mailto } from '@/config/site'
import { usePageSeo } from '@/composables/usePageSeo'
import { Building2, ChevronRight, Flag, Mail } from 'lucide-vue-next'
import { ref } from 'vue'

usePageSeo({
  title: '聯絡我們 | 補亦樂乎',
  description: '資料錯誤回報、業者合作洽詢或一般問題，請透過此頁聯絡補亦樂乎團隊。',
  robots: 'noindex',
})

const faqs = [
  {
    q: '評價審核需要多久？',
    a: '通常在 3 個工作天內完成審核。審核通過後即會公開顯示；未通過則不會刊出（匿名投稿無法以 Email 通知，敬請見諒）。',
  },
  {
    q: '一天可以投幾則評價？',
    a: '為避免灌水，同一網路或裝置每日大約最多 5 則。若出現過於頻繁的提示，請隔日再試。',
  },
  {
    q: '如何刪除我的評價？',
    a: `請來信 ${CONTACT_EMAIL}，提供補習班名稱、投稿日期與內容摘要，我們會協助處理。`,
  },
  {
    q: '資料更新頻率為何？',
    a: '補習班基本資料每月與教育部開放資料同步一次；稽查紀錄則依主管機關公告盡快更新。本平台非主管機關，內容以各機關最新公告為準。',
  },
  {
    q: '補習班業者可以回應評價嗎？',
    a: '目前尚無法在平台直接回應，此功能預計於未來版本推出。若對公開內容或資料有異議，可先來信說明並附佐證，我們會依審核規則與服務條款協助處理。',
  },
  {
    q: '發現資料或評價有問題怎麼辦？',
    a: `請來信 ${CONTACT_EMAIL}，說明補習班名稱、問題說明與相關佐證（如公告連結）。我們會於合理範圍內核實；公開資料仍以主管機關公告為準。`,
  },
]

const openFaq = ref<number | null>(null)
function toggleFaq(i: number) {
  openFaq.value = openFaq.value === i ? null : i
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <div class="flex-1 pb-20 md:pb-10">
      <SubpageHeader title="聯絡我們" />

      <div class="mx-auto max-w-xl space-y-3 px-4 py-5 md:px-6">
        <div class="rounded-md border border-gray-200 bg-white p-4">
          <div class="flex gap-3.5">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50"
            >
              <Mail :size="18" class="text-primary-700" />
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500">一般問題</p>
              <p class="mt-1 text-sm font-semibold text-gray-900">來信信箱</p>
              <a :href="mailto()" class="text-sm font-medium text-primary-700 hover:underline">
                {{ CONTACT_EMAIL }}
              </a>
              <p class="mt-1 text-xs text-gray-500">我們會在 2 個工作天內回覆</p>
            </div>
          </div>
        </div>

        <div class="rounded-md border border-gray-200 bg-white p-4">
          <div class="flex gap-3.5">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-50">
              <Flag :size="18" class="text-gray-500" />
            </div>
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-500">資料回報</p>
              <p class="mt-1 text-sm font-semibold text-gray-900">補習班資料有誤？</p>
              <p class="mt-1 text-sm leading-relaxed text-gray-500">
                若發現資料不正確，歡迎來信告知，我們會盡快核實更新。
              </p>
              <a
                :href="mailto('資料回報')"
                class="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
              >
                來信回報
                <ChevronRight :size="13" />
              </a>
            </div>
          </div>
        </div>

        <div class="rounded-md border border-primary-200 bg-primary-50 p-4">
          <div class="flex gap-3.5">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-100"
            >
              <Building2 :size="18" class="text-primary-700" />
            </div>
            <div class="flex-1">
              <p class="text-xs font-medium text-primary-700">補習班業者</p>
              <p class="mt-1 text-sm font-semibold text-gray-900">業者合作洽詢</p>
              <p class="mt-1 text-sm leading-relaxed text-gray-600">
                資料勘誤、評價異議或未來業者功能洽詢，歡迎來信並附佐證（評價回應功能尚在規劃中）。
              </p>
              <a
                :href="mailto('業者合作洽詢')"
                class="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
              >
                來信洽詢
              </a>
            </div>
          </div>
        </div>

        <div class="pt-3">
          <p class="mb-3 text-xs font-medium text-gray-500">常見問題</p>
          <div class="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div
              v-for="(item, idx) in faqs"
              :key="item.q"
              class="border-b border-gray-100 last:border-0"
            >
              <button
                type="button"
                class="flex min-h-12 w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
                :aria-expanded="openFaq === idx"
                @click="toggleFaq(idx)"
              >
                <span class="text-sm font-medium text-gray-900">{{ item.q }}</span>
                <ChevronRight
                  :size="15"
                  class="shrink-0 text-gray-400 transition-transform duration-200"
                  :class="openFaq === idx ? 'rotate-90' : ''"
                />
              </button>
              <div v-if="openFaq === idx" class="px-4 pb-4 pt-0">
                <p class="text-sm leading-relaxed text-gray-500">{{ item.a }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BottomTabBar />
  </div>
</template>
