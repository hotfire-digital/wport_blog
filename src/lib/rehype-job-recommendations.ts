import type { Element, ElementContent, Root } from "hast";

/**
 * Build-time: insert an empty positional anchor for the in-article job
 * recommendation section. The anchor is rendered `hidden`; the client script
 * in `[slug].astro` fetches live jobs and reveals it (or leaves it hidden when
 * there are no keywords / no results). Keyword data is NOT known here (rehype
 * has no frontmatter access), so this plugin only decides *where* the section
 * goes: immediately before the second top-level H2.
 */
function createSlot(): Element {
  return {
    type: "element",
    tagName: "section",
    properties: { className: ["job-recs-slot"], dataJobRecs: "", hidden: true },
    children: [],
  };
}

export function rehypeJobRecommendations() {
  return (tree: Root) => {
    const children = tree.children as ElementContent[];
    const h2Indexes: number[] = [];

    for (let i = 0; i < children.length; i += 1) {
      const node = children[i];
      if (node.type === "element" && (node as Element).tagName === "h2") {
        h2Indexes.push(i);
      }
    }

    if (h2Indexes.length >= 2) {
      // Before the second H2.
      children.splice(h2Indexes[1], 0, createSlot());
    } else if (h2Indexes.length === 1) {
      // Only one H2: place right after it.
      children.splice(h2Indexes[0] + 1, 0, createSlot());
    }
    // Zero H2s: do not inject; the section simply does not appear.
  };
}
