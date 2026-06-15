# Rules for AI

This file provides guidance to AI Agent when working with code in this repository.

## What this is

A **static Astro 5 blog** (the Wport blog), deployed as static files. Built with Astro content collections, a few React 19 islands for interactivity, Tailwind 4, and shadcn/ui primitives. There is **no backend, no auth, no database, and no SSR** — `output: "static"`.

## Commands

- `npm run dev` — start dev server on port 3000
- `npm run build` — static production build (outputs to `dist/`)
- `npm run preview` — preview the built site
- `npm run lint` — ESLint (flat config, eslint.config.js)
- `npm run lint:fix` — auto-fix lint issues
- `npm run format` — Prettier (includes prettier-plugin-astro)

Pre-commit hooks: husky + lint-staged runs `eslint --fix` on `*.{ts,tsx,astro}` and `prettier --write` on `*.{json,css,md}`.

## Architecture

### Rendering
- `astro.config.mjs`: `output: "static"`, `site: "https://wport.me"`, `base: "/blog"`. Integrations: `@astrojs/react`, `@astrojs/sitemap`; Tailwind via `@tailwindcss/vite`.
- All pages are prerendered to static HTML at build time. The site is served from the `/blog` base path.

### Content
- Blog posts live in `src/content/posts/` as Markdown. The collection schema (`title`, `description`, `publishDate`, `tags?`, `featured?`, `cover?`, `draft?`) is defined in `src/content.config.ts`. Posts with `draft: true` are excluded from the build.
- Pages: `src/pages/index.astro` (home), `src/pages/archive.astro` (all posts), `src/pages/posts/[slug].astro` (post page; the slug is the post filename).

### Key conventions
- **Path alias**: `@/*` maps to `./src/*` (tsconfig paths).
- **Astro components** for static content/layout; **React components** only when interactivity is needed.
- **Tailwind class merging**: use the `cn()` helper from `@/lib/utils` (clsx + tailwind-merge) for conditional/merged class names. Do not concatenate class strings manually.
- **shadcn/ui**: components live in `src/components/ui/`, "new-york" style variant. Install new ones with `npx shadcn@latest add [name]`.
- **Design tokens**: `src/styles/global.css` is the source of truth for color/typography/spacing/radius. Prefer the token CSS variables over hardcoded values; keep reusable visual rules there.
- **Images**: never commit image files. Host them on Cloudinary (cloud name `dyebbsckc`, folder `wport-blog/`) and reference the URL — see README "Images". `scripts/upload_to_cloudinary.py` is the signed-upload helper for the Wport account.
- **Shared types** go in `src/types.ts`.

### Environment
- Node.js v22.14.0 (see `.nvmrc`).
- No environment variables or secrets are required to build or run the blog.
