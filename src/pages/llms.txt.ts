import { buildLlmsTxt } from "@/lib/llms-content";
import { defaultLocale } from "@/i18n/locales";
import { getPostsByLocale } from "@/lib/posts";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const postsMeta = await getPostsByLocale(defaultLocale);
  const body = buildLlmsTxt(postsMeta.map((p) => p.entry));

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
