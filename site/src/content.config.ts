import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: 'level-*/*.md', base: '..' }),
  schema: z.object({}).passthrough(),
});

export const collections = { notes };
