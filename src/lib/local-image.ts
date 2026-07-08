import type { CoverImageUrls } from "@/lib/cover-image";

type SiteAssetContext = "hero" | "icon";

const PRESETS: Record<SiteAssetContext, { widths: [number, number]; sizes: string }> = {
  hero: {
    widths: [480, 960],
    sizes: "480px",
  },
  icon: {
    widths: [24, 48],
    sizes: "24px",
  },
};

function withBlogBase(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${path.replace(/^\//, "")}`;
}

function stripExtension(assetPath: string): string {
  return assetPath.replace(/^\//, "").replace(/\.[^.]+$/, "");
}

/** Responsive srcset for static assets under /public (pre-generated WebP variants). */
export function getSiteAssetUrls(assetPath: string, context: SiteAssetContext = "hero"): CoverImageUrls {
  const preset = PRESETS[context];
  const [mobileW, desktopW] = preset.widths;
  const baseName = stripExtension(assetPath);
  const mobile = withBlogBase(`${baseName}-${mobileW}w.webp`);
  const desktop = withBlogBase(`${baseName}-${desktopW}w.webp`);

  return {
    mobile,
    desktop,
    default: desktop,
    srcset: `${mobile} ${mobileW}w, ${desktop} ${desktopW}w`,
    sizes: preset.sizes,
  };
}
