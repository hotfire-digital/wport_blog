import { getCollection, type CollectionEntry } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";

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

export const GET: APIRoute = async ({ props }) => {
  const post = props.post as CollectionEntry<"posts">;
  const body = post.body ?? "";
  const md = `${buildFrontmatter(post.data)}\n\n${body.trimStart()}\n`;
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "index, follow",
    },
  });
};
