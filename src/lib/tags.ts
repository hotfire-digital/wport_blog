export const CANONICAL_TAGS = [
  "僑外生",
  "留台工作",
  "求職面試",
  "個人品牌",
  "AI 實作",
  "聰電站",
  "台大創創",
  "創業募資",
  "簡報 Pitch",
  "WPORT 功能",
] as const;

export type CanonicalTag = (typeof CANONICAL_TAGS)[number];

/** 舊 tag URL → 新叢集 tag（archive ?tag= 相容） */
export const LEGACY_TAG_REDIRECTS: Record<string, CanonicalTag> = {
  外籍人才: "僑外生",
  留台: "留台工作",
  在台工作: "留台工作",
  工作許可: "留台工作",
  居留證: "留台工作",
  "2026新制": "留台工作",
  求職: "求職面試",
  履歷: "求職面試",
  面試: "求職面試",
  求職平台: "求職面試",
  SEO: "個人品牌",
  LinkedIn: "個人品牌",
  內容行銷: "個人品牌",
  作品集: "個人品牌",
  個人品牌: "個人品牌",
  職涯發展: "個人品牌",
  AI工具: "AI 實作",
  "AI IDE": "AI 實作",
  Cursor: "AI 實作",
  Obsidian: "AI 實作",
  CLI: "AI 實作",
  MCP: "AI 實作",
  Skill: "AI 實作",
  個人網站: "AI 實作",
  "桃園 AI 課程": "聰電站",
  線下活動: "聰電站",
  桃園: "聰電站",
  創業: "創業募資",
  募資: "創業募資",
  VC: "創業募資",
  創投: "創業募資",
  商業思維: "創業募資",
  人脈: "創業募資",
  簡報: "簡報 Pitch",
  Pitch: "簡報 Pitch",
  "Pitch Deck": "簡報 Pitch",
  軟實力: "簡報 Pitch",
  Prompt: "簡報 Pitch",
  最新功能: "WPORT 功能",
  產品更新: "WPORT 功能",
  功能教學: "WPORT 功能",
};

export function resolveArchiveTag(tag: string | null | undefined): string | null {
  if (!tag) {
    return null;
  }

  if ((CANONICAL_TAGS as readonly string[]).includes(tag)) {
    return tag;
  }

  return LEGACY_TAG_REDIRECTS[tag] ?? tag;
}
