// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import rehypeRaw from "rehype-raw";
import { rehypeOptimizeImages } from "./src/lib/rehype-optimize-images.ts";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://wport.me",
  base: "/blog",
  integrations: [react(), sitemap()],
  markdown: {
    rehypePlugins: [rehypeRaw, rehypeOptimizeImages],
    shikiConfig: {
      theme: "github-light",
      wrap: true,
    },
  },
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
});
