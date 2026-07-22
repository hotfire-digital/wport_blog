import { getCollection, type CollectionEntry } from "astro:content";
import { defaultLocale, locales, type Locale } from "@/i18n/locales";
import { localizedPath, parsePostEntryId, postPath } from "@/i18n/utils";

export type PostEntry = CollectionEntry<"posts">;

export type PostMeta = {
  entry: PostEntry;
  baseSlug: string;
  locale: Locale;
};

export function enrichPost(entry: PostEntry): PostMeta {
  const { baseSlug, locale } = parsePostEntryId(entry.id);
  return { entry, baseSlug, locale };
}

export async function getPublishedPosts(): Promise<PostMeta[]> {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return posts.map(enrichPost);
}

export async function getPostsByLocale(locale: Locale): Promise<PostMeta[]> {
  const all = await getPublishedPosts();
  return all
    .filter((p) => p.locale === locale)
    .sort((a, b) => b.entry.data.publishDate.getTime() - a.entry.data.publishDate.getTime());
}

export async function getPostBySlug(locale: Locale, baseSlug: string): Promise<PostMeta | undefined> {
  const posts = await getPostsByLocale(locale);
  return posts.find((p) => p.baseSlug === baseSlug);
}

/** Available translations for a base slug (published only). */
export async function getPostTranslationGroup(baseSlug: string): Promise<Partial<Record<Locale, PostMeta>>> {
  const all = await getPublishedPosts();
  const group: Partial<Record<Locale, PostMeta>> = {};
  for (const post of all) {
    if (post.baseSlug === baseSlug) {
      group[post.locale] = post;
    }
  }
  return group;
}

/** Language switcher targets for the current page. Missing post translations → locale home. */
export async function getLanguageSwitcherHrefs(
  locale: Locale,
  options: { page: "home" | "archive" | "post"; baseSlug?: string }
): Promise<Record<Locale, string>> {
  const hrefs = {} as Record<Locale, string>;

  if (options.page === "post" && options.baseSlug) {
    const group = await getPostTranslationGroup(options.baseSlug);
    for (const loc of locales) {
      hrefs[loc] = group[loc] ? postPath(loc, options.baseSlug) : localizedPath(loc, "/");
    }
    return hrefs;
  }

  const path = options.page === "archive" ? "/archive" : "/";
  for (const loc of locales) {
    hrefs[loc] = localizedPath(loc, path);
  }
  void locale;
  return hrefs;
}

export function viewsKeyForPost(meta: PostMeta): string {
  // Keep analytics keyed by base slug so translations share counts
  return meta.baseSlug;
}

export { defaultLocale };
