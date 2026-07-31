# Threads 行銷素材

- 文案：[`THREADS-COPY.md`](./THREADS-COPY.md)
- **新北／高雄即將上線**：[`CITIES-LAUNCH.md`](./CITIES-LAUNCH.md)
- **兩班對照・更版（三縣市＋對照＋分享）**：[`COMPARE-UPDATE.md`](./COMPARE-UPDATE.md)
- **地區教育情報**：[`DISTRICT-INTEL.md`](./DISTRICT-INTEL.md)
- 輸出：`out/threads-*.png`、`out/*cities-launch*`、`out/*compare-update*`、`out/*district-intel*`

```bash
cd frontend
# 既有海報／舊動畫
node scripts/marketing/render-posters.mjs

# 新北／高雄即將上線（方圖＋限動直式）
node scripts/marketing/render-cities-launch.mjs

# 兩班對照・更版（方圖＋限動直式）
node scripts/marketing/render-compare-update.mjs

# 地區教育情報（方圖＋限動直式）
node scripts/marketing/render-district-intel.mjs
```

需已安裝 Playwright Chromium：`npx playwright install chromium`
