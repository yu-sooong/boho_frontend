<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import {
  BarChart2,
  BookOpen,
  Bookmark,
  ChevronRight,
  Info,
  Mail,
  MapPin,
  MessageSquareText,
  Scale,
  Shield,
  Sparkles,
} from 'lucide-vue-next'
import { SITE_URL } from '@/config/site'
import { usePageSeo } from '@/composables/usePageSeo'

usePageSeo({
  title: '更多 | 補亦樂乎',
  description:
    '探索補亦樂乎功能、常見問題與說明條款。台中市補習班地圖、立案狀態與稽查資訊一站查詢。',
  ogTitle: '更多 | 補亦樂乎',
  ogUrl: `${SITE_URL}/more`,
})

const features = [
  { label: '找補習班', sub: '地圖與列表雙模式搜尋', icon: MapPin, to: '/' },
  { label: '地區情報', sub: '各區密度統計分析', icon: BarChart2, to: '/district-stats' },
  { label: '我的收藏', sub: '儲存關注的補習班', icon: Bookmark, to: '/favorites' },
  { label: '文章專區', sub: '選班指南與實用文章', icon: BookOpen, to: '/guide' },
  { label: 'AI 選班', sub: '依需求推薦適合的班', icon: Sparkles, to: '/ai-pick' },
]

const infoLinks = [
  { label: '關於我們', icon: Info, to: '/more/about' },
  { label: '評價怎麼審核', icon: MessageSquareText, to: '/more/review-policy' },
  { label: '聯絡我們', icon: Mail, to: '/more/contact' },
  { label: '隱私權政策', icon: Shield, to: '/more/privacy' },
  { label: '服務條款', icon: Scale, to: '/more/terms' },
]

const stats = [
  { value: '2,800+', label: '立案補習班' },
  { value: '29', label: '台中市行政區' },
  { value: '持續更新', label: '資料來源' },
]

