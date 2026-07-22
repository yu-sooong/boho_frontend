/**
 * Google Analytics 4（僅在設定 VITE_GA_MEASUREMENT_ID 時啟用）
 *
 * 已埋事件（漏斗／互動）：
 * - page_view
 * - search_schools（keyword_length, result_count）
 * - apply_filter（district_count, category_count, result_count）
 * - select_map_pin（school_id）
 * - select_school（school_id, source: list|preview）
 * - view_school_detail（school_id, district, status）
 * - click_directions（school_id）
 * - open_review_sheet（school_id）
 * - submit_review（school_id, rating）
 * - add_to_favorites / remove_from_favorites（school_id）
 * - share_school（school_id, method: shared|copied）
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() ?? ''

let initialized = false

export function isAnalyticsEnabled(): boolean {
  return Boolean(MEASUREMENT_ID) && typeof window !== 'undefined'
}

export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || initialized) return
  initialized = true

  // 必須 push(arguments)，不可 push([...args])，否則 gtag 只載入腳本、不會送 collect
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`
  document.head.appendChild(script)
}

export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled() || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
  })
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (!isAnalyticsEnabled() || !window.gtag) return
  window.gtag('event', name, params)
}
