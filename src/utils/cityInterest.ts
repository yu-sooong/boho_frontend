/**
 * 「通知我某縣市上線」— 純本機記錄，不打後端（南美延遲／無預算）
 * 之後若要匯出，可讀 localStorage 或改接極輕量 POST。
 */

const KEY = 'buyu:city-interest'

export function listCityInterest(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function hasCityInterest(regionName: string): boolean {
  return listCityInterest().includes(regionName)
}

/** @returns true 若為新登記 */
export function addCityInterest(regionName: string): boolean {
  const name = regionName.trim()
  if (!name) return false
  const list = listCityInterest()
  if (list.includes(name)) return false
  list.push(name)
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
  return true
}
