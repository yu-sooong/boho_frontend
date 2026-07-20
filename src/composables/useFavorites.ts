import { trackEvent } from '@/analytics'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'buyu:favorites'

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('favorites')
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

const favorites = ref<string[]>(loadFavorites())

watch(
  favorites,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true },
)

function isFavorite(schoolId: string) {
  return favorites.value.includes(schoolId)
}

function toggleFavorite(schoolId: string) {
  if (isFavorite(schoolId)) {
    favorites.value = favorites.value.filter((id) => id !== schoolId)
    trackEvent('remove_from_favorites', { school_id: schoolId })
  } else {
    favorites.value = [...favorites.value, schoolId]
    trackEvent('add_to_favorites', { school_id: schoolId })
  }
}

export function useFavorites() {
  return { favorites, isFavorite, toggleFavorite }
}
