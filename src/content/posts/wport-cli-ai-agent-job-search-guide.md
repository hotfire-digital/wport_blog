---
title: "WPORT CLI 使用說明：讓 AI Agent 在終端機直接搜尋職缺、撈資料"
description: "安裝 @wport/cli，一行指令搜尋 WPORT 職缺、輸出 JSON 給 Cursor 等 AI Agent 接續處理。含安裝步驟、常用指令、Agent 友善參數與實戰範例。"
publishDate: 2026-07-07
tags: ["WPORT 功能", "AI 實作", "求職面試"]
featured: false
cover: "https://res.cloudinary.com/dyebbsckc/image/upload/f_auto,q_auto:good,w_1200,c_limit/v1783409274/wport-blog/wport-cli-cover.jpg"
---

<figure>
  <img src="https://res.cloudinary.com/dyebbsckc/image/upload/f_auto,q_auto:good,w_1200,c_limit/v1783409274/wport-blog/wport-cli-cover.jpg" alt="WPORT CLI 終端機職缺搜尋示範現場" />
  <figcaption>WPORT CLI 讓 AI Agent 在終端機直接搜尋職缺、輸出結構化資料。</figcaption>
</figure>

你在 Cursor 裡跟 AI 說「幫我找桃園的 PM 職缺」，它通常只能上網搜、或請你手動複製貼上。

