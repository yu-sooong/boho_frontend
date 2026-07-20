import type { Router } from 'vue-router'

/** 有站內上一頁則返回，否則回首頁（避免直接進詳情時 back 跳出站） */
export function goBackOrHome(router: Router, fallback = '/') {
  const back = window.history.state?.back
  if (back != null) {
    router.back()
    return
  }
  void router.push(fallback)
}
