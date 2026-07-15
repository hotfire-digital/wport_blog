import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  // Support both absolute image URLs and local image paths.
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    cover: z.string().optional(),
    draft: z.boolean().optional(),
    // Optional. Customizes the in-article job recommendations: when set, the
    // section searches general jobs by these keywords instead of defaulting to
    // the foreign-student zone (which is used when the post is tagged 僑外生).
    jobKeywords: z.array(z.string()).optional(),
  }),
});

export const collections = { posts };
