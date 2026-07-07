const SITE = 'https://www.cv-learn.com';
const BASE = '/visual-slam-roadmap';

/** Plain-text description from a note body: the one-line-summary line, else first paragraph. */
export function extractSummary(body) {
  const m = body.match(/^\*\*[^*\n]+\*\*\s*[—–-]\s*(.+)$/m);
  let text = m ? m[1] : (body.split(/\n\n/).find((p) => p && !p.startsWith('#') && !p.startsWith('>')) ?? '');
  text = text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`$\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 300 ? text.slice(0, 297) + '…' : text;
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE}${BASE}${path}`,
    })),
  };
}

export function articleLd({ title, description, path, lang }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    inLanguage: lang === 'zh' ? 'zh-CN' : lang,
    url: `${SITE}${BASE}${path}`,
    isPartOf: { '@type': 'WebSite', name: 'Visual-SLAM Developer Roadmap', url: `${SITE}${BASE}/` },
    author: { '@type': 'Person', name: 'Hyunggi Chang', url: 'https://github.com/changh95' },
    license: 'https://opensource.org/licenses/MIT',
  };
}

export function websiteLd(lang, tagline) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Visual-SLAM Developer Roadmap',
    description: tagline,
    url: `${SITE}${BASE}/`,
    inLanguage: ['en', 'ko', 'zh-CN', 'ja'],
    author: { '@type': 'Person', name: 'Hyunggi Chang', url: 'https://github.com/changh95' },
  };
}
