import type { School } from '@/types'
import { hasSchoolCoords } from '@/utils/geo'

/** Google 地圖導航／搜尋連結（有座標用導航，否則依地址搜尋） */
export function googleMapsDirectionsUrl(
  school: Pick<School, 'lat' | 'lng' | 'address' | 'name'>,
): string {
  if (hasSchoolCoords(school.lat, school.lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${school.lat},${school.lng}&travelmode=driving`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.address || school.name)}`
}
