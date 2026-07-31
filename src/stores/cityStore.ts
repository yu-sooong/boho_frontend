import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import {
  CITIES,
  getCityById,
  isCityId,
  type CityConfig,
  type CityId,
} from '@/data/cities'

const CITY_KEY = 'buyu:selected-city'
const ONBOARD_KEY = 'buyu:city-onboarded'

function readStoredCity(): CityId | null {
  try {
    const raw = localStorage.getItem(CITY_KEY)
    if (raw && isCityId(raw)) return raw
  } catch {
    /* ignore */
  }
  return null
}

function readOnboarded(): boolean {
  try {
    if (localStorage.getItem(ONBOARD_KEY) === '1') return true
    // 舊版已選過縣市 → 視為完成引導，避免強制再選一次
    const city = localStorage.getItem(CITY_KEY)
    return !!(city && isCityId(city))
  } catch {
    return false
  }
}

export const useCityStore = defineStore('city', () => {
  const cityId = ref<CityId | null>(readStoredCity())
  const onboarded = ref(readOnboarded())

  /** 尚未完成引導時 city 可能為 null；UI 需處理 */
  const city = computed<CityConfig | null>(() => getCityById(cityId.value))
  const cities = CITIES
  const isLive = computed(() => city.value?.live ?? false)
  const isMock = computed(() => city.value?.dataSource === 'mock')
  const needsOnboarding = computed(() => !onboarded.value || !cityId.value)

  function setCity(id: CityId) {
    if (!isCityId(id)) return
    cityId.value = id
  }

  function completeOnboarding(id: CityId) {
    setCity(id)
    onboarded.value = true
    try {
      localStorage.setItem(ONBOARD_KEY, '1')
      localStorage.setItem(CITY_KEY, id)
    } catch {
      /* ignore */
    }
  }

  watch(
    cityId,
    (id) => {
      if (!id) return
      try {
        localStorage.setItem(CITY_KEY, id)
      } catch {
        /* ignore */
      }
    },
    { flush: 'post' },
  )

  return {
    cityId,
    city,
    cities,
    isLive,
    isMock,
    onboarded,
    needsOnboarding,
    setCity,
    completeOnboarding,
  }
})