如果我們把**職缺搜尋做成 CLI**，AI Agent 就能在終端機直接執行指令、拿到結構化 JSON，再往下做履歷客製、比對 JD、甚至寫進你的 Obsidian 筆記。這就是 [WPORT CLI](https://www.npmjs.com/package/@wport/cli)（`@wport/cli`）存在的理由。

---

## 為什麼是 CLI，不是網頁？

網頁介面適合人類點擊；**命令列介面（CLI）適合程式與 AI Agent**。

| 情境 | 網頁 GUI | WPORT CLI |
|------|----------|-----------|
| 人類瀏覽職缺 | 直覺、好看 | 可以，但非主力 |
| AI Agent 自動搜尋 | 要模擬點擊，不穩 | 一行指令，穩定 |
| 輸出給下一步 Skill | 要爬 HTML | 原生 JSON / NDJSON |
| 串進腳本或 CI | 困難 | `pipe` 到 `jq` 即可 |

WPORT CLI 是 W101 人才搜尋中心公開 API 的終端機介面。公開職缺搜尋與檢視**不需登入**；企業端管理職缺則有獨立的 `enterprise` 子命令（需 API Key，文末簡述）。

> **版本說明**：目前 npm 最新版為 `0.5.0`，仍屬 `0.x` 預發布階段。API 網域與指令可能調整，建議在自動化腳本中鎖定版本號。

---

## 安裝

需要 **Node.js >= 18.17**。

```bash
npm install -g @wport/cli
```

安裝完成後，終端機輸入 `wport` 即可使用。若 AI Agent（如 Cursor Agent）有終端機權限，同樣可以代你執行這些指令。

驗證環境：

```bash
wport doctor
```

`doctor` 會顯示目前設定的 API 位址、語系、連線狀態，以及 Agent 應留意的 API 行為（例如排序欄位由伺服器決定，客戶端無法覆寫）。

---

## 三步驟快速開始

### 1. 搜尋職缺

```bash
wport jobs search --keyword "產品經理"
```

加上地區代碼可縮小範圍（地區代碼可重複使用 `-l`）：

```bash
wport jobs search --keyword "PM" -l 6001001000
```

預設在終端機會以**表格**顯示；若輸出被導向管線（pipe），會自動切換為 **JSON**，方便後續處理。

### 2. 查看單一職缺詳情

從搜尋結果複製 `enc_id`，再執行：

```bash
wport jobs view <enc_id>
```

也可只取單一欄位，減少 AI 讀取的 token：

```bash
wport jobs view <enc_id> --field job_info.job_title
```

### 3. 輸出 JSON 給 Agent 或 jq

```bash
wport jobs search --keyword backend --output json
```

若只要 Agent 必要欄位，用 `--minimal`（等同精簡版欄位集合）：

```bash
wport jobs search --keyword backend --minimal --output json
```

或自訂欄位：

```bash
wport jobs search --keyword backend --fields enc_id,title --output json
```

`--minimal` 與 `--fields` 會在**客戶端**裁切 JSON，讓 LLM 少讀無關欄位，但網路傳輸量不變。這是專門為 Agent 工作流設計的。

---

## 給 AI Agent 用的實戰範例

### 範例 A：搜尋 → 抽出 enc_id → 批次讀標題

```bash
wport jobs search --keyword backend --fields enc_id --output json \
  | jq -r '.data[].enc_id' \
  | wport jobs view - --batch --field job_info.job_title
```

`--batch` 模式從 stdin 讀取多個 `enc_id`，以 NDJSON 逐行輸出，單筆失敗不會中斷整批。適合 Agent 一次處理多份 JD。

### 範例 B：在 Cursor 裡請 Agent 執行

你可以在 Cursor 的 Agent 模式這樣下指令：

> 請在終端機執行 `wport jobs search --keyword "桃園 產品經理" --minimal --output json`，把結果整理成 Markdown 表格，並標出最適合應屆生的 3 筆。

Agent 會呼叫 CLI、拿到 JSON、再依你的 Skill 或對話繼續產出履歷建議。這比請它「去網站找職缺」可靠得多。

### 範例 C：進階查詢（`--json-query`）

部分篩選條件（年資、遠端模式、薪資區間等）尚未暴露成簡短 flag，可寫成 JSON 檔後傳入：

```bash
wport jobs search --json-query ./my-search.json --output json
```

JSON 結構對應伺服器端的 `JobSearchDto`，適合進階腳本或 Agent 動態產生查詢檔。

---

## 語系與個人設定

CLI 介面字串固定；`--lang` 影響的是 **API 回傳內容的語言**（職缺描述等）：

```bash
wport jobs search --keyword backend --lang en-US
```

持久化偏好：

```bash
wport config set locale zh-TW
wport config get
```

可設定項目：`locale`、`output`、`timeout_ms`。API 位址請用環境變數或 flag，不要寫進 config（安全考量）：

```bash
WPORT_API_BASE=https://api.wport.me wport jobs search --keyword backend
# 或單次指定
wport jobs search --keyword backend --api https://api.wport.me
```

---

## 企業端指令（招募方）

若你代表公司管理 WPORT 職缺，可使用 `wport enterprise` 子命令（需企業 API Key `wpk_live_...`，請聯繫 BD 團隊取得）：

```bash
wport enterprise login          # 安全儲存金鑰（不會出現在 shell history）
wport enterprise jobs list --status published
wport enterprise jobs create --file new-job.json
wport enterprise talents list --tab applied
```

企業命令與公開的 `wport jobs` **完全隔離**；未登入時不會碰到雇主端 API。CI / Agent 也可透過環境變數傳金鑰：

```bash
WPORT_API_KEY=wpk_live_... wport enterprise jobs list --minimal --output json
```

---

## 離開碼與速率限制

Agent 寫腳本時可依 exit code 判斷結果：

| Code | 意義 |
|------|------|
| `0` | 成功 |
| `2` | 參數錯誤 |
| `3` | 伺服器 4xx |
| `4` | 伺服器 5xx / 網路錯誤 |
| `5` | 設定檔損壞 |

公開職缺搜尋端點限速約 **1200 次 / 分鐘 / IP**，一般互動與 Agent 單線程使用足夠。請勿用多進程爬蟲大量請求。

---

## 我們為什麼這樣設計？

1. **Agent 優先**：`--minimal`、`--fields`、`--batch`、pipe 友善的 JSON 預設，都是為了讓 AI 少讀廢話、多做事。
2. **公開與企業分離**：求職者用 `wport jobs` 不需帳號；企業功能收在 `enterprise`，金鑰權限清楚。
3. **可腳本化**：與 `jq`、Skill、MCP 工具鏈串接，才能把「搜職缺」變成履歷客製、投遞追蹤流水線的一環。

這也是聰電站 Vol.3 現場示範的核心：一行 `wport jobs search`，桃園 PM 職缺立刻進 Agent 工作流。若你錯過課程，這篇文章就是補課手冊。

---

## 下一步

- **安裝套件**：[npmjs.com/package/@wport/cli](https://www.npmjs.com/package/@wport/cli)
- **遇到問題**：`wport doctor` 先跑一輪；`0.x` 階段可來信 [yao@wport.me](mailto:yao@wport.me)
- **在網站找職缺**：[wport.me](https://wport.me/)

之後我們會在「WPORT 功能」專區持續更新：新指令、Agent 串接範例、以及產品背後的設計取捨。歡迎收藏這篇，下次開 Cursor 直接叫 Agent 跑 `wport` 就好。
