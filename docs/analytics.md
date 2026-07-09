# Blog Analytics & Search Console

本文件說明 WPORT Blog（`https://wport.me/blog/`）的追蹤架構、事件字典、
Google Tag Manager / GA4 / Search Console 設定步驟，以及「每篇文章熱度／來源」判讀方式。

## 架構總覽

```text
瀏覽器 (Blog)
  └─ GTM container (預設 GTM-MGLNLCG5，與主站共用)
       └─ GA4 Configuration / Event tags
            └─ GA4 property（報表 / DebugView / Explorations）

Google Search Console
  └─ URL-prefix 或 Domain property → 提交 sitemap → Performance by page
```

站內實作位置：

| 項目 | 檔案 |
| --- | --- |
| GTM snippet | `src/layouts/BlogLayout.astro` |
| dataLayer helper | `src/lib/analytics.ts` |
| 文章事件 | `src/pages/posts/[slug].astro` |
| 已閱讀標記 | `src/lib/read-markers.ts` + archive/index |
| RSS 樣式 | `public/feed.xsl` + `src/pages/feed.xml.ts` |
| Env 範例 | `.env.example`（`PUBLIC_GTM_ID`, `PUBLIC_GSC_VERIFICATION`） |

---

## 1. Google Tag Manager

### 既有情況

- 主站 `https://wport.me/` 已掛載 `GTM-MGLNLCG5`。
- Blog 現在同一個 container，預設不需另開新容器。
- 可用 `PUBLIC_GTM_ID` 覆寫（例如臨時換成測試 container）。

### GTM 建議設定（在 GTM UI 完成）

1. **GA4 Configuration Tag**
   - Tag type: Google Analytics: GA4 Configuration
   - Measurement ID: `G-XXXXXXXX`（你的 GA4 property）
   - Trigger: All Pages
2. **Data Layer Variables**（參數名稱需完全一致）
   - `post_id`
   - `post_title`
   - `post_tags`
   - `publish_date`
   - `page_type`
   - `scroll_percent`
   - `share_platform`
   - `target_post_id`
3. **Custom Event Triggers + GA4 Event Tags**

| Event name (Custom Event) | GA4 Event name | 額外參數 |
| --- | --- | --- |
| `post_view` | `post_view` | post_* |
| `scroll_depth` | `scroll_depth` | scroll_percent + post_* |
| `read_complete` | `read_complete` | scroll_percent + post_* |
| `share_click` | `share_click` | share_platform + post_* |
| `related_post_click` | `related_post_click` | target_post_id + post_* |
| `mark_read` | `mark_read` | post_* |

4. 在 GA4 後台把上述事件標記為 **Key events**（至少 `read_complete`、`share_click`）。
5. Publish GTM container。

### 驗證

1. Chrome 開 GTM Preview，連到 `http://localhost:3000/blog/posts/<slug>/` 或正式站。
2. 確認看到 `post_view`、捲動後的 `scroll_depth`。
3. GA4 → Admin → DebugView 同步確認參數有值、沒有大量 `(not set)`。

---

## 2. Google Analytics 4（每篇熱度與來源）

### 探索報表建議：文章熱度

- 技法：自由格式
- 列（維度）：`post_id`（自訂參數）或 `page_path`
- 次要維度：`session source / medium`、`session default channel group`
- 指標：
  - Views / Active users
  - Average engagement time
  - Event count: `read_complete`
  - Event count: `share_click`
  - Event count: `related_post_click`

> 自訂參數第一次出現後，需到 GA4 → Admin → Custom definitions 註冊為 Custom dimension（event-scoped），才會出現在標準報表／探索。

建議註冊的 dimensions：

- `post_id`
- `post_title`
- `post_tags`
- `publish_date`
- `page_type`
- `share_platform`
- `target_post_id`
- `scroll_percent`（number / 可選）

### 來源判讀

| 來源訊號 | 看哪裡 |
| --- | --- |
| 自然搜尋 | Channel = Organic Search；細節用 GSC |
| 社群 | Organic Social / referral（line, facebook, linkedin…） |
| UTM 行銷 | `source / medium / campaign` |
| 站內導流 | `related_post_click`、首頁／archive 的 `page_referrer` |

### 判讀框架（KPI）

| 現象 | 可能原因 | 建議動作 |
| --- | --- | --- |
| 高曝光、低點擊（GSC CTR 低） | 標題／描述不吸引 | 改寫 title、description、封面 |
| 高流量、低 `read_complete` | 開頭無重點、排版差、長度錯位 | 優化導讀、小標、目錄 |
| 高完成、低 `share_click` | CTA 不明顯 | 強化側欄分享、文末 CTA |
| 單一來源佔比過高 | 分發管道單一 | 補 LinkedIn / 電子報 / RSS |

