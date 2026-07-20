<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import { usePageSeo } from '@/composables/usePageSeo'
import { ChevronDown, ShieldCheck } from 'lucide-vue-next'
import { ref } from 'vue'

usePageSeo({
  title: '服務條款 | 補亦樂乎',
  description: '閱讀補亦樂乎的服務條款，了解使用本平台的相關規範與您的權益。',
  robots: 'noindex',
})

const sections = [
  {
    title: '一、服務說明',
    content: `補亦樂乎提供補習班資訊查詢、家長評價、地區統計等功能。平台資料來自教育部公開資料及使用者投稿，僅供參考，不構成推薦或背書。`,
    open: true,
    highlight: null as string | null,
  },
  {
    title: '二、使用者責任',
    content: `您同意在使用本平台時：\n\n• 不得張貼虛假、誤導或侵犯他人權益的評價內容\n• 不得利用本平台從事任何違法行為\n• 不得以自動化方式大量擷取平台資料\n• 不得冒充他人身份投稿評價`,
    open: true,
    highlight: null,
  },
  {
    title: '三、評價政策',
    content: `評價採匿名分享：公開時只顯示身份類別與就讀／接觸時期，不公開投稿者真實身分。評價須通過人工審核，確認為具體親身經驗方可刊出。廣告、業配、人身攻擊、洩漏個資或非親身經驗將被退件。業者回應評價功能尚在規劃中；補習班若有異議，應透過聯絡我們提出，不得要求無理由刪除他人真實經驗。`,
    open: true,
    highlight:
      '我們不刪除真實的負面評價。補習班的真實面貌需要誠實的資訊才能呈現，這是本平台的核心承諾。',
  },
  {
    title: '四、免責聲明',
    content: `本平台盡力確保資料的正確性，但對於資料的完整性、即時性不作任何保證。選擇補習班時請以實際情況為準，並自行承擔相關風險。`,
    open: false,
    highlight: null,
  },
  {
    title: '五、條款變更',
    content: `本平台保留隨時修訂服務條款的權利。條款變更後將於本頁面公告，繼續使用即視為接受修訂後的條款。`,
    open: false,
    highlight: null,
  },
]

const openSections = ref<Set<number>>(
  new Set(sections.map((s, i) => (s.open ? i : -1)).filter((i) => i >= 0)),
)

function toggle(i: number) {
  if (openSections.value.has(i)) {
    openSections.value.delete(i)
  } else {
    openSections.value.add(i)
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <div class="flex-1 pb-20 md:pb-10">
      <SubpageHeader title="服務條款" />

      <div class="mx-auto max-w-xl px-4 py-5 md:px-6">
        <div class="mb-5 flex items-center justify-between">
          <p class="text-xs text-gray-500">最後更新：2026 年 1 月 1 日</p>
          <span
            class="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
            style="border-color: #99d4cc; color: #0f766e; background-color: #f0fdfb"
          >
            版本 1.0
          </span>
        </div>

        <p class="mb-6 text-sm leading-relaxed text-gray-600">
          使用補亦樂乎平台即表示您同意以下服務條款。請在使用前仔細閱讀。
        </p>

        <div class="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
          <div v-for="(sec, idx) in sections" :key="sec.title">
            <button
              type="button"
              class="flex min-h-12 w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-gray-50"
              :aria-expanded="openSections.has(idx)"
              @click="toggle(idx)"
            >
              <span class="text-sm font-semibold text-gray-900">{{ sec.title }}</span>
              <ChevronDown
                :size="16"
                class="shrink-0 text-gray-300 transition-transform duration-200"
                :class="openSections.has(idx) ? 'rotate-180' : ''"
              />
            </button>
            <div v-if="openSections.has(idx)" class="px-4 pb-5 pt-0">
              <div
                v-if="sec.highlight"
                class="mb-3 flex items-start gap-2.5 rounded-md border p-3"
                style="background-color: #f0fdfb; border-color: #99d4cc"
              >
                <ShieldCheck :size="16" class="mt-0.5 shrink-0" style="color: #0f766e" />
                <p class="text-sm leading-relaxed" style="color: #0f766e">{{ sec.highlight }}</p>
              </div>
              <p
                v-for="(line, li) in sec.content.split('\n')"
                :key="li"
                class="text-sm leading-relaxed text-gray-500"
                :class="line === '' ? 'mt-2' : ''"
              >
                {{ line }}
              </p>
            </div>
          </div>
        </div>

        <p class="mt-6 text-xs leading-relaxed text-gray-500">
          如對條款有疑問，請透過
          <RouterLink to="/more/contact" class="underline hover:text-gray-700">聯絡我們</RouterLink>
          與我們聯繫。
        </p>
      </div>
    </div>

    <BottomTabBar />
  </div>
</template>
