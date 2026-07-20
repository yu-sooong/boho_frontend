import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || 'https://boho.yujii.app').replace(/\/$/, '')

  return {
    plugins: [
      vue(),
      {
        name: 'html-site-url',
        transformIndexHtml(html) {
          return html.replaceAll('__SITE_URL__', siteUrl)
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // 開發時將 /api/* 代理到後端，避免 CORS 問題
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
      // 部分沙箱/虛擬檔案系統環境下 fsevents/inotify 不會正確觸發，改用輪詢確保 HMR 能偵測到檔案變更
      watch: {
        usePolling: true,
        interval: 300,
      },
    },
  }
})
