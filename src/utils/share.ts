/** 分享目前頁面：優先系統分享面板，否則複製連結 */

export interface SharePayload {
  title: string
  text?: string
  url: string
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through
  }

  try {
    const input = document.createElement('input')
    input.value = text
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(input)
    return ok
  } catch {
    return false
  }
}

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

  const ok = await copyText(url)
  return ok ? 'copied' : 'failed'
}
