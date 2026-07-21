<script setup lang="ts">
import { ShieldAlert, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  selectedDistricts?: string[]
  selectedCategories?: string[]
  onlyHasPenalty?: boolean
  districts?: string[]
  categories?: string[]
}>()

const emit = defineEmits<{
  close: []
  apply: [{ districts: string[]; categories: string[]; onlyHasPenalty: boolean }]
}>()

const localDistricts = ref<string[]>([])
const localCategories = ref<string[]>([])
const localOnlyHasPenalty = ref(false)

watch(
  () => props.open,
  (v) => {
    if (v) {
      localDistricts.value = [...(props.selectedDistricts ?? [])]
      localCategories.value = [...(props.selectedCategories ?? [])]
      localOnlyHasPenalty.value = props.onlyHasPenalty ?? false
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
  emit('apply', {
    districts: [...localDistricts.value],
    categories: [...localCategories.value],
    onlyHasPenalty: localOnlyHasPenalty.value,
  })
  emit('close')
}

function clear() {
  localDistricts.value = []
  localCategories.value = []
  localOnlyHasPenalty.value = false
}

const activeCount = () =>
  localDistricts.value.length +
  localCategories.value.length +
  (localOnlyHasPenalty.value ? 1 : 0)
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

      <div class="space-y-6 px-5 pb-8">
        <!-- 稽查紀錄 -->
        <section>
          <h3 class="mb-3 text-sm font-semibold text-gray-700">稽查紀錄</h3>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors"
            :class="
              localOnlyHasPenalty
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-gray-300 bg-white text-gray-700 hover:border-amber-300'
            "
            :aria-pressed="localOnlyHasPenalty"
            @click="localOnlyHasPenalty = !localOnlyHasPenalty"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              :class="localOnlyHasPenalty ? 'bg-amber-100' : 'bg-gray-50'"
            >
              <ShieldAlert
                :size="18"
                :class="localOnlyHasPenalty ? 'text-amber-700' : 'text-gray-400'"
              />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium">僅顯示有稽查紀錄</span>
              <span class="mt-0.5 block text-xs text-gray-500">
                近幾年曾出現在主管機關稽查／違規公告者
              </span>
            </span>
            <span
              class="h-5 w-5 shrink-0 rounded-full border-2"
              :class="
                localOnlyHasPenalty
                  ? 'border-amber-600 bg-amber-600'
                  : 'border-gray-300 bg-white'
              "
              aria-hidden="true"
            />
          </button>
        </section>

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
