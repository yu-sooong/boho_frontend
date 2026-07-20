<script setup lang="ts">
import RatingStars from '@/components/common/RatingStars.vue'
import Tag from '@/components/common/Tag.vue'
import ReviewGuidelines from '@/components/detail/ReviewGuidelines.vue'
import { useReviews } from '@/composables/useReviews'
import {
  REVIEW_FEATURE_OPTIONS,
  REVIEW_IDENTITIES,
  REVIEW_PERIODS,
  REVIEW_POLICY,
  type ReviewIdentity,
  type ReviewPeriod,
} from '@/data/reviewConstants'
import type { School } from '@/types'
import { ChevronDown, ChevronUp, Info, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = defineProps<{
  school: School
}>()

const emit = defineEmits<{ close: []; submitted: [] }>()

const { submitReview } = useReviews(() => props.school.id)

const rating = ref(0)
const content = ref('')
const identity = ref<ReviewIdentity | ''>('')
const period = ref<ReviewPeriod | ''>('')
const selectedFeatures = ref<string[]>([])
const showGuidelines = ref(false)
const errorMsg = ref('')
const isSubmitting = ref(false)

const contentLen = computed(() => content.value.trim().length)

function toggleFeature(feature: string) {
  if (selectedFeatures.value.includes(feature)) {
    selectedFeatures.value = selectedFeatures.value.filter((f) => f !== feature)
  } else {
    selectedFeatures.value = [...selectedFeatures.value, feature]
  }
}

function validate(): string | null {
  if (!identity.value) return '請選擇您的身份'
  if (!period.value) return '請選擇就讀／接觸時期'
  if (rating.value < 1) return '請點選星等評分'
  if (contentLen.value < 15) return `經驗內容請至少 15 字（目前 ${contentLen.value} 字）`
  if (!props.school.id) return '補習班資料異常，請重新整理後再試'
  return null
}

async function submit() {
  errorMsg.value = ''
  const validationError = validate()
  if (validationError) {
    errorMsg.value = validationError
    return
  }
  if (!identity.value || !period.value) return

  isSubmitting.value = true
  try {
    await submitReview({
      schoolId: props.school.id,
      identity: identity.value,
      period: period.value,
      rating: Math.round(Number(rating.value)),
      content: content.value,
      tags: selectedFeatures.value,
    })
    emit('submitted')
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '送出失敗，請稍後再試'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col justify-end">
    <div class="absolute inset-0 bg-black/10 backdrop-blur-sm" @click="emit('close')" />

    <div class="relative flex max-h-[92vh] flex-col rounded-t-xl bg-white">
      <div class="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300" />

      <div class="flex items-start justify-between px-5 pt-4">
        <div>
          <h2 class="font-heading text-lg font-bold text-gray-900">分享您的經驗</h2>
          <p class="text-sm text-gray-500">{{ school.name }}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          aria-label="關閉評價表單"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div>
          <p class="mb-2 text-sm font-medium text-gray-800">您的身份</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in REVIEW_IDENTITIES"
              :key="opt.value"
              type="button"
              @click="identity = opt.value"
            >
              <Tag :active="identity === opt.value" size="md">{{ opt.label }}</Tag>
            </button>
          </div>
        </div>

        <div>
          <p class="mb-2 text-sm font-medium text-gray-800">就讀／接觸時期</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in REVIEW_PERIODS"
              :key="opt.value"
              type="button"
              @click="period = opt.value"
            >
              <Tag :active="period === opt.value" size="md">{{ opt.label }}</Tag>
            </button>
          </div>
        </div>

        <div class="rounded-md bg-amber-50/80 px-3 py-4">
          <p class="mb-3 text-center text-sm font-semibold text-gray-800">整體評分</p>
          <div class="flex justify-center">
            <RatingStars
              :rating="rating"
              :size="40"
              tone="amber"
              interactive
              @update:rating="(v) => (rating = v)"
            />
          </div>
          <p class="mt-2 text-center text-xs text-amber-700/80">
            {{ rating > 0 ? `已選 ${rating} 星` : '點一下星星評分' }}
          </p>
        </div>

        <div>
          <p class="mb-2 text-sm font-medium text-gray-800">這間補習班的特色是？（可複選）</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="f in REVIEW_FEATURE_OPTIONS"
              :key="f"
              type="button"
              @click="toggleFeature(f)"
            >
              <Tag :active="selectedFeatures.includes(f)" size="md">{{ f }}</Tag>
            </button>
          </div>
        </div>

        <div>
          <textarea
            v-model="content"
            rows="4"
            placeholder="分享您的親身經驗，例如老師怎麼帶班、連絡是否順暢、教材與環境……（至少 15 字）"
            class="w-full resize-none rounded-md border border-gray-200 p-3 text-sm text-gray-700 placeholder:text-gray-500 focus:border-primary-600 focus:outline-none"
          />
          <p
            class="mt-1 text-right text-xs"
            :class="contentLen > 0 && contentLen < 15 ? 'text-amber-700' : 'text-gray-500'"
          >
            {{ contentLen }}／至少 15 字
          </p>
        </div>

        <div class="rounded-md border border-gray-200">
          <button
            type="button"
            class="flex w-full items-center justify-between px-3 py-2.5 text-left"
            @click="showGuidelines = !showGuidelines"
          >
            <span class="flex items-center gap-2 text-sm font-medium text-gray-800">
              <Info :size="16" class="text-primary-600" />
              {{ REVIEW_POLICY.title }}
            </span>
            <component
              :is="showGuidelines ? ChevronUp : ChevronDown"
              :size="18"
              class="text-gray-400"
            />
          </button>

          <div v-if="showGuidelines" class="border-t border-gray-100 px-3 pb-3 pt-3">
            <ReviewGuidelines compact @navigate="emit('close')" />
          </div>
        </div>

        <p v-if="errorMsg" class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {{ errorMsg }}
        </p>
      </div>

      <div
        class="shrink-0 border-t border-gray-100 p-4"
        style="padding-bottom: max(1rem, env(safe-area-inset-bottom))"
      >
        <button
          type="button"
          class="w-full rounded-md bg-primary-700 py-2.5 font-medium text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSubmitting"
          @click="submit"
        >
          {{ isSubmitting ? '送出中…' : '送出評價' }}
        </button>
        <p class="mt-2 text-center text-xs leading-relaxed text-gray-500">
          匿名分享，審核通過後才公開顯示<br />
          同一裝置每日大約最多 5 則
        </p>
      </div>
    </div>
  </div>
</template>
