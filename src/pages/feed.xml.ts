import { getCollection, type CollectionEntry } from "astro:content";
import { BASE_PATH, SITE_ORIGIN } from "@/lib/llms-content";
import type { APIRoute } from "astro";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async () => {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  const sorted = [...posts].sort(
    (a: CollectionEntry<"posts">, b: CollectionEntry<"posts">) =>
      b.data.publishDate.getTime() - a.data.publishDate.getTime()
  );

  const feedUrl = `${SITE_ORIGIN}${BASE_PATH}/feed.xml`;
  const siteUrl = `${SITE_ORIGIN}${BASE_PATH}/`;

  const items = sorted
    .map((post) => {
      const url = `${SITE_ORIGIN}${BASE_PATH}/posts/${post.id}/`;
      const pubDate = post.data.publishDate.toUTCString();
      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>WPORT 職航站｜Blog</title>
    <link>${siteUrl}</link>
    <description>專為僑外生打造的台灣求職資源與攻略</description>
    <language>zh-TW</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
