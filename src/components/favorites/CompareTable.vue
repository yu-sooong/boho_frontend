<script setup lang="ts">
import StatusBadge from '@/components/common/StatusBadge.vue'
import { trackEvent } from '@/analytics'
import { useSchoolStore } from '@/stores/schoolStore'
import type { School } from '@/types'
import { distanceKm, formatDistanceKm, hasSchoolCoords } from '@/utils/geo'
import { googleMapsDirectionsUrl } from '@/utils/maps'
import { copyText } from '@/utils/share'
import { Check, Copy, Navigation, Phone } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = defineProps<{
  left: School
  right: School
  locating?: boolean
  locateError?: string | null
}>()

const emit = defineEmits<{
  requestLocate: []
  feedback: [message: string, tone?: 'success' | 'info']
}>()

const store = useSchoolStore()
const copiedId = ref<string | null>(null)

/** left＝左優、right＝右優、tie＝相當、none＝不比較 */
type Mark = 'left' | 'right' | 'tie' | 'none'

function cityHint(address: string) {
  if (address.includes('新北')) return '新北市'
  if (address.includes('高雄')) return '高雄市'
  if (address.includes('台中') || address.includes('臺中')) return '台中市'
  return ''
}

function districtCell(s: School) {
  const city = cityHint(s.address)
  const d = s.district || ''
  if (city && d) return `${city}・${d}`
  return d || city || '—'
}

function categories(s: School) {
  const tags = [...(s.categoryTags ?? []), ...(s.levelTags ?? [])]
  return tags.length ? tags.join('、') : '—'
}

function penaltyCount(s: School) {
  return s.penaltyCount ?? s.penalties?.length ?? 0
}

function penaltyCell(s: School) {
  const n = penaltyCount(s)
  if (n <= 0) return '無'
  const latest = s.penalties?.[0]
  if (latest?.content) {
    const short =
      latest.content.length > 22 ? `${latest.content.slice(0, 22)}…` : latest.content
    return `${n} 筆・${short}`
  }
  return `${n} 筆`
}

function schoolDistance(s: School): number | null {
  if (store.userLat == null || store.userLng == null) return null
  if (!hasSchoolCoords(s.lat, s.lng)) return null
  return distanceKm(store.userLat, store.userLng, s.lat, s.lng)
}

function distanceLabel(s: School): string {
  if (props.locating) return '定位中…'
  if (store.userLat == null || store.userLng == null) return '需定位'
  if (!hasSchoolCoords(s.lat, s.lng)) return '無座標'
  return formatDistanceKm(schoolDistance(s)) || '—'
}

function markByLower(a: number | null, b: number | null): Mark {
  if (a == null || b == null) return 'none'
  if (a === b) return 'tie'
  return a < b ? 'left' : 'right'
}

function markByHigher(a: number, b: number): Mark {
  if (a === b) return 'tie'
  return a > b ? 'left' : 'right'
}

function statusScore(status: string) {
  if (status === '立案中') return 1
  return 0
}

type RowKind = 'status' | 'text' | 'phone' | 'address'

type Row = {
  label: string
  left: string
  right: string
  kind: RowKind
  mark: Mark
}

const hasUserLocation = computed(
  () => store.userLat != null && store.userLng != null,
)

const sides = computed(() => [props.left, props.right])

const rows = computed((): Row[] => {
  const L = props.left
  const R = props.right

  const list: Row[] = [
    {
      label: '狀態',
      left: L.status,
      right: R.status,
      kind: 'status',
      mark: markByHigher(statusScore(L.status), statusScore(R.status)),
    },
    {
      label: '地區',
      left: districtCell(L),
      right: districtCell(R),
      kind: 'text',
      mark: 'none',
    },
    {
      label: '類別',
      left: categories(L),
      right: categories(R),
      kind: 'text',
      mark: 'none',
    },
    {
      label: '地址',
      left: L.address || '—',
      right: R.address || '—',
      kind: 'address',
      mark: 'none',
    },
  ]

  const phoneL = L.phone?.trim()
  const phoneR = R.phone?.trim()
  if (phoneL || phoneR) {
    list.push({
      label: '電話',
      left: phoneL || '—',
      right: phoneR || '—',
      kind: 'phone',
      mark: markByHigher(phoneL ? 1 : 0, phoneR ? 1 : 0),
    })
  }

  list.push({
    label: '距離',
    left: distanceLabel(L),
    right: distanceLabel(R),
    kind: 'text',
    mark: markByLower(schoolDistance(L), schoolDistance(R)),
  })

  list.push({
    label: '稽查',
    left: penaltyCell(L),
    right: penaltyCell(R),
    kind: 'text',
    // 不比較優劣：有／無公開紀錄≠好壞，避免被讀成排名
    mark: 'none',
  })

  return list
})

function isWin(row: Row, side: 'left' | 'right') {
  return row.mark === side
}

function schoolOf(sideKey: 'left' | 'right') {
  return sideKey === 'left' ? props.left : props.right
}

function openDirections(s: School) {
  trackEvent('click_directions', { school_id: s.id, source: 'compare' })
  window.open(googleMapsDirectionsUrl(s), '_blank', 'noopener,noreferrer')
}

async function copyAddress(s: School) {
  const text = s.address?.trim()
  if (!text) {
    emit('feedback', '這間班沒有地址可複製', 'info')
    return
  }
  const ok = await copyText(text)
  if (ok) {
    copiedId.value = s.id
    trackEvent('copy_address', { school_id: s.id, source: 'compare' })
    emit('feedback', `已複製「${s.name}」地址`)
    window.setTimeout(() => {
      if (copiedId.value === s.id) copiedId.value = null
    }, 2000)
  } else {
    emit('feedback', '複製失敗，請手動選取地址', 'info')
  }
}

