<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import {
  BarChart2,
  BookOpen,
  Bookmark,
  ChevronRight,
  Info,
  LayoutGrid,
  Mail,
  MapPin,
  MessageSquareText,
  Scale,
  Shield,
  SlidersHorizontal,
} from 'lucide-vue-next'
import { SITE_URL } from '@/config/site'
import { usePageSeo } from '@/composables/usePageSeo'

usePageSeo({
  title: '更多 | 補亦樂乎',
  description:
    '探索補亦樂乎功能、常見問題與說明條款。台中、新北、高雄補習班地圖、立案狀態與稽查資訊一站查詢。',
  ogTitle: '更多 | 補亦樂乎',
  ogUrl: `${SITE_URL}/more`,
})

const features = [
  { label: '導覽', sub: '選縣市、快速找班入口', icon: LayoutGrid, to: '/' },
  { label: '找班', sub: '地圖與列表雙模式搜尋', icon: MapPin, to: '/find' },
  { label: '地區情報', sub: '各區密度統計分析', icon: BarChart2, to: '/district-stats' },
  { label: '我的收藏', sub: '儲存關注的補習班', icon: Bookmark, to: '/favorites' },
  { label: '文章專區', sub: '選班指南與實用文章', icon: BookOpen, to: '/guide' },
  { label: 'AI 選班', sub: '規劃中・請先用找班與指南', icon: SlidersHorizontal, to: '/ai-pick' },
]

const infoLinks = [
  { label: '關於我們', icon: Info, to: '/more/about', sub: '公開資料彙整與找班工具' },
  { label: '評價怎麼審核', icon: MessageSquareText, to: '/more/review-policy', sub: '投稿規範與審核說明' },
  { label: '聯絡我們', icon: Mail, to: '/more/contact', sub: '回報錯誤或合作洽詢' },
  { label: '隱私權政策', icon: Shield, to: '/more/privacy', sub: '個資與 Cookie 說明' },
  { label: '服務條款', icon: Scale, to: '/more/terms', sub: '使用規範與免責' },
]

const stats = [
  { value: '3', label: '開查縣市' },
  { value: '96', label: '行政區' },
  { value: '持續更新', label: '資料來源' },
]

const faqs = [
  {
    q: '資料來源是哪裡？',
    a: '基本資料來自教育部與各縣市政府等開放資料；稽查紀錄摘錄自主管機關公告（台中、新北已匯入；高雄尚無可解析清冊），並定期同步。本平台非主管機關。機關網站改版後，原始連結可能失效，內容若有出入以各機關最新公告為準。',
  },
  {
    q: '評價是真實的嗎？',
    a: '評價採匿名投稿（公開只顯示身份與接觸時期），須通過人工審核才會刊出。符合標準的親身經驗不論正負都會保留；廣告、攻擊或不實內容則會退件。評價為投稿者意見，不代表本平台立場。',
  },
  {
    q: '如何回報資訊錯誤？',
    a: '請到「聯絡我們」來信說明並盡量附上佐證，我們會於合理範圍內核實後更新。',
  },
  {
    q: '補習班業者可以回應評價嗎？',
    a: '目前無法在平台直接回應；此功能尚在規劃。若對公開內容或資料有異議，可先透過「聯絡我們」說明，我們會依服務條款與審核規則處理。',
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
            以可核對的公開資訊，陪伴家長做決定
          </p>
          <div
            class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-wider"
            style="color: rgba(255,255,255,0.5)"
          >
            <span>採用教育部開放資料</span>
            <span style="color: rgba(255,255,255,0.2)">·</span>
            <span>家長與學生評價</span>
            <span style="color: rgba(255,255,255,0.2)">·</span>
            <span>不販售置頂</span>
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
                  我們想蒐集更多家長與學生的真實評價——實際上過課的人怎麼說，往往最有參考價值。同時彙整台中、新北、高雄的立案與稽查公開資訊，並朝向以這些資料協助 AI 選班。
                </p>
                <p>
                  評價採匿名投稿與人工審核，正面與需要改進的經驗都保留；我們不販售置頂或業配排序。
                </p>
              </div>
              <RouterLink
                to="/more/about"
                class="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
              >
                閱讀品牌故事與資料來源
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
                  <div class="min-w-0 flex-1">
                    <p class="text-[14px] font-medium text-gray-900">{{ item.label }}</p>
                    <p class="text-xs text-gray-500">{{ item.sub }}</p>
                  </div>
                  <ChevronRight :size="15" class="shrink-0 text-gray-200 transition-colors group-hover:text-gray-400" />
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SiteFooter show-sources class="pb-20 md:pb-0" />
    <BottomTabBar />
  </div>
</template>
