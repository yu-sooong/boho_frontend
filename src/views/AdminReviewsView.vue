<script setup lang="ts">
import { getPendingReviews, moderateReview, type ApiReview } from '@/api/reviews'
import { identityLabel, periodLabel } from '@/data/reviewConstants'
import { usePageSeo } from '@/composables/usePageSeo'
import { onMounted, ref } from 'vue'

usePageSeo({
  title: '評價審核 | 補亦樂乎',
  robots: 'noindex, nofollow',
})

/** 僅存 sessionStorage，關閉分頁即清除（降低 XSS 長期竊取風險） */
const TOKEN_KEY = 'buyu:adminToken'

function readToken(): string {
  try {
    const fromSession = sessionStorage.getItem(TOKEN_KEY)
    if (fromSession) return fromSession
    // 遷移舊 localStorage
    const legacy = localStorage.getItem(TOKEN_KEY)
    if (legacy) {
      sessionStorage.setItem(TOKEN_KEY, legacy)
      localStorage.removeItem(TOKEN_KEY)
      return legacy
    }
  } catch {
    // ignore
  }
  return ''
}

const token = ref(readToken())
const items = ref<ApiReview[]>([])
const errorMsg = ref('')
const isLoading = ref(false)
const actingId = ref<string | null>(null)
const unlocked = ref(false)

async function load() {
  errorMsg.value = ''
  if (!token.value.trim()) {
    errorMsg.value = '請先輸入 Admin Token'
    unlocked.value = false
    items.value = []
    return
  }
  isLoading.value = true
  try {
    sessionStorage.setItem(TOKEN_KEY, token.value.trim())
    localStorage.removeItem(TOKEN_KEY)
    const result = await getPendingReviews(token.value.trim())
    items.value = result.data
    unlocked.value = true
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '載入失敗'
    items.value = []
    unlocked.value = false
  } finally {
    isLoading.value = false
  }
}

async function act(id: string, status: 'approved' | 'rejected') {
  actingId.value = id
  errorMsg.value = ''
  try {
    await moderateReview(id, status, token.value.trim())
    items.value = items.value.filter((r) => r.id !== id)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '操作失敗'
  } finally {
    actingId.value = null
  }
}

onMounted(() => {
  if (token.value) void load()
})
</script>

<template>
  <div class="mx-auto min-h-screen max-w-2xl px-4 py-8">
    <h1 class="font-heading text-2xl font-bold text-gray-900">評價審核</h1>
    <p class="mt-1 text-sm text-gray-500">
      僅內部使用。Token 存在此分頁的 sessionStorage，關閉分頁後會清除。
    </p>

    <div class="mt-6 flex flex-col gap-2 sm:flex-row">
      <input
        v-model="token"
        type="password"
        autocomplete="current-password"
        placeholder="Admin Token"
        aria-label="Admin Token"
        class="min-h-10 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
        @keydown.enter="load"
      />
      <button
        type="button"
        class="min-h-10 rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50"
        :disabled="isLoading"
        @click="load"
      >
        {{ isLoading ? '載入中…' : '載入待審' }}
      </button>
    </div>

    <p v-if="errorMsg" class="mt-3 text-sm text-red-600">{{ errorMsg }}</p>

    <template v-if="unlocked">
      <p v-if="!isLoading && !items.length" class="mt-8 text-sm text-gray-400">
        目前沒有待審評價。
      </p>

      <ul class="mt-6 space-y-4">
        <li
          v-for="r in items"
          :key="r.id"
          class="rounded-md border border-gray-200 p-4"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <p class="font-medium text-gray-900">{{ r.schoolName }}</p>
            <p class="text-xs text-gray-400">{{ r.date }}・★ {{ r.rating }}</p>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            {{ identityLabel(r.identity) }}・{{ periodLabel(r.period) }}
          </p>
          <p class="mt-3 text-sm leading-relaxed text-gray-700">{{ r.content }}</p>
          <p v-if="r.tags?.length" class="mt-2 text-xs text-gray-400">
            {{ r.tags.join('、') }}
          </p>
          <div class="mt-4 flex gap-2">
            <button
              type="button"
              class="rounded-md bg-primary-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50"
              :disabled="actingId === r.id"
              @click="act(r.id, 'approved')"
            >
              通過
            </button>
            <button
              type="button"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              :disabled="actingId === r.id"
              @click="act(r.id, 'rejected')"
            >
              退件
            </button>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
