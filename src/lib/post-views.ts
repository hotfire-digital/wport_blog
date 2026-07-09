import postViewsData from "@/data/post-views.json";

interface PostViewsFile {
  _meta?: {
    note?: string;
    updatedAt?: string | null;
  };
  views: Record<string, number>;
}

const viewsFile = postViewsData as PostViewsFile;
const viewsMap: Record<string, number> = viewsFile?.views ?? {};

/** Total page views for a given post slug. Returns 0 if not tracked yet. */
export function getPostViews(postId: string): number {
  const value = viewsMap[postId];
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Human-readable label. Chose "N 閱讀" per product decision. */
export function formatPostViews(views: number): string {
  return `${views.toLocaleString("en-US")} 閱讀`;
}

/** When the JSON was last regenerated (ISO string) or null if never fetched. */
export function getViewsUpdatedAt(): string | null {
  return viewsFile?._meta?.updatedAt ?? null;
}
