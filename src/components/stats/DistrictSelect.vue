<script setup lang="ts">
import { taichungDistricts } from '@/data/taichungDistricts'
import { Check, ChevronDown } from 'lucide-vue-next'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

const selected = computed(
  () => taichungDistricts.find((d) => d.id === props.modelValue) ?? taichungDistricts[0],
)

const sortedDistricts = computed(() =>
  [...taichungDistricts].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')),
)

function toggle() {
  open.value = !open.value
}

function choose(id: string) {
  emit('update:modelValue', id)
  open.value = false
}

function onDocPointer(e: Event) {
  const t = e.target as Node
  if (rootRef.value && !rootRef.value.contains(t)) open.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

watch(open, async (v) => {
  if (!v) return
  await nextTick()
  const active = listRef.value?.querySelector<HTMLElement>('[data-active="true"]')
  active?.scrollIntoView({ block: 'nearest' })
})

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer)
  document.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointer)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-left shadow-sm transition-colors hover:border-primary-300 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="min-w-0">
        <span class="block text-[11px] font-medium tracking-wide text-gray-400">選擇行政區</span>
        <span class="mt-0.5 block truncate text-sm font-semibold text-gray-900">
          {{ selected.name }}
        </span>
      </span>
      <ChevronDown
        :size="18"
        class="shrink-0 text-gray-400 transition-transform duration-200"
        :class="open ? 'rotate-180 text-primary-700' : ''"
      />
    </button>

    <Transition name="district-menu">
      <ul
        v-if="open"
        ref="listRef"
        role="listbox"
        class="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg"
      >
        <li v-for="d in sortedDistricts" :key="d.id" role="option" :aria-selected="d.id === modelValue">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors"
            :class="
              d.id === modelValue
                ? 'bg-primary-50 font-semibold text-primary-800'
                : 'text-gray-700 hover:bg-gray-50'
            "
            :data-active="d.id === modelValue ? 'true' : undefined"
            @click="choose(d.id)"
          >
            <span>{{ d.name }}</span>
            <Check v-if="d.id === modelValue" :size="16" class="shrink-0 text-primary-700" />
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.district-menu-enter-active,
.district-menu-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.district-menu-enter-from,
.district-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