const iconBtn =
  'group relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 active:bg-gray-200 disabled:opacity-40'
const iconTip =
  'pointer-events-none absolute -top-7 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 sm:block'
</script>

<template>
  <div
    class="overflow-hidden rounded-md border border-gray-200 bg-white"
    data-testid="compare-table"
  >
    <div
      class="sticky top-0 z-10 grid grid-cols-[3.25rem_1fr_1fr] border-b border-gray-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 sm:grid-cols-[4.5rem_1fr_1fr]"
    >
      <div
        class="flex items-end bg-gray-50 px-1 pb-2 text-[10px] font-medium text-gray-400 sm:px-2"
        title="客觀項目打勾（立案／電話／距離），非總排名；稽查不評優劣"
      >
        對照
      </div>
      <div
        v-for="(side, i) in sides"
        :key="side.id"
        class="border-l border-gray-100 px-1.5 py-2 sm:px-2 sm:py-2.5"
      >
        <RouterLink :to="`/schools/${side.id}`" class="block active:opacity-70">
          <span class="mb-0.5 block text-[10px] font-medium text-gray-400">
            {{ i === 0 ? 'A' : 'B' }}
          </span>
          <span
            class="line-clamp-2 font-heading text-xs font-bold leading-snug text-gray-900 sm:text-sm"
          >
            {{ side.name }}
          </span>
        </RouterLink>
      </div>
    </div>

    <div
      v-for="(row, idx) in rows"
      :key="row.label"
      class="grid grid-cols-[3.25rem_1fr_1fr] border-b border-gray-100 last:border-b-0 sm:grid-cols-[4.5rem_1fr_1fr]"
      :class="idx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'"
    >
      <div
        class="flex items-start bg-gray-50/90 px-1.5 py-2.5 text-[11px] font-medium leading-snug text-gray-500 sm:px-2 sm:text-xs"
      >
        {{ row.label }}
      </div>
      <div
        v-for="sideKey in (['left', 'right'] as const)"
        :key="sideKey"
        class="min-w-0 border-l border-gray-100 px-1.5 py-2.5 sm:px-2"
        :class="isWin(row, sideKey) ? 'bg-primary-50/50' : ''"
      >
        <div class="flex items-start gap-1">
          <span
            v-if="isWin(row, sideKey)"
            class="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white"
            aria-label="此項較清楚"
          >
            <Check :size="11" :stroke-width="3" />
          </span>

          <div class="min-w-0 flex-1">
            <StatusBadge
              v-if="row.kind === 'status'"
              :status="sideKey === 'left' ? left.status : right.status"
            />
            <span
              v-else
              class="block break-words text-[12px] leading-snug text-gray-800 sm:text-[13px]"
            >
              {{ row[sideKey] }}
            </span>
          </div>

          <!-- 地址旁：導航、複製 -->
          <div
            v-if="row.kind === 'address' && row[sideKey] !== '—'"
            class="flex shrink-0 items-center gap-0.5"
            data-testid="compare-actions"
          >
            <button
              type="button"
              :class="iconBtn"
              class="!text-primary-700 hover:!bg-primary-50"
              title="導航"
              aria-label="導航"
              @click="openDirections(schoolOf(sideKey))"
            >
              <Navigation :size="16" />
              <span :class="iconTip">導航</span>
            </button>
            <button
              type="button"
              :class="iconBtn"
              :title="copiedId === schoolOf(sideKey).id ? '已複製' : '複製地址'"
              :aria-label="copiedId === schoolOf(sideKey).id ? '已複製' : '複製地址'"
              @click="copyAddress(schoolOf(sideKey))"
            >
              <Copy :size="16" />
              <span :class="iconTip">
                {{ copiedId === schoolOf(sideKey).id ? '已複製' : '複製地址' }}
              </span>
            </button>
          </div>

          <!-- 電話旁：撥打 -->
          <a
            v-else-if="row.kind === 'phone' && row[sideKey] !== '—'"
            :href="`tel:${row[sideKey]}`"
            :class="iconBtn"
            class="!text-primary-700 hover:!bg-primary-50"
            title="撥打電話"
            aria-label="撥打電話"
            @click="trackEvent('click_phone', {
              school_id: schoolOf(sideKey).id,
              source: 'compare',
            })"
          >
            <Phone :size="16" />
            <span :class="iconTip">電話</span>
          </a>
        </div>
      </div>
    </div>

    <div
      v-if="!hasUserLocation"
      class="flex items-center gap-2 border-t border-gray-100 px-3 py-2.5"
    >
      <p class="min-w-0 flex-1 text-[11px] leading-relaxed text-gray-500">
        {{ locateError || '取得定位後可比較距離。' }}
      </p>
      <button
        type="button"
        class="shrink-0 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800 active:bg-primary-100 disabled:opacity-60"
        :disabled="locating"
        data-testid="compare-locate"
        @click="emit('requestLocate')"
      >
        {{ locating ? '定位中…' : '取得定位' }}
      </button>
    </div>

    <p class="border-t border-gray-100 bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-500">
      <span class="font-medium text-gray-600">✓</span>
      ＝客觀項目較清楚（如立案中、有電話、距離較近），非總排名。稽查僅並列公開紀錄，不評優劣；「無」＝本站尚未彙整到相關公告。
    </p>
  </div>
</template>
