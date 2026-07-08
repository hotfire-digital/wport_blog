# Performance iteration log

Track lab scores after each deploy. Field (CrUX) metrics update on a ~28-day rolling window — compare those separately.

**Baseline PSI:** [2026-06-15 desktop report](https://pagespeed.web.dev/analysis/https-wport-me-blog/hdzv95qpcy?form_factor=desktop)

| Device | Lab Perf | A11y | BP | SEO | CrUX LCP | CrUX INP | CrUX CLS |
|--------|----------|------|----|-----|----------|----------|----------|
| Mobile | 74 | 89 | 100 | 92 | 2.7s | 370ms | 0.06 |
| Desktop | 100 | 89 | 100 | 92 | 1.2s | 53ms | 0.16 |

Test URLs after deploy:

- https://wport.me/blog/
- https://wport.me/blog/archive
- One post with a cover image

---

## Iteration #2 — 2026-07-07

**Changes (Round 1 — font & hero)**

- Remove self-hosted 11MB Noto Sans TC variable font; use system font stack (`PingFang TC`, `Microsoft JhengHei`)
- Stop preloading the font file in `BlogLayout.astro`
- Hero mascots: load only on desktop via `<picture media="(min-width: 769px)">` (mobile was downloading hidden PNGs)
- Add long-cache `_headers` for static assets (`/_astro/*`, images, icons)

**Lab scores (local Lighthouse, `npm run preview`)**

| Device | Perf | A11y | BP | SEO | LCP | SI |
|--------|------|------|----|-----|-----|-----|
| Mobile | 96 | 100 | 100 | 100 | 2.8s | 0.9s |
| Desktop | 98 | 100 | 100 | 100 | 0.9s | 0.9s |

---

## Iteration #3 — 2026-07-07

**Changes (Round 2 — images)**

- Bento covers: mobile `w_400` / desktop `w_800` (was `w_600`/`w_1200`); remove duplicate CSS `background-image` + `<img>` double-fetch
- Preload homepage LCP bento cover (`僑外生指南` large card)
- `content-visibility: auto` on below-fold popular section
- Strip hardcoded Cloudinary transforms from `home-categories.ts` (let `cover-image.ts` handle sizing)

**Lab scores (local Lighthouse, `npm run preview`)**

| Device | Perf | A11y | BP | SEO | LCP | SI |
|--------|------|------|----|-----|-----|-----|
| Mobile | 99 | 100 | 100 | 100 | 2.2s | 0.9s |
| Desktop | 98 | 100 | 100 | 100 | 0.8s | 0.7s |

**Note:** PSI API quota was exceeded during this session; scores above are Lighthouse CLI (same engine as PSI lab data). Re-run `psi https://wport.me/blog` after deploy.

**Outcome:** Pending deploy + PSI re-run.

---

## Iteration #1 — 2026-06-15

**Changes**

- Preconnect to `res.cloudinary.com` and `images.pexels.com`
- Preload homepage LCP cover (responsive `imagesrcset`)
- Responsive card/thumbnail covers: Cloudinary `w_400`/`w_800` transforms; Pexels `w=400`/`w=800` query params
- Remove 11MB Noto Sans TC font preload; dedupe `@font-face` in layout

**Commit/PR:** _(fill after merge)_

**Lab scores (post-deploy)**

| Device | Perf | Notes |
|--------|------|-------|
| Mobile | ? | Re-run PSI |
| Desktop | ? | Re-run PSI |

**PSI link:** _(paste new report URL)_

**Outcome:** Pending deploy + PSI re-run. CrUX: recheck in 2–4 weeks.
