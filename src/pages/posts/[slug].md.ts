import { buildPostMarkdown } from "@/lib/post-markdown";
import { defaultLocale } from "@/i18n/locales";
import { getPostsByLocale } from "@/lib/posts";
import type { APIRoute, GetStaticPaths } from "astro";
import type { CollectionEntry } from "astro:content";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPostsByLocale(defaultLocale);
  return posts.map((postMeta) => ({
    params: { slug: postMeta.baseSlug },
    props: { post: postMeta.entry },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const post = props.post as CollectionEntry<"posts">;
  const md = `\uFEFF${buildPostMarkdown(post)}`;
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "index, follow",
    },
  });
};
