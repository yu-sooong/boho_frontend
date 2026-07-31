<script setup lang="ts">
/**
 * 縣市選擇：手機 bottom sheet／桌面置中對話框
 * 白底、系統字、與站內 border 語彙一致（避免 iOS 灰底＋display 標題）
 */
import { CITIES, type CityId } from '@/data/cities'
import { Check, LocateFixed, Search, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  selectedId: CityId | null
  nearbyCityId?: CityId | null
  nearbyLabel?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  select: [id: CityId]
}>()

const q = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const filtered = computed(() => {
  const needle = q.value.trim().replace(/\s+/g, '')
  if (!needle) return CITIES
  return CITIES.filter(
    (c) =>
      c.name.includes(needle) ||
      c.shortName.includes(needle) ||
      c.id.includes(needle.toLowerCase()),
  )
})

const showNearby = computed(() => {
  return !!(props.nearbyCityId && props.nearbyLabel && !q.value.trim())
})

function close() {
  emit('update:modelValue', false)
  q.value = ''
}

function pick(id: CityId) {
  emit('select', id)
  close()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      q.value = ''
      if (CITIES.length > 6) {
        requestAnimationFrame(() => inputRef.value?.focus())
      }
    }
  },
)

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="city-sheet">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 md:items-center md:p-6"
        @click.self="close"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="city-sheet-title"
          class="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-xl border border-gray-200 bg-white shadow-lg md:max-h-[70vh] md:rounded-lg"
          @click.stop
        >
          <div class="flex justify-center pt-2 md:hidden" aria-hidden="true">
            <div class="h-1 w-8 rounded-full bg-gray-300" />
          </div>

          <div class="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <h2
              id="city-sheet-title"
              class="min-w-0 flex-1 text-base font-semibold text-gray-900"
            >
              選擇縣市
            </h2>
            <button
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              aria-label="關閉"
              @click="close"
            >
              <X :size="18" stroke-width="1.75" />
            </button>
          </div>

          <div class="border-b border-gray-100 px-4 py-3">
            <label class="relative block">
              <span class="sr-only">搜尋縣市</span>
              <Search
                :size="16"
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref="inputRef"
                v-model="q"
                type="search"
                enterkeyhint="search"
                placeholder="搜尋縣市"
                class="min-h-10 w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              />
            </label>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-2 py-2 pb-6">
            <button
              v-if="showNearby && nearbyCityId"
              type="button"
              class="mb-1 flex w-full min-h-12 items-center gap-3 rounded-md px-3 text-left hover:bg-gray-50 active:bg-gray-50"
              @click="pick(nearbyCityId)"
            >
              <span class="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-700">
                <LocateFixed :size="16" stroke-width="1.75" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium text-gray-900">使用目前位置</span>
                <span class="block text-xs text-gray-500">{{ nearbyLabel }}</span>
              </span>
              <Check
                v-if="selectedId === nearbyCityId"
                :size="18"
                stroke-width="2"
                class="shrink-0 text-primary-700"
              />
            </button>

            <p class="px-3 pb-1 pt-2 text-xs font-medium text-gray-500">已開放</p>
            <ul>
              <li v-if="!filtered.length" class="px-3 py-8 text-center text-sm text-gray-500">
                找不到符合的縣市
              </li>
              <li v-for="c in filtered" :key="c.id">
                <button
                  type="button"
                  class="flex w-full min-h-12 items-center gap-3 rounded-md px-3 text-left hover:bg-gray-50 active:bg-gray-50"
                  @click="pick(c.id)"
                >
                  <span class="min-w-0 flex-1 text-sm text-gray-900">{{ c.name }}</span>
                  <Check
                    v-if="c.id === selectedId"
                    :size="18"
                    stroke-width="2"
                    class="shrink-0 text-primary-700"
                  />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.city-sheet-enter-active,
.city-sheet-leave-active {
  transition: opacity 0.18s ease;
}
.city-sheet-enter-active > div:last-child,
.city-sheet-leave-active > div:last-child {
  transition: transform 0.22s ease;
}
.city-sheet-enter-from,
.city-sheet-leave-to {
  opacity: 0;
}
.city-sheet-enter-from > div:last-child,
.city-sheet-leave-to > div:last-child {
  transform: translateY(100%);
}
@media (min-width: 768px) {
  .city-sheet-enter-from > div:last-child,
  .city-sheet-leave-to > div:last-child {
    transform: translateY(8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .city-sheet-enter-active,
  .city-sheet-leave-active,
  .city-sheet-enter-active > div:last-child,
  .city-sheet-leave-active > div:last-child {
    transition: none;
  }
}
</style>