const faqs = [
  {
    q: '資料來源是哪裡？',
    a: '基本資料來自教育部與台中市政府等開放資料；稽查／裁罰紀錄來自主管機關公告，並定期同步更新。',
  },
  {
    q: '評價是真實的嗎？',
    a: '評價採匿名投稿（公開只顯示身份與接觸時期），須通過人工審核才會刊出。具體親身經驗不論正負都會保留，我們不刪真實負評。',
  },
  {
    q: '如何回報資訊錯誤？',
    a: '請到「聯絡我們」來信說明，我們會核實後更新。',
  },
  {
    q: '補習班業者可以回應評價嗎？',
    a: '目前無法在平台回應；此功能尚在規劃。若對公開評價有異議，可先透過「聯絡我們」說明。',
  },
]
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <div class="flex-1 pb-20 md:pb-0">
      <!-- ── Hero：更多頁樞紐 ── -->
      <div
        class="relative overflow-hidden px-6 pb-8 pt-8 md:px-10 md:pb-10 md:pt-10"
        style="background-color: #1a3a2e"
      >
        <svg
          class="pointer-events-none absolute right-0 top-0 opacity-[0.08]"
          width="260"
          height="260"
          viewBox="0 0 260 260"
          fill="none"
        >
          <circle cx="230" cy="30" r="140" stroke="white" stroke-width="1" />
          <circle cx="230" cy="30" r="100" stroke="white" stroke-width="1" />
          <circle cx="230" cy="30" r="60" stroke="white" stroke-width="1" />
        </svg>

        <div class="relative z-10 md:max-w-2xl">
          <div class="mb-4 h-px w-8" style="background-color: rgba(255,255,255,0.25)" />
          <h1 class="font-heading text-3xl font-bold leading-tight tracking-wide text-white md:text-4xl">
            補亦樂乎
          </h1>
          <p class="mt-1.5 text-base tracking-wide md:text-lg" style="color: #7dd3c0">
            找回教育的樂趣
          </p>
          <p
            class="mt-3 text-[13px] italic leading-relaxed tracking-wide"
            style="color: rgba(200,235,228,0.6)"
          >
            以透明資訊，陪伴每位家長做出最好的決定
          </p>
          <div
            class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-wider"
            style="color: rgba(255,255,255,0.5)"
          >
            <span>採用教育部開放資料</span>
            <span style="color: rgba(255,255,255,0.2)">·</span>
            <span>真實家長口碑</span>
            <span style="color: rgba(255,255,255,0.2)">·</span>
            <span>不業配、不置頂</span>
          </div>
        </div>
      </div>

      <div class="mx-auto w-full max-w-5xl px-4 md:px-8">
        <div class="md:flex md:gap-12 md:py-10">
          <div class="md:flex-1">
            <!-- 桌面：關於摘要＋連到完整關於頁 -->
            <div class="hidden md:block">
              <p class="mb-4 text-[11px] font-medium uppercase tracking-widest text-gray-400">
                關於補亦樂乎
              </p>
              <div class="mb-5 grid grid-cols-3 gap-4">
                <div v-for="s in stats" :key="s.label">
                  <p class="font-heading text-2xl font-bold" style="color: #0f766e">{{ s.value }}</p>
                  <p class="mt-0.5 text-xs text-gray-500">{{ s.label }}</p>
                </div>
              </div>
              <div class="mb-5 h-px bg-gray-100" />
              <div class="space-y-3 text-sm leading-relaxed text-gray-600">
                <p>
                  補亦樂乎幫台中家長在報名前查立案、看稽查、讀真實評價——用公開資料把資訊攤開，讓選擇有依據。
                </p>
                <p>
                  我們不業配、不置頂、不刪真實負評。評價採匿名投稿與人工審核，資料來源皆可追查。
                </p>
              </div>
              <RouterLink
                to="/more/about"
                class="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
              >
                查看完整介紹與資料來源
                <ChevronRight :size="15" />
              </RouterLink>
            </div>

            <!-- 手機：探索功能 -->
            <div class="pt-5 md:hidden">
              <p class="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-gray-400">
                探索功能
              </p>
              <div class="overflow-hidden rounded-md border border-gray-200 bg-white">
                <RouterLink
                  v-for="(item, idx) in features"
                  :key="item.label"
                  :to="item.to"
                  class="group flex min-h-12 items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-gray-50/80"
                  :class="idx < features.length - 1 ? 'border-b border-gray-100' : ''"
                >
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style="background-color: #f0fdfb"
                  >
                    <component :is="item.icon" :size="17" style="color: #0f766e" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[14px] font-medium text-gray-900">{{ item.label }}</p>
                    <p class="text-xs text-gray-500">{{ item.sub }}</p>
                  </div>
                  <ChevronRight :size="15" class="shrink-0 text-gray-200 transition-colors group-hover:text-gray-400" />
                </RouterLink>
              </div>
            </div>
          </div>

          <div class="md:w-80 md:shrink-0">
            <div class="hidden md:block">
              <p class="mb-4 text-[11px] font-medium uppercase tracking-widest text-gray-400">
                常見問題
              </p>
              <div class="space-y-4">
                <div
                  v-for="item in faqs"
                  :key="item.q"
                  class="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <p class="text-sm font-medium text-gray-900">{{ item.q }}</p>
                  <p class="mt-1.5 text-sm leading-relaxed text-gray-500">{{ item.a }}</p>
                </div>
              </div>
            </div>

            <div class="md:hidden">
              <p class="mb-2.5 mt-5 text-[11px] font-medium uppercase tracking-widest text-gray-400">
                說明與條款
              </p>
              <div class="overflow-hidden rounded-md border border-gray-200 bg-white">
                <RouterLink
                  v-for="(item, idx) in infoLinks"
                  :key="item.label"
                  :to="item.to"
                  class="group flex min-h-12 items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-gray-50/80"
                  :class="idx < infoLinks.length - 1 ? 'border-b border-gray-100' : ''"
                >
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                    <component :is="item.icon" :size="17" class="text-gray-400" />
                  </div>
                  <span class="flex-1 text-[14px] font-medium text-gray-900">{{ item.label }}</span>
                  <ChevronRight :size="15" class="shrink-0 text-gray-200 transition-colors group-hover:text-gray-400" />
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="border-t border-gray-100 bg-white">
      <div class="mx-auto max-w-5xl px-8 py-5">
        <div class="flex flex-col items-center gap-2 md:flex-row md:justify-between">
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span class="font-medium text-gray-600">補亦樂乎</span>
            <span class="text-gray-200">|</span>
            <span>v1.0.0</span>
          </div>
          <p class="text-xs text-gray-400">© 2026 補亦樂乎 · All Rights Reserved.</p>
          <div class="hidden items-center gap-4 text-xs text-gray-400 md:flex">
            <RouterLink to="/more/about" class="hover:text-gray-600">關於我們</RouterLink>
            <span class="text-gray-200">·</span>
            <RouterLink to="/more/privacy" class="hover:text-gray-600">隱私權政策</RouterLink>
            <span class="text-gray-200">·</span>
            <RouterLink to="/more/terms" class="hover:text-gray-600">服務條款</RouterLink>
            <span class="text-gray-200">·</span>
            <RouterLink to="/more/contact" class="hover:text-gray-600">聯絡我們</RouterLink>
          </div>
        </div>
        <div class="mt-3 border-t border-gray-50 pt-3">
          <p class="text-center text-[10px] leading-relaxed text-gray-500 md:text-left">
            資料來源：臺中市政府資料開放平臺《臺中市立案補習班資料》、教育部終身教育司（data.gov.tw #16461）、「直轄市及各縣市短期補習班」資訊管理系統（bsb.kh.edu.tw）、臺中市政府教育局《補習班稽查違規清冊》。
            均依政府資料開放授權條款第 1 版或各機關公告授權使用。
            <RouterLink to="/more/about" class="underline hover:text-gray-700">查看完整資料來源</RouterLink>
          </p>
        </div>
      </div>
    </footer>
    <BottomTabBar />
  </div>
</template>
