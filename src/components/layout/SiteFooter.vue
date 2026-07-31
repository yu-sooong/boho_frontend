<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 是否顯示資料來源摘要（更多頁建議開） */
    showSources?: boolean
  }>(),
  { showSources: false },
)

const year = new Date().getFullYear()

const links = [
  { label: '關於我們', to: '/more/about' },
  { label: '隱私權政策', to: '/more/privacy' },
  { label: '服務條款', to: '/more/terms' },
  { label: '聯絡我們', to: '/more/contact' },
] as const
</script>

<template>
  <footer class="border-t border-gray-100 bg-white">
    <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-800">補亦樂乎</p>
          <p class="mt-0.5 text-xs leading-relaxed text-gray-500">
            補習班公開資料彙整與找班工具
          </p>
        </div>
        <nav
          class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500"
          aria-label="頁尾連結"
        >
          <template v-for="(link, i) in links" :key="link.to">
            <span v-if="i > 0" class="text-gray-200" aria-hidden="true">·</span>
            <RouterLink :to="link.to" class="hover:text-gray-800">
              {{ link.label }}
            </RouterLink>
          </template>
        </nav>
      </div>

      <p
        v-if="showSources"
        class="mt-4 border-t border-gray-50 pt-3 text-[11px] leading-relaxed text-gray-500"
      >
        資料彙整自教育部與台中、新北、高雄等主管機關公開資訊；本站非主管機關，內容若有出入以各機關最新公告為準。
        <RouterLink to="/more/about" class="underline hover:text-gray-700">
          完整資料來源
        </RouterLink>
      </p>

      <p class="mt-3 text-[11px] text-gray-400">
        © {{ year }} 補亦樂乎
      </p>
    </div>
  </footer>
</template>
