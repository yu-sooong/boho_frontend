/** 站台公開設定（可由 Vite 環境變數覆寫） */

function resolveSiteUrl(): string {
  const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv

  // 預覽／Workers 未設 env 時，用目前 origin，避免 OG／分享連到尚未綁定的正式網域
  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location
    if (origin && !/^(localhost|127\.0\.0\.1)$/i.test(hostname)) {
      return origin
    }
  }

  return 'https://boho.yujii.app'
}

export const SITE_URL = resolveSiteUrl()

/** 對外聯絡信箱；Email 尚未申請前先統一用此變數，之後改 .env 即可 */
export const CONTACT_EMAIL =
  (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'yujiiii543@gmail.com'

export function mailto(subject?: string): string {
  const base = `mailto:${CONTACT_EMAIL}`
  if (!subject) return base
  return `${base}?subject=${encodeURIComponent(subject)}`
}
