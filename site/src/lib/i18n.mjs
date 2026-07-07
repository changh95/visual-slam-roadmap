import fs from 'node:fs';
import path from 'node:path';

export const LANGS = ['en', 'ko', 'zh', 'ja'];
export const ALT_LANGS = ['ko', 'zh', 'ja'];
export const LABELS = { en: 'EN', ko: 'KO', zh: 'ZH', ja: 'JA' };

const I18N_DIR = path.resolve(process.cwd(), 'src/content/i18n');

const EN_UI = {
  tagline:
    'A guided path from camera basics to world models — 11 levels, 400+ study notes covering the theory, the landmark papers with their actual equations and results, and hands-on code exercises.',
  keyframes: '// keyframes 01–11',
  notes: 'notes',
  levelOf: 'Level {n} / 11',
  appendix: 'Appendix',
  studyResources: 'Study Resources',
  resourcesBlurb: 'Lectures, books, surveys, and code exercises',
  roadmapCrumb: 'roadmap',
  levelCrumb: 'level',
  suggestions: 'Suggestions are welcome — please submit a PR to the repository.',
  titles: {},
  focus: {},
};

export function getUi(lang) {
  if (lang === 'en') return EN_UI;
  try {
    const ui = JSON.parse(fs.readFileSync(path.join(I18N_DIR, lang, 'ui.json'), 'utf8'));
    return { ...EN_UI, ...ui };
  } catch {
    return EN_UI;
  }
}

/** Translated README level-section markdown, or null when unavailable. */
export function getSectionMd(lang, dirOrResources) {
  if (lang === 'en') return null;
  try {
    return fs.readFileSync(path.join(I18N_DIR, lang, 'readme', `${dirOrResources}.md`), 'utf8');
  } catch {
    return null;
  }
}

/** Route prefix for a language ('' for en, 'ko/' etc. otherwise). */
export function langPrefix(lang) {
  return lang === 'en' ? '' : `${lang}/`;
}
