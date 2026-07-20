# 補亦樂乎 · 廣告片管線（Playwright + Remotion）

一鍵：模擬 iPhone 操作本地站 → 錄影 → 套白色 iPhone 外框 → 輸出 1080×1920 MP4。

## 前置

1. 前端已啟動：`cd frontend && npm run dev`（`http://localhost:5173`）
2. 安裝依賴：`cd frontend/reels && npm install`

## 一鍵產出

```bash
cd frontend/reels && npm run ad:render
# 或在 frontend：
npm run ad:render
```

成品：`frontend/reels/out/final-ad.mp4`  
畫面 CTA 為 **boho.yujii.app**（不會露出 localhost）。

## 其他指令

| 指令 | 說明 |
| --- | --- |
| `npm run frame:generate` | 重產白色 iPhone 外框 PNG |
| `npm run ad:record` | 只錄影 |
| `npm run studio` | Remotion Studio 預覽 |

## 外框對齊建議

| 項目 | 建議 |
| --- | --- |
| PNG 畫布 | 860×1760（約 iPhone 比例） |
| 螢幕洞 | inset 28px、圓角 52px；**完全透明** |
| Dynamic Island | 不透明黑膠囊，蓋在影片上方 |
| 機身色 | 白／淺灰漸層（流行「白 iPhone」質感） |

微調邏輯（`src/layout.ts` → `FRAME.screen`）：

1. 外框與錄影都用**同一組比例**（left/top/width/height 為 0–1）
2. Remotion 先依 `phoneWidth` 縮放整支手機，再把影片放進洞內並加相同 `borderRadius`
3. 若露邊：略增 `FRAME.screen.left/top` 或略減 `width/height`（一次調 0.002～0.005）
4. 重產外框：`npm run frame:generate`（會覆寫 PNG，請同步改 `generate-frame.ts` 的 inset）

## 與舊 CSS 3D 管線

已改用 Remotion。舊的 `scripts/compose-reels.mjs` / `e2e/reels-demo.spec.ts` 可留作參考，日常請用 `npm run ad:render`。
