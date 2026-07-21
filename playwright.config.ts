import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    locale: 'zh-TW',
    geolocation: { latitude: 24.1477, longitude: 120.6736 },
    permissions: ['geolocation'],
    browserName: 'chromium',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 } },
      testMatch: /map-navigation\.spec\.ts/,
      grep: /桌面/,
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        browserName: 'chromium',
      },
      testMatch: /map-navigation\.spec\.ts/,
      grep: /手機/,
    },
    {
      // 行銷直式片：viewport 必須 == video.size、且為 9:16；
      // deviceScaleFactor 必須為 1，否則畫面會縮在左上、周圍灰底（Playwright 已知行為）。
      // 720≤767 → 仍走手機版面；compose 再套 3D 手機外框並輸出 1080×1920。
      name: 'reels',
      use: {
        browserName: 'chromium',
        viewport: { width: 720, height: 1280 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
        video: {
          mode: 'on',
          size: { width: 720, height: 1280 },
        },
        screenshot: 'off',
      },
      testMatch: /reels-demo\.spec\.ts/,
      outputDir: './test-results/reels',
      timeout: 120_000,
    },
    {
      name: 'remote-qa',
      use: {
        browserName: 'chromium',
        baseURL:
          process.env.PLAYWRIGHT_BASE_URL ?? 'https://boho-frontend.sscode543.workers.dev',
        viewport: { width: 1280, height: 800 },
        locale: 'zh-TW',
        geolocation: { latitude: 24.1477, longitude: 120.6736 },
        permissions: ['geolocation'],
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
      },
      testMatch: /(?:remote-qa-monkey|detail-api-count)\.spec\.ts/,
      timeout: 120_000,
    },
  ],
})
