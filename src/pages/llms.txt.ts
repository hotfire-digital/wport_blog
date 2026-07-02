import { getCollection, type CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";

const SITE_ORIGIN = "https://wport.me";
const BASE_PATH = "/blog";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const GET: APIRoute = async () => {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  const sorted = [...posts].sort(
    (a: CollectionEntry<"posts">, b: CollectionEntry<"posts">) =>
      b.data.publishDate.getTime() - a.data.publishDate.getTime()
  );

  const lines: string[] = [];
  lines.push("# WPORT 職航站｜Blog");
  lines.push("");
  lines.push(
    "> 專為僑外生（僑生、外籍生）打造的台灣求職資源。內容涵蓋台灣工作許可、履歷與作品集、LinkedIn 個人品牌、內容行銷 SEO、AI IDE 與 CLI 實戰課程等。"
  );
  lines.push("");
  lines.push(`Website: ${SITE_ORIGIN}${BASE_PATH}/`);
  lines.push(`Archive: ${SITE_ORIGIN}${BASE_PATH}/archive/`);
  lines.push(`Full content bundle: ${SITE_ORIGIN}${BASE_PATH}/llms-full.txt`);
  lines.push(`Sitemap: ${SITE_ORIGIN}${BASE_PATH}/sitemap-index.xml`);
  lines.push("");
  lines.push("每篇文章皆提供 `.md` 原始 Markdown 端點，可直接 `curl` 取得純文本內容（連結指向 `.md`）。");
  lines.push("");
  lines.push("## Blog posts");
  lines.push("");
  for (const post of sorted) {
    const mdUrl = `${SITE_ORIGIN}${BASE_PATH}/posts/${post.id}.md`;
    const date = formatDate(post.data.publishDate);
    lines.push(`- [${post.data.title}](${mdUrl}) — ${date}. ${post.data.description}`);
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
