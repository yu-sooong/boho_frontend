/** 分享目前頁面：優先系統分享面板，否則複製連結 */

export interface SharePayload {
  title: string
  text?: string
  url: string
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareOrCopy(payload: SharePayload): Promise<ShareResult> {
  const { title, text, url } = payload

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      // 使用者取消分享面板
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      // 某些環境 share 失敗時改走複製
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return 'copied'
    }
  } catch {
    // fall through
  }

  // 舊瀏覽器：選取隱藏 input 複製
  try {
    const input = document.createElement('input')
    input.value = url
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(input)
    return ok ? 'copied' : 'failed'
  } catch {
    return 'failed'
  }
}
