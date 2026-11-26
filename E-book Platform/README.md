# E-book Platform

靜態書櫃與共用閱讀器，不需要安裝前端框架。以 HTTP server 或 GitHub Pages 開啟，不能直接使用 file://。

新增書籍：建立書籍資料夾、cover.svg、book.json 與 pages/*.html。book.json 的 pages 是依序排列的 HTML 片段路徑，toc 的 page 是從 0 開始的頁碼；可選 styles、scripts、widgets（ES module，匯出 bindInteractiveWidgets）。把 book.json 的相對路徑加入 catalog.json。空 pages 的書籍顯示在書櫃但不可開啟。

PHYSICA AI 保留原本 24 個頁面、圖解與互動元件，原本內嵌的 Tailwind Play CDN 3.4.10 移至 vendor；仍使用原本的 Google Fonts 連線。閱讀進度儲存在瀏覽器 localStorage，不會上傳或跨裝置同步。翻頁以固定雜誌頁為單位；長頁內可垂直捲動。
