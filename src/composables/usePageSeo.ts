import { SITE_URL } from '@/config/site'
import { watchEffect, isRef, type Ref } from 'vue'

interface SeoMeta {
  title: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogUrl?: string
  ogImage?: string
  /** 預設 index,follow；設為 noindex 時阻止搜尋引擎索引此頁 */
  robots?: string
}

type SeoInput = SeoMeta | Ref<SeoMeta>

function setMetaTag(name: string, content: string, property = false) {
  const selector = property
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`
  let el = document.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    if (property) el.setAttribute('property', name)
    else el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.content = content
}

export function usePageSeo(input: SeoInput) {
  watchEffect(() => {
    const meta = isRef(input) ? input.value : input

    document.title = meta.title

    if (meta.description) setMetaTag('description', meta.description)
    if (meta.robots) setMetaTag('robots', meta.robots)

    const title = meta.ogTitle ?? meta.title
    const description = meta.ogDescription ?? meta.description
    // ?v= 避免 LINE／FB 快取舊圖；比例維持 1200×630（社群標準）
    const image = meta.ogImage ?? `${SITE_URL}/og.png?v=3`

    setMetaTag('og:title', title, true)
    if (description) setMetaTag('og:description', description, true)
    if (meta.ogUrl) setMetaTag('og:url', meta.ogUrl, true)
    setMetaTag('og:image', image, true)
    setMetaTag('og:image:alt', title, true)

    // Twitter／多數爬蟲會讀這組；與 OG 同步避免只有連結沒圖
    setMetaTag('twitter:card', 'summary_large_image')
    setMetaTag('twitter:title', title)
    if (description) setMetaTag('twitter:description', description)
    setMetaTag('twitter:image', image)
    setMetaTag('twitter:image:alt', title)
  })
}
