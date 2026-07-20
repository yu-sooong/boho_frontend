import { ref } from 'vue'

export interface GeoCoords {
  lat: number
  lng: number
}

export function useGeolocation() {
  const coords = ref<GeoCoords | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  function request(): Promise<GeoCoords | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        error.value = '瀏覽器不支援定位功能'
        resolve(null)
        return
      }
      isLoading.value = true
      error.value = null
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result: GeoCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          coords.value = result
          isLoading.value = false
          resolve(result)
        },
        (err) => {
          error.value = err.code === 1 ? '定位權限被拒絕' : '定位失敗，請稍後再試'
          isLoading.value = false
          resolve(null)
        },
        { timeout: 10000, maximumAge: 60000 },
      )
    })
  }

  return { coords, isLoading, error, request }
}
