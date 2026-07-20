/** 台中行政區選單輔助（不含假統計數字） */
import { taichungDistricts } from '@/data/taichungDistricts'

export const DEFAULT_DISTRICT_ID = '66000060' // 西屯區

export function isValidDistrictId(id: string) {
  return taichungDistricts.some((d) => d.id === id)
}

export function getDistrictById(id: string) {
  return (
    taichungDistricts.find((d) => d.id === id) ??
    taichungDistricts.find((d) => d.id === DEFAULT_DISTRICT_ID)!
  )
}
