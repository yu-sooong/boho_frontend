/** 評價投稿：身份／時期選項與審核說明文案 */

export const REVIEW_IDENTITIES = [
  { value: 'parent', label: '家長' },
  { value: 'student', label: '學生' },
  { value: 'former_staff', label: '曾任職' },
  { value: 'other', label: '其他' },
] as const

export const REVIEW_PERIODS = [
  { value: 'current', label: '目前就讀中' },
  { value: 'within_1y', label: '一年內曾就讀' },
  { value: 'over_1y', label: '一年前曾就讀' },
  { value: 'inquiry', label: '僅諮詢或試聽' },
] as const

export type ReviewIdentity = (typeof REVIEW_IDENTITIES)[number]['value']
export type ReviewPeriod = (typeof REVIEW_PERIODS)[number]['value']

export const REVIEW_FEATURE_OPTIONS = [
  '老師耐心',
  '教材完整',
  '環境整潔',
  '價格合理',
  '師生互動好',
  '進度清楚',
  '課後回饋',
] as const

export const REVIEW_POLICY = {
  title: '評價怎麼審核',
  intro: '採匿名投稿、人工審核。公開時只顯示身份與就讀／接觸時期，不會露出你的真實身分。',
  points: [
    '送出後先進入待審；通過後才會顯示在補習班頁面。',
    '審核通常約 3 個工作天；未通過則不會刊出，也不會另行通知。',
    '為避免灌水，同一網路或裝置每日大約最多 5 則；超過請隔日再試。',
    '請寫具體親身經驗。負評只要具體、不人身攻擊，一樣會刊出。',
    '廣告、業配、人身攻擊、洩漏個資（如老師或小孩姓名）、道聽塗說會退件。',
    '我們不收補習班廣告費，也不接受付費要求刪改真實評價。',
    '業者目前無法在平台回應評價；此功能尚在規劃中。',
  ],
  privacyNote:
    '送出時會記錄 IP 與匿名裝置識別，僅用於調查灌水或冒充，不會公開顯示。',
}

export function identityLabel(value: ReviewIdentity): string {
  return REVIEW_IDENTITIES.find((i) => i.value === value)?.label ?? '使用者'
}

export function periodLabel(value: ReviewPeriod): string {
  return REVIEW_PERIODS.find((p) => p.value === value)?.label ?? ''
}
