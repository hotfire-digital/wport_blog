import type { CollectionEntry } from "astro:content";

export type HomeCategoryId = "features" | "overseas-students" | "ai" | "startup";

export interface HomeCategory {
  id: HomeCategoryId;
  label: string;
  eyebrow: string;
  description: string;
  size: "large" | "medium" | "small";
  filterTags: string[];
  archiveTag?: string;
  coverImage: string;
  coverAlt: string;
}

const CLOUDINARY_BASE =
  "https://res.cloudinary.com/dyebbsckc/image/upload/f_auto,q_auto:good,w_1200,c_limit/wport-blog";

export const HOME_CATEGORIES: HomeCategory[] = [
  {
    id: "overseas-students",
    label: "僑外生指南",
    eyebrow: "GUIDE",
    description: "各種留台詳解，讓你不會對法規感到頭痛",
    size: "large",
    filterTags: ["僑外生", "留台工作", "求職面試", "個人品牌"],
    archiveTag: "僑外生",
    coverImage: `${CLOUDINARY_BASE}/bento-overseas-students.jpg`,
    coverAlt: "僑外生指南專區封面，留台求職與法規相關活動現場",
  },
  {
    id: "ai",
    label: "AI 技術",
    eyebrow: "AI LAB",
    description: "拆解各種 AI 工具與技術，讓你職場能力大加分",
    size: "medium",
    filterTags: ["AI 實作", "聰電站"],
    archiveTag: "AI 實作",
    coverImage: `${CLOUDINARY_BASE}/bento-ai-lab.jpg`,
    coverAlt: "AI 技術專區封面，聰電站 AI 實作課程現場",
  },
  {
    id: "startup",
    label: "新創知識",
    eyebrow: "STARTUP",
    description: "新創成長之路艱辛，避免走過其他人碰到的坑、知道怎樣與 VC 打交道",
    size: "small",
    filterTags: ["台大創創", "創業募資", "簡報 Pitch"],
    archiveTag: "台大創創",
    coverImage: `${CLOUDINARY_BASE}/ntutec-visit4-wport-team.jpg`,
    coverAlt: "新創知識專區封面，台大創創拜訪活動現場",
  },
  {
    id: "features",
    label: "WPORT 功能",
    eyebrow: "WPORT",
    description: "最新的功能、使用手冊、教學",
    size: "small",
    filterTags: ["WPORT 功能"],
    archiveTag: "WPORT 功能",
    coverImage: `${CLOUDINARY_BASE}/bento-wport-features.jpg`,
    coverAlt: "WPORT 功能專區封面，產品教學與實作現場",
  },
];

function postMatchesCategory(post: CollectionEntry<"posts">, category: HomeCategory): boolean {
  const tags = post.data.tags ?? [];
  return category.filterTags.some((tag) => tags.includes(tag));
}

export function getPostsForCategory(
  posts: CollectionEntry<"posts">[],
  category: HomeCategory
): CollectionEntry<"posts">[] {
  return posts.filter((post) => postMatchesCategory(post, category));
}

export function getCategoryArchiveHref(category: HomeCategory, withBase: (path: string) => string): string {
  const tag = category.archiveTag ?? category.filterTags[0];
  return `${withBase("/archive")}?tag=${encodeURIComponent(tag)}`;
}
