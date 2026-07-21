<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
import SubpageHeader from '@/components/layout/SubpageHeader.vue'
import { usePageSeo } from '@/composables/usePageSeo'
import { ChevronDown, ShieldCheck } from 'lucide-vue-next'
import { ref } from 'vue'

usePageSeo({
  title: '服務條款 | 補亦樂乎',
  description: '閱讀補亦樂乎的服務條款，了解使用規範、資料來源說明與免責事項。',
  robots: 'noindex',
})

const sections = [
  {
    title: '一、服務說明',
    content: `補亦樂乎（以下稱「本平台」）提供台中市補習班公開資訊查詢、地圖瀏覽、地區統計與使用者評價等功能，目的是協助家長與學生取得可核對的資訊。\n\n本平台展示之內容僅供參考，不構成對任何補習班之推薦、背書、保證或投資／就學建議。是否報名、參觀或簽訂契約，請您自行判斷並承擔相關風險。`,
    open: true,
    highlight: null as string | null,
  },
  {
    title: '二、資料來源與正確性',
    content: `本平台之補習班基本資料、立案狀態等，主要加值應用自教育部、台中市政府及其他主管機關之開放資料或依法應公開資訊；稽查／違規相關內容摘錄或轉載自主管機關公告（例如教育局稽查違規清冊），並盡力標示來源連結。\n\n• 本平台並非主管機關，亦不自行作成裁罰或違規認定。\n• 開放資料與公告可能有時間落差、缺漏或與現場實際狀況不同；若有出入，一律以各機關最新公告及現場查證為準。\n• 機關網站可能改版，公告頁或 PDF 等原始連結也可能搬移、下架或暫時無法開啟；本平台保留同步當下之摘錄供查閱，不保證來源連結永久有效。\n• 本平台會盡力同步更新，但不保證資料完整、即時、正確或適合特定用途。\n• 補習班或相關利害關係人若發現資料錯誤，可透過「聯絡我們」提供佐證，我們將於合理範圍內核實並更新。`,
    open: true,
    highlight: '公開資料與公告的權利義務仍屬各該主管機關；本平台僅為資訊加值與呈現。來源連結若失效，請改以機關現行查詢管道為準。',
  },
  {
    title: '三、使用者責任',
    content: `您同意在使用本平台時：\n\n• 不得張貼虛假、誤導、誹謗或侵犯他人權益的評價內容\n• 不得利用本平台從事任何違法或不當行為\n• 不得以自動化方式大量擷取、重製或轉售平台資料\n• 不得冒充他人身份投稿評價\n• 不得干擾平台運作或嘗試未授權存取\n\n您對自己投稿的內容負全部責任。若因您的內容致第三人主張權利或請求賠償，您應自行處理並使本平台免受損害。`,
    open: true,
    highlight: null,
  },
  {
    title: '四、評價與使用者內容',
    content: `評價採匿名分享：公開時只顯示身份類別與就讀／接觸時期，不公開投稿者真實身分。評價須通過人工審核，確認為具體親身經驗方可刊出。廣告、人身攻擊、洩漏個資或非親身經驗將被退件。\n\n• 符合審核標準的親身經驗不論正負都會公開；我們不以付費作為刪改評價的條件。\n• 本平台有權依審核規則拒絕、下架、編輯標示或限制顯示違反規範之內容，無需事先通知。\n• 業者回應評價功能尚在規劃；補習班若對內容有異議，請透過「聯絡我們」提出並附具體理由與佐證，我們將依審核規則核實處理。\n• 評價內容為投稿者個人經驗與意見，不代表本平台立場。`,
    open: true,
    highlight:
      '本平台為資訊中介與審核機制之提供者，並非評價所述事實之保證人。',
  },
  {
    title: '五、智慧財產與授權',
    content: `本平台自行製作之介面、文案、編排與商標，其權利歸本平台或合法權利人所有。政府開放資料依各該授權條款使用；使用者投稿內容，您同意授予本平台於服務營運所需範圍內非專屬、可再授權之使用權（包含儲存、展示、備份與合理必要之技術處理）。\n\n未經同意，請勿大量重製、爬取或商業性轉售本平台加值後之資料呈現。`,
    open: false,
    highlight: null,
  },
  {
    title: '六、服務變更與帳號／使用限制',
    content: `本平台得視營運需要新增、調整、暫停或終止全部或部分服務，並得對濫用、違法或嚴重違反本條款之使用行為採取限制存取、移除內容等措施。\n\n因維護、不可抗力、第三方服務中斷或其他非本平台所能控制之事由，導致服務暫時無法使用，本平台不負賠償責任。`,
    open: false,
    highlight: null,
  },
  {
    title: '七、免責聲明',
    content: `在法律允許的最大範圍內：\n\n• 本平台不就資料之正確性、完整性、即時性、可用性或特定目的適用性作任何明示或默示保證。\n• 您因信賴本平台資訊、評價或統計所為之決定（包含但不限於報名、簽約、消費），其風險由您自行承擔。\n• 對於第三人（含補習班、投稿者、主管機關、地圖或其他外部服務）之行為、內容或公告，本平台不負連帶責任。\n• 在法律允許範圍內，本平台對任何間接、附帶、衍生或懲罰性損害不負責任；若依法仍應負責，責任上限以您就該爭議事件曾向本平台支付之費用為限（本平台目前主要為免費服務時，該上限得為新臺幣零元）。\n\n本條款部分約定若依法無效，不影響其他約定之效力。`,
    open: true,
    highlight: null,
  },
  {
    title: '八、準據法與爭議處理',
    content: `本條款以中華民國法律為準據法。因本條款或本平台服務所生爭議，雙方應先善意協商；協商不成時，合意以臺灣臺中地方法院為第一審管轄法院。`,
    open: false,
    highlight: null,
  },
  {
    title: '九、條款變更',
    content: `本平台保留隨時修訂本條款之權利。重大變更將於本頁面公告更新日期；您於變更後繼續使用本平台，即視為同意修訂後條款。`,
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
          <p class="text-xs text-gray-500">最後更新：2026 年 7 月 21 日</p>
          <span
            class="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
            style="border-color: #99d4cc; color: #0f766e; background-color: #f0fdfb"
          >
            版本 1.1
          </span>
        </div>

        <p class="mb-6 text-sm leading-relaxed text-gray-600">
          使用補亦樂乎平台即表示您同意以下服務條款。請在使用前仔細閱讀。本文件為平台營運說明，如有法律諮詢需求，請另行洽詢專業人士。
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
