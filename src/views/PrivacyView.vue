<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import { CONTACT_EMAIL } from '@/config/site'
import { usePageSeo } from '@/composables/usePageSeo'
import { ChevronDown } from 'lucide-vue-next'
import { ref } from 'vue'

usePageSeo({
  title: '隱私權政策 | 補亦樂乎',
  description: '閱讀補亦樂乎的隱私權政策，了解我們如何蒐集、處理及保護您的個人資料。',
  robots: 'noindex',
})

const sections = [
  {
    title: '一、收集的資料',
    content: `當您使用本平台時，我們可能收集以下資料：\n\n• 您主動提供的資料（如評價內容、自填身份／就讀時期、聯絡資訊）\n• 自動收集的使用資料（如瀏覽頁面、點擊行為）\n• 裝置資訊（如 IP 位址、匿名裝置識別、瀏覽器類型）\n• 儲存在您瀏覽器本機的資料（如收藏清單、匿名裝置識別）\n\n評價公開時僅顯示身份類別與就讀／接觸時期，不會公開您的真實身分。評價送出後由伺服器保存並經人工審核，通過後公開顯示。收藏清單存在該瀏覽器本機，不會同步到其他裝置。`,
    open: true,
  },
  {
    title: '二、資料使用目的',
    content: `收集的資料用於：\n\n• 提供及改善平台服務\n• 審核使用者評價內容\n• 調查濫用行為（如灌水、冒充；IP 與裝置識別僅供此用途，不對外顯示）\n• 分析使用行為以優化體驗\n• 回應使用者詢問\n\n分析用流量資料與評價投稿內容分開處理，不會用來還原您的個人身分。`,
    open: true,
  },
  {
    title: '三、資料分享',
    content: `本平台不會將您的個人資料出售予第三方。僅在法律要求或保護平台權益時，才會向主管機關揭露必要資訊。`,
    open: true,
  },
  {
    title: '四、Cookie 使用',
    content: `我們使用 Cookie 來提升您的使用體驗，例如記住您的偏好設定、分析網站流量。您可以透過瀏覽器設定拒絕 Cookie，但部分功能可能因此受限。`,
    open: false,
  },
  {
    title: '五、您的權利',
    content: `您有權查詢、請求更正或刪除您的個人資料，並可要求停止資料處理或行銷用途。如需行使相關權利，請來信 ${CONTACT_EMAIL}。`,
    open: false,
  },
  {
    title: '六、聯絡我們',
    content: `若您對本政策有任何疑問，或希望行使您的權利，歡迎透過以下方式聯繫我們：\n\nEmail：${CONTACT_EMAIL}\n回覆時間：2 個工作天內`,
    open: false,
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
      <SubpageHeader title="隱私權政策" />

      <div class="mx-auto max-w-xl px-4 py-5 md:px-6">
        <p class="mb-5 text-xs text-gray-500">最後更新：2026 年 1 月 1 日</p>

        <p class="mb-6 text-sm leading-relaxed text-gray-600">
          補亦樂乎（以下簡稱「本平台」）重視您的隱私權。本政策說明我們如何收集、使用及保護您的個人資料。
        </p>

        <div class="space-y-0 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
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
          本政策如有修訂，將於本頁更新。繼續使用本平台，即表示您接受修訂後的內容。
        </p>
      </div>
    </div>

    <BottomTabBar />
  </div>
</template>
