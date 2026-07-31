import type { ApiCategoryStat, ApiDistrictStat, ApiSummary } from '@/api/types'
import type { DistrictStat } from '@/types'
import type { CityDistrict } from '@/data/districtMeta'

/** 將 API 行政區統計組成畫面用 DistrictStat（不含人口等尚未有資料的欄位） */
export function buildDistrictStatView(opts: {
  districtId: string
  districtName: string
  cityName: string
  districtStats: ApiDistrictStat[]
  categoryStats: ApiCategoryStat[]
  summary: ApiSummary | null
}): DistrictStat {
  const name = opts.districtName
  const totalSchools = opts.districtStats.find((d) => d.district === name)?.count ?? 0
  const totalActive =
    opts.summary?.totalActive ??
    opts.districtStats.reduce((s, d) => s + d.count, 0)
  const districtCount = Math.max(
    1,
    opts.summary?.districtCount ?? (opts.districtStats.length || 1),
  )
  const cityAverage = totalActive / districtCount
  const densityRatioToAverage =
    cityAverage > 0 ? Math.round((totalSchools / cityAverage) * 10) / 10 : 0

  const counts = opts.districtStats.map((d) => d.count)
  const maxCount = Math.max(1, ...counts, totalSchools)
  const densityNorm = totalSchools / maxCount
  const densityLevel = Math.min(5, Math.max(1, Math.ceil(densityNorm * 5) || 1))

  const catTotal = opts.categoryStats.reduce((s, c) => s + c.count, 0) || 1
  const top = [...opts.categoryStats].sort((a, b) => b.count - a.count).slice(0, 6)
  /** 依實際占比計算（勿把餘數塞給最後一項，否則會失真） */
  const categoryDistribution = top.map((c) => ({
    label: c.category,
    percent: Math.round((c.count / catTotal) * 1000) / 10,
  }))

  const abundanceText =
    densityRatioToAverage >= 1.3
      ? '相對充沛'
      : densityRatioToAverage >= 1
        ? '略高於平均'
        : densityRatioToAverage >= 0.7
          ? '接近平均'
          : totalSchools === 0
            ? '資料偏少或尚無立案資料'
            : '相對偏少'

  const sharePct =
    totalActive > 0 ? Math.round((totalSchools / totalActive) * 1000) / 10 : 0

  return {
    districtName: name,
    cityName: opts.cityName,
    totalSchools,
    shareOfCityPercent: sharePct,
    cityAverageSchools: Math.round(cityAverage),
    densityRatioToAverage,
    densityLevel,
    categoryDistribution,
    categoryScope: 'district' as const,
    summary: `${name}目前有 ${totalSchools} 間立案補習班，約占全市 ${sharePct}%（約為各區平均的 ${densityRatioToAverage} 倍），資源${abundanceText}。可再搭配地圖位置與就讀經驗，比較交通與課程需求。`,
  }
}

/** 從補習班列表聚合行政區／類別統計（假資料縣市用） */
export function buildStatsFromSchools(
  schools: {
    district: string
    categoryTags: string[]
    penaltyCount?: number
    penalties?: unknown[]
  }[],
  districts: CityDistrict[],
): {
  districtStats: ApiDistrictStat[]
  categoryStats: ApiCategoryStat[]
  districtCategoryStats: (districtName: string) => ApiCategoryStat[]
  summary: ApiSummary
} {
  const countByDistrict = new Map<string, number>()
  const penaltyByDistrict = new Map<string, number>()
  const countByCategory = new Map<string, number>()
  const byDistrictCategory = new Map<string, Map<string, number>>()
  let withPenalty = 0

  for (const s of schools) {
    const d = s.district || '未分類'
    countByDistrict.set(d, (countByDistrict.get(d) ?? 0) + 1)
    const hasPenalty =
      (s.penaltyCount ?? 0) > 0 || (Array.isArray(s.penalties) && s.penalties.length > 0)
    if (hasPenalty) {
      withPenalty += 1
      penaltyByDistrict.set(d, (penaltyByDistrict.get(d) ?? 0) + 1)
    }
    for (const c of s.categoryTags) {
      countByCategory.set(c, (countByCategory.get(c) ?? 0) + 1)
      if (!byDistrictCategory.has(d)) byDistrictCategory.set(d, new Map())
      const m = byDistrictCategory.get(d)!
      m.set(c, (m.get(c) ?? 0) + 1)
    }
  }

  const districtStats: ApiDistrictStat[] = districts.map((d) => ({
    district: d.name,
    count: countByDistrict.get(d.name) ?? 0,
    penaltyCount: penaltyByDistrict.get(d.name) ?? 0,
  }))

  const categoryStats: ApiCategoryStat[] = [...countByCategory.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const totalActive = schools.length

  return {
    districtStats,
    categoryStats,
    districtCategoryStats: (districtName: string) => {
      const m = byDistrictCategory.get(districtName)
      if (!m) return []
      return [...m.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
    },
    summary: {
      totalActive,
      totalClosed: 0,
      districtCount: districts.length,
      withPenalty,
    },
  }
}

/** 0~1 密度（給地圖著色），依全市最大區正規化 */
export function densityByDistrictName(
  districtStats: ApiDistrictStat[],
): Record<string, number> {
  const max = Math.max(1, ...districtStats.map((d) => d.count), 1)
  const out: Record<string, number> = {}
  for (const d of districtStats) {
    out[d.district] = d.count / max
  }
  return out
}

export function countByDistrictName(
  districtStats: ApiDistrictStat[],
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const d of districtStats) out[d.district] = d.count
  return out
}
