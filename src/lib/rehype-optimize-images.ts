import type { Element, ElementContent, Root } from "hast";
import { getCoverImageUrls, isOptimizableImageUrl } from "./cover-image.ts";

function visitImages(node: ElementContent, isFirst: { value: boolean }): void {
  if (node.type !== "element") {
    return;
  }

  const element = node as Element;

  if (element.tagName === "img" && element.properties?.src) {
    const src = String(element.properties.src);

    if (isOptimizableImageUrl(src)) {
      const optimized = getCoverImageUrls(src, "prose");
      element.properties.src = optimized.default;
      element.properties.srcset = optimized.srcset;
      element.properties.sizes = optimized.sizes;
      element.properties.decoding = "async";
      element.properties.width = 1200;
      element.properties.height = 675;

      if (isFirst.value) {
        element.properties.loading = "eager";
        element.properties.fetchpriority = "high";
        isFirst.value = false;
      } else {
        element.properties.loading = "lazy";
      }
    }
  }

  if (element.children) {
    for (const child of element.children) {
      visitImages(child, isFirst);
    }
  }
}

/** Build-time: responsive srcset + lazy load for markdown / HTML images in posts. */
export function rehypeOptimizeImages() {
  return (tree: Root) => {
    const isFirst = { value: true };
    for (const child of tree.children) {
      visitImages(child, isFirst);
    }
  };
}
