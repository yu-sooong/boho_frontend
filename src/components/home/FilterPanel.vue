<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  selectedDistricts?: string[]
  selectedCategories?: string[]
  districts?: string[]
  categories?: string[]
}>()

const emit = defineEmits<{
  close: []
  apply: [{ districts: string[]; categories: string[] }]
}>()

const localDistricts = ref<string[]>([])
const localCategories = ref<string[]>([])

watch(
  () => props.open,
  (v) => {
    if (v) {
      localDistricts.value = [...(props.selectedDistricts ?? [])]
      localCategories.value = [...(props.selectedCategories ?? [])]
    }
  },
)

function toggleDistrict(d: string) {
  const idx = localDistricts.value.indexOf(d)
  if (idx >= 0) localDistricts.value.splice(idx, 1)
  else localDistricts.value.push(d)
}

function toggleCategory(c: string) {
  const idx = localCategories.value.indexOf(c)
  if (idx >= 0) localCategories.value.splice(idx, 1)
  else localCategories.value.push(c)
}

function apply() {
  emit('apply', { districts: [...localDistricts.value], categories: [...localCategories.value] })
  emit('close')
}

function clear() {
  localDistricts.value = []
  localCategories.value = []
}

const activeCount = () => localDistricts.value.length + localCategories.value.length
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
      @click="$emit('close')"
    />
  </Transition>

  <Transition name="slide-up">
    <div
      v-if="open"
      class="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl"
    >
      <div class="flex justify-center pt-3">
        <div class="h-1 w-10 rounded-full bg-gray-300" />
      </div>

      <div class="flex items-center justify-between px-5 py-4">
        <h2 class="font-heading text-base font-bold text-gray-900">
          篩選條件
          <span v-if="activeCount() > 0" class="ml-1.5 text-sm font-normal text-primary-600">
            (已選 {{ activeCount() }})
          </span>
        </h2>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          aria-label="關閉篩選"
          @click="$emit('close')"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="px-5 pb-8 space-y-6">
        <!-- 行政區（多選） -->
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">行政區</h3>
            <button
              v-if="localDistricts.length"
              type="button"
              class="text-xs text-gray-500 hover:text-primary-700"
              @click="localDistricts = []"
            >
              清除
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="d in districts"
              :key="d"
              type="button"
              class="rounded-md border px-3 py-1.5 text-sm transition-colors"
              :class="
                localDistricts.includes(d)
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-primary-300'
              "
              @click="toggleDistrict(d)"
            >
              {{ d }}
            </button>
          </div>
        </section>

        <!-- 補習類別（多選） -->
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">補習類別</h3>
            <button
              v-if="localCategories.length"
              type="button"
              class="text-xs text-gray-500 hover:text-primary-700"
              @click="localCategories = []"
            >
              清除
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="c in categories"
              :key="c"
              type="button"
              class="rounded-md border px-3 py-1.5 text-sm transition-colors"
              :class="
                localCategories.includes(c)
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-primary-300'
              "
              @click="toggleCategory(c)"
            >
              {{ c }}
            </button>
          </div>
        </section>

        <!-- 操作 -->
        <div class="flex items-center gap-3 pt-2">
          <button
            type="button"
            class="flex-1 rounded-md border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="clear"
          >
            全部清除
          </button>
          <button
            type="button"
            class="flex-1 rounded-md bg-primary-700 py-2.5 text-sm font-medium text-white hover:bg-primary-800"
            @click="apply"
          >
            套用篩選
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
