/** 縣市維度設定 */

export type CityId = 'taichung' | 'newtaipei' | 'kaohsiung'

export type CityDataSource = 'api' | 'mock'

export interface CityConfig {
  id: CityId
  name: string
  shortName: string
  /** BSB / open data 縣市代碼（之後 ETL 用） */
  bsbCode: string
  /** 是否可進入查詢流程（含假資料） */
  live: boolean
  dataSource: CityDataSource
  center: { lng: number; lat: number }
  /** 地圖 maxBounds：SW → NE */
  maxBounds: [[number, number], [number, number]]
  /** 導覽頁快捷行政區（靜態，不打 API） */
  quickDistricts: string[]
}

export const CITIES: CityConfig[] = [
  {
    id: 'taichung',
    name: '台中市',
    shortName: '台中',
    bsbCode: '42',
    live: true,
    dataSource: 'api',
    center: { lng: 120.6736, lat: 24.1477 },
    maxBounds: [
      [120.25, 23.88],
      [121.35, 24.55],
    ],
    quickDistricts: ['西屯區', '北屯區', '南屯區'],
  },
  {
    id: 'newtaipei',
    name: '新北市',
    shortName: '新北',
    bsbCode: '21',
    live: true,
    dataSource: 'api',
    center: { lng: 121.4657, lat: 25.0169 },
    maxBounds: [
      [121.28, 24.68],
      [122.05, 25.35],
    ],
    quickDistricts: ['板橋區', '中和區', '新莊區'],
  },
  {
    id: 'kaohsiung',
    name: '高雄市',
    shortName: '高雄',
    bsbCode: '70',
    live: true,
    dataSource: 'api',
    center: { lng: 120.3014, lat: 22.6273 },
    maxBounds: [
      [120.05, 22.45],
      [120.75, 23.35],
    ],
    quickDistricts: ['左營區', '鳳山區', '三民區'],
  },
]

export function getCityById(id: string | null | undefined): CityConfig | null {
  if (!id) return null
  return CITIES.find((c) => c.id === id) ?? null
}

export function isCityId(id: string): id is CityId {
  return CITIES.some((c) => c.id === id)
}
