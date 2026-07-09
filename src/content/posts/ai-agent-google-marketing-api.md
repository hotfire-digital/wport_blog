---
title: "AI Agent 操作 GA4／GTM／GSC：從 OAuth 到 Trigger 與 Tag 成對"
description: "用 Cursor 等 AI Agent 操作 Google 行銷全家桶。說明為什麼要 OAuth Internal、怎樣驗證權限，以及 GTM 裡 Trigger 與 Tag 為什麼一定要成對，否則事件進不了 GA4。"
publishDate: 2026-07-09
tags: ["AI 實作", "WPORT 功能"]
featured: false
draft: true
---

你跟 AI 說「幫我看這篇文章熱不熱、來源從哪來」，它若只能開網頁點來點去，效率很差。

更好的做法是：給 Agent 一把**有正確權限的 OAuth token**，讓它直接呼叫 Google API。這篇文章整理我們在 WPORT Blog 落地追蹤時踩過的路，特別適合行銷人、SEO、以及要教「AI × 行銷技術」的講師。

---

## 先搞懂三個產品各管什麼

| 產品 | 一句話 |
|------|--------|
| **GTM** | 網站上的事件管理員：什麼時候送、送到哪 |
| **GA4** | 事件倉庫：流量、來源、閱讀完成度 |
| **GSC** | 搜尋端表現：曝光、點擊、關鍵字、排名 |

Blog 在 `wport.me/blog/`，我們**不另開** GTM container 或 GA4 property，而是與主站共用：

- GTM：`GTM-MGLNLCG5`
- GA4：`WPORT-行銷總覽`（`G-WQWNNDZ22Y`）
- GSC：`sc-domain:wport.me`

這樣才能追「讀文章 → 點找工作 → 投遞」同一條漏斗。細節見專案文件 `docs/analytics-guide.md`。

---

## Agent 不是魔術，是「代替你按 API」

整條流程可以拆成五步：

1. 在 GCP 開啟 Tag Manager、Analytics、Search Console API
2. OAuth consent screen 設成 **Internal**（Workspace 帳號才不會被擋）
3. 建立 Desktop OAuth Client，下載 JSON
4. 用 Python 跑一次授權，把 refresh token 存本機
5. Agent 之後用這個 token 呼叫 API，過期自動 refresh

常見卡關：

| 錯誤訊息 | 真正原因 |
|----------|----------|
| This app is blocked | Consent 不是 Internal，或專案沒綁 Workspace |
| 403 insufficient scopes | 用了 `gcloud` 預設 token，沒有行銷 API scope |
| invalid_rapt | Workspace 要求重新驗證，舊 refresh token 失效 |

**不要**指望 `gcloud auth login` 就能操作 GTM／GA4／GSC。那組 token 多半只有 GCP 權限。

---

## GTM 最重要的一句話：Trigger 與 Tag 一定要成對

這是實務上最容易「以為有追蹤、其實沒資料」的地方。

| 概念 | 角色 | 單獨存在會怎樣 |
|------|------|----------------|
| **Variable** | 讀 dataLayer 欄位 | 可以先建 |
| **Trigger** | 定義「何時開火」 | **不會送任何資料到 GA4** |
| **Tag** | 定義「開火後做什麼」 | 沒 Trigger 就永遠不會跑 |

正確流程：

```text
網站 dataLayer.push(event)
  → Custom Event Trigger（何時）
  → GA4 Event Tag（做什麼）
  → GA4 報表
```

我們曾在 GTM 看到六個 `Blog - CE - *` Trigger，卻沒有對應的 `Blog - GA4 - *` Tag。結果是：前端有送事件、Trigger 也會亮，但 **GA4 永遠收不到**。

補齊後的對應如下：

| Trigger | Tag |
|---------|-----|
| `Blog - CE - post_view` | `Blog - GA4 - post_view` |
| `Blog - CE - scroll_depth` | `Blog - GA4 - scroll_depth` |
| `Blog - CE - read_complete` | `Blog - GA4 - read_complete` |
| `Blog - CE - share_click` | `Blog - GA4 - share_click` |
| `Blog - CE - related_post_click` | `Blog - GA4 - related_post_click` |
| `Blog - CE - mark_read` | `Blog - GA4 - mark_read` |

驗收口訣：點開每個 Blog Trigger，右側「Tags that fire this trigger」不能是空的。

---

## Blog 追哪些事件？

| 事件 | 用途 |
|------|------|
| `post_view` | 文章曝光基準 |
| `scroll_depth` | 25／50／75／90，區分「有開」與「有讀」 |
| `read_complete` | ≥90% 且停留 ≥30 秒，閱讀完成 |
| `share_click` | 分享平台 |
| `related_post_click` | 站內導流 |
| `mark_read` | 首次標記已閱讀（同裝置） |

每個事件都帶 `post_id`、`post_title`、`post_tags`、`publish_date`、`page_type`，方便在 GA4 依文章切報表。

前台「已閱讀」用 `localStorage`，只代表同瀏覽器；營運分析請看 GA4 的 `read_complete`／`mark_read`。

---

## 怎樣讓 Agent 幫你做

WPORT Blog repo 裡有兩支腳本：

1. `scripts/google_api_auth_test.py`：授權並驗證 GSC／GTM／GA4
2. `scripts/gtm_build_blog_tags.py`：冪等建立 Variable／Trigger／Tag（不自動 Publish）

授權通過後，你就可以請 Agent：

- 盤點哪個 Trigger 沒有 Tag
- 提交 sitemap 到 Search Console
- 依文章 slug 查熱度與來源

記住：**改 GTM 後一定要 Preview，再手動 Publish。** 腳本刻意不自動發布，避免誤上線。

---

## 給講師的收斂

若你要教「AI × 行銷」：

1. 先講三角關係（GTM／GA4／GSC）
2. 再講 OAuth 為什麼比「貼一把 key」安全
3. 最後用「Trigger 沒 Tag」當現場 demo，學員一次就記住

技術細節與決策紀錄，請看專案文件 `docs/analytics-guide.md`。
