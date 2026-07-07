import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkMdLinks from './src/lib/remark-md-links.mjs';

export default defineConfig({
  // canonical serving domain (github.io redirects here via the account-level custom domain)
  site: 'https://www.cv-learn.com',
  base: '/visual-slam-roadmap',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', ko: 'ko', zh: 'zh-CN', ja: 'ja' },
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMath, remarkMdLinks],
    rehypePlugins: [[rehypeKatex, { strict: false }]],
    shikiConfig: { theme: 'github-light' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
