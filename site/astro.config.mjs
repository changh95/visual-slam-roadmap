import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkMdLinks from './src/lib/remark-md-links.mjs';

export default defineConfig({
  site: 'https://changh95.github.io',
  base: '/visual-slam-roadmap',
  trailingSlash: 'always',
  markdown: {
    remarkPlugins: [remarkMath, remarkMdLinks],
    rehypePlugins: [[rehypeKatex, { strict: false }]],
    shikiConfig: { theme: 'github-light' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
