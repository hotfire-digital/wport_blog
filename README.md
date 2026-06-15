# 10x Astro Starter

![](./public/template.png)

A modern, opinionated starter template for building fast, accessible, and AI-friendly web applications.

## Tech Stack

- [Astro](https://astro.build/) v6.1.9 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.2.4 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5.9.3 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.2.1 - Utility-first CSS framework

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Command Shortcut Script

This project includes a root command runner: `scripts.sh`.

1. Grant execute permission once:

```bash
chmod +x scripts.sh
```

2. Use shortcuts:

```bash
./scripts.sh help
./scripts.sh dev
./scripts.sh build
./scripts.sh lint
./scripts.sh git:status
./scripts.sh gh:pr-status
```

The script also supports custom ports and common Git/GitHub flows, with inline comments in `scripts.sh` for quick reference.

## Project Structure

```md
.
├── src/
│   ├── content/
│   │   └── posts/  # Blog posts (.md)
│   ├── layouts/    # Astro layouts
│   ├── pages/      # Astro pages
│   ├── components/ # UI components (Astro & React)
│   └── assets/     # Static assets
├── public/         # Public assets
```

## Writing Blog Posts

All blog posts live in `src/content/posts/` as `.md` files.

### File naming

Use lowercase kebab-case, ideally prefixed with the topic or date for easy sorting:

```
taiwan-job-search-tips.md
2026-06-11-my-post-title.md
```

### Frontmatter

Every post **must** include a frontmatter block at the top. Copy the template below and fill in the fields:

```yaml
---
title: "文章標題"
description: "一到兩句話的文章摘要，用於 SEO meta description 與文章列表預覽。"
publishDate: 2026-06-11
tags: ["標籤一", "標籤二"]
featured: false
cover: "https://images.pexels.com/photos/XXXXXX/pexels-photo-XXXXXX.jpeg?auto=compress&cs=tinysrgb&w=1600"
---
```

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `title` | string | ✅ | 文章標題 |
| `description` | string | ✅ | 摘要，建議 50–160 字元，用於 SEO |
| `publishDate` | date | ✅ | 格式 `YYYY-MM-DD` |
| `tags` | string[] | — | 分類標籤陣列，建議 2–4 個 |
| `featured` | boolean | — | `true` 會在首頁置頂顯示，預設 `false` |
| `cover` | string | — | 封面圖片 URL（建議使用 Pexels 或自有圖片） |
| `draft` | boolean | — | `true` 則文章不對外顯示，預設發布 |

### Images

**不要將圖片檔案 commit 進 repo。** 所有圖片統一透過 Cloudinary 託管，文章內只放 URL。

**上傳流程：**

1. 登入 [Cloudinary Dashboard](https://cloudinary.com/)，使用 wport 公司帳號（cloud name: `dyebbsckc`）
2. 上傳圖片到 `wport-blog/` 資料夾
3. 複製圖片的 Public ID，組成以下格式的 URL 貼入文章：

```
https://res.cloudinary.com/dyebbsckc/image/upload/f_auto,q_auto:good,w_1200,c_limit/wport-blog/你的圖片名稱.jpg
```

**URL 參數說明：**

| 參數 | 說明 |
|---|---|
| `f_auto` | 自動選擇最佳格式（WebP / AVIF），依瀏覽器支援決定 |
| `q_auto:good` | 自動壓縮品質（約 80–85%），肉眼無感但檔案大幅縮小 |
| `w_1200,c_limit` | 最大寬度 1200px，只縮不放大，適合 Mobile 與 Retina 螢幕 |

> 上傳原始圖片尺寸不限，Cloudinary 會自動處理。行銷同仁可直接用 Cloudinary Dashboard 上傳，無需任何 API 金鑰。

### Preview locally

```bash
npm run dev
```

開啟 `http://localhost:3000` 確認文章顯示正常後再 commit。

## Design Kit & Template Reuse

This blog is now structured to support template reuse for client delivery.

### Design system source of truth

- `src/styles/global.css` is the primary design token file (color, typography, spacing, radius, transitions).
- Shared primitives should consume tokens via CSS variables (for example `var(--fg-heading)`, `var(--bg-tag)`, `var(--border-default)`).
- Avoid hardcoded color values in page-level styles unless there is a specific one-off visual requirement.

### Current styling architecture

- `src/layouts/Layout.astro` imports `src/styles/global.css`.
- `src/components/Topbar.astro`, `src/pages/archive.astro`, and `src/pages/posts/[slug].astro` have been refactored to remove inline styles and use class-based styling.
- These files now use token-based color/typography values so theme customization can be done centrally.

### Template customization workflow (for new clients)

1. Update brand tokens in `src/styles/global.css` (`:root` variables).
2. Replace logo and static assets in `public/`.
3. Adjust content tone/SEO in `src/content/posts/` and page metadata.
4. Only then apply page-specific style tweaks if needed.

### Conventions for future changes

- Keep reusable visual rules in `src/styles/global.css`.
- Keep component/page files focused on structure and behavior.
- Prefer classes over inline `style=...`.
- If adding new UI patterns, extract reusable classes/components first before duplicating styles.

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
