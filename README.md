# boho_frontend（補亦樂乎）

Vue 3 + Vite + MapLibre。正式站：`https://boho.yujii.app`

## 開發

```bash
cp .env.example .env   # 可選；本機可用 Vite proxy `/api`
npm ci
npm run dev
```

## 產線建置（Cloudflare Pages）

- Build：`npm run build`
- Output：`dist`
- 環境變數：
  - `VITE_API_BASE=https://api.yujii.app/api`
  - `VITE_SITE_URL=https://boho.yujii.app`
  - `VITE_CONTACT_EMAIL=yujiiii543@gmail.com`

`public/og.png` 為社群預覽圖（需一併部署）。
