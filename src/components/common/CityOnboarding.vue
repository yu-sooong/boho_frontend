<script setup lang="ts">
import { ref } from 'vue'
import { CITIES, type CityId } from '@/data/cities'
import { useCityStore } from '@/stores/cityStore'
import SproutLogo from '@/components/common/SproutLogo.vue'
import { Check, MapPin } from 'lucide-vue-next'

const cityStore = useCityStore()
const pending = ref<CityId | null>(cityStore.cityId)

function pick(id: CityId) {
  pending.value = id
}

function confirm() {
  if (!pending.value) return
  cityStore.completeOnboarding(pending.value)
}
</script>

<template>
  <div
    class="fixed inset-0 z-[80] flex flex-col bg-[#f6f8f7]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="city-onboard-title"
  >
    <div class="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-12">
      <div class="mb-8 text-center">
        <SproutLogo svg-class="mx-auto h-14 w-14" />
        <h1
          id="city-onboard-title"
          class="mt-4 font-heading text-2xl font-bold tracking-tight text-gray-900"
        >
          你在哪個縣市找班？
        </h1>
        <p class="mt-2 text-sm leading-relaxed text-gray-500">
          先選範圍，地圖與列表會依縣市顯示。之後可在首頁上方隨時切換。
        </p>
      </div>

      <ul class="flex-1 space-y-2" role="listbox" aria-label="縣市">
        <li v-for="c in CITIES" :key="c.id">
          <button
            type="button"
            role="option"
            :aria-selected="pending === c.id"
            class="flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors duration-150"
            :class="
              pending === c.id
                ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            "
            @click="pick(c.id)"
          >
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
              :class="pending === c.id ? 'bg-primary-100' : 'bg-gray-100'"
            >
              <MapPin
                :size="20"
                stroke-width="1.75"
                :class="pending === c.id ? 'text-primary-700' : 'text-gray-500'"
              />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-base font-semibold text-gray-900">{{ c.name }}</span>
              <span class="mt-0.5 block text-xs text-gray-500">立案開放資料・可查詢</span>
            </span>
            <Check
              v-if="pending === c.id"
              :size="20"
              stroke-width="2"
              class="shrink-0 text-primary-700"
            />
          </button>
        </li>
      </ul>

      <button
        type="button"
        class="mt-6 min-h-12 w-full rounded-md bg-primary-700 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        :disabled="!pending"
        @click="confirm"
      >
        開始查詢
      </button>
    </div>
  </div>
</template>
