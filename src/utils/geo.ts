/** 台灣大致範圍內的有效座標（略寬鬆，避免邊界漏掉） */
export function hasSchoolCoords(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 21.5 &&
    lat <= 26.5 &&
    lng >= 119 &&
    lng <= 122.5
  )
}

/** Haversine：兩點距離（公里）；缺座標時回 null */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number | null {
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1)) return null
  if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return null
  if (!hasSchoolCoords(lat2, lng2)) return null

  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistanceKm(km: number | null): string {
  if (km == null || !Number.isFinite(km) || km < 0) return ''
  if (km < 1) return `${Math.round(km * 1000)} 公尺`
  return `${km.toFixed(1)} 公里`
}
