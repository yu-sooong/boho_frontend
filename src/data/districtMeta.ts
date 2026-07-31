/** 各縣市行政區選單／密度圖輔助 */
import type { CityId } from '@/data/cities'
import { taichungDistricts, taichungViewBox } from '@/data/taichungDistricts'
import { newtaipeiDistricts, newtaipeiViewBox } from '@/data/newtaipeiDistricts'
import { kaohsiungDistricts, kaohsiungViewBox } from '@/data/kaohsiungDistricts'

export interface CityDistrict {
  id: string
  name: string
  path: string
  density?: number
  selected?: boolean
}

export interface CityDistrictMap {
  cityName: string
  defaultId: string
  viewBox: string
  districts: CityDistrict[]
}

const MAPS: Record<CityId, CityDistrictMap> = {
  taichung: {
    cityName: '台中市',
    defaultId: '66000060', // 西屯區
    viewBox: taichungViewBox,
    districts: taichungDistricts,
  },
  newtaipei: {
    cityName: '新北市',
    defaultId: '65000010', // 板橋區
    viewBox: newtaipeiViewBox,
    districts: newtaipeiDistricts,
  },
  kaohsiung: {
    cityName: '高雄市',
    defaultId: '64000120', // 鳳山區
    viewBox: kaohsiungViewBox,
    districts: kaohsiungDistricts,
  },
}

/** @deprecated 相容舊碼：預設台中西屯 */
export const DEFAULT_DISTRICT_ID = MAPS.taichung.defaultId

export function getCityDistrictMap(cityId: CityId | null | undefined): CityDistrictMap {
  return MAPS[cityId && cityId in MAPS ? cityId : 'taichung']
}

export function isValidDistrictId(cityId: CityId | null | undefined, id: string) {
  return getCityDistrictMap(cityId).districts.some((d) => d.id === id)
}

export function getDistrictById(cityId: CityId | null | undefined, id: string): CityDistrict {
  const map = getCityDistrictMap(cityId)
  return map.districts.find((d) => d.id === id) ?? map.districts.find((d) => d.id === map.defaultId)!
}
