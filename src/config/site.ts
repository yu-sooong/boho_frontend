/** 站台公開設定（可由 Vite 環境變數覆寫） */

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://boho.yujii.app'

/** 對外聯絡信箱；Email 尚未申請前先統一用此變數，之後改 .env 即可 */
export const CONTACT_EMAIL =
  (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'yujiiii543@gmail.com'

export function mailto(subject?: string): string {
  const base = `mailto:${CONTACT_EMAIL}`
  if (!subject) return base
  return `${base}?subject=${encodeURIComponent(subject)}`
}
