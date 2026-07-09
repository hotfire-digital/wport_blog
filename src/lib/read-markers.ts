/**
 * Client-side helpers for localStorage "已閱讀" markers.
 * Kept as plain JS so it can be loaded via <script type="module"> from Astro pages.
 */

export const READ_POSTS_STORAGE_KEY = "wport.readPosts";

export function readStoredPostIds() {
  try {
    const raw = window.localStorage.getItem(READ_POSTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value) => typeof value === "string" && value.length > 0);
  } catch {
    return [];
  }
}

/**
 * Marks cards that have [data-post-id] matching a stored read slug.
 * Optional badge selector creates a small "已閱讀" pill in the footer/title area.
 */
export function applyReadMarkers(root = document) {
  const readIds = new Set(readStoredPostIds());
  const cards = root.querySelectorAll("[data-post-id]");

  cards.forEach((card) => {
    const postId = card.getAttribute("data-post-id");
    if (!postId) return;

    const isRead = readIds.has(postId);
    card.classList.toggle("is-read", isRead);

    let badge = card.querySelector(".read-badge");
    if (isRead && !badge) {
      badge = document.createElement("span");
      badge.className = "read-badge";
      badge.textContent = "已閱讀";
      const footer = card.querySelector(".card-footer");
      if (footer) {
        footer.prepend(badge);
      } else {
        card.appendChild(badge);
      }
    } else if (!isRead && badge) {
      badge.remove();
    }
  });
}
