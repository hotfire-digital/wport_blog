const CLOUDINARY_HOST = "res.cloudinary.com";

export type CoverImageContext = "card" | "thumbnail" | "bento" | "prose";

const TRANSFORMS: Record<CoverImageContext, { mobile: string; desktop: string; widths: [number, number] }> = {
  card: {
    mobile: "f_auto,q_auto:good,w_400,c_limit",
    desktop: "f_auto,q_auto:good,w_800,c_limit",
    widths: [400, 800],
  },
  thumbnail: {
    mobile: "f_auto,q_auto:good,w_160,c_limit",
    desktop: "f_auto,q_auto:good,w_320,c_limit",
    widths: [160, 320],
  },
  bento: {
    mobile: "f_auto,q_auto:good,w_600,c_fill,g_auto",
    desktop: "f_auto,q_auto:good,w_1200,c_fill,g_auto",
    widths: [600, 1200],
  },
  prose: {
    mobile: "f_auto,q_auto:good,w_640,c_limit",
    desktop: "f_auto,q_auto:good,w_1200,c_limit",
    widths: [640, 1200],
  },
};

function isCloudinaryUrl(url: string): boolean {
  return url.includes(CLOUDINARY_HOST);
}

function isPexelsUrl(url: string): boolean {
  return url.includes("images.pexels.com");
}

/** Pexels supports width via query string — no Cloudinary fetch needed. */
function applyPexelsWidth(url: string, width: number): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("auto", "compress");
    parsed.searchParams.set("cs", "tinysrgb");
    parsed.searchParams.set("w", String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Strip existing Cloudinary transformation segments and apply new ones. */
function applyCloudinaryTransform(url: string, transform: string): string {
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
  if (!match) {
    return url;
  }

  const [, prefix, rest] = match;
  const segments = rest.split("/");
  let publicIdStart = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isTransform = segment.includes(",") || /^(w_|h_|f_|q_|c_|dpr_|ar_|g_|e_)/.test(segment);
    if (isTransform) {
      publicIdStart = i + 1;
      continue;
    }
    break;
  }

  const publicIdPath = segments.slice(publicIdStart).join("/");
  return `${prefix}${transform}/${publicIdPath}`;
}

function buildUrl(src: string, transform: string, width: number): string {
  if (isCloudinaryUrl(src)) {
    return applyCloudinaryTransform(src, transform);
  }
  if (isPexelsUrl(src)) {
    return applyPexelsWidth(src, width);
  }
  return src;
}

export interface CoverImageUrls {
  mobile: string;
  desktop: string;
  srcset: string;
  sizes: string;
  default: string;
}

export function getCoverImageUrls(src: string, context: CoverImageContext = "card"): CoverImageUrls {
  const preset = TRANSFORMS[context];
  const [mobileW, desktopW] = preset.widths;
  const mobile = buildUrl(src, preset.mobile, mobileW);
  const desktop = buildUrl(src, preset.desktop, desktopW);

  const sizes =
    context === "thumbnail"
      ? "84px"
      : context === "bento"
        ? "(max-width: 768px) 100vw, (max-width: 1080px) 50vw, 520px"
        : context === "prose"
          ? "(max-width: 768px) 100vw, 720px"
          : "(max-width: 768px) 100vw, (max-width: 1080px) 50vw, 300px";

  return {
    mobile,
    desktop,
    default: desktop,
    srcset: `${mobile} ${mobileW}w, ${desktop} ${desktopW}w`,
    sizes,
  };
}

/** Origins used by cover images — for preconnect hints in layout. */
export const COVER_IMAGE_PRECONNECT_ORIGINS = ["https://res.cloudinary.com", "https://images.pexels.com"] as const;

export function isOptimizableImageUrl(url: string): boolean {
  return isCloudinaryUrl(url) || isPexelsUrl(url);
}
