import type { ApiCategoryStat, ApiDistrictStat, ApiSummary } from '@/api/types'
import type { DistrictStat } from '@/types'
import { getDistrictById } from '@/data/districtMeta'

/** 將 API 行政區統計組成畫面用 DistrictStat（不含人口等尚未有資料的欄位） */
export function buildDistrictStatView(opts: {
  districtId: string
  districtStats: ApiDistrictStat[]
  categoryStats: ApiCategoryStat[]
  summary: ApiSummary | null
}): DistrictStat {
  const district = getDistrictById(opts.districtId)
  const name = district.name
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
  let allocated = 0
  const categoryDistribution = top.map((c, i) => {
    if (i === top.length - 1) {
      return { label: c.category, percent: Math.max(0, 100 - allocated) }
    }
    const percent = Math.round((c.count / catTotal) * 100)
    allocated += percent
    return { label: c.category, percent }
  })

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
    cityName: '台中市',
    totalSchools,
    shareOfCityPercent: sharePct,
    cityAverageSchools: Math.round(cityAverage),
    densityRatioToAverage,
    densityLevel,
    categoryDistribution,
    categoryScope: 'district' as const,
    summary: `${name}目前有 ${totalSchools} 間立案補習班，約占全市 ${sharePct}%（約為各區平均的 ${densityRatioToAverage} 倍），資源${abundanceText}。可再搭配地圖位置與家長評價，比較交通與課程需求。`,
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
