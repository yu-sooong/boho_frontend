<script setup lang="ts">
/**
 * 行政區選擇：可搜尋 bottom sheet（行政區多時比橫滑更主流）
 */
import { Check, Search, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

export interface DistrictPickerItem {
  id: string
  name: string
  count: number
}

const props = defineProps<{
  modelValue: boolean
  selectedId: string
  items: DistrictPickerItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  select: [id: string]
}>()

const q = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const filtered = computed(() => {
  const needle = q.value.trim().replace(/\s+/g, '')
  if (!needle) return props.items
  return props.items.filter((d) => d.name.includes(needle))
})

function close() {
  emit('update:modelValue', false)
  q.value = ''
}

function pick(id: string) {
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
      requestAnimationFrame(() => inputRef.value?.focus())
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
    <Transition name="district-sheet">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 md:items-center md:p-6"
        @click.self="close"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="district-sheet-title"
          class="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-xl border border-gray-200 bg-white shadow-lg md:max-h-[70vh] md:rounded-lg"
          @click.stop
        >
          <div class="flex justify-center pt-2 md:hidden" aria-hidden="true">
            <div class="h-1 w-8 rounded-full bg-gray-300" />
          </div>

          <div class="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <h2
              id="district-sheet-title"
              class="min-w-0 flex-1 text-base font-semibold text-gray-900"
            >
              選擇行政區
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

          <div class="border-b border-gray-100 px-4 py-3">
            <label class="relative block">
              <span class="sr-only">搜尋行政區</span>
              <Search
                :size="16"
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref="inputRef"
                v-model="q"
                type="search"
                enterkeyhint="search"
                placeholder="搜尋行政區"
                class="min-h-10 w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600/20"
              />
            </label>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-2 py-2 pb-6">
            <p class="px-3 pb-1 pt-1 text-xs font-medium text-gray-500">班數由多到少</p>
            <ul>
              <li v-if="!filtered.length" class="px-3 py-8 text-center text-sm text-gray-500">
                找不到符合的行政區
              </li>
              <li v-for="(d, idx) in filtered" :key="d.id">
                <button
                  type="button"
                  class="flex w-full min-h-12 items-center gap-3 rounded-md px-3 text-left hover:bg-gray-50"
                  @click="pick(d.id)"
                >
                  <span class="w-5 shrink-0 text-center text-xs text-gray-400">{{ idx + 1 }}</span>
                  <span class="min-w-0 flex-1 text-sm text-gray-900">{{ d.name }}</span>
                  <span class="shrink-0 tabular-nums text-xs text-gray-500">{{ d.count }} 間</span>
                  <Check
                    v-if="d.id === selectedId"
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
.district-sheet-enter-active,
.district-sheet-leave-active {
  transition: opacity 0.18s ease;
}
.district-sheet-enter-active > div:last-child,
.district-sheet-leave-active > div:last-child {
  transition: transform 0.22s ease;
}
.district-sheet-enter-from,
.district-sheet-leave-to {
  opacity: 0;
}
.district-sheet-enter-from > div:last-child,
.district-sheet-leave-to > div:last-child {
  transform: translateY(100%);
}
@media (min-width: 768px) {
  .district-sheet-enter-from > div:last-child,
  .district-sheet-leave-to > div:last-child {
    transform: translateY(8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .district-sheet-enter-active,
  .district-sheet-leave-active,
  .district-sheet-enter-active > div:last-child,
  .district-sheet-leave-active > div:last-child {
    transition: none;
  }
}
</style>
