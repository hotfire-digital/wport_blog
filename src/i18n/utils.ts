import {
  defaultLocale,
  localeFileSuffix,
  localeFromPathPrefix,
  localePathPrefix,
  locales,
  type Locale,
  type PathPrefix,
  isPathPrefix,
} from "./locales";
import { t, type UiKey } from "./ui";

export { t };
export type { UiKey };

/** Build a site path for a locale, respecting Astro `base` (/blog). */
export function localizedPath(locale: Locale, path = "/"): string {
  const baseUrl = import.meta.env.BASE_URL;
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const prefix = localePathPrefix[locale];
  const cleanPath = path.replace(/^\//, "");

  if (!prefix) {
    return `${normalizedBase}${cleanPath}`;
  }

  if (!cleanPath) {
    return `${normalizedBase}${prefix}/`;
  }

  return `${normalizedBase}${prefix}/${cleanPath}`;
}

/** Absolute canonical URL for a locale path. */
export function localizedCanonicalUrl(locale: Locale, path = "/"): string {
  const siteUrl = "https://wport.me";
  const relative = localizedPath(locale, path);
  // localizedPath already includes /blog base
  return `${siteUrl}${relative}`.replace(/([^:]\/)\/+/g, "$1");
}

export function jobsUrlForLocale(locale: Locale): string {
  const prefix = localePathPrefix[locale];
  if (!prefix) return "https://wport.me/jobs";
  return `https://wport.me/${prefix}/jobs`;
}

export function mainSitePath(locale: Locale, path: string): string {
  const prefix = localePathPrefix[locale];
  const clean = path.replace(/^\//, "");
  if (!prefix) return `https://wport.me/${clean}`;
  return `https://wport.me/${prefix}/${clean}`;
}

/**
 * Parse collection entry id into base slug + locale.
 * Examples: `resume-tips` → zh-TW; `resume-tips.en` → en-US
 */
export function parsePostEntryId(entryId: string): { baseSlug: string; locale: Locale } {
  const match = entryId.match(/^(.*)\.(en|id|vi|th)$/);
  if (!match) {
    return { baseSlug: entryId, locale: defaultLocale };
  }

  const baseSlug = match[1];
  const suffix = match[2] as PathPrefix;
  return { baseSlug, locale: localeFromPathPrefix(suffix) };
}

export function postPath(locale: Locale, baseSlug: string): string {
  return localizedPath(locale, `/posts/${baseSlug}`);
}

export function postCanonicalUrl(locale: Locale, baseSlug: string): string {
  return localizedCanonicalUrl(locale, `/posts/${baseSlug}/`);
}

/** Map a logical page path (e.g. `/`, `/archive`, `/posts/foo`) across locales. */
export function switchLocalePath(targetLocale: Locale, currentPathWithoutBase: string): string {
  // Strip leading locale prefix if present
  const stripped = currentPathWithoutBase.replace(/^\/(en|id|vi|th)(?=\/|$)/, "") || "/";
  return localizedPath(targetLocale, stripped);
}

export function getLocaleFromAstroUrl(pathname: string, baseUrl: string): Locale {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  let path = pathname;
  if (normalizedBase && path.startsWith(normalizedBase)) {
    path = path.slice(normalizedBase.length) || "/";
  }
  if (!path.startsWith("/")) path = `/${path}`;

  const segment = path.split("/").filter(Boolean)[0];
  if (segment && isPathPrefix(segment)) {
    return localeFromPathPrefix(segment);
  }
  return defaultLocale;
}

export function dateLocaleFor(locale: Locale): string {
  return locale;
}

export { defaultLocale, locales, localePathPrefix, localeFileSuffix };
