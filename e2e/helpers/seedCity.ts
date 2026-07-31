import type { Page } from '@playwright/test'

/** 進找班／情報前寫入已選縣市，避免 router 導回導覽 */
export async function seedCityOnboarding(page: Page, cityId = 'taichung') {
  await page.addInitScript((id) => {
    try {
      localStorage.setItem('buyu:selected-city', id)
      localStorage.setItem('buyu:city-onboarded', '1')
      // 同一 browser context 只清一次收藏，避免後續導頁把剛收藏的蓋掉
      if (!sessionStorage.getItem('buyu:e2e-fav-cleared')) {
        localStorage.removeItem('buyu:favorites')
        localStorage.removeItem('favorites')
        sessionStorage.setItem('buyu:e2e-fav-cleared', '1')
      }
    } catch {
      /* ignore */
    }
  }, cityId)
}
