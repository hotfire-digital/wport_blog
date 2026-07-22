import { defaultLocale } from "@/i18n/locales";
import { getPostsByLocale } from "@/lib/posts";
import type { APIRoute } from "astro";

const SITE_ORIGIN = "https://wport.me";
const BASE_PATH = "/blog";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const GET: APIRoute = async () => {
  const postsMeta = await getPostsByLocale(defaultLocale);

  const chunks: string[] = [];
  chunks.push("# WPORT 職航站｜完整文章原文");
  chunks.push("");
  chunks.push(
    "> 專為僑外生（僑生、外籍生）打造的台灣求職資源。以下為全部已發佈文章的原始 Markdown 內容，依發佈日期由新到舊排列。"
  );
  chunks.push("");
  chunks.push(`Website: ${SITE_ORIGIN}${BASE_PATH}/`);
  chunks.push(`Index: ${SITE_ORIGIN}${BASE_PATH}/llms.txt`);
  chunks.push(`RSS: ${SITE_ORIGIN}${BASE_PATH}/feed.xml`);
  chunks.push("");

  for (const meta of postsMeta) {
    const post = meta.entry;
    const canonical = `${SITE_ORIGIN}${BASE_PATH}/posts/${meta.baseSlug}/`;
    const mdUrl = `${SITE_ORIGIN}${BASE_PATH}/posts/${meta.baseSlug}.md`;
    chunks.push("");
    chunks.push("---");
    chunks.push("");
    chunks.push(`# ${post.data.title}`);
    chunks.push("");
    chunks.push(`- Source: ${canonical}`);
    chunks.push(`- Raw Markdown: ${mdUrl}`);
    chunks.push(`- Published: ${formatDate(post.data.publishDate)}`);
    if (post.data.tags && post.data.tags.length > 0) {
      chunks.push(`- Tags: ${post.data.tags.join(", ")}`);
    }
    chunks.push(`- Description: ${post.data.description}`);
    chunks.push("");
    chunks.push((post.body ?? "").trim());
    chunks.push("");
  }

  return new Response(chunks.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
