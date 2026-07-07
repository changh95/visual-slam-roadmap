import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const schema = z.object({}).passthrough();

const notes = defineCollection({
  loader: glob({ pattern: 'level-*/*.md', base: '..' }),
  schema,
});
const notesKo = defineCollection({
  loader: glob({ pattern: 'level-*/*.md', base: './src/content/i18n/ko' }),
  schema,
});
const notesZh = defineCollection({
  loader: glob({ pattern: 'level-*/*.md', base: './src/content/i18n/zh' }),
  schema,
});
const notesJa = defineCollection({
  loader: glob({ pattern: 'level-*/*.md', base: './src/content/i18n/ja' }),
  schema,
});

export const collections = { notes, notesKo, notesZh, notesJa };
