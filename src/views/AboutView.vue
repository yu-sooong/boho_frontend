<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import { SITE_URL } from '@/config/site'
import { usePageSeo } from '@/composables/usePageSeo'
import {
  BookOpen,
  ExternalLink,
  MapPinned,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

usePageSeo({
  title: '關於補亦樂乎 | 台中補教情報地圖',
  description:
    '補亦樂乎致力蒐集更多家長與學生的真實評價，並彙整台中市立案補習班公開資訊；未來再以這些口碑協助 AI 選班，讓孩子更容易找到適合的學習資源。',
  ogTitle: '關於補亦樂乎｜蒐集真實家長與學生評價',
  ogUrl: `${SITE_URL}/more/about`,
})

const storySteps = [
  {
    icon: MapPinned,
    title: '彙整台中市立案補習班',
    desc: '把公開資料放進同一張地圖與列表，讓你先確認立案狀態與稽查紀錄，再決定要不要預約參觀。',
  },
  {
    icon: MessageCircleHeart,
    title: '盡力蒐集更多家長與學生評價',
    desc: '邀請實際上過課的家長、學生留下留言與星等。匿名投稿、經人工審核後公開；正面與需要改進的經驗都歡迎，重點是具體、可核對的親身感受。',
  },
  {
    icon: Sparkles,
    title: '用這些評價協助找到更好資源',
    desc: '評價累積得越完整，比較才越有意義。下一步是 AI 選班：把公開資訊與審核後的家長／學生口碑變成依據，依孩子需求推薦更適合的選擇。（功能準備中）',
  },
]

const promises = [
  {
    icon: ThumbsUp,
    title: '不業配、不置頂',
    desc: '若出現廣告，由 Google 自動投放，與補習班排序、查核結果無關。我們不向業者收取曝光或置頂費用，排序不販售。',
  },
  {
    icon: Star,
    title: '依標準審核、正負並陳',
    desc: '符合審核標準的親身經驗——不論正負——都會公開。業者回應功能尚在規劃；若對內容有異議，可透過「聯絡我們」提出，我們會依審核規則處理。',
  },
  {
    icon: ShieldCheck,
    title: '來源可考',
    desc: '立案狀態與稽查紀錄來自政府公開資料與主管機關公告，標明來源與日期，並提供原始連結供自行核對。',
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
              品牌故事
            </p>
            <h2 class="mt-2 font-heading text-xl font-bold leading-snug text-pretty text-white">
              先把家長與學生的真實聲音蒐集起來
            </h2>
            <p class="mt-3 text-sm leading-relaxed" style="color: rgba(200,235,228,0.85)">
              政府公開資料能協助核對立案與稽查公告；實際上過課的家長與學生怎麼說，則補上更難取得的日常體驗。補亦樂乎把兩者放在一起，讓選擇多一點可核對的依據。請注意：機關網站可能改版，公告或檔案連結也可能搬移、失效，仍以主管機關最新公告為準。
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
          <p class="mb-2 text-xs font-medium text-gray-500">我們為什麼做這件事</p>
          <div class="space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              補習資訊常散落在傳單、社團與搜尋結果裡。立案與稽查公告可以查，但班上氣氛、教學節奏、孩子適不適應，往往只能靠親友口述，或難以判斷來源的網路訊息。
            </p>
            <p>
              因此我們把重心放在<strong class="font-semibold text-gray-800">蒐集更多家長與學生的留言評價</strong>：有親身經驗的人，都可以在補習班頁留下星等與心得。評價經人工審核後公開，正面與需要改進的經驗都保留。公開資料協助核對底線；親身經驗則補上日常感受——也會成為未來 AI 選班的重要依據。
            </p>
          </div>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium text-gray-500">我們怎麼做</p>
          <div class="space-y-3">
            <div
              v-for="step in storySteps"
              :key="step.title"
              class="flex gap-3.5 rounded-md border border-gray-200 bg-white p-4"
            >
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50">
                <component :is="step.icon" :size="17" class="text-primary-700" />
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ step.title }}</p>
                <p class="mt-1 text-sm leading-relaxed text-gray-500">{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-md border border-primary-100 bg-primary-50/60 px-4 py-4">
          <p class="text-sm font-semibold text-gray-900">歡迎留下你的經驗</p>
          <p class="mt-1.5 text-sm leading-relaxed text-gray-600">
            若你是家長或學生，上過某間台中補習班，歡迎到該班詳情頁投稿評價。每一則經審核的具體心得，都能幫助下一位家長把選擇看得更清楚。
          </p>
          <RouterLink
            to="/"
            class="mt-3 inline-flex text-sm font-medium text-primary-700 hover:underline"
          >
            去找補習班並留下評價
          </RouterLink>
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
            本平台依政府資料開放授權條款（或各機關公告授權）加值應用上列資料，並非主管機關，亦不自行作成裁罰認定。機關網站改版後，原始連結可能搬移、失效或暫時無法開啟；若內容有出入，以各機關最新公告為準。詳見
            <RouterLink to="/more/terms" class="underline hover:text-gray-700">服務條款</RouterLink>
            。
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
