import { buildPostMarkdown } from "@/lib/post-markdown";
import { defaultLocale } from "@/i18n/locales";
import { getPostsByLocale } from "@/lib/posts";
import type { APIRoute, GetStaticPaths } from "astro";
import type { CollectionEntry } from "astro:content";

const SITE_ORIGIN = "https://wport.me";
const BASE_PATH = "/blog";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPostsByLocale(defaultLocale);
  return posts.map((postMeta) => ({
    params: { slug: postMeta.baseSlug },
    props: { post: postMeta.entry, baseSlug: postMeta.baseSlug },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const post = props.post as CollectionEntry<"posts">;
  const slug = props.baseSlug as string;
  const payload = {
    title: post.data.title,
    description: post.data.description,
    url: `${SITE_ORIGIN}${BASE_PATH}/posts/${slug}/`,
    raw_url: `${SITE_ORIGIN}${BASE_PATH}/posts/${slug}.md`,
    publishDate: post.data.publishDate.toISOString().slice(0, 10),
    tags: post.data.tags ?? [],
    cover: post.data.cover ?? null,
    content_format: "markdown",
    content: buildPostMarkdown(post),
  };
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  return new Response(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "index, follow",
    },
  });
};
