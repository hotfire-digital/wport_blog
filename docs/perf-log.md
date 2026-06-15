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
