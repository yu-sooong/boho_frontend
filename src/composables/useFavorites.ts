import { trackEvent } from '@/analytics'
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'buyu:favorites'
const COMPARE_HINT_KEY = 'buyu:compareHintShown'

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('favorites')
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

const favorites = ref<string[]>(loadFavorites())
/** 全站共用：收藏滿 1 間時提示一次「再收藏可對照」 */
const showCompareHint = ref(false)

watch(
  favorites,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      /* ignore */
    }
  },
  { deep: true },
)

function isFavorite(schoolId: string) {
  return favorites.value.includes(schoolId)
}

function maybeShowCompareHint() {
  if (favorites.value.length !== 1) return
  try {
    if (localStorage.getItem(COMPARE_HINT_KEY) === '1') return
    localStorage.setItem(COMPARE_HINT_KEY, '1')
  } catch {
    /* still show once this session */
  }
  showCompareHint.value = true
  window.setTimeout(() => {
    showCompareHint.value = false
  }, 5200)
}

function dismissCompareHint() {
  showCompareHint.value = false
}

function addFavorite(schoolId: string, source?: string) {
  return ensureFavorites([schoolId], source)
}

/** 批次加入收藏（分享對照連結用）；回傳是否有新增 */
function ensureFavorites(schoolIds: string[], source?: string) {
  const missing = schoolIds.filter((id) => id && !favorites.value.includes(id))
  if (!missing.length) return false
  favorites.value = [...favorites.value, ...missing]
  for (const id of missing) {
    trackEvent('add_to_favorites', {
      school_id: id,
      source: source || undefined,
    })
  }
  maybeShowCompareHint()
  return true
}

function toggleFavorite(schoolId: string) {
  if (isFavorite(schoolId)) {
    favorites.value = favorites.value.filter((id) => id !== schoolId)
    trackEvent('remove_from_favorites', { school_id: schoolId })
  } else {
    ensureFavorites([schoolId])
  }
}

/** 收藏清單中「不是目前這間」的第一個 id（用於對照 CTA） */
function otherFavoriteId(currentId: string): string | null {
  return favorites.value.find((id) => id !== currentId) ?? null
}

const favoriteCount = computed(() => favorites.value.length)

export function useFavorites() {
  return {
    favorites,
    favoriteCount,
    isFavorite,
    addFavorite,
    ensureFavorites,
    toggleFavorite,
    otherFavoriteId,
    showCompareHint,
    dismissCompareHint,
  }
}
