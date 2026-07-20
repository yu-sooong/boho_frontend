const STORAGE_KEY = 'buyu:deviceId'

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** 匿名裝置識別（localStorage），供評價防濫用限流 */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const id = createId()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    return createId()
  }
}
