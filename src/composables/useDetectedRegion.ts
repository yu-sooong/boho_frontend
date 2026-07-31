/**
 * 偵測所在縣市：只用瀏覽器定位 + 靜態 bbox，不呼叫 Geocoding／後端。
 * 結果快取在 sessionStorage，同一次瀏覽不重複要定位。
 */
import { useGeolocation } from '@/composables/useGeolocation'
import {
  detectRegionFromCoords,
  type DetectedRegion,
} from '@/utils/taiwanRegions'
import { onMounted, ref, shallowRef } from 'vue'

const CACHE_KEY = 'buyu:detected-region:v1'

function readCache(): DetectedRegion | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DetectedRegion
  } catch {
    return null
  }
}

function writeCache(r: DetectedRegion) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(r))
  } catch {
    /* ignore */
  }
}

export function useDetectedRegion(options?: { auto?: boolean }) {
  const auto = options?.auto !== false
  const { request, isLoading, error } = useGeolocation()
  const region = shallowRef<DetectedRegion | null>(readCache())
  const tried = ref(!!region.value)

  async function detect(force = false): Promise<DetectedRegion | null> {
    if (!force && region.value) return region.value
    tried.value = true
    const coords = await request()
    if (!coords) return null
    const hit = detectRegionFromCoords(coords.lat, coords.lng)
    if (hit) {
      region.value = hit
      writeCache(hit)
    }
    return hit
  }

  if (auto) {
    onMounted(() => {
      if (!region.value) void detect()
    })
  }

  return { region, isLoading, error, tried, detect }
}
