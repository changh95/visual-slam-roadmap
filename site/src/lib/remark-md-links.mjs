import { visit } from 'unist-util-visit';
import path from 'node:path';

export const BASE = '/visual-slam-roadmap';

export const LEVEL_DIRS = {
  1: 'level-01-beginner',
  2: 'level-02-getting-familiar',
  3: 'level-03-monocular-slam',
  4: 'level-04-rgbd-slam',
  5: 'level-05-deep-learning',
  6: 'level-06-vio-vins',
  7: 'level-07-stereo-slam',
  8: 'level-08-collaborative-slam',
  9: 'level-09-lidar-visual-lidar-slam',
  10: 'level-10-event-camera-slam',
  11: 'level-11-world-models-spatial-ai',
};

/** Rewrite a markdown link target to a site route.
 * @param url     original link target
 * @param baseDir directory of the containing file relative to repo root ('' for README)
 * @param lang    site language for the produced route ('en' → no prefix)
 */
export function rewriteTarget(url, baseDir, lang = 'en') {
  const pre = lang === 'en' ? '' : `${lang}/`;
  if (/^(https?:|mailto:|\/)/.test(url)) return url;
  if (url.startsWith('#')) {
    const m = url.match(/^#level-(\d+)-/);
    if (m) return `${BASE}/${pre}${LEVEL_DIRS[Number(m[1])]}/`;
    return url;
  }
  const [target, anchor] = url.split('#');
  if (!target.endsWith('.md')) return url;
  let resolved = path.posix.normalize(path.posix.join(baseDir, target));
  if (resolved === 'README.md' || resolved === '../README.md') {
    if (anchor) {
      const m = anchor.match(/^level-(\d+)-/);
      if (m) return `${BASE}/${pre}${LEVEL_DIRS[Number(m[1])]}/`;
    }
    return `${BASE}/${pre}`;
  }
  const route = resolved.replace(/\.md$/, '');
  return `${BASE}/${pre}${route}/` + (anchor ? `#${anchor}` : '');
}

export default function remarkMdLinks() {
  return (tree, file) => {
    let baseDir = '';
    let lang = 'en';
    const p = String((file && file.path) || '');
    const im = p.match(/i18n\/(ko|zh|ja)\//);
    if (im) lang = im[1];
    const m = p.match(/(level-\d{2}-[a-z0-9-]+)\//);
    if (m) baseDir = m[1];
    visit(tree, 'link', (node) => {
      node.url = rewriteTarget(node.url, baseDir, lang);
    });
  };
}
