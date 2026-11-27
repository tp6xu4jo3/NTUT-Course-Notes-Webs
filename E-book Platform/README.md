# E-book Platform

靜態書櫃與共用閱讀器，不需要安裝前端框架。以 HTTP server 或 GitHub Pages 開啟，不能直接使用 file://。

新增書籍：建立書籍資料夾、cover.svg、book.json 與 pages/*.html。book.json 的 pages 是依序排列的 HTML 片段路徑，toc 的 page 是從 0 開始的頁碼；可選 styles、scripts、widgets（ES module，匯出 bindInteractiveWidgets）。把 book.json 的相對路徑加入 catalog.json。空 pages 的書籍顯示在書櫃但不可開啟。

PHYSICA AI 保留原本 24 個頁面、圖解與互動元件，原本內嵌的 Tailwind Play CDN 3.4.10 移至 vendor；仍使用原本的 Google Fonts 連線。不儲存已讀位置，每次開啟書籍皆從封面開始；閱讀器的即時頁碼與跳頁進度條仍可使用。翻頁以固定雜誌頁為單位；長頁內可垂直捲動。

## 分類與翻頁
每本書的 book.json 可加入 `categories` 陣列（由上到下的分類名稱），例如 `["Google Career Credential","Google AI"]`；未指定分類會進入「其他」。書櫃依分類巢狀呈現，各分類下的書卡由左往右排列，寬度不足時自動換行。既有書籍 ID 與路徑保持不變。書櫃只顯示總頁數，不顯示已讀位置。
AI Fundamentals 依 Module 1–6 分目錄存放 HTML 片段，搭配獨立 magazine.css、SVG 封面與標誌；為非官方中文學習筆記，未公開原始課程逐字稿。
閱讀時點擊書頁區域左半部回上一頁（雙頁模式為上一個跨頁），右半部往下一頁；原有按鈕、鍵盤、滑動、目錄及選字仍保留。互動元件不觸發翻頁。

## Google AI 四冊系列
四冊對應官方 Google AI Professional Certificate 課程：VOL. 01 C01；VOL. 02 C02、C03、C06；VOL. 03 C04、C05；VOL. 04 C07、C08。book.json 的 courses 記錄官方編號、名稱及 included/pending 狀態；書櫃會顯示實際收錄進度。四冊皆已收錄全部8門課程、28個Module，合計107頁（24／27／23／33）。統一使用 AI Fundamentals/magazine.css，封面同時用於書櫃與閱讀器。流程圖以書頁可用寬度響應式排版，假設數據與原創示意標明，新增內容為非官方中文學習筆記。課程08未附原始挑戰題，採原創實作檢核。
