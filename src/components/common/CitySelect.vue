<script setup lang="ts">
/**
 * 縣市切換：單行觸發 + sheet 清單（不重複分段控制）
 */
import { trackEvent } from '@/analytics'
import { CITIES, type CityId } from '@/data/cities'
import { useCityStore } from '@/stores/cityStore'
import { Check, ChevronDown, MapPin, X } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /**
     * context：列表／情報頂部
     * inline：地圖浮層緊湊觸發
     */
    variant?: 'context' | 'inline'
    /** GA select_city 的 source（如 stats、find） */
    analyticsSource?: string
  }>(),
  { variant: 'context', analyticsSource: 'city_select' },
)

const cityStore = useCityStore()
const open = ref(false)

function select(id: CityId) {
  if (id !== cityStore.cityId) {
    cityStore.setCity(id)
    trackEvent('select_city', { city_id: id, source: props.analyticsSource })
  }
  open.value = false
}

function close() {
  open.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(open, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div>
    <div
      v-if="variant === 'context'"
      class="flex items-center justify-between gap-3"
    >
      <p class="text-xs text-gray-500">查詢範圍</p>
      <button
        type="button"
        class="inline-flex min-h-9 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
        :aria-expanded="open"
        aria-haspopup="dialog"
        @click="open = true"
      >
        {{ cityStore.city?.name ?? '選擇縣市' }}
        <ChevronDown
          :size="14"
          stroke-width="2"
          class="text-gray-400 transition-transform"
          :class="open ? 'rotate-180' : ''"
        />
      </button>
    </div>

    <button
      v-else
      type="button"
      class="inline-flex h-10 items-center gap-1 rounded-md border border-white/50 bg-white/85 px-2.5 text-sm font-medium text-gray-800 backdrop-blur-md hover:bg-white"
      :aria-expanded="open"
      aria-haspopup="dialog"
      aria-label="選擇縣市"
      @click="open = true"
    >
      <MapPin :size="14" stroke-width="1.75" class="text-primary-700" />
      <span>{{ cityStore.city?.shortName ?? '縣市' }}</span>
      <ChevronDown :size="14" class="text-gray-400" />
    </button>

    <Teleport to="body">
      <Transition name="city-fade">
        <div
          v-if="open"
          class="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 md:items-center md:p-6"
          @click.self="close"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="city-picker-title"
            class="flex w-full max-w-md flex-col overflow-hidden rounded-t-xl border border-gray-200 bg-white shadow-lg md:rounded-lg"
            @click.stop
          >
            <div class="flex justify-center pt-2 md:hidden" aria-hidden="true">
              <div class="h-1 w-8 rounded-full bg-gray-300" />
            </div>

            <div class="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
              <h2
                id="city-picker-title"
                class="min-w-0 flex-1 text-base font-semibold text-gray-900"
              >
                選擇縣市
              </h2>
              <button
                type="button"
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
                aria-label="關閉"
                @click="close"
              >
                <X :size="18" stroke-width="1.75" />
              </button>
            </div>

            <ul class="max-h-[70vh] space-y-0.5 overflow-y-auto px-2 py-2 pb-6 md:max-h-[60vh]">
              <li v-for="c in CITIES" :key="c.id">
                <button
                  type="button"
                  class="flex w-full min-h-12 items-center gap-3 rounded-md px-3 text-left hover:bg-gray-50"
                  @click="select(c.id)"
                >
                  <span class="min-w-0 flex-1 text-sm text-gray-900">{{ c.name }}</span>
                  <Check
                    v-if="c.id === cityStore.cityId"
                    :size="18"
                    stroke-width="2"
                    class="shrink-0 text-primary-700"
                  />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.city-fade-enter-active,
.city-fade-leave-active {
  transition: opacity 0.18s ease;
}
.city-fade-enter-active > div:last-child,
.city-fade-leave-active > div:last-child {
  transition: transform 0.22s ease;
}
.city-fade-enter-from,
.city-fade-leave-to {
  opacity: 0;
}
.city-fade-enter-from > div:last-child,
.city-fade-leave-to > div:last-child {
  transform: translateY(100%);
}
@media (min-width: 768px) {
  .city-fade-enter-from > div:last-child,
  .city-fade-leave-to > div:last-child {
    transform: translateY(8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .city-fade-enter-active,
  .city-fade-leave-active,
  .city-fade-enter-active > div:last-child,
  .city-fade-leave-active > div:last-child {
    transition: none;
  }
}
</style>
