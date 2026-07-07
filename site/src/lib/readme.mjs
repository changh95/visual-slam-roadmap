import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { rewriteTarget, LEVEL_DIRS } from './remark-md-links.mjs';

const ROOT = path.resolve(process.cwd(), '..');
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');

function makeProcessor(lang) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(() => (tree) => {
      visit(tree, 'link', (node) => {
        node.url = rewriteTarget(node.url, '', lang);
      });
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex, { strict: false })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

const processors = {};
export function renderMd(md, lang = 'en') {
  processors[lang] ??= makeProcessor(lang);
  return String(processors[lang].processSync(md));
}

/** Split README into level sections + study resources. */
export function getSections() {
  const parts = readme.split(/\n(?=## )/);
  const levels = [];
  let resources = null;
  for (const part of parts) {
    const lm = part.match(/^## Level (\d+): (.+)\n/);
    if (lm) {
      levels.push({
        n: Number(lm[1]),
        title: lm[2].trim(),
        dir: LEVEL_DIRS[Number(lm[1])],
        md: part.replace(/^## .+\n/, '').trim(),
      });
    } else if (part.startsWith('## Study Resources')) {
      resources = part.replace(/^## .+\n/, '').trim();
    }
  }
  return { levels, resources };
}

/** ToC rows: level number -> focus text. */
export function getFocus() {
  const focus = {};
  for (const m of readme.matchAll(/^\| \*\*(\d+)\*\* \| \[[^\]]+\]\([^)]*\) \| ([^|]+) \|$/gm)) {
    focus[Number(m[1])] = m[2].trim();
  }
  return focus;
}

/** Count notes per level directory. */
export function getNoteCounts() {
  const counts = {};
  for (const dir of Object.values(LEVEL_DIRS)) {
    counts[dir] = fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.md')).length;
  }
  return counts;
}
