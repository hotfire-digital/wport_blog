import { getCollection, type CollectionEntry } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";

const SITE_ORIGIN = "https://wport.me";
const BASE_PATH = "/blog";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return posts.map((post: CollectionEntry<"posts">) => ({
    params: { slug: post.id },
    props: { post },
  }));
};

function needsQuoting(str: string): boolean {
  if (str.length === 0) return true;
  if (/^\s|\s$/.test(str)) return true;
  if (/[:#&*!|>'"%@`\n\r\t]/.test(str)) return true;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(str)) return true;
  if (/^-?\d/.test(str)) return true;
  return false;
}

function yamlString(value: string): string {
  if (!needsQuoting(value)) return value;
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function buildFrontmatter(data: CollectionEntry<"posts">["data"]): string {
  const lines: string[] = ["---"];
  lines.push(`title: ${yamlString(data.title)}`);
  lines.push(`description: ${yamlString(data.description)}`);
  lines.push(`publishDate: ${data.publishDate.toISOString().slice(0, 10)}`);
  if (data.tags && data.tags.length > 0) {
    lines.push("tags:");
    for (const tag of data.tags) {
      lines.push(`  - ${yamlString(tag)}`);
    }
  }
  if (data.featured) {
    lines.push(`featured: ${data.featured}`);
  }
  if (data.cover) {
    lines.push(`cover: ${yamlString(data.cover)}`);
  }
  lines.push("---");
  return lines.join("\n");
}

function buildPostMarkdown(post: CollectionEntry<"posts">): string {
  const body = post.body ?? "";
  return `${buildFrontmatter(post.data)}\n\n${body.trimStart()}\n`;
}

export const GET: APIRoute = async ({ props }) => {
  const post = props.post as CollectionEntry<"posts">;
  const slug = post.id;
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
  const json = `\uFEFF${JSON.stringify(payload, null, 2)}\n`;
  return new Response(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "index, follow",
    },
  });
};
