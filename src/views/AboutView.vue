<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import { SITE_URL } from '@/config/site'
import { usePageSeo } from '@/composables/usePageSeo'
import {
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Star,
  ThumbsUp,
} from 'lucide-vue-next'

usePageSeo({
  title: '關於補亦樂乎 | 台中補教情報地圖',
  description:
    '補亦樂乎是半公益補教資訊平台：不業配、不刪負評、來源可考。資料來自教育部及台中市政府公開資料，協助家長在報名前查核立案與稽查資訊。',
  ogTitle: '關於補亦樂乎',
  ogUrl: `${SITE_URL}/more/about`,
})

const promises = [
  {
    icon: ThumbsUp,
    title: '不業配、不置頂',
    desc: '若出現廣告，由 Google 自動投放，與補習班排序、查核結果無關。我們不向業者收費，也不接受置頂或業配。',
  },
  {
    icon: Star,
    title: '不刪真實負評',
    desc: '符合審核標準的親身經驗——不論正負——都會公開。業者回應評價尚在規劃；目前不得要求無理由刪除真實評論。',
  },
  {
    icon: ShieldCheck,
    title: '來源可考',
    desc: '立案狀態與稽查紀錄來自政府公開資料，標明來源與公告日期，並提供原始連結供自行核對。',
  },
]

const dataSources = [
  {
    agency: '台中市政府',
    dataset: '臺中市立案補習班資料',
    license: '政府資料開放授權條款第 1 版',
    url: 'https://opendata.taichung.gov.tw/',
    licenseUrl: 'https://data.gov.tw/license',
    note: '',
  },
  {
    agency: '教育部終身教育司（data.gov.tw #16461）',
    dataset: '全國立案短期補習班基本資料',
    license: '政府資料開放授權條款第 1 版',
    url: 'https://data.gov.tw/dataset/16461',
    licenseUrl: 'https://data.gov.tw/license',
    note: '',
  },
  {
    agency: '教育部（data.gov.tw #160225）',
    dataset: '全國立案兒童課後照顧服務中心基本資料',
    license: '政府資料開放授權條款第 1 版',
    url: 'https://data.gov.tw/dataset/160225',
    licenseUrl: 'https://data.gov.tw/license',
    note: '',
  },
  {
    agency: '教育部（bsb.kh.edu.tw）',
    dataset: '直轄市及各縣市短期補習班資訊管理系統（已立案查詢、廢止註銷查詢）',
    license: '政府資料開放授權條款第 1 版（站內開放宣告）',
    url: 'https://bsb.kh.edu.tw/showpage.jsp',
    licenseUrl: 'https://bsb.kh.edu.tw/open-data.jsp',
    note: '依開放宣告標示：資料來源為「直轄市及各縣市短期補習班」資訊管理系統',
  },
  {
    agency: '臺中市政府教育局',
    dataset: '補習班稽查違規清冊（月度 PDF 公告）',
    license: '法定應公開資訊（《短期補習班設立及管理準則》第 31 條）',
    url: 'https://www.tc.edu.tw/page/24b89681-4044-4838-9d67-426fea2d6fce',
    licenseUrl: '',
    note: '',
  },
]
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <div class="flex-1 pb-20 md:pb-10">
      <SubpageHeader title="關於補亦樂乎" />

      <div class="mx-auto max-w-xl space-y-6 px-4 py-5 md:px-6">
        <div
          class="relative overflow-hidden rounded-md px-5 pb-6 pt-5"
          style="background-color: #1a3a2e"
        >
          <svg
            class="pointer-events-none absolute right-0 top-0 opacity-[0.07]"
            width="200"
            height="200"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="180" cy="20" r="110" stroke="white" stroke-width="1" />
            <circle cx="180" cy="20" r="75" stroke="white" stroke-width="1" />
          </svg>
          <div class="relative z-10">
            <p class="text-xs font-medium tracking-wide" style="color: rgba(125,211,192,0.85)">
              補亦樂乎 · 台中補教情報
            </p>
            <h2 class="mt-2 font-heading text-xl font-bold leading-snug text-white text-pretty">
              用透明資訊，陪家長把選擇看清楚
            </h2>
            <p class="mt-3 text-sm leading-relaxed" style="color: rgba(200,235,228,0.85)">
              我們整合教育部與台中市政府公開資料，協助你在報名前查核立案狀態、稽查紀錄，並參考經審核的家長評價。
            </p>
            <div
              class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
              style="color: rgba(255,255,255,0.55)"
            >
              <span>台中市範圍</span>
              <span style="color: rgba(255,255,255,0.25)">·</span>
              <span>2,800+ 立案補習班</span>
              <span style="color: rgba(255,255,255,0.25)">·</span>
              <span>29 個行政區</span>
            </div>
          </div>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium text-gray-500">我們的承諾</p>
          <div class="space-y-3">
            <div
              v-for="p in promises"
              :key="p.title"
              class="flex gap-3.5 rounded-md border border-gray-200 bg-white p-4"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50"
              >
                <component :is="p.icon" :size="17" class="text-primary-700" />
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ p.title }}</p>
                <p class="mt-1 text-sm leading-relaxed text-gray-500">{{ p.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <p class="text-xs font-medium text-gray-500">資料來源</p>
            <span class="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">
              政府開放資料
            </span>
          </div>

          <div class="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div
              v-for="src in dataSources"
              :key="src.dataset"
              class="border-b border-gray-100 px-4 py-4 last:border-0"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-medium text-gray-500">{{ src.agency }}</p>
                  <p class="mt-0.5 text-sm font-medium leading-snug text-gray-800">{{ src.dataset }}</p>
                  <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span class="text-xs text-gray-500">{{ src.license }}</span>
                    <a
                      v-if="src.licenseUrl"
                      :href="src.licenseUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-0.5 text-xs font-medium text-primary-700 hover:underline"
                    >
                      授權條款 <ExternalLink :size="10" />
                    </a>
                  </div>
                  <p v-if="src.note" class="mt-1.5 text-xs leading-relaxed text-primary-700">
                    ※ {{ src.note }}
                  </p>
                </div>
                <a
                  :href="src.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                  :aria-label="`開啟資料來源：${src.dataset}`"
                >
                  <ExternalLink :size="13" />
                </a>
              </div>
            </div>
          </div>

          <p class="mt-2 px-1 text-xs leading-relaxed text-gray-500">
            本平台依政府資料開放授權條款（或各機關公告授權）加值應用上列資料。若內容有出入，以各機關最新公告為準。
          </p>
        </div>

        <div class="rounded-md border border-gray-200 bg-white px-4 py-4">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-50">
              <BookOpen :size="16" class="text-gray-500" />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-800">補亦樂乎 v1.0.0</p>
              <p class="text-xs text-gray-500">© 2026 補亦樂乎 · 台灣</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BottomTabBar />
  </div>
</template>