「已閱讀」前台標記用 localStorage（`wport.readPosts`），只代表**同一瀏覽器／裝置**；
分析請以 `read_complete` / `mark_read` 事件為準，不要用 UI 狀態當全域唯一真相。

---

## 3. Google Search Console

### 建議 property

- **優先**：Domain property `wport.me`（DNS TXT 驗證一次，涵蓋 blog 子路徑）
- **備案**：URL-prefix `https://wport.me/blog/`

### 驗證方式

**A. DNS（推薦）**

1. GSC → Add property → Domain → `wport.me`
2. 依指示加 Google TXT record 到網域 DNS
3. Verify

**B. HTML meta（本 repo 已預留）**

1. GSC → URL prefix → 取得 verification token
2. 建置時設環境變數：

```bash
PUBLIC_GSC_VERIFICATION=你的token
```

3. Layout 會輸出：

```html
<meta name="google-site-verification" content="..." />
```

**C. HTML 檔**

1. 下載 `googleXXXX.html`
2. 放到 `public/`（部屬後路徑會是 `https://wport.me/blog/googleXXXX.html`）
3. 注意：若用 **Domain** 或 **root URL-prefix** 驗證，驗證檔應在 `https://wport.me/` 根站，不在 `/blog/`。Blog 靜態 repo 較適合 meta 或 DNS。

### Sitemap

`public/robots.txt` 已宣告：

```text
Sitemap: https://wport.me/blog/sitemap-index.xml
```

GSC → Sitemaps → 提交：

```text
https://wport.me/blog/sitemap-index.xml
```

也可只提交：

```text
https://wport.me/blog/sitemap-0.xml
```

### 用 gcloud / Google API（可選）

本機若已用 `gcloud auth login` 且帳號具備 GSC 權限，可啟用 Search Console API 後用 OAuth
token 查 inspection／sitemaps。**驗證與授權仍需在 Search Console UI 人工完成一次**；
CLI 無法代替 DNS / meta 驗證點選。

常見指令（探索用）：

```bash
# 確認目前登入帳號
gcloud auth list

# 若要走 API，需在 Cloud Console 啟用「Google Search Console API」
# 並用使用者 OAuth（gcloud 服務帳號預設無法直接管 GSC property）
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform
```

驗證完成後，可用 Google API／第三方指令查 sitemap 狀態；日常仍建議以 GSC UI 為主。

### GSC 報表切法（每篇文章）

1. Performance → Pages
2. Filter page URL 含 `/blog/posts/`
3. 點單一 page → 看 Queries
4. 匯出／Looker Studio 可再與 GA4 `page_path` join

指標：`clicks`, `impressions`, `CTR`, `average position`

---

## 4. 事件字典（前端送出）

所有文章事件都會帶：

- `post_id`：slug
- `post_title`
- `post_tags`：逗號字串
- `publish_date`：`YYYY-MM-DD`
- `page_type`：固定 `post_detail`

| Event | 觸發條件 | 去重規則 |
| --- | --- | --- |
| `post_view` | 進入文章頁 | 每頁載入一次 |
| `scroll_depth` | 捲動達 25 / 50 / 75 / 90 | 各門檻本頁一次 |
| `read_complete` | ≥90% 且停留 ≥30 秒 | 本頁一次 |
| `mark_read` | 首次寫入 localStorage | 同裝置每 slug 一次 |
| `share_click` | 點分享按鈕 | 每次點擊 |
| `related_post_click` | 點相關文章 | 每次點擊（含 `target_post_id`） |

---

## 5. RSS 可讀化

- Feed：`https://wport.me/blog/feed.xml`
- Stylesheet：`https://wport.me/blog/feed.xsl`
- 瀏覽器看到友善列表是正常的；若仍看到「does not appear to have any style information」，多半是快取或 XSL 尚未部署。
- RSS Reader 不受影響。

---

## 6. 上線驗收清單

- [ ] `npm run build` 成功
- [ ] 正式站 HTML 含 GTM snippet（`GTM-MGLNLCG5` 或覆寫值）
- [ ] GTM Preview 見自訂事件
- [ ] GA4 DebugView 見參數
- [ ] 自訂維度已註冊
- [ ] GSC 屬性已驗證
- [ ] Sitemap 已提交且無重大錯誤
- [ ] 文章讀完後，同瀏覽器回到 archive／首頁可見「已閱讀」

資料穩定期：上線後建議等 **24–72 小時** 再看標準報表（DebugView 可即時）。
