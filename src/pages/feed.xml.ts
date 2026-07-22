import { BASE_PATH, SITE_ORIGIN } from "@/lib/llms-content";
import { defaultLocale } from "@/i18n/locales";
import { getPostsByLocale } from "@/lib/posts";
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
  const postsMeta = await getPostsByLocale(defaultLocale);

  const feedUrl = `${SITE_ORIGIN}${BASE_PATH}/feed.xml`;
  const siteUrl = `${SITE_ORIGIN}${BASE_PATH}/`;

  const items = postsMeta
    .map((meta) => {
      const url = `${SITE_ORIGIN}${BASE_PATH}/posts/${meta.baseSlug}/`;
      const pubDate = meta.entry.data.publishDate.toUTCString();
      return `    <item>
      <title>${escapeXml(meta.entry.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(meta.entry.data.description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const stylesheetHref = `${BASE_PATH}/feed.xsl`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${stylesheetHref}"?>
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
