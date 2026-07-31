/**
 * 台灣縣市粗略 bbox（靜態、零 API）
 * 僅供「偵測所在縣市是否已開放」；精準門牌不需要。
 * 由小範圍到大範圍排序時，先匹配較小區域。
 */

import { type CityId, isCityId } from '@/data/cities'

export interface TaiwanRegion {
  /** 顯示名，如 嘉義市 */
  name: string
  /** 若已在產品上線則對應 CityId */
  cityId: CityId | null
  /** [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number]
}

/** 已開放 + 常見未開放（優先匹配較小框） */
export const TAIWAN_REGIONS: TaiwanRegion[] = [
  // 直轄／六都核心（略縮，減少邊界誤判）
  { name: '嘉義市', cityId: null, bbox: [120.40, 23.44, 120.50, 23.52] },
  { name: '新竹市', cityId: null, bbox: [120.93, 24.76, 121.05, 24.85] },
  { name: '基隆市', cityId: null, bbox: [121.68, 25.08, 121.80, 25.18] },
  // 台北框略縮，避免板橋／中和被誤判成台北
  { name: '台北市', cityId: null, bbox: [121.48, 24.98, 121.65, 25.15] },
  { name: '新北市', cityId: 'newtaipei', bbox: [121.28, 24.68, 122.05, 25.35] },
  { name: '桃園市', cityId: null, bbox: [121.05, 24.85, 121.48, 25.15] },
  { name: '台中市', cityId: 'taichung', bbox: [120.45, 24.05, 121.05, 24.45] },
  { name: '台南市', cityId: null, bbox: [120.05, 22.85, 120.55, 23.45] },
  { name: '高雄市', cityId: 'kaohsiung', bbox: [120.15, 22.45, 120.75, 23.15] },
  { name: '嘉義縣', cityId: null, bbox: [120.15, 23.25, 120.75, 23.65] },
  { name: '新竹縣', cityId: null, bbox: [120.85, 24.55, 121.35, 24.90] },
  { name: '苗栗縣', cityId: null, bbox: [120.65, 24.35, 121.10, 24.75] },
  { name: '彰化縣', cityId: null, bbox: [120.35, 23.85, 120.75, 24.25] },
  { name: '雲林縣', cityId: null, bbox: [120.15, 23.55, 120.65, 23.90] },
  { name: '南投縣', cityId: null, bbox: [120.55, 23.65, 121.15, 24.15] },
  { name: '屏東縣', cityId: null, bbox: [120.35, 21.90, 120.90, 22.75] },
  { name: '宜蘭縣', cityId: null, bbox: [121.35, 24.35, 122.05, 24.90] },
  { name: '花蓮縣', cityId: null, bbox: [121.15, 23.15, 121.75, 24.40] },
  { name: '台東縣', cityId: null, bbox: [120.85, 22.25, 121.55, 23.45] },
  { name: '澎湖縣', cityId: null, bbox: [119.45, 23.20, 119.75, 23.80] },
  { name: '金門縣', cityId: null, bbox: [118.20, 24.35, 118.55, 24.55] },
  { name: '連江縣', cityId: null, bbox: [119.85, 26.10, 120.05, 26.40] },
]

export interface DetectedRegion {
  name: string
  cityId: CityId | null
  supported: boolean
}

export function detectRegionFromCoords(lat: number, lng: number): DetectedRegion | null {
  for (const r of TAIWAN_REGIONS) {
    const [minLng, minLat, maxLng, maxLat] = r.bbox
    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
      const cityId = r.cityId && isCityId(r.cityId) ? r.cityId : null
      return {
        name: r.name,
        cityId,
        supported: cityId != null,
      }
    }
  }
  return null
}
