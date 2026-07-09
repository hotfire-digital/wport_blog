export type AnalyticsEventName =
  | "post_view"
  | "scroll_depth"
  | "read_complete"
  | "share_click"
  | "related_post_click"
  | "mark_read";

export interface PostAnalyticsContext {
  post_id: string;
  post_title: string;
  post_tags: string;
  publish_date: string;
  page_type: "post_detail";
}

export type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: AnalyticsPayload[];
  }
}

/** GTM container used by wport.me root; override via PUBLIC_GTM_ID. */
export const DEFAULT_GTM_ID = "GTM-MGLNLCG5";

export const READ_POSTS_STORAGE_KEY = "wport.readPosts";

export function getGtmId(): string {
  const fromEnv = import.meta.env.PUBLIC_GTM_ID as string | undefined;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim();
  }
  return DEFAULT_GTM_ID;
}

export function pushAnalyticsEvent(event: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...payload,
  });
}

export function readStoredPostIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(READ_POSTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is string => typeof value === "string" && value.length > 0);
  } catch {
    return [];
  }
}

/** Returns true only the first time this post is marked as read. */
export function markPostAsRead(postId: string): boolean {
  if (typeof window === "undefined" || !postId) return false;

  const existing = readStoredPostIds();
  if (existing.includes(postId)) return false;

  const next = [...existing, postId];
  window.localStorage.setItem(READ_POSTS_STORAGE_KEY, JSON.stringify(next));
  return true;
}

export function isPostRead(postId: string): boolean {
  return readStoredPostIds().includes(postId);
}
